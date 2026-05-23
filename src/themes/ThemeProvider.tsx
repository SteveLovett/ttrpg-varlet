import { useEffect, type ReactNode } from 'react'
import { useUserPreferences } from '../hooks/useUserPreferences'
import { clearAppThemeFromDocument, markAppShellActive } from './applyTheme'
import { ThemeContext } from './themeContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const prefs = useUserPreferences()

  useEffect(() => {
    markAppShellActive()
    return () => {
      clearAppThemeFromDocument()
    }
  }, [])

  return <ThemeContext.Provider value={prefs}>{children}</ThemeContext.Provider>
}
