import { useCallback, useState } from 'react'

const STORAGE_KEY = 'ttrpg-varlet-dice-graphics'

function readPreference(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

export function useDiceGraphicsPreference(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(readPreference)

  const setPreference = useCallback((value: boolean) => {
    setEnabled(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      /* private browsing */
    }
  }, [])

  return [enabled, setPreference]
}
