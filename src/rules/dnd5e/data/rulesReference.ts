import conditionsData from './conditions.json'
import rulesReferenceData from './rules-reference.json'

export type RulesRefItem = {
  id: string
  name: string
  summary: string
}

export type RulesRefSection = {
  id: string
  title: string
  intro?: string
  items: RulesRefItem[]
}

export type RulesRefEntry = RulesRefItem & {
  sectionId: string
  sectionTitle: string
}

type RulesFile = {
  version: number
  ruleset: string
  sections: RulesRefSection[]
}

const file = rulesReferenceData as RulesFile

const CONDITIONS_SECTION: RulesRefSection = {
  id: 'conditions',
  title: 'Conditions',
  intro:
    'Conditions alter what a creature can do. Multiple conditions stack unless they describe the same effect.',
  items: (conditionsData as RulesRefItem[]).map((c) => ({
    id: c.id,
    name: c.name,
    summary: c.summary,
  })),
}

export const rulesReferenceSections: RulesRefSection[] = [CONDITIONS_SECTION, ...file.sections]

export const rulesReferenceMeta = {
  version: file.version,
  ruleset: file.ruleset,
}

export function flattenRulesReference(sections = rulesReferenceSections): RulesRefEntry[] {
  const entries: RulesRefEntry[] = []
  for (const section of sections) {
    for (const item of section.items) {
      entries.push({
        ...item,
        sectionId: section.id,
        sectionTitle: section.title,
      })
    }
  }
  return entries
}

export function searchRulesReference(
  query: string,
  sectionId = '',
): { sections: RulesRefSection[]; matchCount: number } {
  const q = query.trim().toLowerCase()
  let matchCount = 0

  const sections = rulesReferenceSections
    .filter((section) => !sectionId || section.id === sectionId)
    .map((section) => {
      if (!q) {
        matchCount += section.items.length
        return section
      }
      const items = section.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.summary.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q),
      )
      matchCount += items.length
      return { ...section, items }
    })
    .filter((section) => section.items.length > 0)

  return { sections, matchCount }
}

export function rulesReferenceSectionById(id: string): RulesRefSection | undefined {
  return rulesReferenceSections.find((s) => s.id === id)
}

export function rulesReferenceEntryById(id: string): RulesRefEntry | undefined {
  return flattenRulesReference().find((e) => e.id === id)
}

/** Path to the rules quick reference, optionally scrolled to an entry. */
export function rulesReferenceHref(entryId?: string): string {
  const base = '/app/tools/rules'
  if (!entryId?.trim()) return base
  return `${base}?highlight=${encodeURIComponent(entryId.trim())}`
}
