import type * as Y from 'yjs'
import type { SceneState } from './types'
import { YJS_SCENE_KEY } from './types'

export function readYjsScene(map: Y.Map<unknown>): SceneState | null {
  const gridSizePx = map.get('gridSizePx')
  if (typeof gridSizePx !== 'number' || !Number.isFinite(gridSizePx)) return null
  return {
    schemaVersion: 1,
    gridSizePx,
    mapPath:
      typeof map.get('mapPath') === 'string' ? (map.get('mapPath') as string) : null,
    mapWidthPx:
      typeof map.get('mapWidthPx') === 'number' ? (map.get('mapWidthPx') as number) : null,
    mapHeightPx:
      typeof map.get('mapHeightPx') === 'number' ? (map.get('mapHeightPx') as number) : null,
    hideTokensInFog: map.get('hideTokensInFog') === true,
  }
}

export function writeYjsScene(doc: Y.Doc, state: SceneState): void {
  const map = doc.getMap(YJS_SCENE_KEY)
  doc.transact(() => {
    map.set('gridSizePx', state.gridSizePx)
    map.set('mapPath', state.mapPath)
    map.set('mapWidthPx', state.mapWidthPx)
    map.set('mapHeightPx', state.mapHeightPx)
    map.set('hideTokensInFog', state.hideTokensInFog)
  })
}

export function sceneStateFromRow(row: {
  grid_size_px: number
  map_path: string | null
  map_width_px: number | null
  map_height_px: number | null
}): SceneState {
  return {
    schemaVersion: 1,
    gridSizePx: row.grid_size_px,
    mapPath: row.map_path,
    mapWidthPx: row.map_width_px,
    mapHeightPx: row.map_height_px,
    hideTokensInFog: false,
  }
}
