-- Phase 5: content + polish
-- Adds a small content layer per game so GMs can record:
--   - ruleset:        a free-form label (e.g. "5e", "PF2e", "homebrew") — stays system-agnostic.
--   - house_rules:    long-form text/markdown for stable rules content.
--   - session_notes:  long-form text/markdown for active campaign notes.
--
-- These columns are written by GMs only (existing games_update_gm policy) and
-- read by anyone who can already read the game row (members or public games).
--
-- We also add a couple of indexes to keep search and "my games" fast as data grows.

alter table public.games
  add column if not exists ruleset text not null default '',
  add column if not exists house_rules text not null default '',
  add column if not exists session_notes text not null default '';

-- Cheap CHECK guards so a runaway client can't dump megabytes of text per game.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'games_ruleset_length_chk'
  ) then
    alter table public.games
      add constraint games_ruleset_length_chk check (char_length(ruleset) <= 64);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'games_house_rules_length_chk'
  ) then
    alter table public.games
      add constraint games_house_rules_length_chk check (char_length(house_rules) <= 20000);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'games_session_notes_length_chk'
  ) then
    alter table public.games
      add constraint games_session_notes_length_chk check (char_length(session_notes) <= 20000);
  end if;
end
$$;

-- Search/listing performance.
create index if not exists games_is_public_created_at_idx
  on public.games (is_public, created_at desc);

-- Case-insensitive lookups for the Search games page (`name ilike ...`).
create index if not exists games_lower_name_idx
  on public.games (lower(name));
