import type { EquipmentKind } from './equipment'
import { getArmorBySlug } from './armor'
import { getItemBySlug } from './items'
import { getWeaponBySlug } from './weapons'

/** Default carried weight (lb) when Open5e has no weight — editable per inventory row. */
const WEAPON_WEIGHT_LB: Record<string, number> = {
  light: 2,
  simple: 3,
  martial: 4,
}

const ARMOR_WEIGHT_LB: Record<string, number> = {
  light: 10,
  medium: 20,
  heavy: 55,
  shield: 6,
}

function weaponCategoryWeight(ref: { is_simple: boolean; properties: string[] }): number {
  if (ref.properties.some((p) => p.toLowerCase().includes('light'))) return WEAPON_WEIGHT_LB.light
  return ref.is_simple ? WEAPON_WEIGHT_LB.simple : WEAPON_WEIGHT_LB.martial
}

function armorCategoryWeight(category: string | null): number {
  const key = (category ?? '').toLowerCase()
  if (key.includes('shield')) return ARMOR_WEIGHT_LB.shield
  if (key.includes('heavy')) return ARMOR_WEIGHT_LB.heavy
  if (key.includes('medium')) return ARMOR_WEIGHT_LB.medium
  if (key.includes('light')) return ARMOR_WEIGHT_LB.light
  return 15
}

export function catalogDefaultWeightLb(kind: EquipmentKind, slug: string): number {
  if (kind === 'item') {
    const ref = getItemBySlug(slug)
    if (!ref?.weight || ref.weight < 0) return 0
    const unit = (ref.weight_unit ?? 'lb').toLowerCase()
    return unit === 'kg' ? ref.weight * 2.20462 : ref.weight
  }
  if (kind === 'weapon') {
    const ref = getWeaponBySlug(slug)
    return ref ? weaponCategoryWeight(ref) : 3
  }
  if (kind === 'armor') {
    const ref = getArmorBySlug(slug)
    return ref ? armorCategoryWeight(ref.category) : 15
  }
  return 0
}
