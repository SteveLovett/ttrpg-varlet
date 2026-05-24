import { getArmorBySlug } from '../data/armor'
import { abilityModifier } from './math'
import type { CharacterSheet, InventoryItem } from './types'

const SHIELD_SLUG = 'srd-2024_shield'

export function isShieldItem(item: InventoryItem): boolean {
  return item.catalogSlug === SHIELD_SLUG || item.name.toLowerCase() === 'shield'
}

export function isBodyArmorItem(item: InventoryItem): boolean {
  return item.kind === 'armor' && item.catalogSlug !== SHIELD_SLUG && !isShieldItem(item)
}

/** Suggested AC from equipped armor/shield and Dexterity (2024 SRD rules). */
export function suggestAcFromEquipment(sheet: CharacterSheet): number {
  const dexMod = abilityModifier(sheet.abilities.dex)
  const equipped = sheet.inventoryItems.filter((i) => i.equipped)

  const bodyArmor = equipped.find(isBodyArmorItem)
  const hasShield = equipped.some(isShieldItem)

  let ac: number
  if (!bodyArmor?.catalogSlug) {
    ac = 10 + dexMod
  } else {
    const ref = getArmorBySlug(bodyArmor.catalogSlug)
    if (!ref || ref.ac_base == null) {
      ac = 10 + dexMod
    } else if (ref.slug === SHIELD_SLUG) {
      ac = 10 + dexMod
    } else {
      ac = ref.ac_base
      if (ref.ac_add_dexmod) {
        const cap = ref.ac_cap_dexmod ?? dexMod
        ac += Math.min(dexMod, cap)
      }
    }
  }

  if (hasShield) {
    ac += 2
  }

  return Math.max(1, ac)
}
