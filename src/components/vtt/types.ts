/**
 * Phase F6 — VTT MVP domain types.
 *
 * Shapes for the Liveblocks Yjs document and `vtt_scenes.state_json` snapshots.
 */

export const YJS_SCENE_KEY = 'scene'
export const YJS_TOKENS_KEY = 'tokens'
export const YJS_FOG_KEY = 'fog'
export const YJS_DRAWINGS_KEY = 'drawings'

/**
 * Scene metadata in Yjs (live) and mirrored to `vtt_scenes.state_json` on snapshot.
 */
export type SceneState = {
  schemaVersion: 1
  gridSizePx: number
  mapPath: string | null
  mapWidthPx: number | null
  mapHeightPx: number | null
  /** Hide PC tokens (linked to a character) outside revealed fog. */
  hidePcTokensInFog: boolean
  /** Hide NPC tokens (no character link) outside revealed fog. */
  hideNpcTokensInFog: boolean
}

/** Visible disc on the map. Square grids only in MVP — slice 3. */
export type TokenState = {
  id: string
  x: number
  y: number
  color: string
  label: string
  characterId: string | null
  ownerId: string
  sizeCells: 1 | 2 | 3 | 4
}

export type FogStroke = {
  id: string
  op: 'reveal' | 'hide'
  points: Array<{ x: number; y: number }>
  radius: number
  authorId: string
  createdAt: string
  /** When set, only this player sees the stroke. `null` = all players. */
  forPlayerId: string | null
}

export type DrawingShape =
  | {
      id: string
      kind: 'line'
      points: Array<{ x: number; y: number }>
      color: string
      visibility: 'all' | 'gm'
    }
  | {
      id: string
      kind: 'text'
      x: number
      y: number
      text: string
      color: string
      visibility: 'all' | 'gm'
    }

/** Full snapshot written to Postgres by the GM client. */
export type VttSceneSnapshot = {
  schemaVersion: 1
  scene: SceneState
  tokens: Record<string, TokenState>
  fog: FogStroke[]
  drawings: DrawingShape[]
}

export function emptyVttSnapshot(scene: SceneState): VttSceneSnapshot {
  return {
    schemaVersion: 1,
    scene,
    tokens: {},
    fog: [],
    drawings: [],
  }
}
