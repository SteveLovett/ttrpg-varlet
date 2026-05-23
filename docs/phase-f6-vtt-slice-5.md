# Phase F6 — VTT slice 5: drawings + token fog visibility

Slice 5 adds GM map annotations and optional token hiding outside revealed fog.

## Features

| Feature | Details |
|---------|---------|
| **Line drawings** | GM freehand lines with live Yjs sync (~20 Hz) |
| **Text labels** | GM enters text, clicks **Place on map**, then clicks the canvas |
| **Visibility** | Each drawing is **Everyone** or **GM only** (GM-only renders above fog) |
| **Colors** | Preset palette in the drawing tools panel |
| **Token fog visibility** | GM toggles **PCs** and **NPCs** separately (`hidePcTokensInFog`, `hideNpcTokensInFog`) |
| **Drawing delete** | **Erase** tool (click on map) or delete from the drawings list |
| **Player behavior** | When enabled, players only see tokens whose center is in revealed fog |
| **GM preview** | Toggle applies in **Player view preview** when previewing a player |
| **Persistence** | Drawings in Yjs `drawings` array; included in GM snapshots |

## Layer order (bottom → top)

1. Map + grid  
2. Public drawings (`visibility: all`)  
3. Fog mask (players / GM preview)  
4. Fog guide + fog/drawing previews (GM)  
5. Tokens  
6. GM-only drawings  

## Key files

| File | Role |
|------|------|
| `src/components/vtt/yjsDrawings.ts` | Yjs drawings array |
| `src/hooks/useYjsDrawings.ts` | React hook + hydrate |
| `src/components/vtt/drawDrawings.ts` | Pixi line/text render |
| `src/components/vtt/DrawingTools.tsx` | GM sidebar |
| `src/components/vtt/fogVisibility.ts` | Point-in-fog + token hide rules |
| `src/components/vtt/types.ts` | `hideTokensInFog` on `SceneState` |

## Smoke test

1. **Lines:** GM draws a red line; player sees it in a revealed area (under fog in unrevealed areas).
2. **GM-only text:** GM sets visibility **GM only** — player does not see it; GM does (above fog).
3. **Everyone text:** Player sees label after area is revealed.
4. Enable **PCs** only — character tokens hide in fog; NPCs stay visible.
5. Enable **NPCs** only — opposite behavior.
6. **Erase** a line from the map or list; refresh — change persists.

## Deferred

- Drawing move/edit in place
