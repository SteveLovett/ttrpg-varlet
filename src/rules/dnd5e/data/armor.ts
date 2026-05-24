import armorData from './armor.json'

export type ArmorRef = {
  slug: string
  name: string
  category: string | null
  ac_display: string | null
  ac_base: number | null
  ac_add_dexmod: boolean
  ac_cap_dexmod: number | null
  document: string | null
}

export const armor = armorData as ArmorRef[]

const bySlug = new Map(armor.map((a) => [a.slug, a]))

export function getArmorBySlug(slug: string): ArmorRef | undefined {
  return bySlug.get(slug)
}
