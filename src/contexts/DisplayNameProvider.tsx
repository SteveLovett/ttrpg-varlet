import type { ReactNode } from 'react'
import { useDisplayName } from '../hooks/useDisplayName'
import { DisplayNameContext } from '../hooks/displayNameProfileContext'

export function DisplayNameProvider({ children }: { children: ReactNode }) {
  const value = useDisplayName()
  return <DisplayNameContext.Provider value={value}>{children}</DisplayNameContext.Provider>
}
