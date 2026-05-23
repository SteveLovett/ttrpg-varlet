# Phase F6 — VTT slice 2 (scene + map + canvas)

Builds on the [spike](./phase-f6-vtt-spike.md). Delivers a real battle map:
GM uploads a map, everyone in the game sees it with a square grid, pan, and zoom.

## What landed

| Feature | Details |
|---------|---------|
| **Scene CRUD** | `useVttScene` — load/create/replace map, update grid, signed URLs, snapshot save |
| **GM setup form** | `SceneSetupForm` — name, grid size (8–512 px), image upload |
| **Map storage** | Private `game-assets` bucket, path `{gameId}/{sceneId}/map.{ext}` |
| **Pixi canvas** | `SceneCanvas` — map sprite, square grid, right-drag pan, scroll zoom |
| **Yjs scene map** | `scene` key in Yjs doc (`gridSizePx`, `mapPath`, dimensions) |
| **Postgres snapshot** | GM debounced write to `vtt_scenes.state_json` (2 s) |
| **Hoisted Liveblocks** | `GameLiveRoom` on game detail — Session stays connected when switching tabs |
| **Removed spike** | `SceneCanvasSpike` deleted |

## Operator steps

1. Ensure Phase F6 migrations are applied (`supabase db push`).
2. Deploy the app (no new env vars).
3. As **GM**, open a game → **VTT** tab → **Set up battle map**.
4. Upload a PNG/JPEG/WebP (≤ 10 MB, ≤ 4096×4096). Set grid size to match your map.
5. Open the same game as a **player** in another browser — the map and grid should appear after the GM finishes.

## Controls

- **Pan:** right-click drag (or hold right mouse button and drag).
- **Zoom:** mouse wheel toward/away from cursor.
- **GM tools** (collapsible): change grid size, replace map image.

Viewport pan/zoom is **per client** in slice 2 — players can look at different areas. Shared camera is a possible later enhancement.

## Verifying slice 2

1. GM creates scene — row appears in `vtt_scenes`, file in Storage under `game-assets`.
2. Player sees map without refresh after GM upload completes.
3. GM changes grid size — grid redraws on GM client; player sees update after Yjs sync (~instant).
4. GM replaces map — new image loads for everyone.
5. Close all tabs, wait ~30 s, reopen VTT — map still loads from Postgres snapshot + signed URL (room may have hibernated; Yjs re-seeds from DB).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Upload fails with policy error | Run `game-assets` bucket migration; confirm GM role |
| Map never appears / signed URL error | Check Storage policies; confirm `map_path` set on row |
| `Could not load battle map` in canvas | CORS on signed URL is usually fine with Supabase; check image corrupt |
| Table `vtt_scenes` missing | `supabase db push` |

## Next slice (3)

- Tokens: add, drag, snap to grid, owner vs GM move
- Optional: link token to `characters` row for name/initials
