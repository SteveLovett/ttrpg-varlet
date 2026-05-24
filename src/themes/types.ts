export const THEME_IDS = [
  'default',
  'light',
  'dark',
  'midnight',
  'parchment',
  'arcane',
  'cozy-hearth',
  'forest-court',
  'slate',
  'blood-moon',
  'high-contrast',
  'terminal',
  'retro-8bit',
  'neon-arcade',
] as const

export type ThemeId = (typeof THEME_IDS)[number]

export const FONT_OVERRIDE_IDS = [
  'theme',
  'system',
  'inter',
  'literata',
  'cinzel',
  'jetbrains',
  'press-start',
  'ibm-plex',
] as const

export type FontOverrideId = (typeof FONT_OVERRIDE_IDS)[number]

import type { SpellcastingValidationMode } from '../settings/validation'

export type UserPreferences = {
  themeId?: ThemeId
  fontOverrideId?: FontOverrideId
  /** Personal default when a game uses inherit policy */
  spellcastingValidation?: SpellcastingValidationMode
}

export const DEFAULT_THEME_ID: ThemeId = 'default'
export const DEFAULT_FONT_OVERRIDE_ID: FontOverrideId = 'theme'

export type ThemeDefinition = {
  id: ThemeId
  name: string
  description: string
  /** CSS color stops for settings preview swatch */
  swatch: [string, string, string]
  googleFontsHref: string | null
  /** Body / UI font (readable) */
  bodySans: string
  /** Headings, nav, buttons */
  heading: string
  mono: string
  /** When true, heading font is pixel/display — body stays bodySans */
  pixelHeadingsOnly?: boolean
}

export type FontOverrideDefinition = {
  id: FontOverrideId
  name: string
  googleFontsHref: string | null
  sans: string
  heading: string
  mono: string
  /** Apply mono stack to all text */
  allMono?: boolean
}
