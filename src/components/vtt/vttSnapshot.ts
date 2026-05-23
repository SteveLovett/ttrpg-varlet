import type * as Y from 'yjs'
import { readYjsScene } from './yjsScene'
import { readDrawings } from './yjsDrawings'
import { readFogStrokes } from './yjsFog'
import { parseTokenValue, readAllTokens } from './yjsTokens'
import {
  YJS_DRAWINGS_KEY,
  YJS_FOG_KEY,
  YJS_SCENE_KEY,
  YJS_TOKENS_KEY,
  type DrawingShape,
  type FogStroke,
  type SceneState,
  type TokenState,
  type VttSceneSnapshot,
} from './types'

export function parseVttSnapshot(raw: unknown): VttSceneSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<VttSceneSnapshot>
  if (o.schemaVersion !== 1) return null
  const scene = parseSceneFromSnapshot(o.scene)
  if (!scene) return null
  const tokens: Record<string, TokenState> = {}
  if (o.tokens && typeof o.tokens === 'object') {
    for (const [id, value] of Object.entries(o.tokens)) {
      if (!value || typeof value !== 'object') continue
      const token = parseTokenValue(value)
      if (token) tokens[id] = token
    }
  }
  return {
    schemaVersion: 1,
    scene,
    tokens,
    fog: parseFogFromSnapshot(o.fog),
    drawings: parseDrawingsFromSnapshot(o.drawings),
  }
}

function parseSceneFromSnapshot(raw: unknown): SceneState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<SceneState>
  if (s.schemaVersion !== 1 || typeof s.gridSizePx !== 'number') return null
  return {
    schemaVersion: 1,
    gridSizePx: s.gridSizePx,
    mapPath: typeof s.mapPath === 'string' ? s.mapPath : null,
    mapWidthPx: typeof s.mapWidthPx === 'number' ? s.mapWidthPx : null,
    mapHeightPx: typeof s.mapHeightPx === 'number' ? s.mapHeightPx : null,
    hidePcTokensInFog: readHidePcFromSnapshot(s),
    hideNpcTokensInFog: readHideNpcFromSnapshot(s),
  }
}

function parseDrawingsFromSnapshot(raw: unknown): DrawingShape[] {
  if (!Array.isArray(raw)) return []
  const out: DrawingShape[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const d = item as DrawingShape
    if (typeof d.id !== 'string' || typeof d.color !== 'string') continue
    const visibility = d.visibility === 'gm' ? 'gm' : 'all'
    if (d.kind === 'line' && Array.isArray(d.points)) {
      out.push({
        id: d.id,
        kind: 'line',
        points: d.points,
        color: d.color,
        visibility,
      })
    } else if (
      d.kind === 'text' &&
      typeof d.x === 'number' &&
      typeof d.y === 'number' &&
      typeof d.text === 'string'
    ) {
      out.push({
        id: d.id,
        kind: 'text',
        x: d.x,
        y: d.y,
        text: d.text,
        color: d.color,
        visibility,
      })
    }
  }
  return out
}

export function buildVttSnapshot(doc: Y.Doc, scene: SceneState): VttSceneSnapshot {
  const sceneMap = doc.getMap(YJS_SCENE_KEY)
  const liveScene = readYjsScene(sceneMap) ?? scene
  return {
    schemaVersion: 1,
    scene: liveScene,
    tokens: readAllTokens(doc.getMap(YJS_TOKENS_KEY)),
    fog: readFogStrokes(doc.getArray(YJS_FOG_KEY)),
    drawings: readDrawings(doc.getArray(YJS_DRAWINGS_KEY)),
  }
}

function readHidePcFromSnapshot(s: Partial<SceneState>): boolean {
  if ('hidePcTokensInFog' in s) return s.hidePcTokensInFog === true
  return (s as { hideTokensInFog?: boolean }).hideTokensInFog === true
}

function readHideNpcFromSnapshot(s: Partial<SceneState>): boolean {
  if ('hideNpcTokensInFog' in s) return s.hideNpcTokensInFog === true
  return (s as { hideTokensInFog?: boolean }).hideTokensInFog === true
}

function parseFogFromSnapshot(raw: unknown): FogStroke[] {
  if (!Array.isArray(raw)) return []
  const out: FogStroke[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const s = item as FogStroke
    if (typeof s.id !== 'string' || (s.op !== 'reveal' && s.op !== 'hide')) continue
    out.push({
      id: s.id,
      op: s.op,
      points: Array.isArray(s.points) ? s.points : [],
      radius: typeof s.radius === 'number' ? s.radius : 32,
      authorId: typeof s.authorId === 'string' ? s.authorId : '',
      createdAt: typeof s.createdAt === 'string' ? s.createdAt : '',
      forPlayerId: typeof s.forPlayerId === 'string' ? s.forPlayerId : null,
    })
  }
  return out
}
