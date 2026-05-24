import weaponsData from './weapons.json'

export type WeaponRef = {
  slug: string
  name: string
  damage_dice: string | null
  damage_type: string | null
  is_simple: boolean
  properties: string[]
  document: string | null
}

export const weapons = weaponsData as WeaponRef[]

const bySlug = new Map(weapons.map((w) => [w.slug, w]))

export function getWeaponBySlug(slug: string): WeaponRef | undefined {
  return bySlug.get(slug)
}
