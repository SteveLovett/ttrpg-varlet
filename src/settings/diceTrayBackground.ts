export const DICE_TRAY_BACKGROUND_IDS = [
  'charcoal',
  'forest',
  'burgundy',
  'midnight',
  'sand',
] as const

export type DiceTrayBackgroundId = (typeof DICE_TRAY_BACKGROUND_IDS)[number]

export const DEFAULT_DICE_TRAY_BACKGROUND_ID: DiceTrayBackgroundId = 'charcoal'

export const DICE_TRAY_BACKGROUND_STORAGE_KEY = 'ttrpg-varlet:dice-tray-background'

export type DiceTrayBackground = {
  id: DiceTrayBackgroundId
  label: string
  /** CSS background for the viewport (shown behind transparent 3D canvas). */
  cssBackground: string
  swatch: string
}

export const DICE_TRAY_BACKGROUNDS: readonly DiceTrayBackground[] = [
  {
    id: 'charcoal',
    label: 'Charcoal',
    swatch: '#1a1814',
    cssBackground: 'radial-gradient(ellipse at 50% 80%, #2a241c 0%, #12100d 70%)',
  },
  {
    id: 'forest',
    label: 'Forest',
    swatch: '#244d1e',
    cssBackground: 'radial-gradient(ellipse at 50% 80%, #3d6b38 0%, #1a2e1a 70%)',
  },
  {
    id: 'burgundy',
    label: 'Burgundy',
    swatch: '#4d1e1e',
    cssBackground: 'radial-gradient(ellipse at 50% 80%, #6b2a2a 0%, #2a1418 70%)',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    swatch: '#0b1a3e',
    cssBackground: 'radial-gradient(ellipse at 50% 80%, #1a3568 0%, #0b1a3e 70%)',
  },
  {
    id: 'sand',
    label: 'Sand',
    swatch: '#d8d2c4',
    cssBackground: 'radial-gradient(ellipse at 50% 80%, #ece8df 0%, #cfc9bb 70%)',
  },
] as const

const backgroundById = new Map(DICE_TRAY_BACKGROUNDS.map((b) => [b.id, b]))

export function parseDiceTrayBackgroundId(raw: unknown): DiceTrayBackgroundId {
  if (raw === 'moss') return 'sand'
  if (typeof raw === 'string' && (DICE_TRAY_BACKGROUND_IDS as readonly string[]).includes(raw)) {
    return raw as DiceTrayBackgroundId
  }
  return DEFAULT_DICE_TRAY_BACKGROUND_ID
}

export function getDiceTrayBackground(id: DiceTrayBackgroundId): DiceTrayBackground {
  return backgroundById.get(id) ?? backgroundById.get(DEFAULT_DICE_TRAY_BACKGROUND_ID)!
}

export function readStoredDiceTrayBackground(): DiceTrayBackgroundId {
  if (typeof window === 'undefined') return DEFAULT_DICE_TRAY_BACKGROUND_ID
  try {
    return parseDiceTrayBackgroundId(localStorage.getItem(DICE_TRAY_BACKGROUND_STORAGE_KEY))
  } catch {
    return DEFAULT_DICE_TRAY_BACKGROUND_ID
  }
}

export function storeDiceTrayBackground(id: DiceTrayBackgroundId): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DICE_TRAY_BACKGROUND_STORAGE_KEY, id)
  } catch {
    /* ignore quota / private mode */
  }
}
