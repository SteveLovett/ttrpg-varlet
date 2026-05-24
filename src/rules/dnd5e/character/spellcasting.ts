import rulesData from '../data/spellcasting-rules.json'
import { isSpellOnClassList } from '../data/class-spell-lists'
import { getSpellBySlug } from '../data/spells'
import { abilityModifier, proficiencyBonus } from './math'
import type { AbilityKey, CharacterSheet, CharacterSpellcasting } from './types'

export type SpellcastingMode = 'none' | 'prepared' | 'known' | 'pact'

type PreparedFormula = 'abilityPlusLevel' | 'abilityPlusHalfLevel'

type ClassSpellcastingRules = {
  mode: SpellcastingMode
  ability?: AbilityKey
  slotTable?: 'full' | 'half' | 'pact'
  cantripsByLevel?: number[]
  spellsKnownByLevel?: number[]
  preparedFormula?: PreparedFormula
}

type PactSlotGroup = { count: number; level: number }

type RulesFile = {
  slotTables: {
    full: number[][]
    half: number[][]
    pact: PactSlotGroup[][]
  }
  classes: Record<string, ClassSpellcastingRules>
}

const rules = rulesData as RulesFile

export function classHasSpellcasting(className: string): boolean {
  const r = rules.classes[className]
  return !!r && r.mode !== 'none'
}

export function getClassSpellcastingRules(className: string): ClassSpellcastingRules | null {
  const r = rules.classes[className]
  if (!r || r.mode === 'none') return null
  return r
}

export function defaultSpellcastingAbility(className: string): AbilityKey {
  return getClassSpellcastingRules(className)?.ability ?? 'int'
}

export function createDefaultSpellcasting(sheet: CharacterSheet): CharacterSpellcasting | null {
  if (!classHasSpellcasting(sheet.className)) return null
  return {
    ability: defaultSpellcastingAbility(sheet.className),
    cantripSlugs: [],
    spellbookSlugs: [],
    knownSlugs: [],
    preparedSlugs: [],
    slotsUsed: {},
  }
}

export function usesSpellbook(className: string): boolean {
  return className === 'Wizard'
}

export function spellSaveDc(sheet: CharacterSheet): number | null {
  const sc = sheet.spellcasting
  if (!sc || !classHasSpellcasting(sheet.className)) return null
  return 8 + proficiencyBonus(sheet.level) + abilityModifier(sheet.abilities[sc.ability])
}

export function spellAttackBonus(sheet: CharacterSheet): number | null {
  const sc = sheet.spellcasting
  if (!sc || !classHasSpellcasting(sheet.className)) return null
  return proficiencyBonus(sheet.level) + abilityModifier(sheet.abilities[sc.ability])
}

/** Human-readable pact slot line for Warlock (all slots share one level). */
export function pactSlotSummary(className: string, level: number): string | null {
  const r = getClassSpellcastingRules(className)
  if (!r || r.slotTable !== 'pact') return null
  const groups = rules.slotTables.pact[levelIndex(level)] ?? []
  if (groups.length === 0) return null
  return groups
    .map((g) => {
      const slotWord = g.count === 1 ? 'slot' : 'slots'
      return `${g.count} ${slotWord} (cast at level ${g.level})`
    })
    .join('; ')
}

function levelIndex(level: number): number {
  return Math.max(0, Math.min(20, Math.floor(level)))
}

export function maxCantripsKnown(className: string, level: number): number {
  const r = getClassSpellcastingRules(className)
  if (!r?.cantripsByLevel) return 0
  return r.cantripsByLevel[levelIndex(level)] ?? 0
}

export function maxSpellsKnown(className: string, level: number): number {
  const r = getClassSpellcastingRules(className)
  if (!r?.spellsKnownByLevel) return 0
  return r.spellsKnownByLevel[levelIndex(level)] ?? 0
}

export function maxSpellsPrepared(
  className: string,
  level: number,
  abilityScore: number,
): number {
  const r = getClassSpellcastingRules(className)
  if (!r || r.mode !== 'prepared') return 0
  const mod = abilityModifier(abilityScore)
  if (r.preparedFormula === 'abilityPlusHalfLevel') {
    return Math.max(1, mod + Math.ceil(level / 2))
  }
  return Math.max(1, mod + level)
}

export function spellSlotsMax(className: string, level: number): number[] {
  const r = getClassSpellcastingRules(className)
  if (!r?.slotTable) return []
  const idx = levelIndex(level)
  if (r.slotTable === 'pact') {
    const groups = rules.slotTables.pact[idx] ?? []
    const slots = [0, 0, 0, 0, 0, 0, 0, 0, 0]
    for (const g of groups) {
      const slotLevel = Math.min(9, Math.max(1, g.level))
      slots[slotLevel - 1] += g.count
    }
    return slots
  }
  const table = r.slotTable === 'half' ? rules.slotTables.half : rules.slotTables.full
  return [...(table[idx] ?? [])]
}

export function spellcastingMode(className: string): SpellcastingMode {
  return getClassSpellcastingRules(className)?.mode ?? 'none'
}

export function spellcastingModeLabel(className: string): string {
  switch (spellcastingMode(className)) {
    case 'prepared':
      return 'Prepared caster'
    case 'known':
      return 'Spells known'
    case 'pact':
      return 'Pact magic'
    default:
      return ''
  }
}

export function preparedCapDescription(className: string): string {
  const r = getClassSpellcastingRules(className)
  if (!r || r.mode !== 'prepared') return 'ability + level'
  return r.preparedFormula === 'abilityPlusHalfLevel' ? 'ability + half level' : 'ability + level'
}

export function usesPreparedList(className: string): boolean {
  const mode = spellcastingMode(className)
  return mode === 'prepared'
}

export function usesKnownList(className: string): boolean {
  const mode = spellcastingMode(className)
  return mode === 'known' || mode === 'pact'
}

export function activeSpellList(sc: CharacterSpellcasting, className: string): string[] {
  return usesPreparedList(className) ? sc.preparedSlugs : sc.knownSlugs
}

/** Merge legacy prepared spells into spellbook for Wizards missing spellbook rows. */
export function normalizeSpellcasting(sheet: CharacterSheet): CharacterSheet {
  if (!usesSpellbook(sheet.className) || !sheet.spellcasting) return sheet
  const sc = sheet.spellcasting
  const book = new Set(sc.spellbookSlugs)
  for (const slug of sc.preparedSlugs) book.add(slug)
  if (book.size === sc.spellbookSlugs.length) return sheet
  return { ...sheet, spellcasting: { ...sc, spellbookSlugs: [...book] } }
}

export function ensureSpellcasting(sheet: CharacterSheet): CharacterSheet {
  if (!classHasSpellcasting(sheet.className)) {
    return { ...sheet, spellcasting: null }
  }
  if (sheet.spellcasting) return normalizeSpellcasting(sheet)
  return normalizeSpellcasting({
    ...sheet,
    spellcasting: createDefaultSpellcasting(sheet),
  })
}

export function longRestSpellcasting(sheet: CharacterSheet): CharacterSheet {
  const sc = sheet.spellcasting
  if (!sc) return sheet
  return { ...sheet, spellcasting: { ...sc, slotsUsed: {} } }
}

/** Warlock pact slots refresh on a short rest. */
export function shortRestSpellcasting(sheet: CharacterSheet): CharacterSheet {
  if (spellcastingMode(sheet.className) !== 'pact') return sheet
  return longRestSpellcasting(sheet)
}

export function toggleSpellPrepared(sheet: CharacterSheet, slug: string): CharacterSheet {
  const sc = sheet.spellcasting
  if (!sc || !usesPreparedList(sheet.className)) return sheet
  if (usesSpellbook(sheet.className) && !sc.spellbookSlugs.includes(slug)) return sheet
  const prepared = sc.preparedSlugs.includes(slug)
    ? sc.preparedSlugs.filter((s) => s !== slug)
    : [...sc.preparedSlugs, slug]
  return { ...sheet, spellcasting: { ...sc, preparedSlugs: prepared } }
}

export function addSpellToSpellcasting(
  sheet: CharacterSheet,
  slug: string,
): CharacterSheet {
  const spell = getSpellBySlug(slug)
  if (!spell || spell.level == null) return sheet
  const next = ensureSpellcasting(sheet)
  const sc = next.spellcasting
  if (!sc) return next

  const level = spell.level
  const inList = (arr: string[]) => arr.includes(slug)

  if (level === 0) {
    if (inList(sc.cantripSlugs)) return next
    return {
      ...next,
      spellcasting: { ...sc, cantripSlugs: [...sc.cantripSlugs, slug] },
    }
  }

  if (usesPreparedList(sheet.className)) {
    if (usesSpellbook(sheet.className)) {
      if (inList(sc.spellbookSlugs)) return next
      return {
        ...next,
        spellcasting: { ...sc, spellbookSlugs: [...sc.spellbookSlugs, slug] },
      }
    }
    if (inList(sc.preparedSlugs)) return next
    return {
      ...next,
      spellcasting: { ...sc, preparedSlugs: [...sc.preparedSlugs, slug] },
    }
  }

  if (inList(sc.knownSlugs)) return next
  return {
    ...next,
    spellcasting: { ...sc, knownSlugs: [...sc.knownSlugs, slug] },
  }
}

export function removeSpellFromSpellcasting(
  sheet: CharacterSheet,
  slug: string,
): CharacterSheet {
  const sc = sheet.spellcasting
  if (!sc) return sheet
  return {
    ...sheet,
    spellcasting: {
      ...sc,
      cantripSlugs: sc.cantripSlugs.filter((s) => s !== slug),
      spellbookSlugs: sc.spellbookSlugs.filter((s) => s !== slug),
      knownSlugs: sc.knownSlugs.filter((s) => s !== slug),
      preparedSlugs: sc.preparedSlugs.filter((s) => s !== slug),
    },
  }
}

export type SpellcastingIssueSeverity = 'error' | 'warning'

export type SpellcastingIssue = {
  message: string
  severity: SpellcastingIssueSeverity
}

function issue(message: string, severity: SpellcastingIssueSeverity): SpellcastingIssue {
  return { message, severity }
}

export function partitionSpellcastingIssues(issues: SpellcastingIssue[]): {
  errors: SpellcastingIssue[]
  warnings: SpellcastingIssue[]
} {
  const errors: SpellcastingIssue[] = []
  const warnings: SpellcastingIssue[] = []
  for (const row of issues) {
    if (row.severity === 'error') errors.push(row)
    else warnings.push(row)
  }
  return { errors, warnings }
}

export function validateSpellcasting(sheet: CharacterSheet): SpellcastingIssue[] {
  const issues: SpellcastingIssue[] = []
  if (!classHasSpellcasting(sheet.className)) {
    if (sheet.spellcasting) {
      issues.push(
        issue(`${sheet.className} does not use spellcasting on this sheet.`, 'error'),
      )
    }
    return issues
  }

  const sc = sheet.spellcasting ?? createDefaultSpellcasting(sheet)!
  const className = sheet.className
  const level = sheet.level
  const abilityScore = sheet.abilities[sc.ability]

  const maxCantrips = maxCantripsKnown(className, level)
  if (sc.cantripSlugs.length > maxCantrips) {
    issues.push(
      issue(
        `Cantrips: ${sc.cantripSlugs.length} selected, maximum ${maxCantrips} at level ${level}.`,
        'error',
      ),
    )
  }

  if (usesPreparedList(className)) {
    const maxPrep = maxSpellsPrepared(className, level, abilityScore)
    if (sc.preparedSlugs.length > maxPrep) {
      issues.push(
        issue(
          `Prepared spells: ${sc.preparedSlugs.length} selected, maximum ${maxPrep} (${preparedCapDescription(className)}).`,
          'error',
        ),
      )
    }
    if (usesSpellbook(className)) {
      for (const slug of sc.preparedSlugs) {
        if (!sc.spellbookSlugs.includes(slug)) {
          const spell = getSpellBySlug(slug)
          issues.push(
            issue(
              `${spell?.name ?? slug} is prepared but not in the spellbook.`,
              'error',
            ),
          )
        }
      }
    }
  } else {
    const maxKnown = maxSpellsKnown(className, level)
    if (sc.knownSlugs.length > maxKnown) {
      issues.push(
        issue(
          `Spells known: ${sc.knownSlugs.length} selected, maximum ${maxKnown} at level ${level}.`,
          'error',
        ),
      )
    }
  }

  const maxSlots = spellSlotsMax(className, level)
  for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
    const max = maxSlots[slotLevel - 1] ?? 0
    const used = sc.slotsUsed[slotLevel] ?? 0
    if (used > max) {
      issues.push(
        issue(`Level ${slotLevel} slots: ${used} used, maximum ${max}.`, 'error'),
      )
    }
  }

  const checkSlugs = [...sc.cantripSlugs, ...sc.knownSlugs, ...sc.preparedSlugs]
  const seen = new Set<string>()
  for (const slug of checkSlugs) {
    if (seen.has(slug)) continue
    seen.add(slug)
    const spell = getSpellBySlug(slug)
    if (!spell) {
      issues.push(issue(`Unknown spell in catalog: ${slug}.`, 'error'))
      continue
    }
    const spellLevel = spell.level ?? 0
    if (spellLevel > level) {
      issues.push(
        issue(`${spell.name} is level ${spellLevel}; character is level ${level}.`, 'error'),
      )
    }
    if (!isSpellOnClassList(className, slug, spellLevel)) {
      issues.push(
        issue(`${spell.name} is not on the ${className} spell list.`, 'warning'),
      )
    }
  }

  return issues
}
