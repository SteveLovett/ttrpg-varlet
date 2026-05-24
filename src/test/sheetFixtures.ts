import type { CharacterSheet, InventoryItem } from '../rules/dnd5e/character/types'
import { createEmptySheet } from '../rules/dnd5e/character/types'

export function testSheet(overrides: Partial<CharacterSheet> = {}): CharacterSheet {
  return { ...createEmptySheet('Test'), ...overrides }
}

export function testItem(partial: Partial<InventoryItem> & Pick<InventoryItem, 'name'>): InventoryItem {
  return {
    id: partial.id ?? 'test-item-1',
    kind: partial.kind ?? 'item',
    name: partial.name,
    quantity: partial.quantity ?? 1,
    catalogSlug: partial.catalogSlug,
    equipped: partial.equipped,
    notes: partial.notes,
  }
}
