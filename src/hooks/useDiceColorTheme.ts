import { useCallback, useState } from 'react'
import {
  type DiceColorThemeId,
  readStoredDiceColorTheme,
  storeDiceColorTheme,
} from '../settings/diceColors'

export function useDiceColorTheme() {
  const [themeId, setThemeId] = useState<DiceColorThemeId>(() => readStoredDiceColorTheme())

  const setTheme = useCallback((id: DiceColorThemeId) => {
    setThemeId(id)
    storeDiceColorTheme(id)
  }, [])

  return { themeId, setTheme }
}
