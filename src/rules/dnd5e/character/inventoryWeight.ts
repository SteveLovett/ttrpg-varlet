import { getItemBySlug } from '../data/items'
import type { CharacterSheet, InventoryItem } from './types'

/** Item weight in pounds from catalog (items only; weapons/armor unknown → 0). */
export function inventoryItemWeightLb(item: InventoryItem): number {
  if (item.kind !== 'item' || !item.catalogSlug) return 0
  const ref = getItemBySlug(item.catalogSlug)
  if (!ref?.weight || ref.weight <= 0) return 0
  const unit = (ref.weight_unit ?? 'lb').toLowerCase()
  const perItem = unit === 'kg' ? ref.weight * 2.20462 : ref.weight
  return perItem * item.quantity
}

export function totalInventoryWeightLb(sheet: CharacterSheet): number {
  return sheet.inventoryItems.reduce((sum, item) => sum + inventoryItemWeightLb(item), 0)
}

export function carryingCapacityLb(sheet: CharacterSheet): number {
  return Math.max(0, sheet.abilities.str) * 15
}

export type EncumbranceStatus = 'ok' | 'encumbered' | 'heavily_encumbered'

export function encumbranceStatus(sheet: CharacterSheet): EncumbranceStatus {
  const weight = totalInventoryWeightLb(sheet)
  const str = sheet.abilities.str
  if (weight > str * 10) return 'heavily_encumbered'
  if (weight > str * 5) return 'encumbered'
  return 'ok'
}

export function encumbranceLabel(status: EncumbranceStatus): string {
  switch (status) {
    case 'encumbered':
      return 'Encumbered (optional rule)'
    case 'heavily_encumbered':
      return 'Heavily encumbered (optional rule)'
    default:
      return ''
  }
}
