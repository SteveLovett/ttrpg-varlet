import { syncClassFields } from './classes'
import { normalizeSheetSpellcasting } from './spellcastingState'
import { parseSheetJson, type CharacterSheet } from './types'

/** Run after parseSheetJson (or on save) to sync multiclass + spellcasting maps. */
export function finalizeCharacterSheet(sheet: CharacterSheet): CharacterSheet {
  return normalizeSheetSpellcasting(syncClassFields(sheet))
}

export function parseAndFinalizeSheet(raw: unknown): CharacterSheet | null {
  const parsed = parseSheetJson(raw)
  return parsed ? finalizeCharacterSheet(parsed) : null
}
