import { catalogName, type EquipmentKind } from '../data/equipment'
import { isBodyArmorItem, isShieldItem } from './armorAc'
import { consolidateInventoryItems } from './inventoryStack'
import type { CharacterSheet, Currency, InventoryItem } from './types'

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

/** Toggle equipped; only one body armor and one shield at a time. */
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
    if (equipped && isShieldItem(target) && isShieldItem(item)) {
      return { ...item, equipped: undefined }
    }
    return item
  })

  return { ...sheet, inventoryItems }
}

export function hasAnyCurrency(currency: Currency): boolean {
  return currency.cp > 0 || currency.sp > 0 || currency.ep > 0 || currency.gp > 0 || currency.pp > 0
}

export function formatCurrencySummary(currency: Currency): string {
  return [
    currency.pp > 0 ? `${currency.pp} pp` : '',
    currency.gp > 0 ? `${currency.gp} gp` : '',
    currency.ep > 0 ? `${currency.ep} ep` : '',
    currency.sp > 0 ? `${currency.sp} sp` : '',
    currency.cp > 0 ? `${currency.cp} cp` : '',
  ]
    .filter(Boolean)
    .join(', ')
}

/** Non-blocking inventory warnings for editor display. */
export function validateInventory(sheet: CharacterSheet): string[] {
  const warnings: string[] = []
  const equippedBody = sheet.inventoryItems.filter((i) => i.equipped && isBodyArmorItem(i))
  if (equippedBody.length > 1) {
    warnings.push('Multiple body armor pieces are marked equipped.')
  }
  const equippedShields = sheet.inventoryItems.filter((i) => i.equipped && isShieldItem(i))
  if (equippedShields.length > 1) {
    warnings.push('Multiple shields are marked equipped.')
  }
  return warnings
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
