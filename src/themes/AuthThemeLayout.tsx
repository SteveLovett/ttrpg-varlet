import { useEffect, type ReactNode } from 'react'
import { applyAuthThemeToDocument, clearAuthThemeFromDocument } from './applyTheme'
import { applyThemeCacheDefaults, readThemeCache } from './themeCache'

type AuthThemeLayoutProps = {
  children: ReactNode
}

/**
 * Applies the local theme cache on guest/auth routes (login, register, etc.).
 */
export function AuthThemeLayout({ children }: AuthThemeLayoutProps) {
  useEffect(() => {
    const cached = readThemeCache()
    if (cached) {
      const defaults = applyThemeCacheDefaults()
      applyAuthThemeToDocument(
        cached.themeId ?? defaults.themeId!,
        cached.fontOverrideId ?? defaults.fontOverrideId!,
      )
    }

    return () => {
      clearAuthThemeFromDocument()
    }
  }, [])

  return <>{children}</>
}
