import type { InventoryItem } from './types'

/** Stable identity for stacking identical catalog or custom items. */
export function inventoryStackKey(item: InventoryItem): string {
  if (item.kind === 'custom') {
    return `custom:${item.name.trim().toLowerCase()}`
  }
  const slug = item.catalogSlug?.trim()
  if (slug) return `${item.kind}:${slug}`
  return `${item.kind}:${item.name.trim().toLowerCase()}`
}

/** Merge identical items into one row per stack; quantities are summed. */
export function consolidateInventoryItems(items: InventoryItem[]): InventoryItem[] {
  const stacks = new Map<string, InventoryItem>()

  for (const item of items) {
    const key = inventoryStackKey(item)
    const qty = Math.max(1, Math.floor(item.quantity))
    const existing = stacks.get(key)

    if (!existing) {
      stacks.set(key, { ...item, quantity: qty })
      continue
    }

    stacks.set(key, {
      ...existing,
      quantity: existing.quantity + qty,
      equipped: existing.equipped || item.equipped || undefined,
      attuned: existing.attuned || item.attuned || undefined,
      weightLb: existing.weightLb ?? item.weightLb,
      notes: existing.notes ?? item.notes,
    })
  }

  return [...stacks.values()].sort((a, b) => a.name.localeCompare(b.name))
}
