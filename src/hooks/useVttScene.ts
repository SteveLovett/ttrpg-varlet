import { useCallback, useState } from 'react'
import {
  GAME_ASSETS_BUCKET,
  extensionForMime,
  loadImageDimensions,
  mapObjectPath,
  validateMapFile,
} from '../components/vtt/mapAssets'
import { supabase } from '../supabaseClient'

export type VttSceneRow = {
  id: string
  game_id: string
  name: string
  map_path: string | null
  map_width_px: number | null
  map_height_px: number | null
  grid_size_px: number
  state_json: unknown
  created_at: string
  updated_at: string
}

const SIGNED_URL_TTL_SEC = 3600

export function useVttScene(gameId: string | undefined) {
  const [scene, setScene] = useState<VttSceneRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('vtt_scenes')
      .select(
        'id, game_id, name, map_path, map_width_px, map_height_px, grid_size_px, state_json, created_at, updated_at',
      )
      .eq('game_id', gameId)
      .maybeSingle()

    if (fetchError) {
      setError(fetchError.message)
      setScene(null)
      setLoading(false)
      return
    }
    setScene((data as VttSceneRow | null) ?? null)
    setLoading(false)
  }, [gameId])

  const createSceneWithMap = useCallback(
    async (input: {
      name: string
      gridSizePx: number
      file: File
    }): Promise<{ scene: VttSceneRow } | { error: string }> => {
      if (!gameId) return { error: 'Missing game.' }
      const trimmedName = input.name.trim()
      if (trimmedName.length < 1) return { error: 'Scene name is required.' }
      if (input.gridSizePx < 8 || input.gridSizePx > 512) {
        return { error: 'Grid size must be between 8 and 512 pixels.' }
      }

      const fileError = validateMapFile(input.file)
      if (fileError) return { error: fileError }

      let dimensions: { width: number; height: number }
      try {
        dimensions = await loadImageDimensions(input.file)
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Invalid image.' }
      }
      if (
        dimensions.width > 4096 ||
        dimensions.height > 4096
      ) {
        return { error: 'Map image must be at most 4096×4096 pixels.' }
      }

      const { data: inserted, error: insertError } = await supabase
        .from('vtt_scenes')
        .insert({
          game_id: gameId,
          name: trimmedName,
          grid_size_px: input.gridSizePx,
          map_width_px: dimensions.width,
          map_height_px: dimensions.height,
        })
        .select(
          'id, game_id, name, map_path, map_width_px, map_height_px, grid_size_px, state_json, created_at, updated_at',
        )
        .single()

      if (insertError) return { error: insertError.message }

      const ext = extensionForMime(input.file.type)
      const path = mapObjectPath(gameId, inserted.id, ext)
      const { error: uploadError } = await supabase.storage
        .from(GAME_ASSETS_BUCKET)
        .upload(path, input.file, { upsert: true, contentType: input.file.type })

      if (uploadError) {
        await supabase.from('vtt_scenes').delete().eq('id', inserted.id)
        return { error: uploadError.message }
      }

      const { data: updated, error: updateError } = await supabase
        .from('vtt_scenes')
        .update({ map_path: path })
        .eq('id', inserted.id)
        .select(
          'id, game_id, name, map_path, map_width_px, map_height_px, grid_size_px, state_json, created_at, updated_at',
        )
        .single()

      if (updateError) return { error: updateError.message }

      const row = updated as VttSceneRow
      setScene(row)
      return { scene: row }
    },
    [gameId],
  )

  const replaceMap = useCallback(
    async (
      sceneId: string,
      file: File,
    ): Promise<{ scene: VttSceneRow } | { error: string }> => {
      if (!gameId) return { error: 'Missing game.' }
      const fileError = validateMapFile(file)
      if (fileError) return { error: fileError }

      let dimensions: { width: number; height: number }
      try {
        dimensions = await loadImageDimensions(file)
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Invalid image.' }
      }
      if (dimensions.width > 4096 || dimensions.height > 4096) {
        return { error: 'Map image must be at most 4096×4096 pixels.' }
      }

      const ext = extensionForMime(file.type)
      const path = mapObjectPath(gameId, sceneId, ext)
      const { error: uploadError } = await supabase.storage
        .from(GAME_ASSETS_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) return { error: uploadError.message }

      const { data: updated, error: updateError } = await supabase
        .from('vtt_scenes')
        .update({
          map_path: path,
          map_width_px: dimensions.width,
          map_height_px: dimensions.height,
        })
        .eq('id', sceneId)
        .select(
          'id, game_id, name, map_path, map_width_px, map_height_px, grid_size_px, state_json, created_at, updated_at',
        )
        .single()

      if (updateError) return { error: updateError.message }

      const row = updated as VttSceneRow
      setScene(row)
      return { scene: row }
    },
    [gameId],
  )

  const updateGridSize = useCallback(
    async (sceneId: string, gridSizePx: number): Promise<string | null> => {
      if (gridSizePx < 8 || gridSizePx > 512) {
        return 'Grid size must be between 8 and 512 pixels.'
      }
      const { data, error: updateError } = await supabase
        .from('vtt_scenes')
        .update({ grid_size_px: gridSizePx })
        .eq('id', sceneId)
        .select(
          'id, game_id, name, map_path, map_width_px, map_height_px, grid_size_px, state_json, created_at, updated_at',
        )
        .single()

      if (updateError) return updateError.message
      setScene(data as VttSceneRow)
      return null
    },
    [],
  )

  const getMapSignedUrl = useCallback(async (mapPath: string): Promise<string | null> => {
    const { data, error: signError } = await supabase.storage
      .from(GAME_ASSETS_BUCKET)
      .createSignedUrl(mapPath, SIGNED_URL_TTL_SEC)
    if (signError || !data?.signedUrl) return null
    return data.signedUrl
  }, [])

  const saveSnapshot = useCallback(
    async (sceneId: string, stateJson: unknown): Promise<string | null> => {
      const { error: updateError } = await supabase
        .from('vtt_scenes')
        .update({ state_json: stateJson })
        .eq('id', sceneId)
      return updateError?.message ?? null
    },
    [],
  )

  return {
    scene,
    loading,
    error,
    load,
    createSceneWithMap,
    replaceMap,
    updateGridSize,
    getMapSignedUrl,
    saveSnapshot,
  }
}
