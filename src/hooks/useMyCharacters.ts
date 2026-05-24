import { useCallback, useState } from 'react'
import {
  addInventoryItem,
  normalizeInventoryIds,
  parseSheetJson,
  type CharacterSheet,
  type InventoryItem,
} from '../rules/dnd5e/character'
import { supabase } from '../supabaseClient'

export type MyCharacterRow = {
  id: string
  name: string
  game_id: string | null
  game_name: string | null
  sheet_json: CharacterSheet
  updated_at: string
}

export function useMyCharacters() {
  const [characters, setCharacters] = useState<MyCharacterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setCharacters([])
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('characters')
      .select('id, name, game_id, sheet_json, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setCharacters([])
      setLoading(false)
      return
    }

    const rows = data ?? []
    const gameIds = [...new Set(rows.map((r) => r.game_id).filter((id): id is string => !!id))]
    let gameNames = new Map<string, string>()
    if (gameIds.length > 0) {
      const { data: games } = await supabase.from('games').select('id, name').in('id', gameIds)
      gameNames = new Map((games ?? []).map((g) => [g.id, g.name]))
    }

    const mapped: MyCharacterRow[] = []
    for (const row of rows) {
      const sheet = parseSheetJson(row.sheet_json)
      if (!sheet) continue
      mapped.push({
        id: row.id,
        name: row.name,
        game_id: row.game_id,
        game_name: row.game_id ? (gameNames.get(row.game_id) ?? 'Campaign') : null,
        sheet_json: sheet,
        updated_at: row.updated_at,
      })
    }

    setCharacters(mapped)
    setLoading(false)
  }, [])

  const addItemToCharacter = useCallback(
    async (characterId: string, item: InventoryItem): Promise<string | null> => {
      const row = characters.find((c) => c.id === characterId)
      if (!row) return 'Character not found.'

      const sheet = normalizeInventoryIds(addInventoryItem(row.sheet_json, item))
      const { error: updateError } = await supabase
        .from('characters')
        .update({ sheet_json: sheet })
        .eq('id', characterId)

      if (updateError) return updateError.message
      await load()
      return null
    },
    [characters, load],
  )

  return {
    characters,
    loading,
    error,
    reload: load,
    addItemToCharacter,
  }
}
