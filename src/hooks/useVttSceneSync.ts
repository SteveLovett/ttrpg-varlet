import { useEffect, useRef, useState } from 'react'
import type * as Y from 'yjs'
import { readYjsScene, sceneStateFromRow, writeYjsScene } from '../components/vtt/yjsScene'
import { buildVttSnapshot } from '../components/vtt/vttSnapshot'
import type { VttSceneRow } from './useVttScene'
import { YJS_SCENE_KEY, YJS_TOKENS_KEY, type SceneState } from '../components/vtt/types'

const SNAPSHOT_DEBOUNCE_MS = 2000

type UseVttSceneSyncArgs = {
  doc: Y.Doc
  synced: boolean
  scene: VttSceneRow | null
  isGM: boolean
  saveSnapshot: (sceneId: string, stateJson: unknown) => Promise<string | null>
}

/**
 * Keeps the Yjs `scene` map aligned with Postgres and debounces GM snapshots
 * (scene + tokens) into `vtt_scenes.state_json`.
 */
export function useVttSceneSync({
  doc,
  synced,
  scene,
  isGM,
  saveSnapshot,
}: UseVttSceneSyncArgs): SceneState | null {
  const [liveScene, setLiveScene] = useState<SceneState | null>(null)
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const yMap = doc.getMap(YJS_SCENE_KEY)

    function refresh() {
      const fromYjs = readYjsScene(yMap)
      if (fromYjs?.mapPath) {
        setLiveScene(fromYjs)
        return
      }
      if (scene?.map_path) {
        setLiveScene(sceneStateFromRow(scene))
        return
      }
      setLiveScene(null)
    }

    refresh()
    yMap.observe(refresh)
    return () => yMap.unobserve(refresh)
  }, [doc, scene])

  useEffect(() => {
    if (!synced || !scene?.map_path) return
    const yMap = doc.getMap(YJS_SCENE_KEY)
    const existing = readYjsScene(yMap)
    if (existing?.mapPath) return
    writeYjsScene(doc, sceneStateFromRow(scene))
  }, [doc, synced, scene])

  useEffect(() => {
    if (!isGM || !scene) return
    const sceneId = scene.id
    const sceneMap = doc.getMap(YJS_SCENE_KEY)
    const tokenMap = doc.getMap(YJS_TOKENS_KEY)

    function scheduleSnapshot() {
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current)
      snapshotTimer.current = setTimeout(() => {
        const live = readYjsScene(sceneMap)
        if (!live) return
        void saveSnapshot(sceneId, buildVttSnapshot(doc, live))
      }, SNAPSHOT_DEBOUNCE_MS)
    }

    sceneMap.observe(scheduleSnapshot)
    tokenMap.observe(scheduleSnapshot)
    return () => {
      sceneMap.unobserve(scheduleSnapshot)
      tokenMap.unobserve(scheduleSnapshot)
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current)
    }
  }, [doc, isGM, scene, saveSnapshot])

  return liveScene
}
