import type { SpellcastingValidationMode } from '../../../settings/validation'
import { MAX_ATTUNEMENT, countAttunedItems } from './inventory'
import { carryingCapacityLb, totalInventoryWeightLb } from './inventoryWeight'
import type { CharacterSheet } from './types'

export type InventorySaveCheck = {
  blocked: boolean
  blockMessages: string[]
  warningMessages: string[]
}

export function inventorySaveIssues(sheet: CharacterSheet): {
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  const attuned = countAttunedItems(sheet)
  if (attuned > MAX_ATTUNEMENT) {
    const msg = `${attuned} items attuned; maximum ${MAX_ATTUNEMENT} allowed.`
    errors.push(msg)
  }

  const weight = totalInventoryWeightLb(sheet)
  const capacity = carryingCapacityLb(sheet)
  if (weight > capacity) {
    errors.push(
      `Carried weight ${weight.toFixed(1)} lb exceeds capacity ${capacity} lb (STR × 15).`,
    )
  }

  return { errors, warnings }
}

/** Uses the same warn/block setting as spellcasting validation. */
export function checkInventorySave(
  sheet: CharacterSheet,
  mode: SpellcastingValidationMode,
): InventorySaveCheck {
  const { errors, warnings } = inventorySaveIssues(sheet)
  const warningMessages = [...errors, ...warnings]

  if (mode === 'block' && errors.length > 0) {
    return {
      blocked: true,
      blockMessages: errors,
      warningMessages: warnings,
    }
  }

  return {
    blocked: false,
    blockMessages: [],
    warningMessages,
  }
}
