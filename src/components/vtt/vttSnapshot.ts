import type * as Y from 'yjs'
import { readYjsScene } from './yjsScene'
import { readAllTokens } from './yjsTokens'
import {
  YJS_SCENE_KEY,
  YJS_TOKENS_KEY,
  type SceneState,
  type TokenState,
  type VttSceneSnapshot,
} from './types'

export function parseVttSnapshot(raw: unknown): VttSceneSnapshot | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<VttSceneSnapshot>
  if (o.schemaVersion !== 1) return null
  const scene = o.scene as SceneState | undefined
  if (!scene || scene.schemaVersion !== 1) return null
  const tokens: Record<string, TokenState> = {}
  if (o.tokens && typeof o.tokens === 'object') {
    for (const [id, value] of Object.entries(o.tokens)) {
      if (!value || typeof value !== 'object') continue
      const t = value as TokenState
      if (typeof t.id === 'string' && typeof t.x === 'number' && typeof t.y === 'number') {
        tokens[id] = t
      }
    }
  }
  return {
    schemaVersion: 1,
    scene,
    tokens,
    fog: Array.isArray(o.fog) ? (o.fog as VttSceneSnapshot['fog']) : [],
    drawings: Array.isArray(o.drawings) ? (o.drawings as VttSceneSnapshot['drawings']) : [],
  }
}

export function buildVttSnapshot(doc: Y.Doc, scene: SceneState): VttSceneSnapshot {
  const sceneMap = doc.getMap(YJS_SCENE_KEY)
  const liveScene = readYjsScene(sceneMap) ?? scene
  return {
    schemaVersion: 1,
    scene: liveScene,
    tokens: readAllTokens(doc.getMap(YJS_TOKENS_KEY)),
    fog: [],
    drawings: [],
  }
}
