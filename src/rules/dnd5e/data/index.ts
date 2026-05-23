import conditionsData from './conditions.json'
import dicePresetsData from './dice-presets.json'
import manifest from './manifest.json'
import type { AdvantageMode } from '../dice/types'

export type DicePreset = {
  id: string
  label: string
  formula: string
  advantage?: AdvantageMode
  /** d100 (×10): rolls 10, 20, … 100 only */
  kind?: 'percentile-tens'
}

export type ConditionRef = {
  id: string
  name: string
  summary: string
}

export const dicePresets = dicePresetsData as DicePreset[]
export const conditions = conditionsData as ConditionRef[]
export const srdManifest = manifest

/** Lazy-load bundled Open5e exports (after running fetch:srd). */
export async function loadMonstersIndex(): Promise<{ count: number } | null> {
  try {
    const mod = await import('./monsters.json')
    const list = mod.default as unknown[]
    return { count: Array.isArray(list) ? list.length : 0 }
  } catch {
    return null
  }
}

export async function loadSpellsIndex(): Promise<{ count: number } | null> {
  try {
    const mod = await import('./spells.json')
    const list = mod.default as unknown[]
    return { count: Array.isArray(list) ? list.length : 0 }
  } catch {
    return null
  }
}
