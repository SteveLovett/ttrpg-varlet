import { getWeaponBySlug } from '../data/weapons'
import { abilityModifier, formatModifier, proficiencyBonus } from './math'
import type { CharacterSheet, InventoryItem } from './types'

function weaponUsesDex(sheet: CharacterSheet, weaponSlug: string): boolean {
  const ref = getWeaponBySlug(weaponSlug)
  if (!ref) return false
  const props = ref.properties.map((p) => p.toLowerCase())
  if (props.some((p) => p.includes('finesse'))) {
    return sheet.abilities.dex >= sheet.abilities.str
  }
  if (props.some((p) => p.includes('thrown') || p.includes('range') || p === 'ammunition')) {
    return true
  }
  return false
}

function attackAbilityForWeapon(sheet: CharacterSheet, item: InventoryItem): 'str' | 'dex' {
  if (item.kind !== 'weapon' || !item.catalogSlug) return 'str'
  return weaponUsesDex(sheet, item.catalogSlug) ? 'dex' : 'str'
}

export type WeaponAttackLine = {
  itemId: string
  name: string
  attackBonus: string
  damage: string
}

export function equippedWeaponAttacks(sheet: CharacterSheet): WeaponAttackLine[] {
  const prof = proficiencyBonus(sheet.level)
  const lines: WeaponAttackLine[] = []

  for (const item of sheet.inventoryItems) {
    if (!item.equipped || item.kind !== 'weapon' || !item.catalogSlug) continue
    const ref = getWeaponBySlug(item.catalogSlug)
    if (!ref) continue

    const ability = attackAbilityForWeapon(sheet, item)
    const mod = abilityModifier(sheet.abilities[ability]) + prof
    const damageMod = abilityModifier(sheet.abilities[ability])
    const dice = ref.damage_dice ?? '—'
    const dmgType = ref.damage_type ?? ''

    lines.push({
      itemId: item.id,
      name: item.name,
      attackBonus: formatModifier(mod),
      damage: `${dice}${damageMod !== 0 ? ` ${formatModifier(damageMod)}` : ''} ${dmgType}`.trim(),
    })
  }

  return lines
}
