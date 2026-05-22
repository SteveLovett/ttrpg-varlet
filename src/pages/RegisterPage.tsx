/**
 * REGISTER PAGE — learning reference for Login
 * =============================================
 * Pieces used here (mirror these on LoginPage):
 *   1. React "controlled inputs": value + onChange tied to useState (see email/password below).
 *   2. Form submit: onSubmit on <form>, call event.preventDefault() so the page does not reload.
 *   3. Async handler: async function → try/catch → set loading + error state.
 *   4. Supabase Auth: supabase.auth.signUp({ email, password }) — docs:
 *      https://supabase.com/docs/reference/javascript/auth-signup
 *   5. React Router: useNavigate() to go to "/app" after success; <Link> for navigation without reload.
 *
 * Login will use signInWithPassword instead of signUp:
 *   https://supabase.com/docs/reference/javascript/auth-signinwithpassword
 */
import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordInput } from '../components/PasswordInput'
import { supabase } from '../supabaseClient'
import './auth-forms.css'

export function RegisterPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  /** True while the network request is in flight — disables the button to avoid double submits. */
  const [loading, setLoading] = useState(false)

  /** Set from Supabase error.message or our own validation — shown above the form. */
  const [error, setError] = useState<string | null>(null)

  /**
   * When email confirmation is required in the Supabase dashboard, signUp returns a user but
   * session may be null — user must click the email link before they can sign in.
   */
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    // --- Client-side checks (do the same kind of thing on Login for empty fields) ---
    if (!email.trim()) {
      setError('Please enter an email address.')
      return
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters (adjust rule to match Supabase settings).')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Session exists → Supabase logged the user in immediately (email confirmation off or skipped).
      if (data.session) {
        navigate('/app', { replace: true })
        return
      }

      // No session → usually means "check your email" if confirmation is enabled.
      setInfo(
        'Account created. If email confirmation is on in Supabase, check your inbox before logging in.',
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
        <h1>Create an account</h1>
        <p className="auth-lede">Use the same email/password flow you will reuse on the login page.</p>

        {info ? <p className="auth-callout">{info}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <label htmlFor="register-password">Password</label>
          <PasswordInput
            id="register-password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            disabled={loading}
          />

          <label htmlFor="register-confirm">Confirm password</label>
          <PasswordInput
            id="register-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Register'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
