import { describe, expect, it } from 'vitest'
import { testSheet } from '../../../test/sheetFixtures'
import { finalizeCharacterSheet } from './normalizeSheet'
import { createDefaultSpellcasting } from './spellcasting'
import { checkSpellcastingSave } from './spellcastingSave'

function wizardWithTooManyCantrips() {
  const sc = createDefaultSpellcasting(testSheet({ className: 'Wizard', level: 1 }))!
  return finalizeCharacterSheet(
    testSheet({
      className: 'Wizard',
      level: 1,
      classes: [{ className: 'Wizard', level: 1 }],
      spellcasting: {
        ...sc,
        cantripSlugs: [
          'srd-2024_acid-splash',
          'srd-2024_chill-touch',
          'srd-2024_dancing-lights',
          'srd-2024_light',
        ],
      },
    }),
  )
}

describe('checkSpellcastingSave', () => {
  it('does not block in warn mode when errors exist', () => {
    const sheet = wizardWithTooManyCantrips()
    const result = checkSpellcastingSave(sheet, 'warn')
    expect(result.blocked).toBe(false)
    expect(result.warningMessages.length).toBeGreaterThan(0)
  })

  it('blocks in block mode when errors exist', () => {
    const sheet = wizardWithTooManyCantrips()
    const result = checkSpellcastingSave(sheet, 'block')
    expect(result.blocked).toBe(true)
    expect(result.blockMessages.length).toBeGreaterThan(0)
    expect(result.warningMessages).not.toContain(result.blockMessages[0])
  })

  it('allows save when sheet is valid', () => {
    const sc = createDefaultSpellcasting(testSheet({ className: 'Wizard', level: 1 }))!
    const sheet = finalizeCharacterSheet(
      testSheet({
        className: 'Wizard',
        level: 1,
        classes: [{ className: 'Wizard', level: 1 }],
        spellcasting: { ...sc, cantripSlugs: ['srd-2024_acid-splash'] },
      }),
    )
    const warn = checkSpellcastingSave(sheet, 'warn')
    const block = checkSpellcastingSave(sheet, 'block')
    expect(warn.blocked).toBe(false)
    expect(block.blocked).toBe(false)
  })
})
