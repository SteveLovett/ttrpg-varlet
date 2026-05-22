/**
 * FORGOT PASSWORD PAGE
 * ====================
 * Sends a password-recovery email via supabase.auth.resetPasswordForEmail.
 * Always shows a generic confirmation message so we don't leak which emails
 * are registered (avoids account enumeration).
 *
 * The `redirectTo` URL must be allowlisted in the Supabase dashboard under
 * Authentication → URL Configuration → Redirect URLs.
 *
 * Docs:
 *   https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
 */
import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './auth-forms.css'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter an email address.')
      return
    }

    setLoading(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      })

      if (resetError) {
        // Supabase returns errors for config/rate limits/unauthorized recipients — not
        // "user not found" (that case succeeds silently). Surface these so you can fix SMTP.
        setError(resetError.message)
        return
      }

      setInfo(
        'If an account exists for that email, a password reset link has been sent. Check your inbox (and spam folder).',
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
        <h1>Forgot your password?</h1>
        <p className="auth-lede">
          Enter the email address you registered with. We&rsquo;ll send you a link to reset your
          password.
        </p>

        {info ? <p className="auth-callout">{info}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        <p className="auth-footer">
          Remembered it? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
