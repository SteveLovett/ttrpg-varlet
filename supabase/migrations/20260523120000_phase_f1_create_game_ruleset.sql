-- Phase F1: default new games to D&D 5e (2024) ruleset label at creation.

create or replace function public.create_game(
  p_name text,
  p_description text,
  p_is_public boolean,
  p_ruleset text default 'D&D 5e (2024)'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_game_id uuid;
  v_ruleset text := coalesce(nullif(trim(p_ruleset), ''), 'D&D 5e (2024)');
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if char_length(v_ruleset) > 64 then
    raise exception 'Ruleset label must be 64 characters or less';
  end if;

  insert into public.games (name, description, is_public, created_by, ruleset)
  values (p_name, p_description, p_is_public, v_uid, v_ruleset)
  returning id into v_game_id;

  insert into public.game_members (game_id, user_id, game_role)
  values (v_game_id, v_uid, 'Game Master'::public.game_role);

  return v_game_id;
end;
$$;

revoke all on function public.create_game(text, text, boolean, text) from public;
grant execute on function public.create_game(text, text, boolean, text) to authenticated;

-- Drop old 3-arg overload so clients resolve to the new signature.
drop function if exists public.create_game(text, text, boolean);
