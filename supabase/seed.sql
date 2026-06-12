-- ============================================================
-- ANITS VELTRIX — Optional Development Seed Data
-- Do not run this file in production.
-- ============================================================

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

insert into public.clubs (name, description, category, is_approved, member_count)
select * from (values
  ('CodeCraft Club', 'Competitive programming and hackathons.', 'Tech', true, 0),
  ('RoboLeague', 'Robotics design and autonomous systems.', 'Robotics', true, 0),
  ('Design Collective', 'UI/UX, graphic design, and creative arts.', 'Design', true, 0),
  ('Cultural Society', 'Arts, drama, music, and cultural events.', 'Cultural', true, 0)
) as v(name, description, category, is_approved, member_count)
where not exists (select 1 from public.clubs limit 1);
