/**
 * RESET PASSWORD PAGE
 * ===================
 * Destination of the password-recovery email link.
 *
 * Flow:
 *   1. User clicks the link in the recovery email. Supabase appends
 *      `#access_token=...&type=recovery` to the URL.
 *   2. The supabase-js client (with `detectSessionInUrl: true`, which is the
 *      default) consumes the hash, stores a recovery session, and fires the
 *      `PASSWORD_RECOVERY` auth event.
 *   3. We listen for that event (or for an already-present session) and show
 *      the new-password form.
 *   4. On submit we call `supabase.auth.updateUser({ password })` to set the
 *      new password, then route the now-signed-in user to /app.
 *
 * This page is NOT wrapped in GuestRoute: the recovery link creates a session,
 * so GuestRoute would redirect the user to /app before they could reset.
 *
 * Docs:
 *   https://supabase.com/docs/reference/javascript/auth-updateuser
 *   https://supabase.com/docs/reference/javascript/auth-onauthstatechange
 */
import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { supabase } from '../supabaseClient'
import './auth-forms.css'

type Phase = 'checking' | 'ready' | 'invalid'

export function ResetPasswordPage() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState<Phase>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // Listen first so we don't miss the PASSWORD_RECOVERY event that fires
    // when supabase-js processes the recovery URL hash.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || session) {
        setPhase('ready')
      }
    })

    // If the page is opened directly (no recovery hash, no existing session),
    // mark the link as invalid after we give the client a moment to parse the URL.
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      if (session) {
        setPhase('ready')
        return
      }
      const timer = window.setTimeout(() => {
        if (cancelled) return
        setPhase((current) => (current === 'checking' ? 'invalid' : current))
      }, 1500)
      return () => window.clearTimeout(timer)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (password.length < 6) {
      setError('Password should be at least 6 characters (match your Supabase settings).')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      setInfo('Password updated. Redirecting...')
      window.setTimeout(() => {
        navigate('/app', { replace: true })
      }, 800)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (phase === 'checking') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Reset your password</h1>
          <p className="auth-lede">Verifying your reset link...</p>
        </div>
      </div>
    )
  }

  if (phase === 'invalid') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Reset link invalid or expired</h1>
          <p className="auth-lede">
            This page can only be used right after clicking the reset link from your email. The
            link may have expired or already been used.
          </p>
          <p className="auth-footer">
            <Link to="/forgot-password">Request a new reset link</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Choose a new password</h1>
        <p className="auth-lede">Enter and confirm your new password to finish signing in.</p>

        {info ? <p className="auth-callout">{info}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="reset-password">New password</label>
          <PasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            disabled={loading}
          />

          <label htmlFor="reset-confirm">Confirm new password</label>
          <PasswordInput
            id="reset-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <p className="auth-footer">
          Changed your mind? <Link to="/login">Back to log in</Link>
        </p>
      </div>
    </div>
  )
}
