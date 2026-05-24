import { createContext, useContext } from 'react'
import type { SpellcastingValidationMode } from '../settings/validation'
import type { FontOverrideId, ThemeId, UserPreferences } from './types'

export type ThemeContextValue = {
  preferences: UserPreferences
  loading: boolean
  saving: boolean
  error: string | null
  savedAt: number | null
  setThemeId: (id: ThemeId) => void
  setFontOverrideId: (id: FontOverrideId) => void
  setSpellcastingValidation: (mode: SpellcastingValidationMode) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useThemeSettings(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useThemeSettings must be used within ThemeProvider')
  }
  return ctx
}
