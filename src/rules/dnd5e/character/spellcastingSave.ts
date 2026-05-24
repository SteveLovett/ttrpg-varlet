import type { SpellcastingValidationMode } from '../../../settings/validation'
import type { CharacterSheet } from './types'
import { partitionSpellcastingIssues, validateSpellcasting } from './spellcasting'

export type SpellcastingSaveCheck = {
  blocked: boolean
  blockMessages: string[]
  warningMessages: string[]
}

export function checkSpellcastingSave(
  sheet: CharacterSheet,
  mode: SpellcastingValidationMode,
): SpellcastingSaveCheck {
  const issues = validateSpellcasting(sheet)
  const { errors, warnings } = partitionSpellcastingIssues(issues)
  const blockMessages = errors.map((i) => i.message)
  const warningMessages = [...errors, ...warnings].map((i) => i.message)

  if (mode === 'block' && errors.length > 0) {
    return {
      blocked: true,
      blockMessages,
      warningMessages: warnings.map((i) => i.message),
    }
  }

  return {
    blocked: false,
    blockMessages: [],
    warningMessages,
  }
}
