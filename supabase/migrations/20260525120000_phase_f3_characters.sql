-- Phase F3: player characters tied to games.

create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  game_id uuid references public.games (id) on delete set null,
  name text not null,
  sheet_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint characters_name_length_chk check (
    char_length(trim(name)) >= 1
    and char_length(name) <= 128
  )
);

create index if not exists characters_game_id_idx on public.characters (game_id);
create index if not exists characters_owner_id_idx on public.characters (owner_id);

create or replace function public.characters_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists characters_updated_at on public.characters;
create trigger characters_updated_at
  before update on public.characters
  for each row
  execute function public.characters_set_updated_at();

alter table public.characters enable row level security;

-- Read: owner or any member of the character's game
create policy characters_select_owner_or_game_member
  on public.characters
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or (
      game_id is not null
      and exists (
        select 1
        from public.game_members gm
        where gm.game_id = characters.game_id
          and gm.user_id = auth.uid()
      )
    )
  );

-- Insert: must be owner; if attached to a game, must be a member
create policy characters_insert_owner
  on public.characters
  for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and (
      game_id is null
      or exists (
        select 1
        from public.game_members gm
        where gm.game_id = characters.game_id
          and gm.user_id = auth.uid()
      )
    )
  );

-- Update: owner only (GM override deferred)
create policy characters_update_owner
  on public.characters
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and (
      game_id is null
      or exists (
        select 1
        from public.game_members gm
        where gm.game_id = characters.game_id
          and gm.user_id = auth.uid()
      )
    )
  );

-- Delete: owner only
create policy characters_delete_owner
  on public.characters
  for delete
  to authenticated
  using (owner_id = auth.uid());
