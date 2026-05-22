import { Navigate } from 'react-router-dom'
import { SessionLoadingFallback } from './SessionLoadingFallback.tsx'
import { useSession } from './hooks/useSession'

/**
 * / — send signed-in users to the app, guests to login.
 */
export function RootRedirect() {
  const session = useSession()

  if (session === undefined) {
    return <SessionLoadingFallback />
  }

  if (session) {
    return <Navigate to="/app" replace />
  }

  return <Navigate to="/login" replace />
}
