import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShellLayout } from './AppShellLayout.tsx'
import { GuestRoute } from './GuestRoute.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx'
import { GameDetailPage } from './pages/GameDetailPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { MailboxPage } from './pages/MailboxPage.tsx'
import { ResetPasswordPage } from './pages/ResetPasswordPage.tsx'
import { SearchGamesPage } from './pages/SearchGamesPage.tsx'
import { ToolsPage } from './pages/ToolsPage.tsx'
import { RegisterPage } from './pages/RegisterPage.tsx'
import { ProtectedRoute } from './ProtectedRoute.tsx'
import { RootRedirect } from './RootRedirect.tsx'

/**
 * Public: /, /login, /register
 * Authenticated app: /app/* (shared layout + Outlet)
 */
function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPasswordPage />
          </GuestRoute>
        }
      />
      {/* Not wrapped in GuestRoute: the recovery email link creates a session,
          and GuestRoute would redirect the user to /app before they could reset. */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShellLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchGamesPage />} />
        <Route path="mailbox" element={<MailboxPage />} />
        <Route path="tools" element={<ToolsPage />} />
        <Route path="games/:gameId" element={<GameDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
