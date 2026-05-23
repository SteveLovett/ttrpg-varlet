import { useCallback, useEffect, useState } from 'react'
import type * as Y from 'yjs'
import { parseVttSnapshot } from '../components/vtt/vttSnapshot'
import { YJS_DRAWINGS_KEY, type DrawingShape } from '../components/vtt/types'
import {
  appendDrawing,
  clearDrawings,
  readDrawings,
  removeDrawing,
  replaceDrawing,
  writeDrawingsFromSnapshot,
} from '../components/vtt/yjsDrawings'
import type { VttSceneRow } from './useVttScene'

export function useYjsDrawings(
  doc: Y.Doc,
  options: { synced: boolean; scene: VttSceneRow | null },
) {
  const [drawings, setDrawings] = useState<DrawingShape[]>([])

  useEffect(() => {
    const arr = doc.getArray(YJS_DRAWINGS_KEY)

    function refresh() {
      setDrawings(readDrawings(arr))
    }

    refresh()
    arr.observe(refresh)
    return () => arr.unobserve(refresh)
  }, [doc])

  useEffect(() => {
    if (!options.synced || !options.scene) return
    const arr = doc.getArray(YJS_DRAWINGS_KEY)
    if (arr.length > 0) return

    const snapshot = parseVttSnapshot(options.scene.state_json)
    if (!snapshot || snapshot.drawings.length === 0) return
    writeDrawingsFromSnapshot(doc, snapshot.drawings)
  }, [doc, options.synced, options.scene])

  const addDrawing = useCallback(
    (shape: DrawingShape) => {
      appendDrawing(doc, shape)
    },
    [doc],
  )

  const updateDrawing = useCallback(
    (shape: DrawingShape) => {
      replaceDrawing(doc, shape.id, shape)
    },
    [doc],
  )

  const deleteDrawing = useCallback(
    (shapeId: string) => {
      removeDrawing(doc, shapeId)
    },
    [doc],
  )

  const resetDrawings = useCallback(() => {
    clearDrawings(doc)
  }, [doc])

  return { drawings, addDrawing, updateDrawing, deleteDrawing, resetDrawings }
}
