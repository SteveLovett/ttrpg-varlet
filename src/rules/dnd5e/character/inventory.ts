import { catalogName, type EquipmentKind } from '../data/equipment'
import { isBodyArmorItem } from './armorAc'
import { consolidateInventoryItems } from './inventoryStack'
import type { CharacterSheet, InventoryItem } from './types'

export { consolidateInventoryItems, inventoryStackKey } from './inventoryStack'

export function newInventoryItemId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function inventoryItemFromCatalog(
  kind: EquipmentKind,
  slug: string,
  quantity = 1,
  equipped?: boolean,
): InventoryItem | null {
  const name = catalogName(kind, slug)
  if (!name) return null
  return {
    id: newInventoryItemId(),
    kind,
    catalogSlug: slug,
    name,
    quantity: Math.max(1, quantity),
    equipped: equipped || undefined,
  }
}

export function inventoryItemCustom(name: string, quantity = 1): InventoryItem {
  return {
    id: newInventoryItemId(),
    kind: 'custom',
    name: name.trim(),
    quantity: Math.max(1, quantity),
  }
}

export function addInventoryItem(sheet: CharacterSheet, item: InventoryItem): CharacterSheet {
  return {
    ...sheet,
    inventoryItems: consolidateInventoryItems([...sheet.inventoryItems, item]),
  }
}

/** Toggle equipped; only one body armor at a time. */
export function setInventoryItemEquipped(
  sheet: CharacterSheet,
  itemId: string,
  equipped: boolean,
): CharacterSheet {
  const target = sheet.inventoryItems.find((i) => i.id === itemId)
  if (!target) return sheet

  const inventoryItems = sheet.inventoryItems.map((item) => {
    if (item.id === itemId) {
      return { ...item, equipped: equipped || undefined }
    }
    if (equipped && isBodyArmorItem(target) && isBodyArmorItem(item)) {
      return { ...item, equipped: undefined }
    }
    return item
  })

  return { ...sheet, inventoryItems }
}

export function displayInventoryItem(item: InventoryItem): string {
  const equipped = item.equipped ? ' (equipped)' : ''
  return `${item.name}${equipped}`
}

/** Ensure stable ids and one row per identical item stack. */
export function normalizeInventoryIds(sheet: CharacterSheet): CharacterSheet {
  let changed = false
  const withIds = sheet.inventoryItems.map((item) => {
    if (item.id && !item.id.startsWith('legacy-')) return item
    changed = true
    return { ...item, id: newInventoryItemId() }
  })
  const inventoryItems = consolidateInventoryItems(withIds)
  if (
    inventoryItems.length !== sheet.inventoryItems.length ||
    changed ||
    inventoryItems.some((item, i) => item.id !== sheet.inventoryItems[i]?.id)
  ) {
    return { ...sheet, inventoryItems }
  }
  return sheet
}
