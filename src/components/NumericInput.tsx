import { useEffect, useState, type InputHTMLAttributes } from 'react'

function clamp(n: number, min?: number, max?: number): number {
  let v = n
  if (min != null) v = Math.max(min, v)
  if (max != null) v = Math.min(max, v)
  return v
}

export type NumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  /** Applied on blur when the field is empty or invalid. Defaults to min or current value. */
  emptyFallback?: number
}

/**
 * Number input that allows clearing the field while typing (fixes controlled
 * inputs that immediately coerce "" to 0 or 1).
 */
export function NumericInput({
  value,
  onChange,
  min,
  max,
  emptyFallback,
  onBlur,
  ...rest
}: NumericInputProps) {
  const [text, setText] = useState(String(value))

  useEffect(() => {
    setText(String(value))
  }, [value])

  function commitFromText(raw: string) {
    const fallback = emptyFallback ?? min ?? value
    if (raw === '' || raw === '-') {
      const next = clamp(fallback, min, max)
      setText(String(next))
      onChange(next)
      return
    }
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isFinite(parsed)) {
      const next = clamp(fallback, min, max)
      setText(String(next))
      onChange(next)
      return
    }
    const next = clamp(parsed, min, max)
    setText(String(next))
    onChange(next)
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const raw = e.target.value
        if (raw !== '' && !/^-?\d*$/.test(raw)) return
        setText(raw)
        if (raw === '' || raw === '-') return
        const parsed = Number.parseInt(raw, 10)
        if (!Number.isFinite(parsed)) return
        onChange(parsed)
      }}
      onBlur={(e) => {
        commitFromText(text)
        onBlur?.(e)
      }}
    />
  )
}
