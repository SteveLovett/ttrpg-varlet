import { useCallback, useState } from 'react'
import {
  DEFAULT_SPELLCASTING_VALIDATION_MODE,
  parseGameSettings,
  resolveSpellcastingValidationMode,
  type SpellcastingValidationMode,
} from '../settings/validation'
import { useThemeSettings } from '../themes/themeContext'
import {
  addInventoryItem,
  addSpellToSpellcasting,
  ensureSpellcasting,
  normalizeInventoryIds,
  parseSheetJson,
  type CharacterSheet,
  type InventoryItem,
} from '../rules/dnd5e/character'
import { checkSpellcastingSave } from '../rules/dnd5e/character/spellcastingSave'
import { supabase } from '../supabaseClient'

export type MyCharacterRow = {
  id: string
  name: string
  game_id: string | null
  game_name: string | null
  sheet_json: CharacterSheet
  updated_at: string
  spellcastingValidationMode: SpellcastingValidationMode
}

export function useMyCharacters() {
  const { preferences } = useThemeSettings()
  const userMode = preferences.spellcastingValidation ?? DEFAULT_SPELLCASTING_VALIDATION_MODE

  const [characters, setCharacters] = useState<MyCharacterRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    setLoading(true)
    setError(null)

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
    const gameNames = new Map<string, string>()
    const gamePolicies = new Map<string, ReturnType<typeof parseGameSettings>>()
    if (gameIds.length > 0) {
      const { data: games } = await supabase
        .from('games')
        .select('id, name, settings')
        .in('id', gameIds)
      for (const g of games ?? []) {
        gameNames.set(g.id, g.name)
        gamePolicies.set(g.id, parseGameSettings(g.settings))
      }
    }

    const mapped: MyCharacterRow[] = []
    for (const row of rows) {
      const sheet = parseSheetJson(row.sheet_json)
      if (!sheet) continue
      const gamePolicy = row.game_id
        ? gamePolicies.get(row.game_id)?.spellcastingValidation
        : undefined
      mapped.push({
        id: row.id,
        name: row.name,
        game_id: row.game_id,
        game_name: row.game_id ? (gameNames.get(row.game_id) ?? 'Campaign') : null,
        sheet_json: sheet,
        updated_at: row.updated_at,
        spellcastingValidationMode: resolveSpellcastingValidationMode(userMode, gamePolicy),
      })
    }

    setCharacters(mapped)
    setLoading(false)
  }, [userMode])

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

  const addSpellToCharacter = useCallback(
    async (characterId: string, slug: string): Promise<string | null> => {
      const row = characters.find((c) => c.id === characterId)
      if (!row) return 'Character not found.'

      const sheet = addSpellToSpellcasting(ensureSpellcasting(row.sheet_json), slug)
      const saveCheck = checkSpellcastingSave(sheet, row.spellcastingValidationMode)
      if (saveCheck.blocked) {
        return saveCheck.blockMessages.join(' ')
      }
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
    addSpellToCharacter,
  }
}
