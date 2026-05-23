import { fontOverrideById } from './fonts'
import { themeById } from './registry'
import type { FontOverrideId, ThemeId } from './types'

const FONT_LINK_THEME = 'ttrpg-varlet-theme-fonts'
const FONT_LINK_OVERRIDE = 'ttrpg-varlet-font-override'

function ensureFontLink(id: string, href: string | null): void {
  const existing = document.getElementById(id) as HTMLLinkElement | null
  if (!href) {
    existing?.remove()
    return
  }
  if (existing) {
    if (existing.href === href) return
    existing.href = href
    return
  }
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

function applyThemeVarsToDocument(themeId: ThemeId, fontOverrideId: FontOverrideId): void {
  const theme = themeById(themeId)
  const fontOverride = fontOverrideById(fontOverrideId)

  const html = document.documentElement
  html.setAttribute('data-theme', themeId)
  html.setAttribute('data-font', fontOverrideId)

  html.style.setProperty('--theme-sans', theme.bodySans)
  html.style.setProperty('--theme-heading', theme.heading)
  html.style.setProperty('--theme-mono', theme.mono)

  if (fontOverrideId === 'theme') {
    html.style.setProperty('--sans', theme.bodySans)
    html.style.setProperty('--heading', theme.pixelHeadingsOnly ? theme.heading : theme.bodySans)
    html.style.setProperty('--heading-display', theme.heading)
    html.style.setProperty('--mono', theme.mono)
    if (theme.pixelHeadingsOnly) {
      html.setAttribute('data-pixel-headings', '')
    } else {
      html.removeAttribute('data-pixel-headings')
    }
  } else {
    html.removeAttribute('data-pixel-headings')
    const sans = fontOverride.allMono ? fontOverride.mono : fontOverride.sans
    const heading = fontOverride.allMono ? fontOverride.mono : fontOverride.heading
    html.style.setProperty('--sans', sans)
    html.style.setProperty('--heading', heading)
    html.style.setProperty('--heading-display', heading)
    html.style.setProperty('--mono', fontOverride.mono)
  }

  if (fontOverrideId === 'theme') {
    ensureFontLink(FONT_LINK_OVERRIDE, null)
    ensureFontLink(FONT_LINK_THEME, theme.googleFontsHref)
  } else {
    ensureFontLink(FONT_LINK_THEME, theme.googleFontsHref)
    ensureFontLink(FONT_LINK_OVERRIDE, fontOverride.googleFontsHref)
  }
}

/** Apply theme inside authenticated app shell. */
export function applyThemeToDocument(themeId: ThemeId, fontOverrideId: FontOverrideId): void {
  const html = document.documentElement
  html.removeAttribute('data-auth-theme')
  html.setAttribute('data-app-shell', '')
  applyThemeVarsToDocument(themeId, fontOverrideId)
}

/** Apply cached theme on login/register (no full-width app layout). */
export function applyAuthThemeToDocument(themeId: ThemeId, fontOverrideId: FontOverrideId): void {
  const html = document.documentElement
  html.removeAttribute('data-app-shell')
  html.setAttribute('data-auth-theme', '')
  applyThemeVarsToDocument(themeId, fontOverrideId)
}

/** Remove auth surface flag when entering the app (theme attrs may remain briefly). */
export function clearAuthThemeFromDocument(): void {
  document.documentElement.removeAttribute('data-auth-theme')
}

export function clearAppThemeFromDocument(): void {
  const html = document.documentElement
  html.removeAttribute('data-app-shell')
  html.removeAttribute('data-auth-theme')
  html.removeAttribute('data-theme')
  html.removeAttribute('data-font')
  html.removeAttribute('data-pixel-headings')
  html.style.removeProperty('--theme-sans')
  html.style.removeProperty('--theme-heading')
  html.style.removeProperty('--theme-mono')
  html.style.removeProperty('--sans')
  html.style.removeProperty('--heading')
  html.style.removeProperty('--heading-display')
  html.style.removeProperty('--mono')
  document.getElementById(FONT_LINK_THEME)?.remove()
  document.getElementById(FONT_LINK_OVERRIDE)?.remove()
}

export function markAppShellActive(): void {
  document.documentElement.setAttribute('data-app-shell', '')
  document.documentElement.removeAttribute('data-auth-theme')
}
