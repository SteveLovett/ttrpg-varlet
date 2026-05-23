import type { CharacterSheet } from './types'
import { characterOptions } from '../data/character-options'

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const

export function proficiencyBonus(level: number): number {
  return Math.floor((Math.max(1, Math.min(20, level)) - 1) / 4) + 2
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : String(mod)
}

export function hitDieForClass(className: string): number {
  const found = characterOptions.classes.find(
    (c) => c.name.toLowerCase() === className.trim().toLowerCase(),
  )
  return found?.hitDie ?? 8
}

/** Level 1 HP: max hit die + CON mod (simplified; no rolled HP at higher levels). */
export function suggestHpMax(sheet: Pick<CharacterSheet, 'className' | 'level' | 'abilities'>): number {
  const hd = hitDieForClass(sheet.className)
  const con = abilityModifier(sheet.abilities.con)
  const lvl = Math.max(1, Math.min(20, sheet.level))
  if (lvl === 1) {
    return Math.max(1, hd + con)
  }
  const perLevel = Math.max(1, Math.floor(hd / 2) + 1 + con)
  return Math.max(1, hd + con + perLevel * (lvl - 1))
}
