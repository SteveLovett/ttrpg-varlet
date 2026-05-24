const STORAGE_KEY = 'ttrpg-varlet-create-game-expanded'

export function readCreateGamePanelExpanded(): boolean | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'true') return true
    if (raw === 'false') return false
    return null
  } catch {
    return null
  }
}

export function writeCreateGamePanelExpanded(expanded: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(expanded))
  } catch {
    /* private browsing */
  }
}
