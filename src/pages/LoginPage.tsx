/**
 * LOGIN PAGE
 * ==========
 * Mirrors RegisterPage (controlled fields, SubmitEvent, signInWithPassword).
 * After login, sends the user to a safe path under /app when `location.state.from` is set
 * by ProtectedRoute (see getSafeRedirectAfterLogin); otherwise /app.
 *
 * Later: forgot password — supabase.auth.resetPasswordForEmail
 */
import { useState } from 'react'
import type { SubmitEvent } from 'react'
import type { Location } from 'react-router-dom'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { supabase } from '../supabaseClient'
import './auth-forms.css'

type LoginLocationState = { from?: Location }

/**
 * Builds an in-app path from ProtectedRoute's state. Rejects values that could be used
 * for open redirects (e.g. //evil.com) or auth pages (avoid pointless round-trips).
 */
const DEFAULT_AFTER_LOGIN = '/app'

function getSafeRedirectAfterLogin(from: unknown): string {
  if (!from || typeof from !== 'object') return DEFAULT_AFTER_LOGIN

  const loc = from as Partial<Location>
  const pathname = loc.pathname
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return DEFAULT_AFTER_LOGIN
  }
  if (pathname === '/login' || pathname === '/register') {
    return DEFAULT_AFTER_LOGIN
  }
  if (pathname === '/') {
    return DEFAULT_AFTER_LOGIN
  }
  if (!pathname.startsWith('/app')) {
    return DEFAULT_AFTER_LOGIN
  }

  const search = typeof loc.search === 'string' ? loc.search : ''
  const hash = typeof loc.hash === 'string' ? loc.hash : ''
  return `${pathname}${search}${hash}`
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Please enter an email address.')
      return
    }
    if (!password.trim()) {
      setError('Please enter a password.')
      return
    }

    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (data.session) {
        const to = getSafeRedirectAfterLogin(state?.from)
        navigate(to, { replace: true })
        return
      }

      // Rare: no error but no session (e.g. project/auth settings). Don't claim success.
      setError(
        'No active session after sign-in. Confirm your email if required, or check Supabase Auth settings.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="auth-lede">Enter your email and password to log in.</p>

        {error ? <p className="auth-error">{error}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="login-password">Password</label>
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="auth-footer" style={{ marginTop: 0 }}>
          Need an account? <Link to="/register">Register</Link>
        </p>
        <p className="auth-footer" style={{ marginTop: 0 }}>
          Forgot your password? <Link to="/forgot-password">Reset it</Link>
        </p>
      </div>
    </div>
  )
}
