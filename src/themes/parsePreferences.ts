import {
  DEFAULT_FONT_OVERRIDE_ID,
  DEFAULT_THEME_ID,
  FONT_OVERRIDE_IDS,
  THEME_IDS,
  type FontOverrideId,
  type ThemeId,
  type UserPreferences,
} from './types'

export function parseUserPreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') {
    return { themeId: DEFAULT_THEME_ID, fontOverrideId: DEFAULT_FONT_OVERRIDE_ID }
  }
  const o = raw as Record<string, unknown>
  const themeId = THEME_IDS.includes(o.themeId as ThemeId)
    ? (o.themeId as ThemeId)
    : DEFAULT_THEME_ID
  const fontOverrideId = FONT_OVERRIDE_IDS.includes(o.fontOverrideId as FontOverrideId)
    ? (o.fontOverrideId as FontOverrideId)
    : DEFAULT_FONT_OVERRIDE_ID
  return { themeId, fontOverrideId }
}
