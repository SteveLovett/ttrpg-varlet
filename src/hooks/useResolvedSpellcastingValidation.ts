import {
  DEFAULT_GAME_SPELLCASTING_POLICY,
  DEFAULT_SPELLCASTING_VALIDATION_MODE,
  resolveSpellcastingValidationMode,
  type GameSpellcastingPolicy,
  type SpellcastingValidationMode,
} from '../settings/validation'
import { useThemeSettings } from '../themes/themeContext'

export function useResolvedSpellcastingValidation(
  gamePolicy: GameSpellcastingPolicy = DEFAULT_GAME_SPELLCASTING_POLICY,
): {
  mode: SpellcastingValidationMode
  userMode: SpellcastingValidationMode
  gamePolicy: GameSpellcastingPolicy
} {
  const { preferences } = useThemeSettings()
  const userMode = preferences.spellcastingValidation ?? DEFAULT_SPELLCASTING_VALIDATION_MODE
  const mode = resolveSpellcastingValidationMode(userMode, gamePolicy)

  return {
    mode,
    userMode,
    gamePolicy,
  }
}
