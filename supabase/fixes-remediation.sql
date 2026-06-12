-- ============================================================
-- ANITS VELTRIX — CTO Audit Remediation Migration
-- Idempotent: safe to run in Supabase SQL Editor.
-- ============================================================

-- 1. Create storage buckets if not exists
insert into storage.buckets (id, name, public)
values
  ('certificates', 'certificates', true),
  ('avatars', 'avatars', true),
  ('banners', 'banners', true)
on conflict (id) do nothing;

-- 2. Email domain restriction trigger on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Enforce email domain restriction at database trigger level
  if new.email not like '%@anits.edu.in' then
    raise exception 'Signup is restricted to @anits.edu.in email domain.';
  end if;

  insert into public.profiles (id, name, email, registration_no, role, department, year, bio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'registration_no',
    'student',  -- always student on self-signup; promotion is admin-only
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce((new.raw_user_meta_data->>'year')::int, 1),
    coalesce(new.raw_user_meta_data->>'bio', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Re-link trigger just in case
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Secure registration lookup RPC
create or replace function public.get_email_by_registration_no(reg_no text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found_email text;
begin
  select email into found_email from public.profiles where registration_no = reg_no limit 1;
  return found_email;
end;
$$;

revoke execute on function public.get_email_by_registration_no(text) from public;
grant execute on function public.get_email_by_registration_no(text) to anon, authenticated;

-- 4. Restricted profiles select RLS (require authenticated session)
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles
  for select
  using (auth.uid() is not null);

-- 5. Update leaderboard view (remove email column)
drop view if exists public.leaderboard cascade;
create or replace view public.leaderboard as
select
  p.id,
  p.name,
  p.department,
  p.avatar_url,
  p.xp,
  p.level,
  rank() over (order by p.xp desc) as rank
from public.profiles p
where p.is_banned = false;

-- 6. Correct XP and level triggers/functions to calculate atomically
create or replace function public.award_attendance_xp()
returns trigger language plpgsql security definer as $$
declare
  event_xp_reward int;
  current_xp int;
  new_xp int;
begin
  select xp_reward into event_xp_reward from public.events where id = NEW.event_id;
  select xp into current_xp from public.profiles where id = NEW.user_id;
  new_xp := coalesce(current_xp, 0) + coalesce(event_xp_reward, 100);

  update public.profiles set
    xp = new_xp,
    level = floor(new_xp / 1000) + 1,
    updated_at = now()
  where id = NEW.user_id;

  -- Update registration status
  update public.registrations set status = 'attended' where user_id = NEW.user_id and event_id = NEW.event_id;
  return NEW;
end;
$$;

drop trigger if exists on_attendance_insert on public.attendance;
create trigger on_attendance_insert
  after insert on public.attendance
  for each row execute function public.award_attendance_xp();

create or replace function public.increment_xp(user_id_param uuid, xp_amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_xp int;
  new_xp int;
begin
  if coalesce(public.current_user_role(), '') <> 'admin' then
    raise exception 'Only admins can award XP directly';
  end if;
  select xp into current_xp from public.profiles where id = user_id_param;
  new_xp := coalesce(current_xp, 0) + xp_amount;

  update public.profiles
  set
    xp = new_xp,
    level = floor(new_xp / 1000) + 1,
    updated_at = now()
  where id = user_id_param;
end;
$$;
