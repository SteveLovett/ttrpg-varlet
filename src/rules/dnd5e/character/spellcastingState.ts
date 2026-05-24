import rulesData from '../data/spellcasting-rules.json'
import { getSheetClasses, primaryClassName, syncClassFields } from './classes'
import type { AbilityKey, CharacterSheet, CharacterSpellcasting } from './types'

type ClassRules = { mode: string; ability?: AbilityKey }

const rules = rulesData as { classes: Record<string, ClassRules> }

function classHasSpellcasting(className: string): boolean {
  const r = rules.classes[className]
  return !!r && r.mode !== 'none'
}

function createDefaultBlock(className: string): CharacterSpellcasting | null {
  if (!classHasSpellcasting(className)) return null
  const ability = rules.classes[className]?.ability ?? 'int'
  return {
    ability,
    cantripSlugs: [],
    spellbookSlugs: [],
    knownSlugs: [],
    preparedSlugs: [],
    slotsUsed: {},
  }
}

export function casterClassNames(sheet: CharacterSheet): string[] {
  return getSheetClasses(sheet)
    .map((c) => c.className)
    .filter((name) => classHasSpellcasting(name))
}

export function getSpellcastingBlock(
  sheet: CharacterSheet,
  className: string,
): CharacterSpellcasting | null {
  return sheet.spellcastingByClass[className] ?? null
}

export function setSpellcastingBlock(
  sheet: CharacterSheet,
  className: string,
  block: CharacterSpellcasting | null,
): CharacterSheet {
  const spellcastingByClass = { ...sheet.spellcastingByClass }
  if (block) spellcastingByClass[className] = block
  else delete spellcastingByClass[className]

  const primary = primaryClassName(sheet)
  const spellcasting = primary === className ? block : sheet.spellcasting

  return { ...sheet, spellcastingByClass, spellcasting }
}

export function ensureSpellcastingForClass(
  sheet: CharacterSheet,
  className: string,
): CharacterSheet {
  if (!classHasSpellcasting(className)) return sheet
  if (getSpellcastingBlock(sheet, className)) return sheet
  const block = createDefaultBlock(className)
  if (!block) return sheet
  return setSpellcastingBlock(sheet, className, block)
}

export function normalizeSheetSpellcasting(sheet: CharacterSheet): CharacterSheet {
  const next = syncClassFields(sheet)
  const classes = getSheetClasses(next)
  const spellcastingByClass = { ...next.spellcastingByClass }

  if (next.spellcasting && classes.length > 0) {
    const primary = classes[0].className
    if (!spellcastingByClass[primary]) {
      spellcastingByClass[primary] = next.spellcasting
    }
  }

  for (const { className } of classes) {
    if (classHasSpellcasting(className) && !spellcastingByClass[className]) {
      const block = createDefaultBlock(className)
      if (block) spellcastingByClass[className] = block
    }
  }

  for (const key of Object.keys(spellcastingByClass)) {
    if (!classes.some((c) => c.className === key)) {
      delete spellcastingByClass[key]
    }
  }

  const primary = classes[0]?.className ?? ''
  const spellcasting = primary ? spellcastingByClass[primary] ?? null : null

  let spellSlotsUsed = { ...next.spellSlotsUsed }
  let pactSlotsUsed = { ...next.pactSlotsUsed }

  if (Object.keys(spellSlotsUsed).length === 0 && spellcasting?.slotsUsed) {
    spellSlotsUsed = { ...spellcasting.slotsUsed }
  }

  const warlockBlock = spellcastingByClass.Warlock
  if (Object.keys(pactSlotsUsed).length === 0 && warlockBlock?.slotsUsed) {
    pactSlotsUsed = { ...warlockBlock.slotsUsed }
  }

  return {
    ...next,
    spellcastingByClass,
    spellcasting,
    spellSlotsUsed,
    pactSlotsUsed,
  }
}
