import { parseUserPreferences } from './parsePreferences'
import {
  DEFAULT_FONT_OVERRIDE_ID,
  DEFAULT_THEME_ID,
  type UserPreferences,
} from './types'

const PREFS_KEY = 'ttrpg-varlet-theme-prefs'
const USER_KEY = 'ttrpg-varlet-theme-user-id'

export function readThemeCache(): UserPreferences | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return null
    return parseUserPreferences(JSON.parse(raw))
  } catch {
    return null
  }
}

export function readThemeCacheUserId(): string | null {
  try {
    return localStorage.getItem(USER_KEY)
  } catch {
    return null
  }
}

export function writeThemeCache(prefs: UserPreferences, userId: string): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
    localStorage.setItem(USER_KEY, userId)
  } catch {
    /* private browsing */
  }
}

export function clearThemeCache(): void {
  try {
    localStorage.removeItem(PREFS_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

export function applyThemeCacheDefaults(): UserPreferences {
  return {
    themeId: DEFAULT_THEME_ID,
    fontOverrideId: DEFAULT_FONT_OVERRIDE_ID,
  }
}
