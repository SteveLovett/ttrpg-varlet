/**
 * Phase F6 — VTT MVP domain types.
 *
 * These are the shapes that will live inside the Liveblocks Yjs document
 * for a game's battle map. They're system-agnostic (no D&D-specific
 * fields here) so the same shapes can serve other rulesets later.
 *
 * NOTE: the spike phase only exercises `SpikeMarker`. The token/fog/scene
 * types are declared up front so the Yjs schema and rendering layers can
 * be built against them without churn.
 */

/**
 * Top-level scene metadata mirrored to `vtt_scenes.state_json` on snapshot.
 * Live values live in Yjs while the room is occupied; this is the on-disk
 * snapshot used to re-hydrate after everyone leaves.
 */
export type SceneState = {
  schemaVersion: 1
  gridSizePx: number
  mapPath: string | null
  mapWidthPx: number | null
  mapHeightPx: number | null
}

/** Visible disc on the map. Square grids only in MVP. */
export type TokenState = {
  id: string
  x: number // map-image px from top-left
  y: number
  color: string // hex, e.g. '#dc2626'
  label: string // 1–3 character initials shown on the disc
  /** Optional link to a row in public.characters; null for monsters/NPCs. */
  characterId: string | null
  /** auth.users id allowed to move this token; GM can override. */
  ownerId: string
  /** 1 = medium/small, 2 = large, 3 = huge, 4 = gargantuan. */
  sizeCells: 1 | 2 | 3 | 4
}

/** One brush stroke in the fog layer. Strokes are applied in order. */
export type FogStroke = {
  id: string
  op: 'reveal' | 'hide'
  points: Array<{ x: number; y: number }>
  radius: number
  authorId: string
  createdAt: string
}

/** GM-only annotation layer. Players see entries with `visibility = 'all'`. */
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

/* -------------------------------------------------------------------------- */
/* Spike scaffolding                                                          */
/* -------------------------------------------------------------------------- */

/**
 * A single shared marker used by the F6 spike to prove that a Yjs document
 * inside the existing Liveblocks room round-trips between browsers. Will be
 * deleted once real tokens land.
 */
export type SpikeMarker = {
  id: string
  /** Normalized 0..1 coords so the marker stays visible across canvas sizes. */
  x: number
  y: number
  color: string
}

export const SPIKE_MARKER_KEY = 'spike-marker'
