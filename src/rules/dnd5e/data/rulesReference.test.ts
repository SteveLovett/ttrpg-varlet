import { describe, expect, it } from 'vitest'
import {
  rulesReferenceHref,
  rulesReferenceSections,
  searchRulesReference,
} from './rulesReference'

describe('searchRulesReference', () => {
  it('includes conditions section', () => {
    const conditions = rulesReferenceSections.find((s) => s.id === 'conditions')
    expect(conditions?.items.length).toBeGreaterThan(10)
  })

  it('filters by query', () => {
    const { matchCount, sections } = searchRulesReference('prone')
    expect(matchCount).toBeGreaterThan(0)
    expect(sections.some((s) => s.items.some((i) => i.id === 'prone'))).toBe(true)
  })

  it('filters by section', () => {
    const { sections, matchCount } = searchRulesReference('', 'cover')
    expect(sections).toHaveLength(1)
    expect(sections[0]?.id).toBe('cover')
    expect(matchCount).toBe(3)
  })

  it('includes 2024 sections', () => {
    const ids = rulesReferenceSections.map((s) => s.id)
    expect(ids).toContain('rests')
    expect(ids).toContain('grapple-shove')
    expect(ids).toContain('exhaustion')
    expect(ids).toContain('spellcasting')
  })

  it('builds highlight href', () => {
    expect(rulesReferenceHref('prone')).toBe('/app/tools/rules?highlight=prone')
    expect(rulesReferenceHref()).toBe('/app/tools/rules')
  })
})
