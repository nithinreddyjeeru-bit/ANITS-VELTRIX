-- ============================================================
-- ANITS VELTRIX — Complete Supabase Schema
-- Run this entire file once in Supabase SQL Editor
-- ============================================================

-- Enable UUID / cryptographic random helpers
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  name          text not null default '',
  email         text not null default '',
  registration_no text unique,
  role          text not null default 'student' check (role in ('student','admin','club_admin')),
  department    text default '',
  year          int default 1,
  avatar_url    text default '',
  bio           text default '',
  xp            int not null default 0,
  level         int not null default 1,
  is_banned     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists "profiles_read_own" on public.profiles;
drop policy if exists "profiles_read_all" on public.profiles;
create policy "profiles_read_all" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_own_safe" on public.profiles;
create policy "profiles_update_own_safe" on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and xp = (select xp from public.profiles where id = auth.uid())
    and level = (select level from public.profiles where id = auth.uid())
    and is_banned = (select is_banned from public.profiles where id = auth.uid())
  );
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles for update using (public.current_user_role() = 'admin');
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert"     on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup*
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, registration_no, role, department, year, bio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email,
    new.raw_user_meta_data->>'registration_no',
    'student',
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce((new.raw_user_meta_data->>'year')::int, 1),
    coalesce(new.raw_user_meta_data->>'bio', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.admin_set_role(target_id uuid, new_role text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.current_user_role(), '') <> 'admin' then
    raise exception 'Only admins can change roles';
  end if;
  if new_role not in ('student','admin','club_admin') then
    raise exception 'Invalid role';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_id;
end;
$$;
revoke execute on function public.admin_set_role(uuid, text) from public;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

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
grant execute on function public.admin_set_ban(uuid, boolean) to authenticated;

create or replace function public.is_active_user()
returns boolean language sql security definer set search_path = public stable as $$
  select coalesce((select not is_banned from public.profiles where id = auth.uid()), false)
$$;
grant execute on function public.is_active_user() to authenticated;

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists public.events (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text default '',
  category      text not null default 'General',
  venue         text default '',
  mode          text not null default 'offline' check (mode in ('online','offline')),
  difficulty    text not null default 'Beginner' check (difficulty in ('Beginner','Intermediate','Advanced','Pro')),
  event_date    timestamptz not null,
  end_date      timestamptz,
  registration_deadline timestamptz,
  max_seats     int default 100,
  xp_reward     int not null default 100,
  banner_url    text default '',
  prize_pool    text default '',
  rules         text default '',
  contact_info  text default '',
  status        text not null default 'upcoming' check (status in ('draft','upcoming','live','completed','cancelled')),
  created_by    uuid references public.profiles(id),
  club_id       uuid,
  is_team_event boolean not null default false,
  team_size     int default 1,
  tags          text[] default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.events enable row level security;
drop policy if exists "events_read_all" on public.events;
create policy "events_read_all"    on public.events for select using (true);
drop policy if exists "events_insert_admin" on public.events;
create policy "events_insert_admin" on public.events for insert with check (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or (
    created_by = auth.uid()
    and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='club_admin')
  )
);
drop policy if exists "events_update_admin" on public.events;
create policy "events_update_admin" on public.events for update using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or (
    created_by = auth.uid()
    and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='club_admin')
  )
);
drop policy if exists "events_delete_admin" on public.events;
create policy "events_delete_admin" on public.events for delete using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or (
    created_by = auth.uid()
    and exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='club_admin')
  )
);

-- ============================================================
-- REGISTRATIONS
-- ============================================================
create table if not exists public.registrations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  event_id      uuid not null references public.events(id) on delete cascade,
  status        text not null default 'confirmed' check (status in ('pending','approved','paid','confirmed','attended','cancelled','certified')),
  payment_status text not null default 'free' check (payment_status in ('pending','paid','free')),
  certificate_status text not null default 'pending' check (certificate_status in ('pending','generated')),
  qr_token      text unique default encode(gen_random_bytes(16), 'hex'),
  team_id       uuid,
  registered_at timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.registrations enable row level security;
drop policy if exists "reg_read_own" on public.registrations;
create policy "reg_read_own"   on public.registrations for select using (
  auth.uid() = user_id
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or exists(
    select 1 from public.events e
    join public.profiles p on p.id = auth.uid()
    where e.id = event_id and e.created_by = auth.uid() and p.role='club_admin'
  )
);
drop policy if exists "reg_insert_own" on public.registrations;
create policy "reg_insert_own" on public.registrations for insert with check (auth.uid() = user_id and public.is_active_user());
drop policy if exists "reg_update_own" on public.registrations;
create policy "reg_update_own" on public.registrations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status <> 'attended');
drop policy if exists "reg_update_admin" on public.registrations;
create policy "reg_update_admin" on public.registrations for update using (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or exists(
    select 1 from public.events e
    join public.profiles p on p.id = auth.uid()
    where e.id = event_id and e.created_by = auth.uid() and p.role='club_admin'
  )
);

-- ============================================================
-- CLUBS
-- ============================================================
create table if not exists public.clubs (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  description   text default '',
  category      text default 'General',
  logo_url      text default '',
  banner_url    text default '',
  admin_id      uuid references public.profiles(id),
  member_count  int not null default 0,
  is_approved   boolean not null default false,
  created_at    timestamptz not null default now()
);

alter table public.clubs enable row level security;
drop policy if exists "clubs_read_all" on public.clubs;
create policy "clubs_read_all"    on public.clubs for select using (true);
drop policy if exists "clubs_insert_admin" on public.clubs;
create policy "clubs_insert_admin" on public.clubs for insert with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "clubs_update_admin" on public.clubs;
create policy "clubs_update_admin" on public.clubs for update using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- ============================================================
-- CLUB MEMBERS
-- ============================================================
create table if not exists public.club_members (
  id        uuid primary key default uuid_generate_v4(),
  club_id   uuid not null references public.clubs(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('member','admin')),
  joined_at timestamptz not null default now(),
  unique(club_id, user_id)
);

alter table public.club_members enable row level security;
drop policy if exists "club_members_read_all" on public.club_members;
create policy "club_members_read_all"  on public.club_members for select using (true);
drop policy if exists "club_members_insert_own" on public.club_members;
create policy "club_members_insert_own" on public.club_members for insert with check (auth.uid() = user_id);
drop policy if exists "club_members_delete_own" on public.club_members;
create policy "club_members_delete_own" on public.club_members for delete using (auth.uid() = user_id);

-- Update member count trigger
create or replace function public.update_club_member_count()
returns trigger language plpgsql security definer as $$
begin
  if TG_OP = 'INSERT' then
    update public.clubs set member_count = member_count + 1 where id = NEW.club_id;
  elsif TG_OP = 'DELETE' then
    update public.clubs set member_count = greatest(member_count - 1, 0) where id = OLD.club_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_club_member_change on public.club_members;
create trigger on_club_member_change
  after insert or delete on public.club_members
  for each row execute function public.update_club_member_count();

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
-- BOOKMARKS
-- ============================================================
create table if not exists public.bookmarks (
  id       uuid primary key default uuid_generate_v4(),
  user_id  uuid not null references public.profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  saved_at timestamptz not null default now(),
  unique(user_id, event_id)
);

alter table public.bookmarks enable row level security;
drop policy if exists "bookmarks_own" on public.bookmarks;
create policy "bookmarks_own" on public.bookmarks for all using (auth.uid() = user_id);

-- ============================================================
-- CERTIFICATES
-- ============================================================
create table if not exists public.certificates (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  event_id     uuid not null references public.events(id) on delete cascade,
  title        text not null,
  issued_at    timestamptz not null default now(),
  file_url     text default '',
  verify_code  text unique default encode(gen_random_bytes(8), 'hex'),
  unique(user_id, event_id)
);

alter table public.certificates enable row level security;
drop policy if exists "certs_read_own" on public.certificates;
create policy "certs_read_own"   on public.certificates for select using (
  auth.uid() = user_id
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or exists(
    select 1 from public.events e
    join public.profiles p on p.id = auth.uid()
    where e.id = event_id and e.created_by = auth.uid() and p.role='club_admin'
  )
);
drop policy if exists "certs_insert_admin" on public.certificates;
create policy "certs_insert_admin" on public.certificates for insert with check (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or exists(
    select 1 from public.events e
    join public.profiles p on p.id = auth.uid()
    where e.id = event_id and e.created_by = auth.uid() and p.role='club_admin'
  )
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
create table if not exists public.attendance (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  scanned_at timestamptz not null default now(),
  scanned_by uuid references public.profiles(id),
  unique(user_id, event_id)
);

alter table public.attendance enable row level security;
drop policy if exists "attendance_read" on public.attendance;
create policy "attendance_read" on public.attendance for select using (
  auth.uid() = user_id
  or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or exists(
    select 1 from public.events e
    join public.profiles p on p.id = auth.uid()
    where e.id = event_id and e.created_by = auth.uid() and p.role='club_admin'
  )
);
drop policy if exists "attendance_insert_admin" on public.attendance;
create policy "attendance_insert_admin" on public.attendance for insert with check (
  exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')
  or exists(
    select 1 from public.events e
    join public.profiles p on p.id = auth.uid()
    where e.id = event_id and e.created_by = auth.uid() and p.role='club_admin'
  )
);

-- XP update on attendance
create or replace function public.award_attendance_xp()
returns trigger language plpgsql security definer as $$
declare
  event_xp int;
begin
  select xp_reward into event_xp from public.events where id = NEW.event_id;
  update public.profiles set
    xp = xp + coalesce(event_xp, 100),
    level = floor((xp + coalesce(event_xp, 100)) / 1000) + 1,
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

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text not null,
  body       text not null,
  type       text not null default 'info' check (type in ('info','success','warning','error')),
  link       text default '',
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
drop policy if exists "notif_read_own" on public.notifications;
create policy "notif_read_own"   on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "notif_update_own" on public.notifications;
create policy "notif_update_own" on public.notifications for update using (auth.uid() = user_id);
drop policy if exists "notif_insert_admin" on public.notifications;
create policy "notif_insert_admin" on public.notifications for insert with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('admin','club_admin')) or auth.uid() = user_id);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
create table if not exists public.announcements (
  id         uuid primary key default uuid_generate_v4(),
  title      text not null,
  body       text not null,
  author_id  uuid references public.profiles(id),
  club_id    uuid references public.clubs(id),
  is_global  boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
drop policy if exists "annc_read_all" on public.announcements;
create policy "annc_read_all"    on public.announcements for select using (true);
drop policy if exists "annc_insert_admin" on public.announcements;
create policy "annc_insert_admin" on public.announcements for insert with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- ============================================================
-- TEAMS
-- ============================================================
create table if not exists public.teams (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  event_id   uuid not null references public.events(id) on delete cascade,
  leader_id  uuid not null references public.profiles(id),
  max_size   int not null default 4,
  invite_code text unique default upper(substr(encode(gen_random_bytes(4),'hex'),1,6)),
  status      text not null default 'confirmed' check (status in ('pending','confirmed')),
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;
drop policy if exists "teams_read_all" on public.teams;
create policy "teams_read_all"   on public.teams for select using (true);
drop policy if exists "teams_insert_auth" on public.teams;
create policy "teams_insert_auth" on public.teams for insert with check (auth.uid() = leader_id and public.is_active_user());

create table if not exists public.team_members (
  id        uuid primary key default uuid_generate_v4(),
  team_id   uuid not null references public.teams(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member' check (role in ('leader','member')),
  status    text not null default 'approved' check (status in ('pending','approved')),
  joined_at timestamptz not null default now(),
  unique(team_id, user_id)
);

alter table public.team_members enable row level security;
drop policy if exists "team_members_read_all" on public.team_members;
create policy "team_members_read_all"  on public.team_members for select using (true);
drop policy if exists "team_members_insert_own" on public.team_members;
create policy "team_members_insert_own" on public.team_members for insert with check (auth.uid() = user_id and role = 'member' and public.is_active_user());
drop policy if exists "team_members_leader_insert" on public.team_members;
create policy "team_members_leader_insert" on public.team_members
  for insert with check (
    exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
  );
drop policy if exists "team_members_leader_update" on public.team_members;
create policy "team_members_leader_update" on public.team_members
  for update using (
    exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
  );
drop policy if exists "team_members_delete_own" on public.team_members;
create policy "team_members_delete_self_or_leader" on public.team_members
  for delete using (
    auth.uid() = user_id
    or exists (select 1 from public.teams t where t.id = team_id and t.leader_id = auth.uid())
  );

create or replace function public.enforce_team_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  current_count int;
  cap int;
begin
  perform pg_advisory_xact_lock(hashtext(NEW.team_id::text));
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

create or replace function public.enforce_event_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  current_count int;
  cap int;
begin
  perform pg_advisory_xact_lock(hashtext(NEW.event_id::text));
  select max_seats into cap from public.events where id = NEW.event_id;
  select count(*) into current_count
  from public.registrations
  where event_id = NEW.event_id and status <> 'cancelled';
  if current_count >= coalesce(cap, 100) then
    raise exception 'Event is full';
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_registration_insert_capacity on public.registrations;
create trigger on_registration_insert_capacity
  before insert on public.registrations
  for each row execute function public.enforce_event_capacity();

-- ============================================================
-- AUDIT LOGS (admin only)
-- ============================================================
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  admin_id    uuid references public.profiles(id),
  action_type text not null,
  target_id   uuid,
  target_name text default '',
  details     text default '',
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;
drop policy if exists "audit_admin_only" on public.audit_logs;
create policy "audit_admin_only" on public.audit_logs for select using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "audit_insert_admin" on public.audit_logs;
create policy "audit_insert_admin" on public.audit_logs for insert with check (exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================
create or replace view public.leaderboard as
select
  p.id,
  p.name,
  p.email,
  p.department,
  p.avatar_url,
  p.xp,
  p.level,
  rank() over (order by p.xp desc) as rank
from public.profiles p
where p.is_banned = false
order by p.xp desc;

create or replace function public.increment_xp(user_id_param uuid, xp_amount int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(public.current_user_role(), '') <> 'admin' then
    raise exception 'Only admins can award XP directly';
  end if;
  update public.profiles
  set
    xp = xp + xp_amount,
    level = floor((xp + xp_amount) / 1000) + 1,
    updated_at = now()
  where id = user_id_param;
end;
$$;
revoke execute on function public.increment_xp(uuid, int) from public;
grant execute on function public.increment_xp(uuid, int) to authenticated;

create or replace function public.verify_certificate(code text)
returns table (
  holder_name text,
  title text,
  event_title text,
  issued_at timestamptz
)
language sql security definer set search_path = public stable as $$
  select p.name, c.title, e.title, c.issued_at
  from public.certificates c
  join public.profiles p on p.id = c.user_id
  left join public.events e on e.id = c.event_id
  where c.verify_code = lower(code)
$$;
grant execute on function public.verify_certificate(text) to anon, authenticated;

create index if not exists idx_registrations_event on public.registrations(event_id);
create index if not exists idx_registrations_user on public.registrations(user_id);
create index if not exists idx_registrations_team on public.registrations(team_id);
create index if not exists idx_events_category on public.events(category);
create index if not exists idx_events_created_by on public.events(created_by);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_team_members_user on public.team_members(user_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_certificates_user on public.certificates(user_id);
create index if not exists idx_attendance_event on public.attendance(event_id);
create index if not exists idx_club_members_club on public.club_members(club_id);
