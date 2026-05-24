import { getClassSpellcastingRules, spellSlotsMax } from './spellcasting'
import type { ClassLevel } from './types'

export type CasterContribution = 'none' | 'full' | 'half' | 'pact'

export function casterContribution(className: string): CasterContribution {
  const rules = getClassSpellcastingRules(className)
  if (!rules?.slotTable) return 'none'
  return rules.slotTable
}

/** Combined caster level for full/half multiclass slot table (excludes Warlock). */
export function multiclassCasterLevel(classes: ClassLevel[]): number {
  let total = 0
  for (const { className, level } of classes) {
    const contribution = casterContribution(className)
    const lvl = Math.max(0, Math.floor(level))
    if (contribution === 'full') total += lvl
    else if (contribution === 'half') total += Math.floor(lvl / 2)
  }
  return Math.min(20, total)
}

export function warlockLevels(classes: ClassLevel[]): number {
  return classes
    .filter((c) => casterContribution(c.className) === 'pact')
    .reduce((sum, c) => sum + Math.max(0, Math.floor(c.level)), 0)
}

/** Shared spell slot maximums for multiclass full/half casters. */
export function combinedSpellSlotsMax(classes: ClassLevel[]): number[] {
  const casterLevel = multiclassCasterLevel(classes)
  if (casterLevel <= 0) return [0, 0, 0, 0, 0, 0, 0, 0, 0]
  return spellSlotsMax('Wizard', casterLevel)
}

export function pactSpellSlotsMax(classes: ClassLevel[]): number[] {
  const wl = warlockLevels(classes)
  if (wl <= 0) return [0, 0, 0, 0, 0, 0, 0, 0, 0]
  return spellSlotsMax('Warlock', wl)
}

export function hasSharedCasterSlots(classes: ClassLevel[]): boolean {
  return multiclassCasterLevel(classes) > 0
}

export function hasPactSlots(classes: ClassLevel[]): boolean {
  return warlockLevels(classes) > 0
}
