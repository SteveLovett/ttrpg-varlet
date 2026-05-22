import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './app-layout.css'

/**
 * Authenticated app chrome for everything under /app/*.
 */
export function AppShellLayout() {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-header-title">TTRPG Varlet</h1>
        <nav className="app-nav" aria-label="App">
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to="/app" end>
            Home
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to="/app/search">
            Search games
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to="/app/mailbox">
            Mailbox
          </NavLink>
        </nav>
        <span className="app-header-spacer" aria-hidden />
        <button type="button" className="app-sign-out" onClick={() => void handleSignOut()}>
          Sign out
        </button>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
