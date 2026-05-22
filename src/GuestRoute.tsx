import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { SessionLoadingFallback } from './SessionLoadingFallback.tsx'
import { useSession } from './hooks/useSession'

type Props = {
  children: ReactNode
}

/**
 * Renders children only when there is no Supabase session (guests).
 * If already signed in, redirects to /app so login/register are not shown again.
 */
export function GuestRoute({ children }: Props) {
  const session = useSession()

  if (session === undefined) {
    return <SessionLoadingFallback />
  }

  if (session) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}
