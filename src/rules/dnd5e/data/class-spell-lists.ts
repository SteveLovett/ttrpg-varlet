import data from './class-spell-lists.json'

export type ClassSpellList = {
  cantrips: string[]
  byLevel: Record<string, string[]>
}

const lists = (data as { classes: Record<string, ClassSpellList> }).classes

export function getClassSpellList(className: string): ClassSpellList | null {
  return lists[className] ?? null
}

export function isSpellOnClassList(className: string, slug: string, level: number): boolean {
  const list = getClassSpellList(className)
  if (!list) return true
  if (level === 0) return list.cantrips.includes(slug)
  return (list.byLevel[String(level)] ?? []).includes(slug)
}
