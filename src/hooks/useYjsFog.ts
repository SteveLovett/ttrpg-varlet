import { useCallback, useEffect, useState } from 'react'
import type * as Y from 'yjs'
import { parseVttSnapshot } from '../components/vtt/vttSnapshot'
import { YJS_FOG_KEY, type FogStroke } from '../components/vtt/types'
import {
  appendFogStroke,
  clearFogStrokes,
  readFogStrokes,
  replaceFogStroke,
  writeFogFromSnapshot,
} from '../components/vtt/yjsFog'
import type { VttSceneRow } from './useVttScene'

export function useYjsFog(
  doc: Y.Doc,
  options: { synced: boolean; scene: VttSceneRow | null },
) {
  const [fogStrokes, setFogStrokes] = useState<FogStroke[]>([])

  useEffect(() => {
    const arr = doc.getArray(YJS_FOG_KEY)

    function refresh() {
      setFogStrokes(readFogStrokes(arr))
    }

    refresh()
    arr.observe(refresh)
    return () => arr.unobserve(refresh)
  }, [doc])

  useEffect(() => {
    if (!options.synced || !options.scene) return
    const arr = doc.getArray(YJS_FOG_KEY)
    if (arr.length > 0) return

    const snapshot = parseVttSnapshot(options.scene.state_json)
    if (!snapshot || snapshot.fog.length === 0) return
    writeFogFromSnapshot(doc, snapshot.fog)
  }, [doc, options.synced, options.scene])

  const addFogStroke = useCallback(
    (stroke: FogStroke) => {
      appendFogStroke(doc, stroke)
    },
    [doc],
  )

  const updateFogStroke = useCallback(
    (stroke: FogStroke) => {
      replaceFogStroke(doc, stroke.id, stroke)
    },
    [doc],
  )

  const resetFog = useCallback(() => {
    clearFogStrokes(doc)
  }, [doc])

  return { fogStrokes, addFogStroke, updateFogStroke, resetFog }
}
