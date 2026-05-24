import { createContext, useContext } from 'react'
import type { useDisplayName } from './useDisplayName'

export type DisplayNameContextValue = ReturnType<typeof useDisplayName>

export const DisplayNameContext = createContext<DisplayNameContextValue | null>(null)

export function useDisplayNameProfile(): DisplayNameContextValue {
  const ctx = useContext(DisplayNameContext)
  if (!ctx) {
    throw new Error('useDisplayNameProfile must be used within DisplayNameProvider')
  }
  return ctx
}
