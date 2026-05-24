import packData from '../data/pack-contents.json'
import { addInventoryItem } from './inventory'
import { entryToInventoryItem, type StartingEquipmentEntry } from './startingEquipment'
import type { CharacterSheet } from './types'

const packs = (packData as { packs: Record<string, StartingEquipmentEntry[]> }).packs

export function getPackContents(slug: string): StartingEquipmentEntry[] {
  return packs[slug] ?? []
}

export function canUnpackPack(slug: string): boolean {
  return slug in packs
}

export function unpackPackIntoInventory(sheet: CharacterSheet, packSlug: string): CharacterSheet {
  const entries = getPackContents(packSlug)
  if (entries.length === 0) return sheet

  let next = sheet
  for (const entry of entries) {
    const item = entryToInventoryItem(entry)
    if (item) next = addInventoryItem(next, item)
  }
  return next
}
