# Phase F6 — VTT MVP, spike slice

This is the **first slice** of Phase F6. The scope is intentionally tiny: prove
the technical pattern (Yjs document inside the existing F5 Liveblocks room,
driving a Pixi v8 canvas) end-to-end, with two browsers seeing each other's
changes. **No** map upload, tokens, fog, or scene CRUD yet — those come in the
next slices once this scaffold is verified live.

## What landed in this slice

| Area | File | Notes |
|------|------|-------|
| Schema | `supabase/migrations/20260528120000_phase_f6_vtt_scenes.sql` | `vtt_scenes` table, `UNIQUE(game_id)`, GM-only RLS |
| Storage | `supabase/migrations/20260528120100_phase_f6_game_assets_bucket.sql` | Private `game-assets` bucket, 10 MB limit, png/jpeg/webp, RLS via path-segment match |
| Types | `src/components/vtt/types.ts` | `SceneState`, `TokenState`, `FogStroke`, `DrawingShape`, plus the temporary `SpikeMarker` |
| Live transport | `src/hooks/useYjsDoc.ts` | `useSyncExternalStore`-backed wrapper around `getYjsProviderForRoom` |
| Room wiring | `src/components/vtt/VttRoom.tsx` | Reuses the F5 `liveblocks-auth` Edge Function; same room id |
| Canvas | `src/components/vtt/SceneCanvasSpike.tsx` | Pixi v8 `Application`, one shared marker, click anywhere to move it |
| UI | `src/components/vtt/VttPanel.tsx` | Lazy-loads the spike canvas so Pixi stays out of the main bundle |
| Page wiring | `src/pages/GameDetailPage.tsx` | VTT tab now renders `VttPanel` instead of the placeholder |
| Styles | `src/app-layout.css` | `.vtt-canvas-host` etc. |

The main JS chunk is **unchanged** at ~211 kB gzipped — Pixi and its sub-systems
ship as separate chunks that only load when you open the VTT tab. The spike
canvas chunk is ~46 kB gzipped; Pixi's rendering chunks add another ~150 kB
on first visit and then cache.

## Operator setup (do once before the first deploy)

### 1. Apply the migrations

```bash
supabase db push
```

That applies both `vtt_scenes` (table) and `game-assets` (Storage bucket and
RLS). The bucket migration is idempotent — re-running won't blow away an
existing bucket.

### 2. Verify the bucket

In the Supabase dashboard → **Storage** you should now see a private
`game-assets` bucket with:

- File size limit: **10 MB**
- Allowed MIME types: `image/png, image/jpeg, image/webp`
- 4 RLS policies on `storage.objects` named `game_assets_*`

### 3. Nothing else

The spike piggy-backs on the F5 `liveblocks-auth` Edge Function. No new env
vars, no new function deploy. If you skipped the F5 setup you'll need to do it
first (`docs/phase-f5-liveblocks-setup.md`).

## Verifying the spike live

1. Push these changes through your usual deploy (or `npm run dev` locally
   against two browsers).
2. Open any game's **VTT** tab in two different browsers signed in as two
   different members of that game.
3. Both browsers show a dark canvas with a red dot in the center, the
   **F6 spike** badge, and `Yjs synced · 2 in room`.
4. Click anywhere on the canvas in browser A. Within ~100 ms the dot moves
   to the same spot on browser B.
5. Refresh either browser. The dot reappears at the last position (Yjs
   document persists in the Liveblocks room while anyone is connected).
6. Close both tabs, wait a few seconds, re-open. With nobody connected the
   Liveblocks room hibernates; the marker may reset. That's expected for
   the spike — real scenes will snapshot to `vtt_scenes.state_json` so
   they survive room hibernation.

If the canvas reports `Connecting…` for more than a few seconds, check the
browser console for `Liveblocks auth failed …` — that means the F5 Edge
Function or its secret isn't deployed.

## What is intentionally NOT in this slice

| Feature | When |
|---------|------|
| Scene creation form (name, grid size, upload map) | Slice 2 |
| Loading the map image as a Pixi `Sprite` with pan/zoom | Slice 2 |
| Grid overlay | Slice 2 |
| Tokens (add, drag, snap, ownership, link to character) | Slice 3 |
| Fog of war | Slice 4 |
| Drawing layer (GM-only annotations) | Slice 5 (optional) |
| Mobile touch hardening | After the MVP is feature-complete |

The cut line for the whole phase still stands — see the Phase F6 section of
`/Users/stevelovett/.cursor/plans/friends-first_d&d_plan_8dc9bf6f.plan.md`.

## Known follow-ups before slice 2

1. **Hoist the Liveblocks room.** Today the Session tab and the VTT tab each
   mount their own `LiveblocksProvider` + `RoomProvider`. Tabs are mutually
   exclusive so this is fine for the spike, but switching tabs disconnects
   and reconnects the room. A small refactor in `GameDetailPage` to wrap
   both tab panels in a single `LiveblocksProvider` + `RoomProvider` keeps
   presence and Yjs warm across tab switches.
2. **Snapshot on idle.** The next slice introduces a GM-only debounced
   write of the Yjs doc into `vtt_scenes.state_json` so a fully idle game
   can re-hydrate without anyone needing to be in the room first.
3. **Loading shim for Pixi.** The lazy import currently shows a plain
   "Loading canvas…" line. Replace with a skeleton box once the empty
   state is built so the layout doesn't jump on first VTT visit.
