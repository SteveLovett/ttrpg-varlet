import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShellLayout } from './AppShellLayout.tsx'
import { AuthThemeLayout } from './themes/AuthThemeLayout.tsx'
import { GuestRoute } from './GuestRoute.tsx'
import { HomePage } from './pages/HomePage.tsx'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.tsx'
import { GameDetailPage } from './pages/GameDetailPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { MailboxPage } from './pages/MailboxPage.tsx'
import { ResetPasswordPage } from './pages/ResetPasswordPage.tsx'
import { SearchGamesPage } from './pages/SearchGamesPage.tsx'
import { DiceToolsPage } from './pages/DiceToolsPage.tsx'
import { BestiaryPage } from './pages/BestiaryPage.tsx'
import { EquipmentPage } from './pages/EquipmentPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
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
          <AuthThemeLayout>
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          </AuthThemeLayout>
        }
      />
      <Route
        path="/login"
        element={
          <AuthThemeLayout>
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          </AuthThemeLayout>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <AuthThemeLayout>
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          </AuthThemeLayout>
        }
      />
      {/* Not wrapped in GuestRoute: the recovery email link creates a session,
          and GuestRoute would redirect the user to /app before they could reset. */}
      <Route
        path="/reset-password"
        element={
          <AuthThemeLayout>
            <ResetPasswordPage />
          </AuthThemeLayout>
        }
      />
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
        <Route path="tools/dice" element={<DiceToolsPage />} />
        <Route path="tools/bestiary" element={<BestiaryPage />} />
        <Route path="tools/equipment" element={<EquipmentPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="games/:gameId" element={<GameDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
