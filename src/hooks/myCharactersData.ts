import {
  parseGameSettings,
  resolveSpellcastingValidationMode,
  type GameSpellcastingPolicy,
  type SpellcastingValidationMode,
} from '../settings/validation'
import { parseAndFinalizeSheet, type CharacterSheet } from '../rules/dnd5e/character'

export type MyCharacterRow = {
  id: string
  name: string
  game_id: string | null
  game_name: string | null
  sheet_json: CharacterSheet
  updated_at: string
  spellcastingValidationMode: SpellcastingValidationMode
}

export type CharacterDbRow = {
  id: string
  name: string
  game_id: string | null
  sheet_json: unknown
  updated_at: string
}

export type GameDbRow = {
  id: string
  name: string
  settings: unknown
}

export function buildMyCharacterRows(
  rows: CharacterDbRow[],
  games: GameDbRow[],
  userMode: SpellcastingValidationMode,
): MyCharacterRow[] {
  const gameNames = new Map(games.map((g) => [g.id, g.name]))
  const gamePolicies = new Map(
    games.map((g) => [g.id, parseGameSettings(g.settings).spellcastingValidation]),
  )

  const mapped: MyCharacterRow[] = []
  for (const row of rows) {
    const sheet = parseAndFinalizeSheet(row.sheet_json)
    if (!sheet) continue
    const gamePolicy = row.game_id ? gamePolicies.get(row.game_id) : undefined
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
  return mapped
}

export function resolveValidationModeForCharacter(
  userMode: SpellcastingValidationMode,
  gameId: string | null,
  gamePolicyByGameId: Map<string, GameSpellcastingPolicy | undefined>,
): SpellcastingValidationMode {
  const gamePolicy = gameId ? gamePolicyByGameId.get(gameId) : undefined
  return resolveSpellcastingValidationMode(userMode, gamePolicy)
}

export type SheetUpdateResult =
  | { ok: true; sheet: CharacterSheet }
  | { ok: false; error: string }
