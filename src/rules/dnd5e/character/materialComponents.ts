import type { SpellRef } from '../data/spells'

/** Label for a custom inventory row from spell material text. */
export function materialComponentInventoryName(spell: SpellRef): string | null {
  if (!spell.material) return null
  const specified = spell.material_specified?.trim()
  if (specified) return `Material: ${specified}`
  return `Material (${spell.name})`
}
