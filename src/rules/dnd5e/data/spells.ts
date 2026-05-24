import spellsData from './spells.json'

export type SpellRef = {
  slug: string
  name: string
  level: number | null
  school: string | null
  casting_time: string | null
  range: number | null
  duration: string | null
  desc: string | null
  ritual: boolean
  concentration: boolean
  verbal: boolean
  somatic: boolean
  material: boolean
  material_specified: string | null
  material_cost: number | null
  material_consumed: boolean
  classNames: string[]
  document: string | null
}

export const spells = spellsData as SpellRef[]

const bySlug = new Map(spells.map((s) => [s.slug, s]))

export function getSpellBySlug(slug: string): SpellRef | undefined {
  return bySlug.get(slug)
}

export const SPELL_LEVELS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const

export function formatSpellLevel(level: number | null): string {
  if (level == null) return '—'
  if (level === 0) return 'Cantrip'
  return `Level ${level}`
}

export function formatCastingTime(castingTime: string | null): string {
  if (!castingTime) return '—'
  return castingTime
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function formatSpellRange(range: number | null): string {
  if (range == null) return '—'
  if (range === 0) return 'Self'
  if (range >= 5280) {
    const miles = range / 5280
    return miles === 1 ? '1 mile' : `${miles} miles`
  }
  return `${range} ft.`
}

export function formatSpellDuration(duration: string | null): string {
  if (!duration) return '—'
  return duration.charAt(0).toUpperCase() + duration.slice(1)
}

export function formatComponents(spell: SpellRef): string {
  const parts: string[] = []
  if (spell.verbal) parts.push('V')
  if (spell.somatic) parts.push('S')
  if (spell.material) {
    if (spell.material_specified) {
      parts.push(`M (${spell.material_specified})`)
    } else {
      parts.push('M')
    }
  }
  return parts.length > 0 ? parts.join(', ') : '—'
}

export function formatComponentsShort(spell: SpellRef): string {
  const parts: string[] = []
  if (spell.verbal) parts.push('V')
  if (spell.somatic) parts.push('S')
  if (spell.material) parts.push('M')
  return parts.length > 0 ? parts.join(', ') : '—'
}

export function formatSpellSummary(spell: SpellRef): string {
  const parts = [
    formatSpellLevel(spell.level),
    spell.school,
    formatComponentsShort(spell),
    formatCastingTime(spell.casting_time),
    formatSpellRange(spell.range),
  ].filter(Boolean)
  return parts.join(' · ')
}

export function spellLevelLabel(level: number): string {
  return level === 0 ? 'Cantrips' : `Level ${level}`
}

export function listSpellSchools(): string[] {
  const set = new Set<string>()
  for (const spell of spells) {
    if (spell.school) set.add(spell.school)
  }
  return [...set].sort()
}

export type SpellSearchResult = SpellRef

export function searchSpells(
  query: string,
  options: { level?: number | ''; school?: string } = {},
  limit = 200,
): SpellSearchResult[] {
  const q = query.trim().toLowerCase()
  const results: SpellRef[] = []

  for (const spell of spells) {
    if (options.level !== undefined && options.level !== '' && spell.level !== options.level) {
      continue
    }
    if (options.school && (spell.school ?? '') !== options.school) continue
    if (q) {
      const haystack = [
        spell.name,
        spell.slug,
        spell.school ?? '',
        spell.desc ?? '',
        formatSpellLevel(spell.level),
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) continue
    }
    results.push(spell)
  }

  results.sort((a, b) => {
    const la = a.level ?? 99
    const lb = b.level ?? 99
    if (la !== lb) return la - lb
    return a.name.localeCompare(b.name)
  })

  return results.slice(0, limit)
}

export function groupSpellsByLevel(spellList: SpellRef[]): Map<number, SpellRef[]> {
  const groups = new Map<number, SpellRef[]>()
  for (const level of SPELL_LEVELS) {
    groups.set(level, [])
  }
  for (const spell of spellList) {
    const level = spell.level
    if (level == null || level < 0 || level > 9) continue
    groups.get(level)?.push(spell)
  }
  for (const [, list] of groups) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }
  return groups
}
