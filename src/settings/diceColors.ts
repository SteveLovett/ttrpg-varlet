export const DICE_COLOR_THEME_IDS = ['amber', 'obsidian', 'frost', 'ember', 'arcane'] as const

export type DiceColorThemeId = (typeof DICE_COLOR_THEME_IDS)[number]

export const DEFAULT_DICE_COLOR_THEME_ID: DiceColorThemeId = 'amber'

export const DICE_COLOR_THEME_STORAGE_KEY = 'ttrpg-varlet:dice-color-theme'

/** Solid-face colorset passed to dice-box-threejs `theme_customColorset`. */
export type DiceBoxCustomColorset = {
  name: string
  foreground: string
  background: string
  outline: string
  texture: 'none'
}

export type DiceColorTheme = {
  id: DiceColorThemeId
  label: string
  /** dice-box-threejs colorset key (also used as custom set name when customColorset is set) */
  colorset: string
  /** When set, uses a single solid color instead of a multi-tone library preset. */
  customColorset?: DiceBoxCustomColorset
  theme_material: 'plastic' | 'glass' | 'metal' | 'wood'
  /** UI swatch (CSS background) */
  swatch: string
}

export const DICE_COLOR_THEMES: readonly DiceColorTheme[] = [
  {
    id: 'amber',
    label: 'Amber',
    colorset: 'bronze',
    theme_material: 'plastic',
    swatch: 'linear-gradient(135deg, #8b5a14 0%, #d4a24a 45%, #f0c878 100%)',
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    colorset: 'black',
    theme_material: 'plastic',
    swatch: 'linear-gradient(135deg, #0a0a0f 0%, #2a2a35 50%, #4a4a58 100%)',
  },
  {
    id: 'frost',
    label: 'Frost',
    colorset: 'frost-solid',
    customColorset: {
      name: 'frost-solid',
      foreground: '#e8f4fc',
      background: '#4a8fc7',
      outline: '#2a5f8f',
      texture: 'none',
    },
    theme_material: 'plastic',
    swatch: '#4a8fc7',
  },
  {
    id: 'ember',
    label: 'Ember',
    colorset: 'ember-solid',
    customColorset: {
      name: 'ember-solid',
      foreground: '#fff0e0',
      background: '#d4511a',
      outline: '#9a3412',
      texture: 'none',
    },
    theme_material: 'plastic',
    swatch: '#d4511a',
  },
  {
    id: 'arcane',
    label: 'Arcane',
    colorset: 'arcane-solid',
    customColorset: {
      name: 'arcane-solid',
      foreground: '#ede9fe',
      background: '#7c3aed',
      outline: '#5b21b6',
      texture: 'none',
    },
    theme_material: 'plastic',
    swatch: '#7c3aed',
  },
] as const

const themeById = new Map(DICE_COLOR_THEMES.map((t) => [t.id, t]))

export function parseDiceColorThemeId(raw: unknown): DiceColorThemeId {
  if (typeof raw === 'string' && (DICE_COLOR_THEME_IDS as readonly string[]).includes(raw)) {
    return raw as DiceColorThemeId
  }
  return DEFAULT_DICE_COLOR_THEME_ID
}

export function getDiceColorTheme(id: DiceColorThemeId): DiceColorTheme {
  return themeById.get(id) ?? themeById.get(DEFAULT_DICE_COLOR_THEME_ID)!
}

export function readStoredDiceColorTheme(): DiceColorThemeId {
  if (typeof window === 'undefined') return DEFAULT_DICE_COLOR_THEME_ID
  try {
    return parseDiceColorThemeId(localStorage.getItem(DICE_COLOR_THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_DICE_COLOR_THEME_ID
  }
}

export function storeDiceColorTheme(id: DiceColorThemeId): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DICE_COLOR_THEME_STORAGE_KEY, id)
  } catch {
    /* ignore quota / private mode */
  }
}
