-- Phase F2: per-game dice roll log.

create table if not exists public.game_rolls (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  formula text not null,
  label text not null default '',
  result_json jsonb not null,
  created_at timestamptz not null default now(),
  constraint game_rolls_formula_length_chk check (char_length(formula) <= 128),
  constraint game_rolls_label_length_chk check (char_length(label) <= 64)
);

create index if not exists game_rolls_game_id_created_at_idx
  on public.game_rolls (game_id, created_at desc);

alter table public.game_rolls enable row level security;

create policy game_rolls_select_member
  on public.game_rolls
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = game_rolls.game_id
        and gm.user_id = auth.uid()
    )
  );

create policy game_rolls_insert_member
  on public.game_rolls
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.game_members gm
      where gm.game_id = game_rolls.game_id
        and gm.user_id = auth.uid()
    )
  );
