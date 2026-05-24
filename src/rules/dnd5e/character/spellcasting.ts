import rulesData from '../data/spellcasting-rules.json'
import { isSpellOnClassList } from '../data/class-spell-lists'
import { getSpellBySlug } from '../data/spells'
import { getSheetClasses } from './classes'
import {
  combinedSpellSlotsMax,
  hasPactSlots,
  hasSharedCasterSlots,
  pactSpellSlotsMax,
} from './multiclassSlots'
import { abilityModifier, proficiencyBonus } from './math'
import {
  casterClassNames,
  ensureSpellcastingForClass,
  getSpellcastingBlock,
  setSpellcastingBlock,
} from './spellcastingState'
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

export function classLevelOnSheet(sheet: CharacterSheet, className: string): number {
  return getSheetClasses(sheet).find((c) => c.className === className)?.level ?? sheet.level
}

export function createDefaultSpellcasting(
  sheet: CharacterSheet,
  className = sheet.className,
): CharacterSpellcasting | null {
  if (!classHasSpellcasting(className)) return null
  return {
    ability: defaultSpellcastingAbility(className),
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

export function spellSaveDcForClass(sheet: CharacterSheet, className: string): number | null {
  const sc = getSpellcastingBlock(sheet, className)
  if (!sc || !classHasSpellcasting(className)) return null
  return 8 + proficiencyBonus(sheet.level) + abilityModifier(sheet.abilities[sc.ability])
}

export function spellAttackBonusForClass(sheet: CharacterSheet, className: string): number | null {
  const sc = getSpellcastingBlock(sheet, className)
  if (!sc || !classHasSpellcasting(className)) return null
  return proficiencyBonus(sheet.level) + abilityModifier(sheet.abilities[sc.ability])
}

/** Primary caster block (first caster class on sheet). */
export function spellSaveDc(sheet: CharacterSheet): number | null {
  const name = casterClassNames(sheet)[0]
  return name ? spellSaveDcForClass(sheet, name) : null
}

export function spellAttackBonus(sheet: CharacterSheet): number | null {
  const name = casterClassNames(sheet)[0]
  return name ? spellAttackBonusForClass(sheet, name) : null
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

function normalizeWizardSpellbook(sc: CharacterSpellcasting): CharacterSpellcasting {
  const book = new Set(sc.spellbookSlugs)
  for (const slug of sc.preparedSlugs) book.add(slug)
  if (book.size === sc.spellbookSlugs.length) return sc
  return { ...sc, spellbookSlugs: [...book] }
}

export function ensureSpellcasting(sheet: CharacterSheet): CharacterSheet {
  let next = sheet
  for (const className of casterClassNames(sheet)) {
    next = ensureSpellcastingForClass(next, className)
    const sc = getSpellcastingBlock(next, className)
    if (sc && usesSpellbook(className)) {
      next = setSpellcastingBlock(next, className, normalizeWizardSpellbook(sc))
    }
  }
  return next
}

export function longRestSpellcasting(sheet: CharacterSheet): CharacterSheet {
  return { ...sheet, spellSlotsUsed: {}, pactSlotsUsed: {} }
}

/** Warlock pact slots refresh on a short rest. */
export function shortRestSpellcasting(sheet: CharacterSheet): CharacterSheet {
  if (!hasPactSlots(getSheetClasses(sheet))) return sheet
  return { ...sheet, pactSlotsUsed: {} }
}

export function toggleSpellPrepared(
  sheet: CharacterSheet,
  slug: string,
  className: string,
): CharacterSheet {
  const sc = getSpellcastingBlock(sheet, className)
  if (!sc || !usesPreparedList(className)) return sheet
  if (usesSpellbook(className) && !sc.spellbookSlugs.includes(slug)) return sheet
  const prepared = sc.preparedSlugs.includes(slug)
    ? sc.preparedSlugs.filter((s) => s !== slug)
    : [...sc.preparedSlugs, slug]
  return setSpellcastingBlock(sheet, className, { ...sc, preparedSlugs: prepared })
}

export function pickCasterClassForSpell(sheet: CharacterSheet, slug: string): string | null {
  const spell = getSpellBySlug(slug)
  if (!spell) return null
  const casters = casterClassNames(sheet)
  const level = spell.level ?? 0
  const match = casters.filter((name) => isSpellOnClassList(name, slug, level))
  if (match.length === 1) return match[0]
  if (match.length > 1) return match[0]
  return casters[0] ?? null
}

export function addSpellToSpellcasting(
  sheet: CharacterSheet,
  slug: string,
  casterClassName?: string,
): CharacterSheet {
  const spell = getSpellBySlug(slug)
  if (!spell || spell.level == null) return sheet
  const className = casterClassName ?? pickCasterClassForSpell(sheet, slug)
  if (!className) return sheet

  const next = ensureSpellcastingForClass(sheet, className)
  const sc = getSpellcastingBlock(next, className)
  if (!sc) return next

  const level = spell.level
  const inList = (arr: string[]) => arr.includes(slug)

  let updated: CharacterSpellcasting

  if (level === 0) {
    if (inList(sc.cantripSlugs)) return next
    updated = { ...sc, cantripSlugs: [...sc.cantripSlugs, slug] }
  } else if (usesPreparedList(className)) {
    if (usesSpellbook(className)) {
      if (inList(sc.spellbookSlugs)) return next
      updated = { ...sc, spellbookSlugs: [...sc.spellbookSlugs, slug] }
    } else {
      if (inList(sc.preparedSlugs)) return next
      updated = { ...sc, preparedSlugs: [...sc.preparedSlugs, slug] }
    }
  } else {
    if (inList(sc.knownSlugs)) return next
    updated = { ...sc, knownSlugs: [...sc.knownSlugs, slug] }
  }

  return setSpellcastingBlock(next, className, updated)
}

export function removeSpellFromSpellcasting(
  sheet: CharacterSheet,
  slug: string,
  casterClassName?: string,
): CharacterSheet {
  const targets = casterClassName ? [casterClassName] : casterClassNames(sheet)
  let next = sheet
  for (const className of targets) {
    const sc = getSpellcastingBlock(next, className)
    if (!sc) continue
    next = setSpellcastingBlock(next, className, {
      ...sc,
      cantripSlugs: sc.cantripSlugs.filter((s) => s !== slug),
      spellbookSlugs: sc.spellbookSlugs.filter((s) => s !== slug),
      knownSlugs: sc.knownSlugs.filter((s) => s !== slug),
      preparedSlugs: sc.preparedSlugs.filter((s) => s !== slug),
    })
  }
  return next
}

export function setSharedSlotUsed(
  sheet: CharacterSheet,
  slotLevel: number,
  used: number,
): CharacterSheet {
  const spellSlotsUsed = { ...sheet.spellSlotsUsed }
  if (used <= 0) delete spellSlotsUsed[slotLevel]
  else spellSlotsUsed[slotLevel] = used
  return { ...sheet, spellSlotsUsed }
}

export function setPactSlotUsed(
  sheet: CharacterSheet,
  slotLevel: number,
  used: number,
): CharacterSheet {
  const pactSlotsUsed = { ...sheet.pactSlotsUsed }
  if (used <= 0) delete pactSlotsUsed[slotLevel]
  else pactSlotsUsed[slotLevel] = used
  return { ...sheet, pactSlotsUsed }
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

function validateCasterClass(
  sheet: CharacterSheet,
  className: string,
  sc: CharacterSpellcasting,
): SpellcastingIssue[] {
  const issues: SpellcastingIssue[] = []
  const classLevel = classLevelOnSheet(sheet, className)
  const abilityScore = sheet.abilities[sc.ability]
  const prefix = casterClassNames(sheet).length > 1 ? `${className}: ` : ''

  const maxCantrips = maxCantripsKnown(className, classLevel)
  if (sc.cantripSlugs.length > maxCantrips) {
    issues.push(
      issue(
        `${prefix}Cantrips: ${sc.cantripSlugs.length} selected, maximum ${maxCantrips} at class level ${classLevel}.`,
        'error',
      ),
    )
  }

  if (usesPreparedList(className)) {
    const maxPrep = maxSpellsPrepared(className, classLevel, abilityScore)
    if (sc.preparedSlugs.length > maxPrep) {
      issues.push(
        issue(
          `${prefix}Prepared spells: ${sc.preparedSlugs.length} selected, maximum ${maxPrep} (${preparedCapDescription(className)}).`,
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
              `${prefix}${spell?.name ?? slug} is prepared but not in the spellbook.`,
              'error',
            ),
          )
        }
      }
    }
  } else {
    const maxKnown = maxSpellsKnown(className, classLevel)
    if (sc.knownSlugs.length > maxKnown) {
      issues.push(
        issue(
          `${prefix}Spells known: ${sc.knownSlugs.length} selected, maximum ${maxKnown} at class level ${classLevel}.`,
          'error',
        ),
      )
    }
  }

  const checkSlugs = [
    ...sc.cantripSlugs,
    ...sc.knownSlugs,
    ...sc.preparedSlugs,
    ...sc.spellbookSlugs,
  ]
  const seen = new Set<string>()
  for (const slug of checkSlugs) {
    if (seen.has(slug)) continue
    seen.add(slug)
    const spell = getSpellBySlug(slug)
    if (!spell) {
      issues.push(issue(`${prefix}Unknown spell in catalog: ${slug}.`, 'error'))
      continue
    }
    const spellLevel = spell.level ?? 0
    if (spellLevel > sheet.level) {
      issues.push(
        issue(
          `${prefix}${spell.name} is level ${spellLevel}; character is level ${sheet.level}.`,
          'error',
        ),
      )
    }
    if (!isSpellOnClassList(className, slug, spellLevel)) {
      issues.push(
        issue(`${prefix}${spell.name} is not on the ${className} spell list.`, 'warning'),
      )
    }
  }

  return issues
}

export function validateSpellcasting(sheet: CharacterSheet): SpellcastingIssue[] {
  const issues: SpellcastingIssue[] = []
  const classes = getSheetClasses(sheet)
  const casters = casterClassNames(sheet)

  for (const className of casters) {
    const sc =
      getSpellcastingBlock(sheet, className) ??
      createDefaultSpellcasting({ ...sheet, className }, className)
    if (!sc) continue
    issues.push(...validateCasterClass(sheet, className, sc))
  }

  if (hasSharedCasterSlots(classes)) {
    const maxSlots = combinedSpellSlotsMax(classes)
    for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
      const max = maxSlots[slotLevel - 1] ?? 0
      const used = sheet.spellSlotsUsed[slotLevel] ?? 0
      if (used > max) {
        issues.push(
          issue(`Shared slots level ${slotLevel}: ${used} used, maximum ${max}.`, 'error'),
        )
      }
    }
  }

  if (hasPactSlots(classes)) {
    const maxPact = pactSpellSlotsMax(classes)
    for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
      const max = maxPact[slotLevel - 1] ?? 0
      const used = sheet.pactSlotsUsed[slotLevel] ?? 0
      if (used > max) {
        issues.push(
          issue(`Pact slots level ${slotLevel}: ${used} used, maximum ${max}.`, 'error'),
        )
      }
    }
  }

  return issues
}
