-- Per-game campaign settings (validation policy, future options).
alter table public.games
  add column if not exists settings jsonb not null default '{}'::jsonb;

comment on column public.games.settings is
  'Campaign settings JSON (e.g. spellcastingValidation: inherit | warn | block).';
