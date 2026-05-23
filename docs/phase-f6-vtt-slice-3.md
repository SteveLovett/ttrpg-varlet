# Phase F6 — VTT slice 3: tokens

Slice 3 adds collaborative tokens on the battle map: placement, drag with grid snap, ownership, and optional character links. State lives in the Liveblocks Yjs document and is included in GM debounced snapshots to `vtt_scenes.state_json`.

## Features

- **Token tray** — GM adds NPCs (label + 1–4 cell size). All members place attached game characters (one token per character).
- **Map interaction** — Left-drag to move with **live Yjs sync** (~20 Hz) so other clients see the token move; **grid snap on release**. Right-drag pan and scroll zoom unchanged. Click map while placing to drop a token.
- **Permissions (client-side)** — GM moves/deletes any token. Players move/delete only tokens they own (`ownerId`).
- **Rendering** — Colored discs with initials (no portraits). Selected token highlighted on map and in tray.
- **Persistence** — Yjs map key `tokens`. New joiners hydrate from `state_json` when the Yjs map is empty. GM snapshots include `scene` + `tokens` every 2s after changes.

## Key files

| File | Role |
|------|------|
| `src/components/vtt/yjsTokens.ts` | Read/write Yjs token map |
| `src/hooks/useYjsTokens.ts` | React hook + snapshot hydrate |
| `src/components/vtt/tokenUtils.ts` | Snap, colors, permissions |
| `src/components/vtt/vttSnapshot.ts` | Parse/build full snapshots |
| `src/components/vtt/TokenTray.tsx` | Placement UI |
| `src/components/vtt/SceneCanvas.tsx` | Pixi token layer + drag |
| `src/hooks/useVttSceneSync.ts` | GM snapshot includes tokens |

## Smoke test

1. Open the same game in two browsers (GM + player).
2. GM: add an NPC, click map to place; drag to snap to grid.
3. Player: place their character token; confirm they cannot drag GM NPC.
4. GM: drag player token; player: drag own token — confirm the other browser sees movement **during** the drag, not only after release.
5. Refresh — tokens reappear from Yjs or Postgres snapshot.
6. GM replaces map — tokens remain (same scene row); verify positions still make sense.

## Next slice

See [slice 4 — fog of war](./phase-f6-vtt-slice-4.md). Drawings and dynamic vision remain deferred.
