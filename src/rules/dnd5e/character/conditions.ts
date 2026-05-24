import { conditions } from '../data'
import type { CharacterSheet } from './types'

export const CONDITION_IDS = conditions.map((c) => c.id)

export function parseActiveConditions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const valid = new Set(CONDITION_IDS)
  return raw.filter((id): id is string => typeof id === 'string' && valid.has(id))
}

export function parseExhaustionLevel(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0
  return Math.max(0, Math.min(6, Math.floor(raw)))
}

export function toggleActiveCondition(
  sheet: CharacterSheet,
  conditionId: string,
  active: boolean,
): CharacterSheet {
  const set = new Set(sheet.activeConditions)
  if (active) {
    set.add(conditionId)
  } else {
    set.delete(conditionId)
  }
  return { ...sheet, activeConditions: [...set].sort() }
}

export function setExhaustionLevel(sheet: CharacterSheet, level: number): CharacterSheet {
  return { ...sheet, exhaustionLevel: parseExhaustionLevel(level) }
}
