-- Phase F4: per-game initiative order (JSON array until live sync).

alter table public.games
  add column if not exists initiative_json jsonb not null default '[]'::jsonb;

comment on column public.games.initiative_json is
  'Array of { id, name, value, isPc? } sorted by initiative for the table.';
