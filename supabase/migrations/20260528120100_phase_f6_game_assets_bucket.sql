-- Phase F6 (VTT MVP) — private Storage bucket for game-scoped assets.
--
-- Object naming convention (enforced by the policies below):
--   <gameId>/<sceneId>/map.<ext>
--   <gameId>/<sceneId>/<filename>
-- The first path segment is always the game id so RLS can scope reads/writes
-- to members of that specific game via split_part(name, '/', 1).
--
-- Bucket is PRIVATE — the client must generate signed URLs to display map
-- images. This matches the SaaS rollout plan's posture and avoids leaking
-- assets to anyone with the URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'game-assets',
  'game-assets',
  false,
  10485760,                           -- 10 MB cap per file
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;

-- Wipe any prior versions of these policies so this migration is idempotent.
drop policy if exists game_assets_select_member on storage.objects;
drop policy if exists game_assets_insert_gm on storage.objects;
drop policy if exists game_assets_update_gm on storage.objects;
drop policy if exists game_assets_delete_gm on storage.objects;

-- Read: any member of the game whose id matches the first path segment.
create policy game_assets_select_member
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'game-assets'
    and exists (
      select 1
      from public.game_members gm
      where gm.user_id = auth.uid()
        and gm.game_id::text = split_part(storage.objects.name, '/', 1)
    )
  );

-- Write (insert/update/delete): GM of the game in the first path segment.
create policy game_assets_insert_gm
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'game-assets'
    and exists (
      select 1
      from public.game_members gm
      where gm.user_id = auth.uid()
        and gm.game_id::text = split_part(storage.objects.name, '/', 1)
        and gm.game_role = 'Game Master'
    )
  );

create policy game_assets_update_gm
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'game-assets'
    and exists (
      select 1
      from public.game_members gm
      where gm.user_id = auth.uid()
        and gm.game_id::text = split_part(storage.objects.name, '/', 1)
        and gm.game_role = 'Game Master'
    )
  );

create policy game_assets_delete_gm
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'game-assets'
    and exists (
      select 1
      from public.game_members gm
      where gm.user_id = auth.uid()
        and gm.game_id::text = split_part(storage.objects.name, '/', 1)
        and gm.game_role = 'Game Master'
    )
  );
