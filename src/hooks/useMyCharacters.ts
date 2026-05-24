import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_SPELLCASTING_VALIDATION_MODE,
  parseGameSettings,
  type SpellcastingValidationMode,
} from '../settings/validation'
import { useThemeSettings } from '../themes/themeContext'
import {
  addInventoryItem,
  addSpellToSpellcasting,
  ensureSpellcasting,
  normalizeInventoryIds,
  finalizeCharacterSheet,
  inventoryItemCustom,
  parseAndFinalizeSheet,
  type CharacterSheet,
  type InventoryItem,
} from '../rules/dnd5e/character'
import { checkInventorySave } from '../rules/dnd5e/character/inventorySave'
import { checkSpellcastingSave } from '../rules/dnd5e/character/spellcastingSave'
import { supabase } from '../supabaseClient'
import {
  buildMyCharacterRows,
  resolveValidationModeForCharacter,
  type MyCharacterRow,
} from './myCharactersData'

export type { MyCharacterRow } from './myCharactersData'

type UseMyCharactersOptions = {
  loadOnMount?: boolean
}

export function useMyCharacters(options: UseMyCharactersOptions = {}) {
  const { loadOnMount = false } = options
  const { preferences } = useThemeSettings()
  const userMode = preferences.spellcastingValidation ?? DEFAULT_SPELLCASTING_VALIDATION_MODE

  const [characters, setCharacters] = useState<MyCharacterRow[]>([])
  const [loading, setLoading] = useState(loadOnMount)
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
    let games: { id: string; name: string; settings: unknown }[] = []
    if (gameIds.length > 0) {
      const { data: gameRows } = await supabase
        .from('games')
        .select('id, name, settings')
        .in('id', gameIds)
      games = gameRows ?? []
    }

    setCharacters(buildMyCharacterRows(rows, games, userMode))
    setLoading(false)
  }, [userMode])

  useEffect(() => {
    if (!loadOnMount) return
    queueMicrotask(() => {
      void load()
    })
  }, [loadOnMount, load])

  const updateCharacterSheet = useCallback(
    async (
      characterId: string,
      apply: (sheet: CharacterSheet, validationMode: SpellcastingValidationMode) => CharacterSheet | string,
    ): Promise<string | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return 'Not signed in.'

      const { data: row, error: fetchError } = await supabase
        .from('characters')
        .select('id, game_id, sheet_json')
        .eq('id', characterId)
        .eq('owner_id', user.id)
        .maybeSingle()

      if (fetchError || !row) return 'Character not found.'

      const sheet = parseAndFinalizeSheet(row.sheet_json)
      if (!sheet) return 'Invalid character data.'

      let validationMode = userMode
      if (row.game_id) {
        const { data: game } = await supabase
          .from('games')
          .select('settings')
          .eq('id', row.game_id)
          .maybeSingle()
        const policies = new Map([
          [row.game_id, parseGameSettings(game?.settings).spellcastingValidation],
        ])
        validationMode = resolveValidationModeForCharacter(userMode, row.game_id, policies)
      }

      const result = apply(sheet, validationMode)
      if (typeof result === 'string') return result

      const finalized = finalizeCharacterSheet(result)

      const { error: updateError } = await supabase
        .from('characters')
        .update({ sheet_json: finalized })
        .eq('id', characterId)

      if (updateError) return updateError.message
      await load()
      return null
    },
    [load, userMode],
  )

  const addItemToCharacter = useCallback(
    async (characterId: string, item: InventoryItem): Promise<string | null> => {
      return updateCharacterSheet(characterId, (sheet, validationMode) => {
        const next = normalizeInventoryIds(addInventoryItem(sheet, item))
        const invCheck = checkInventorySave(next, validationMode)
        if (invCheck.blocked) return invCheck.blockMessages.join(' ')
        return next
      })
    },
    [updateCharacterSheet],
  )

  const addSpellToCharacter = useCallback(
    async (
      characterId: string,
      slug: string,
      casterClassName?: string,
    ): Promise<string | null> => {
      return updateCharacterSheet(characterId, (sheet, validationMode) => {
        const next = addSpellToSpellcasting(ensureSpellcasting(sheet), slug, casterClassName)
        const saveCheck = checkSpellcastingSave(next, validationMode)
        if (saveCheck.blocked) {
          return saveCheck.blockMessages.join(' ')
        }
        return next
      })
    },
    [updateCharacterSheet],
  )

  const addMaterialToCharacter = useCallback(
    async (characterId: string, materialLabel: string): Promise<string | null> => {
      const trimmed = materialLabel.trim()
      if (!trimmed) return 'Material name is required.'
      return updateCharacterSheet(characterId, (sheet, validationMode) => {
        const next = normalizeInventoryIds(
          addInventoryItem(sheet, inventoryItemCustom(trimmed)),
        )
        const invCheck = checkInventorySave(next, validationMode)
        if (invCheck.blocked) return invCheck.blockMessages.join(' ')
        return next
      })
    },
    [updateCharacterSheet],
  )

  return {
    characters,
    loading,
    error,
    reload: load,
    addItemToCharacter,
    addSpellToCharacter,
    addMaterialToCharacter,
  }
}
