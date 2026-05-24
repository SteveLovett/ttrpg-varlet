import { useCallback, useState } from 'react'
import {
  type DiceTrayBackgroundId,
  readStoredDiceTrayBackground,
  storeDiceTrayBackground,
} from '../settings/diceTrayBackground'

export function useDiceTrayBackground() {
  const [backgroundId, setBackgroundId] = useState<DiceTrayBackgroundId>(() =>
    readStoredDiceTrayBackground(),
  )

  const setBackground = useCallback((id: DiceTrayBackgroundId) => {
    setBackgroundId(id)
    storeDiceTrayBackground(id)
  }, [])

  return { backgroundId, setBackground }
}
