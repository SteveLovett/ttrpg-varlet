import { characterOptions } from '../data/character-options'
import type { CharacterSheet, ClassLevel } from './types'

export const MAX_CHARACTER_LEVEL = 20

export function getSheetClasses(sheet: CharacterSheet): ClassLevel[] {
  if (sheet.classes.length > 0) return sheet.classes
  if (sheet.className) return [{ className: sheet.className, level: sheet.level }]
  return []
}

export function totalClassLevels(classes: ClassLevel[]): number {
  return classes.reduce((sum, row) => sum + Math.max(0, Math.floor(row.level)), 0)
}

export function primaryClassName(sheet: CharacterSheet): string {
  return getSheetClasses(sheet)[0]?.className ?? sheet.className
}

export function syncClassFields(sheet: CharacterSheet): CharacterSheet {
  const classes = getSheetClasses(sheet).map((row) => ({
    className: row.className,
    level: Math.max(1, Math.min(MAX_CHARACTER_LEVEL, Math.floor(row.level))),
  }))

  const total = Math.min(MAX_CHARACTER_LEVEL, Math.max(1, totalClassLevels(classes)))
  const primary = classes[0]?.className ?? sheet.className

  return {
    ...sheet,
    classes,
    className: primary,
    level: classes.length > 0 ? total : sheet.level,
  }
}

export function isValidClassName(name: string): boolean {
  return characterOptions.classes.some((c) => c.name === name)
}

export function setSheetClasses(sheet: CharacterSheet, classes: ClassLevel[]): CharacterSheet {
  const cleaned = classes
    .filter((row) => row.className && isValidClassName(row.className))
    .map((row) => ({
      className: row.className,
      level: Math.max(1, Math.min(MAX_CHARACTER_LEVEL, Math.floor(row.level))),
    }))

  if (cleaned.length === 0) {
    return syncClassFields({ ...sheet, classes: [], className: '', level: 1 })
  }

  const total = totalClassLevels(cleaned)
  if (total > MAX_CHARACTER_LEVEL) {
    return syncClassFields(sheet)
  }

  return syncClassFields({
    ...sheet,
    classes: cleaned,
    className: cleaned[0].className,
    level: total,
  })
}

export function addClassLevel(sheet: CharacterSheet, className: string, level = 1): CharacterSheet {
  const classes = [...getSheetClasses(sheet)]
  const existing = classes.find((c) => c.className === className)
  if (existing) {
    existing.level = Math.min(MAX_CHARACTER_LEVEL, existing.level + level)
  } else {
    classes.push({ className, level })
  }
  return setSheetClasses(sheet, classes)
}

export function updateClassLevelAt(
  sheet: CharacterSheet,
  index: number,
  patch: Partial<ClassLevel>,
): CharacterSheet {
  const classes = [...getSheetClasses(sheet)]
  if (index < 0 || index >= classes.length) return sheet
  classes[index] = { ...classes[index], ...patch }
  return setSheetClasses(sheet, classes)
}

export function removeClassAt(sheet: CharacterSheet, index: number): CharacterSheet {
  const classes = getSheetClasses(sheet).filter((_, i) => i !== index)
  return setSheetClasses(sheet, classes)
}

export function classLevelsLabel(sheet: CharacterSheet): string {
  const classes = getSheetClasses(sheet)
  if (classes.length === 0) return ''
  if (classes.length === 1) return `Level ${classes[0].level} ${classes[0].className}`
  return classes.map((c) => `${c.className} ${c.level}`).join(' / ')
}
