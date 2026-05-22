import { useState } from 'react'

type Props = {
  id: string
  name?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoComplete?: string
  minLength?: number
  required?: boolean
}

/**
 * Password field with a peek toggle (show/hide). Toggles input type between
 * password and text; peek state resets when the component unmounts.
 */
export function PasswordInput({
  id,
  name,
  value,
  onChange,
  disabled = false,
  autoComplete,
  minLength,
  required,
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-field">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        minLength={minLength}
        required={required}
      />
      <button
        type="button"
        className="password-peek"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={id}
      >
        {visible ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}
