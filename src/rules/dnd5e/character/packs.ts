import packData from '../data/pack-contents.json'
import { addInventoryItem, consolidateInventoryItems } from './inventory'
import { entryToInventoryItem, type StartingEquipmentEntry } from './startingEquipment'
import type { CharacterSheet, InventoryItem } from './types'

const packs = (packData as { packs: Record<string, StartingEquipmentEntry[]> }).packs

export function getPackContents(slug: string): StartingEquipmentEntry[] {
  return packs[slug] ?? []
}

export function canUnpackPack(slug: string): boolean {
  return slug in packs
}

function removeOnePackFromInventory(
  items: InventoryItem[],
  packSlug: string,
): InventoryItem[] {
  const index = items.findIndex(
    (item) => item.catalogSlug === packSlug && item.kind === 'item',
  )
  if (index < 0) return items

  const pack = items[index]
  if (pack.quantity > 1) {
    return items.map((item, i) =>
      i === index ? { ...item, quantity: item.quantity - 1 } : item,
    )
  }
  return items.filter((_, i) => i !== index)
}

export function unpackPackIntoInventory(
  sheet: CharacterSheet,
  packSlug: string,
): CharacterSheet {
  const entries = getPackContents(packSlug)
  if (entries.length === 0) return sheet

  let next = sheet
  for (const entry of entries) {
    const item = entryToInventoryItem(entry)
    if (item) next = addInventoryItem(next, item)
  }

  const inventoryItems = consolidateInventoryItems(
    removeOnePackFromInventory(next.inventoryItems, packSlug),
  )

  return { ...next, inventoryItems }
}
