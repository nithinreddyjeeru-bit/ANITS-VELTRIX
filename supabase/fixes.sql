-- ============================================================
-- ANITS VELTRIX — Reconciliation & Security Migration
-- Run AFTER schema.sql and extensions.sql.
-- Idempotent: safe to re-run.
-- ============================================================

-- ============================================================
-- 1. SCHEMA RECONCILIATION (columns the app already writes)
-- ============================================================

-- REGISTRATIONS: payment + certificate lifecycle + widened status
alter table public.registrations
  add column if not exists payment_status     text not null default 'free',
  add column if not exists certificate_status text not null default 'pending';

-- Widen the status CHECK to match the app's state machine.
alter table public.registrations drop constraint if exists registrations_status_check;
alter table public.registrations
  add constraint registrations_status_check
  check (status in ('pending','approved','paid','confirmed','attended','cancelled','certified'));

alter table public.registrations drop constraint if exists registrations_payment_status_check;
alter table public.registrations
  add constraint registrations_payment_status_check
  check (payment_status in ('pending','paid','free'));

alter table public.registrations drop constraint if exists registrations_certificate_status_check;
alter table public.registrations
  add constraint registrations_certificate_status_check
  check (certificate_status in ('pending','generated'));

-- TEAMS: invite code + status
alter table public.teams
  add column if not exists invite_code text unique default upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),
  add column if not exists status      text not null default 'confirmed';

alter table public.teams drop constraint if exists teams_status_check;
alter table public.teams
  add constraint teams_status_check check (status in ('pending','confirmed'));

-- TEAM_MEMBERS: approval status
alter table public.team_members
  add column if not exists status text not null default 'approved';

alter table public.team_members drop constraint if exists team_members_status_check;
alter table public.team_members
  add constraint team_members_status_check check (status in ('pending','approved'));

-- EVENTS: real FK for club_id (was a dangling uuid)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'events_club_id_fkey' and table_name = 'events'
  ) then
    alter table public.events
      add constraint events_club_id_fkey
      foreign key (club_id) references public.clubs(id) on delete set null;
  end if;
end $$;

-- ============================================================
-- 2. INDEXES (hot FK / filter columns)
-- ============================================================
create index if not exists idx_registrations_event   on public.registrations(event_id);
create index if not exists idx_registrations_user     on public.registrations(user_id);
create index if not exists idx_registrations_team     on public.registrations(team_id);
create index if not exists idx_events_category        on public.events(category);
create index if not exists idx_events_created_by      on public.events(created_by);
create index if not exists idx_events_status          on public.events(status);
create index if not exists idx_team_members_team      on public.team_members(team_id);
create index if not exists idx_team_members_user      on public.team_members(user_id);
create index if not exists idx_notifications_user     on public.notifications(user_id);
create index if not exists idx_bookmarks_user         on public.bookmarks(user_id);
create index if not exists idx_certificates_user      on public.certificates(user_id);
create index if not exists idx_attendance_event       on public.attendance(event_id);
create index if not exists idx_club_members_club      on public.club_members(club_id);

-- ============================================================
-- 3. SECURITY: stop privilege escalation on profiles
--    Students may edit profile fields, but NOT role / xp / level /
--    is_banned. Those become admin-only (via policy) or server-only.
-- ============================================================

-- Drop the unrestricted self-update policy.
drop policy if exists "profiles_update_own" on public.profiles;

-- Self-update allowed ONLY when privileged columns are unchanged.
create policy "profiles_update_own_safe" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role     = (select role     from public.profiles where id = auth.uid())
    and xp       = (select xp       from public.profiles where id = auth.uid())
    and level    = (select level    from public.profiles where id = auth.uid())
    and is_banned = (select is_banned from public.profiles where id = auth.uid())
  );

-- Admins retain full update rights (policy from schema.sql: profiles_update_admin).
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.current_user_role() = 'admin');

-- Admin-only RPC for role changes (clean server path for the admin UI).
create or replace function public.admin_set_role(target_id uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  -- NULL-safe check: anon/no-profile callers have a NULL role and must be rejected.
  if coalesce(public.current_user_role(), '') <> 'admin' then
    raise exception 'Only admins can change roles';
  end if;
  if new_role not in ('student','admin','club_admin') then
    raise exception 'Invalid role';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_id;
end;
$$;
-- Functions grant EXECUTE to PUBLIC by default — lock that down.
revoke execute on function public.admin_set_role(uuid, text) from public;
grant  execute on function public.admin_set_role(uuid, text) to authenticated;

create or replace function public.admin_set_ban(target_id uuid, banned boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.current_user_role(), '') <> 'admin' then
    raise exception 'Only admins can ban users';
  end if;
  update public.profiles set is_banned = banned, updated_at = now() where id = target_id;
end;
$$;
revoke execute on function public.admin_set_ban(uuid, boolean) from public;
grant  execute on function public.admin_set_ban(uuid, boolean) to authenticated;

-- ============================================================
-- 4. SECURITY: harden auto-profile trigger (never trust client role)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
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

-- ============================================================
-- 5. SECURITY: allow legitimate student writes the app needs
-- ============================================================

-- Students may update their OWN registration (team linking, leaving,
-- delayed-payment confirmation) — but cannot self-mark 'attended'.
drop policy if exists "reg_update_own" on public.registrations;
create policy "reg_update_own" on public.registrations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status <> 'attended');

-- Team leaders may approve/reject members of their team.
drop policy if exists "team_members_leader_update" on public.team_members;
create policy "team_members_leader_update" on public.team_members
  for update using (
    exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
  );

-- Team leaders may remove members; members may remove themselves.
drop policy if exists "team_members_delete_own" on public.team_members;
create policy "team_members_delete_self_or_leader" on public.team_members
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
  );

-- Tighten member self-insert: a self-insert may NOT claim the leader role.
drop policy if exists "team_members_insert_own" on public.team_members;
create policy "team_members_insert_own" on public.team_members
  for insert with check (auth.uid() = user_id and role = 'member');
-- (extensions.sql "team_members_leader_insert" still lets the leader seat
--  themselves/others on teams they own.)

-- ============================================================
-- 6. SECURITY: enforce bans at the database layer
--    Banned users cannot register, bookmark, form/join teams.
-- ============================================================
create or replace function public.is_active_user()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select not is_banned from public.profiles where id = auth.uid()), false)
$$;
grant execute on function public.is_active_user() to authenticated;

drop policy if exists "reg_insert_own" on public.registrations;
create policy "reg_insert_own" on public.registrations
  for insert with check (auth.uid() = user_id and public.is_active_user());

drop policy if exists "teams_insert_auth" on public.teams;
create policy "teams_insert_auth" on public.teams
  for insert with check (auth.uid() = leader_id and public.is_active_user());

-- ============================================================
-- 7. CAPACITY GUARD: prevent team oversize (atomic, server-side)
-- ============================================================
create or replace function public.enforce_team_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  current_count int;
  cap int;
begin
  select max_size into cap from public.teams where id = NEW.team_id;
  select count(*) into current_count from public.team_members where team_id = NEW.team_id;
  if current_count >= coalesce(cap, 4) then
    raise exception 'Squad is full';
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_team_member_insert_capacity on public.team_members;
create trigger on_team_member_insert_capacity
  before insert on public.team_members
  for each row execute function public.enforce_team_capacity();

-- ============================================================
-- 8. EVENT BANNERS storage bucket + policies
-- ============================================================
insert into storage.buckets (id, name, public)
values ('banners','banners', true)
on conflict (id) do nothing;

drop policy if exists "banners_public_read" on storage.objects;
create policy "banners_public_read" on storage.objects
  for select using (bucket_id = 'banners');

drop policy if exists "banners_creator_insert" on storage.objects;
create policy "banners_creator_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'banners'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','club_admin'))
  );

drop policy if exists "banners_creator_update" on storage.objects;
create policy "banners_creator_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'banners'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','club_admin'))
  );

-- ============================================================
-- 9. PUBLIC CERTIFICATE VERIFICATION
--    Anyone (even anon) can verify a certificate by its code,
--    seeing only non-sensitive fields. Certificates RLS stays
--    locked down; this RPC is the only public window.
-- ============================================================
create or replace function public.verify_certificate(code text)
returns table (
  holder_name text,
  title       text,
  event_title text,
  issued_at   timestamptz
)
language sql security definer set search_path = public stable as $$
  select p.name, c.title, e.title, c.issued_at
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  left join public.events e on e.id = c.event_id
  where c.verify_code = lower(code)
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;
