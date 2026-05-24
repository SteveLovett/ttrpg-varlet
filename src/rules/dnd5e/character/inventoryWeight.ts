import { catalogDefaultWeightLb } from '../data/catalogWeights'
import type { CharacterSheet, InventoryItem } from './types'

export function defaultInventoryItemWeightLb(item: InventoryItem): number {
  if (item.kind === 'custom' || !item.catalogSlug) return 0
  return catalogDefaultWeightLb(item.kind, item.catalogSlug)
}

/** Per-unit weight in lb (override or catalog default). */
export function inventoryItemWeightLb(item: InventoryItem): number {
  const perUnit =
    typeof item.weightLb === 'number' && Number.isFinite(item.weightLb)
      ? item.weightLb
      : defaultInventoryItemWeightLb(item)
  return perUnit * item.quantity
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
