import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { SessionLoadingFallback } from './SessionLoadingFallback.tsx'
import { useSession } from './hooks/useSession'

type Props = {
  children: ReactNode
}

/**
 * Renders children only when a Supabase session exists; otherwise redirects to /login.
 */
export function ProtectedRoute({ children }: Props) {
  const location = useLocation()
  const session = useSession()

  if (session === undefined) {
    return <SessionLoadingFallback />
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
