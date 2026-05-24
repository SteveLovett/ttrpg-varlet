import { catalogName, type EquipmentKind } from '../data/equipment'
import startingEquipmentData from '../data/starting-equipment.json'
import { consolidateInventoryItems } from './inventoryStack'
import { inventoryItemFromCatalog, inventoryItemCustom } from './inventory'
import type { CharacterSheet, Currency, InventoryItem } from './types'

export type StartingEquipmentEntry =
  | { kind: EquipmentKind; slug: string; quantity?: number; equipped?: boolean }
  | { kind: 'custom'; name: string; quantity?: number; equipped?: boolean }

export type StartingEquipmentOption = {
  id: string
  label: string
  entries: StartingEquipmentEntry[]
}

export type StartingEquipmentChoice = {
  id: string
  prompt: string
  options: StartingEquipmentOption[]
}

export type StartingClassPack = {
  description: string
  currency?: Partial<Currency>
  fixed?: StartingEquipmentEntry[]
  choices: StartingEquipmentChoice[]
}

const startingByClass = (startingEquipmentData as { classes: Record<string, StartingClassPack> })
  .classes

export function getStartingEquipmentPack(className: string): StartingClassPack | null {
  return startingByClass[className] ?? null
}

export function startingChoiceIds(className: string): string[] {
  const pack = getStartingEquipmentPack(className)
  if (!pack) return []
  return pack.choices.map((c) => c.id)
}

export function isStartingSelectionComplete(
  className: string,
  selections: Record<string, string>,
): boolean {
  return startingChoiceIds(className).every((id) => Boolean(selections[id]))
}

export function entryToInventoryItem(entry: StartingEquipmentEntry): InventoryItem | null {
  const qty = entry.quantity ?? 1
  const equipped = entry.equipped === true
  if (entry.kind === 'custom') {
    if (!entry.name.trim()) return null
    return { ...inventoryItemCustom(entry.name, qty), equipped }
  }
  const item = inventoryItemFromCatalog(entry.kind, entry.slug, qty)
  if (!item) return null
  return { ...item, equipped: equipped || undefined }
}

function mergeCurrency(sheet: CharacterSheet, add: Partial<Currency> | undefined): Currency {
  if (!add) return sheet.currency
  const next = { ...sheet.currency }
  for (const key of ['cp', 'sp', 'ep', 'gp', 'pp'] as const) {
    const v = add[key]
    if (typeof v === 'number' && v > 0) {
      next[key] += Math.floor(v)
    }
  }
  return next
}

function mergeInventoryItems(
  existing: InventoryItem[],
  entries: StartingEquipmentEntry[],
): InventoryItem[] {
  const added: InventoryItem[] = []
  for (const entry of entries) {
    const item = entryToInventoryItem(entry)
    if (item) added.push(item)
  }
  return consolidateInventoryItems([...existing, ...added])
}

function entriesForSelections(
  pack: StartingClassPack,
  selections: Record<string, string>,
): StartingEquipmentEntry[] {
  const entries: StartingEquipmentEntry[] = [...(pack.fixed ?? [])]
  for (const choice of pack.choices) {
    const optionId = selections[choice.id]
    if (!optionId) continue
    const option = choice.options.find((o) => o.id === optionId)
    if (option) entries.push(...option.entries)
  }
  return entries
}

/** Apply PHB-style starting equipment from choice selections; adds class currency. */
export function applyStartingEquipmentSelections(
  sheet: CharacterSheet,
  className: string,
  selections: Record<string, string>,
  replace = false,
): CharacterSheet {
  const pack = getStartingEquipmentPack(className)
  if (!pack) return sheet

  const entries = entriesForSelections(pack, selections)
  const inventoryItems = mergeInventoryItems(replace ? [] : sheet.inventoryItems, entries)
  const currency = mergeCurrency(replace ? { ...sheet, currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 } } : sheet, pack.currency)

  return { ...sheet, inventoryItems, currency }
}

/** Label for a catalog entry (for choice UI). */
export function startingEntryLabel(entry: StartingEquipmentEntry): string {
  if (entry.kind === 'custom') return entry.name
  const name = catalogName(entry.kind, entry.slug)
  const qty = entry.quantity && entry.quantity > 1 ? ` ×${entry.quantity}` : ''
  return `${name ?? entry.slug}${qty}`
}
