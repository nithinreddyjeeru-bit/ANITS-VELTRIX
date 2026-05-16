-- Run after schema.sql (optional helpers)

-- Fix: profiles RLS infinite recursion

drop policy if exists "profiles_read_own" on public.profiles;
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);

create or replace function public.increment_xp(user_id_param uuid, xp_amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    xp = xp + xp_amount,
    level = floor((xp + xp_amount) / 1000) + 1,
    updated_at = now()
  where id = user_id_param;
end;
$$;

grant execute on function public.increment_xp(uuid, int) to authenticated;

-- Storage buckets (create in Supabase Dashboard if insert fails)
insert into storage.buckets (id, name, public)
values
  ('certificates', 'certificates', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Certificate PDFs: admins upload anywhere; students read public bucket
drop policy if exists "certificates_public_read" on storage.objects;
create policy "certificates_public_read" on storage.objects
  for select using (bucket_id = 'certificates');

drop policy if exists "certificates_admin_insert" on storage.objects;
create policy "certificates_admin_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'certificates'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'club_admin')
    )
  );

drop policy if exists "certificates_admin_update" on storage.objects;
create policy "certificates_admin_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'certificates'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'club_admin')
    )
  );

-- Avatars: users upload own folder
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Team leader can add members to their team (invite flow)
drop policy if exists "team_members_leader_insert" on public.team_members;
create policy "team_members_leader_insert" on public.team_members
  for insert
  with check (
    exists (
      select 1 from public.teams t
      where t.id = team_id and t.leader_id = auth.uid()
    )
    or auth.uid() = user_id
  );
