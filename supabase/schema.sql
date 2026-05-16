-- ============================================================
-- ANITS VELTRIX — Complete Supabase Schema
-- Run this entire file once in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

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
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
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
    coalesce(new.raw_user_meta_data->>'role', 'student'),
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

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists public.events (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  description   text default '',
  category      text not null default 'General',
  venue         text default '',
  event_date    timestamptz not null,
  end_date      timestamptz,
  max_seats     int default 100,
  xp_reward     int not null default 100,
  banner_url    text default '',
  status        text not null default 'upcoming' check (status in ('upcoming','live','completed','cancelled')),
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
  status        text not null default 'confirmed' check (status in ('confirmed','cancelled','attended')),
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
create policy "reg_insert_own" on public.registrations for insert with check (auth.uid() = user_id);
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
  created_at timestamptz not null default now()
);

alter table public.teams enable row level security;
drop policy if exists "teams_read_all" on public.teams;
create policy "teams_read_all"   on public.teams for select using (true);
drop policy if exists "teams_insert_auth" on public.teams;
create policy "teams_insert_auth" on public.teams for insert with check (auth.uid() = leader_id);

create table if not exists public.team_members (
  id        uuid primary key default uuid_generate_v4(),
  team_id   uuid not null references public.teams(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member',
  joined_at timestamptz not null default now(),
  unique(team_id, user_id)
);

alter table public.team_members enable row level security;
drop policy if exists "team_members_read_all" on public.team_members;
create policy "team_members_read_all"  on public.team_members for select using (true);
drop policy if exists "team_members_insert_own" on public.team_members;
create policy "team_members_insert_own" on public.team_members for insert with check (auth.uid() = user_id);
drop policy if exists "team_members_delete_own" on public.team_members;
create policy "team_members_delete_own" on public.team_members for delete using (auth.uid() = user_id);

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

-- ============================================================
-- SAMPLE SEED DATA (optional — remove in production)
-- ============================================================
-- Insert sample events if table is empty
insert into public.events (title, description, category, venue, event_date, xp_reward, status, max_seats)
select * from (values
  ('CODE WARS 2026', 'Competitive programming battle. Bring your A-game.', 'Tech', 'CS Block Lab', now() + interval '10 days', 500, 'upcoming', 200),
  ('ROBOTIX CHALLENGE', 'Build autonomous robots. Fight for the title.', 'Robotics', 'Mech Block Arena', now() + interval '14 days', 400, 'upcoming', 100),
  ('DESIGN ARENA', 'UI/UX hackathon. 24-hour design sprint.', 'Design', 'Design Studio', now() + interval '16 days', 300, 'upcoming', 80),
  ('CULTURAL GALA 2026', 'Annual cultural fest. Performances, art, food.', 'Cultural', 'Open Air Theatre', now() + interval '20 days', 200, 'upcoming', 500),
  ('ML SUMMIT', 'Machine learning paper presentations.', 'Tech', 'Seminar Hall A', now() + interval '25 days', 350, 'upcoming', 150),
  ('SPORTS DAY', 'Inter-department sports competition.', 'Sports', 'Sports Ground', now() + interval '30 days', 250, 'upcoming', 300)
) as v(title, description, category, venue, event_date, xp_reward, status, max_seats)
where not exists (select 1 from public.events limit 1);

-- Insert sample clubs if table is empty
insert into public.clubs (name, description, category, is_approved, member_count)
select * from (values
  ('CodeCraft Club', 'Competitive programming and hackathons.', 'Tech', true, 0),
  ('RoboLeague', 'Robotics design and autonomous systems.', 'Robotics', true, 0),
  ('Design Collective', 'UI/UX, graphic design, and creative arts.', 'Design', true, 0),
  ('Cultural Society', 'Arts, drama, music, and cultural events.', 'Cultural', true, 0)
) as v(name, description, category, is_approved, member_count)
where not exists (select 1 from public.clubs limit 1);
