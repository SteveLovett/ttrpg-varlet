-- Phase F6 (VTT MVP) — per-game battle map scene.
--
-- One scene per game in the MVP (enforced by UNIQUE(game_id)). Multi-scene
-- libraries are deferred; expanding later just means dropping that unique
-- constraint and adding a UI for scene management.
--
-- The Yjs document in the Liveblocks room is the live truth while members
-- are connected. `state_json` is a periodic snapshot the GM client writes
-- so the scene can be re-hydrated after everyone has left the room.

create table if not exists public.vtt_scenes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  name text not null default 'Scene',
  map_path text,
  map_width_px int,
  map_height_px int,
  grid_size_px int not null default 50,
  state_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vtt_scenes_name_length_chk check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 128
  ),
  constraint vtt_scenes_grid_size_chk check (
    grid_size_px between 8 and 512
  ),
  constraint vtt_scenes_map_dims_chk check (
    (map_width_px is null and map_height_px is null)
    or (map_width_px between 1 and 8192 and map_height_px between 1 and 8192)
  ),
  constraint vtt_scenes_unique_per_game unique (game_id)
);

create index if not exists vtt_scenes_game_id_idx on public.vtt_scenes (game_id);

create or replace function public.vtt_scenes_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists vtt_scenes_updated_at on public.vtt_scenes;
create trigger vtt_scenes_updated_at
  before update on public.vtt_scenes
  for each row
  execute function public.vtt_scenes_set_updated_at();

alter table public.vtt_scenes enable row level security;

-- Read: any member of the game can see the scene.
create policy vtt_scenes_select_member
  on public.vtt_scenes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = vtt_scenes.game_id
        and gm.user_id = auth.uid()
    )
  );

-- Insert / update / delete: GM of the game only.
create policy vtt_scenes_insert_gm
  on public.vtt_scenes
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = vtt_scenes.game_id
        and gm.user_id = auth.uid()
        and gm.game_role = 'Game Master'
    )
  );

create policy vtt_scenes_update_gm
  on public.vtt_scenes
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = vtt_scenes.game_id
        and gm.user_id = auth.uid()
        and gm.game_role = 'Game Master'
    )
  )
  with check (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = vtt_scenes.game_id
        and gm.user_id = auth.uid()
        and gm.game_role = 'Game Master'
    )
  );

create policy vtt_scenes_delete_gm
  on public.vtt_scenes
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = vtt_scenes.game_id
        and gm.user_id = auth.uid()
        and gm.game_role = 'Game Master'
    )
  );
