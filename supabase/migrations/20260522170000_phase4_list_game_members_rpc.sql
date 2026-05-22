-- Phase 4: GM tools — list members of a game.
--
-- Why an RPC: the existing game_members SELECT policy is restricted to
-- user_id = auth.uid() (set in 20260408000100 to avoid RLS recursion), so a
-- direct client SELECT can only return the caller's own membership row. The
-- GM "Members" panel needs every membership for the game. This SECURITY
-- DEFINER function bypasses RLS but enforces its own access check: the
-- caller must already be a member of the game.

create or replace function public.list_game_members(p_game_id uuid)
returns table (
  user_id uuid,
  display_name text,
  game_role public.game_role,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_member boolean;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select exists (
    select 1
    from public.game_members gm
    where gm.game_id = p_game_id
      and gm.user_id = v_caller
  )
  into v_is_member;

  if not v_is_member then
    raise exception 'You are not a member of this game';
  end if;

  return query
  select gm.user_id,
         p.display_name,
         gm.game_role,
         gm.joined_at
  from public.game_members gm
  left join public.profiles p on p.id = gm.user_id
  where gm.game_id = p_game_id
  order by
    case gm.game_role
      when 'Game Master'::public.game_role then 0
      else 1
    end,
    p.display_name nulls last,
    gm.user_id;
end;
$$;

revoke all on function public.list_game_members(uuid) from public;
grant execute on function public.list_game_members(uuid) to authenticated;
