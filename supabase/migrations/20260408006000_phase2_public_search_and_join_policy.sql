-- Phase 2: public game discovery and join-as-player flow.

-- Replace games SELECT policy so users can read:
-- 1) games they belong to
-- 2) any public game (for discovery)
drop policy if exists games_select_member on public.games;

create policy games_select_member_or_public
  on public.games
  for select
  to authenticated
  using (
    is_public = true
    or exists (
      select 1
      from public.game_members gm
      where gm.game_id = games.id
        and gm.user_id = auth.uid()
    )
  );

-- Allow authenticated users to join public games as Player.
drop policy if exists game_members_insert_public_player on public.game_members;

create policy game_members_insert_public_player
  on public.game_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and game_role = 'Player'::public.game_role
    and exists (
      select 1
      from public.games g
      where g.id = game_id
        and g.is_public = true
    )
  );
