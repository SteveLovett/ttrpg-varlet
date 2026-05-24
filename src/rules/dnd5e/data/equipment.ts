import { armor, getArmorBySlug, type ArmorRef } from './armor'
import { getItemBySlug, items, type ItemRef } from './items'
import { getWeaponBySlug, weapons, type WeaponRef } from './weapons'

export type EquipmentKind = 'weapon' | 'armor' | 'item'

export type CatalogEntry =
  | { kind: 'weapon'; ref: WeaponRef }
  | { kind: 'armor'; ref: ArmorRef }
  | { kind: 'item'; ref: ItemRef }

export function catalogName(kind: EquipmentKind, slug: string): string | null {
  if (kind === 'weapon') return getWeaponBySlug(slug)?.name ?? null
  if (kind === 'armor') return getArmorBySlug(slug)?.name ?? null
  return getItemBySlug(slug)?.name ?? null
}

export function getCatalogEntry(kind: EquipmentKind, slug: string): CatalogEntry | null {
  if (kind === 'weapon') {
    const ref = getWeaponBySlug(slug)
    return ref ? { kind: 'weapon', ref } : null
  }
  if (kind === 'armor') {
    const ref = getArmorBySlug(slug)
    return ref ? { kind: 'armor', ref } : null
  }
  const ref = getItemBySlug(slug)
  return ref ? { kind: 'item', ref } : null
}

export type EquipmentSearchResult = CatalogEntry & { slug: string }

export function searchEquipment(
  query: string,
  kindFilter: EquipmentKind | '' = '',
  limit = 80,
): EquipmentSearchResult[] {
  const q = query.trim().toLowerCase()
  const results: EquipmentSearchResult[] = []

  const match = (name: string, slug: string) =>
    !q || name.toLowerCase().includes(q) || slug.toLowerCase().includes(q)

  if (!kindFilter || kindFilter === 'weapon') {
    for (const ref of weapons) {
      if (match(ref.name, ref.slug)) results.push({ kind: 'weapon', ref, slug: ref.slug })
    }
  }
  if (!kindFilter || kindFilter === 'armor') {
    for (const ref of armor) {
      if (match(ref.name, ref.slug)) results.push({ kind: 'armor', ref, slug: ref.slug })
    }
  }
  if (!kindFilter || kindFilter === 'item') {
    for (const ref of items) {
      if (match(ref.name, ref.slug)) results.push({ kind: 'item', ref, slug: ref.slug })
    }
  }

  results.sort((a, b) => a.ref.name.localeCompare(b.ref.name))
  return results.slice(0, limit)
}

export function formatEquipmentSummary(entry: CatalogEntry): string {
  if (entry.kind === 'weapon') {
    const w = entry.ref
    const parts = [w.damage_dice, w.damage_type].filter(Boolean)
    const props = w.properties.length > 0 ? w.properties.join(', ') : null
    return [parts.join(' '), props].filter(Boolean).join(' · ') || 'Weapon'
  }
  if (entry.kind === 'armor') {
    return entry.ref.ac_display ?? entry.ref.category ?? 'Armor'
  }
  const i = entry.ref
  const parts: string[] = []
  if (i.category) parts.push(i.category)
  if (i.cost) parts.push(`${i.cost} gp`)
  return parts.join(' · ') || 'Item'
}
