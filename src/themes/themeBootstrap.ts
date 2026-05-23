import { applyAuthThemeToDocument } from './applyTheme'
import { applyThemeCacheDefaults, readThemeCache } from './themeCache'

/** Run before React paint so auth pages match the last saved theme. */
export function bootstrapCachedAuthTheme(): void {
  const cached = readThemeCache()
  if (!cached) return
  const defaults = applyThemeCacheDefaults()
  applyAuthThemeToDocument(
    cached.themeId ?? defaults.themeId!,
    cached.fontOverrideId ?? defaults.fontOverrideId!,
  )
}
