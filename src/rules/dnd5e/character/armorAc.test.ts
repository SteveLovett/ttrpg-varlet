import { describe, expect, it } from 'vitest'
import { testItem, testSheet } from '../../../test/sheetFixtures'
import { suggestAcFromEquipment } from './armorAc'

describe('suggestAcFromEquipment', () => {
  it('uses 10 + Dex when unarmored', () => {
    const sheet = testSheet({ abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 10, cha: 10 } })
    expect(suggestAcFromEquipment(sheet)).toBe(12)
  })

  it('applies medium armor with Dex cap', () => {
    const sheet = testSheet({
      abilities: { str: 10, dex: 16, con: 10, int: 10, wis: 10, cha: 10 },
      inventoryItems: [
        testItem({
          kind: 'armor',
          name: 'Breastplate',
          catalogSlug: 'srd-2024_breastplate',
          equipped: true,
        }),
      ],
    })
    expect(suggestAcFromEquipment(sheet)).toBe(16)
  })

  it('applies heavy armor without Dex', () => {
    const sheet = testSheet({
      abilities: { str: 10, dex: 16, con: 10, int: 10, wis: 10, cha: 10 },
      inventoryItems: [
        testItem({
          kind: 'armor',
          name: 'Chain Mail',
          catalogSlug: 'srd-2024_chain-mail',
          equipped: true,
        }),
      ],
    })
    expect(suggestAcFromEquipment(sheet)).toBe(16)
  })

  it('adds shield bonus once even if multiple shields equipped', () => {
    const sheet = testSheet({
      abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      inventoryItems: [
        testItem({
          kind: 'armor',
          name: 'Shield',
          catalogSlug: 'srd-2024_shield',
          equipped: true,
        }),
        testItem({
          id: 'shield-2',
          kind: 'armor',
          name: 'Shield',
          catalogSlug: 'srd-2024_shield',
          equipped: true,
        }),
      ],
    })
    expect(suggestAcFromEquipment(sheet)).toBe(12)
  })

  it('combines body armor and shield', () => {
    const sheet = testSheet({
      abilities: { str: 10, dex: 12, con: 10, int: 10, wis: 10, cha: 10 },
      inventoryItems: [
        testItem({
          kind: 'armor',
          name: 'Chain Shirt',
          catalogSlug: 'srd-2024_chain-shirt',
          equipped: true,
        }),
        testItem({
          id: 'shield',
          kind: 'armor',
          name: 'Shield',
          catalogSlug: 'srd-2024_shield',
          equipped: true,
        }),
      ],
    })
    expect(suggestAcFromEquipment(sheet)).toBe(16)
  })
})
