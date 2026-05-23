import { useCallback, useState } from 'react'
import { parseSheetJson, type CharacterSheet } from '../rules/dnd5e/character'
import { supabase } from '../supabaseClient'

export type CharacterRow = {
  id: string
  owner_id: string
  game_id: string | null
  name: string
  sheet_json: CharacterSheet
  created_at: string
  updated_at: string
  owner_display_name: string | null
}

function mapRow(
  row: {
    id: string
    owner_id: string
    game_id: string | null
    name: string
    sheet_json: unknown
    created_at: string
    updated_at: string
  },
  displayName: string | null,
): CharacterRow | null {
  const sheet = parseSheetJson(row.sheet_json)
  if (!sheet) return null
  return {
    ...row,
    sheet_json: sheet,
    owner_display_name: displayName,
  }
}

export function useGameCharacters(gameId: string | undefined) {
  const [characters, setCharacters] = useState<CharacterRow[]>([])
  const [myUnattached, setMyUnattached] = useState<CharacterRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCharacters = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('characters')
      .select('id, owner_id, game_id, name, sheet_json, created_at, updated_at')
      .eq('game_id', gameId)
      .order('name')

    if (fetchError) {
      setError(fetchError.message)
      setCharacters([])
      setLoading(false)
      return
    }

    const rows = data ?? []
    const ownerIds = [...new Set(rows.map((r) => r.owner_id))]
    let names = new Map<string, string | null>()
    if (ownerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', ownerIds)
      names = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))
    }

    setCharacters(
      rows
        .map((r) => mapRow(r, names.get(r.owner_id) ?? null))
        .filter((r): r is CharacterRow => r !== null),
    )
    setLoading(false)
  }, [gameId])

  const loadMyUnattached = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setMyUnattached([])
      return
    }

    const { data, error: fetchError } = await supabase
      .from('characters')
      .select('id, owner_id, game_id, name, sheet_json, created_at, updated_at')
      .eq('owner_id', user.id)
      .is('game_id', null)
      .order('updated_at', { ascending: false })

    if (fetchError) {
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle()

    setMyUnattached(
      (data ?? [])
        .map((r) => mapRow(r, profile?.display_name ?? null))
        .filter((r): r is CharacterRow => r !== null),
    )
  }, [])

  const createCharacter = useCallback(
    async (name: string, sheet: CharacterSheet): Promise<{ id: string } | { error: string }> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: 'You must be signed in.' }
      if (!gameId) return { error: 'Missing game.' }

      const { data, error: insertError } = await supabase
        .from('characters')
        .insert({
          owner_id: user.id,
          game_id: gameId,
          name: name.trim(),
          sheet_json: sheet,
        })
        .select('id')
        .single()

      if (insertError) return { error: insertError.message }
      await loadCharacters()
      return { id: data.id }
    },
    [gameId, loadCharacters],
  )

  const updateCharacter = useCallback(
    async (
      characterId: string,
      name: string,
      sheet: CharacterSheet,
    ): Promise<string | null> => {
      const { error: updateError } = await supabase
        .from('characters')
        .update({ name: name.trim(), sheet_json: sheet })
        .eq('id', characterId)

      if (updateError) return updateError.message
      await loadCharacters()
      return null
    },
    [loadCharacters],
  )

  const attachCharacter = useCallback(
    async (characterId: string): Promise<string | null> => {
      if (!gameId) return 'Missing game.'
      const { error: updateError } = await supabase
        .from('characters')
        .update({ game_id: gameId })
        .eq('id', characterId)

      if (updateError) return updateError.message
      await loadCharacters()
      await loadMyUnattached()
      return null
    },
    [gameId, loadCharacters, loadMyUnattached],
  )

  const detachCharacter = useCallback(
    async (characterId: string): Promise<string | null> => {
      const { error: updateError } = await supabase
        .from('characters')
        .update({ game_id: null })
        .eq('id', characterId)

      if (updateError) return updateError.message
      await loadCharacters()
      await loadMyUnattached()
      return null
    },
    [loadCharacters, loadMyUnattached],
  )

  const deleteCharacter = useCallback(
    async (characterId: string): Promise<string | null> => {
      const { error: deleteError } = await supabase.from('characters').delete().eq('id', characterId)
      if (deleteError) return deleteError.message
      await loadCharacters()
      await loadMyUnattached()
      return null
    },
    [loadCharacters, loadMyUnattached],
  )

  return {
    characters,
    myUnattached,
    loading,
    error,
    loadCharacters,
    loadMyUnattached,
    createCharacter,
    updateCharacter,
    attachCharacter,
    detachCharacter,
    deleteCharacter,
  }
}
