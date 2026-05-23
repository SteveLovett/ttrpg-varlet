# Phase F6 — VTT slice 4: fog of war

Slice 4 adds collaborative fog of war: the GM paints reveal/hide strokes, players see only uncovered map areas, and optional per-player reveals.

## Features

| Feature | Details |
|---------|---------|
| **GM paint tools** | Reveal (uncover) and Hide (cover again) brushes on the map |
| **Live sync** | Fog strokes stream to Yjs while painting (~20 Hz, same throttle as tokens) |
| **Player view** | Full-map black mask until reveal strokes apply; hide strokes paint fog back |
| **Per-player reveal** | GM can target “Everyone” or one member — only that player gets those reveal/hide strokes |
| **GM guide mode** | Default: full map visible with green/red stroke overlays |
| **Player preview** | GM can enable fog mask and pick a player to see their view |
| **Persistence** | Yjs array key `fog`; GM snapshots include `fog` in `state_json` |
| **Clear fog** | GM can reset all strokes (confirm dialog) |

Layer order: map → grid → fog mask → fog guide (GM) → tokens.

## Key files

| File | Role |
|------|------|
| `src/components/vtt/yjsFog.ts` | Yjs fog array read/write |
| `src/hooks/useYjsFog.ts` | React hook + snapshot hydrate |
| `src/components/vtt/drawFog.ts` | RenderTexture mask + guide/preview graphics |
| `src/components/vtt/fogUtils.ts` | Viewer filtering, brush helpers |
| `src/components/vtt/FogTools.tsx` | GM/player sidebar controls |
| `src/components/vtt/SceneCanvas.tsx` | Fog layers + paint handlers |

## Smoke test

1. **GM + player** in the same game, VTT tab open.
2. Player sees a **fully fogged** map (no strokes yet).
3. GM selects **Reveal**, paints an area — player sees it **during** the drag.
4. GM selects **Hide**, paints over part of the reveal — player loses sight there.
5. GM sets **Reveal for** one player, paints — only that player sees it; others do not.
6. GM enables **Player view preview**, picks a player — GM sees that player’s mask.
7. Refresh both clients — fog restores from Yjs or Postgres snapshot.
8. GM **Clear all fog** — player map goes fully dark again.

## Next slice

See [slice 5 — drawings + token fog visibility](./phase-f6-vtt-slice-5.md).

## Deferred (later)

- Dynamic line-of-sight / walls
- Per-shape drawing erase
