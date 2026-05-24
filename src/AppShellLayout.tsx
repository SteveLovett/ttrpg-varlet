import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { DisplayNameProvider } from './contexts/DisplayNameProvider'
import { useDisplayNameProfile } from './hooks/displayNameProfileContext'
import { supabase } from './supabaseClient'
import { clearThemeCache } from './themes/themeCache'
import { ThemeProvider } from './themes/ThemeProvider'
import './app-layout.css'

const PRIMARY_NAV = [
  { to: '/app/search', label: 'Search games', end: false },
  { to: '/app/mailbox', label: 'Mailbox', end: false },
  { to: '/app/tools', label: 'Tools', end: false },
  { to: '/app/settings', label: 'Settings', end: false },
] as const

function AppShellHeader() {
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)
  const { greetingLabel, loading: profileLoading } = useDisplayNameProfile()

  useEffect(() => {
    if (!navOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [navOpen])

  async function handleSignOut() {
    clearThemeCache()
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <NavLink
          to="/app"
          end
          className="app-header-title"
          title="Back to games"
          onClick={() => setNavOpen(false)}
        >
          TTRPG Varlet
        </NavLink>
        <button
          type="button"
          className="app-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="app-primary-nav"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span className="app-nav-toggle-label">{navOpen ? 'Close menu' : 'Menu'}</span>
        </button>
      </div>

      <nav
        id="app-primary-nav"
        className={`app-nav${navOpen ? ' is-open' : ''}`}
        aria-label="App"
      >
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
            to={item.to}
            end={item.end}
            onClick={() => setNavOpen(false)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <span className="app-header-spacer" aria-hidden />

      {!profileLoading && greetingLabel ? (
        <span className="app-user-chip" title="Your display name">
          Hi, <strong>{greetingLabel}</strong>
        </span>
      ) : null}

      <button type="button" className="app-sign-out" onClick={() => void handleSignOut()}>
        Sign out
      </button>
    </header>
  )
}

function AppShellInner() {
  return (
    <DisplayNameProvider>
      <div className="app-shell">
        <AppShellHeader />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </DisplayNameProvider>
  )
}

/**
 * Authenticated app chrome for everything under /app/*.
 */
export function AppShellLayout() {
  return (
    <ThemeProvider>
      <AppShellInner />
    </ThemeProvider>
  )
}
