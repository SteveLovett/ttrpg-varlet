-- User appearance preferences (theme, font override, future settings).

alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.preferences is
  'User settings JSON, e.g. { "themeId": "default", "fontOverrideId": "theme" }';
