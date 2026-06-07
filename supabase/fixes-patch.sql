-- ============================================================
-- SECURITY PATCH — run once in Supabase SQL Editor.
-- Fixes a hole in the first fixes.sql: admin_set_role / admin_set_ban
-- were callable by anon (PUBLIC execute) and their NULL-vs-'admin'
-- guard never fired for anon callers. This closes both.
-- ============================================================

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
