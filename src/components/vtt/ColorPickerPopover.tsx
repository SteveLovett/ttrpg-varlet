import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  hexToHsl,
  hexValidationMessage,
  hslToHex,
  normalizeHexColor,
} from './colorUtils'

const WHEEL_SIZE = 168
const WHEEL_RADIUS = WHEEL_SIZE / 2 - 4

type ColorPickerPopoverProps = {
  color: string
  onChange: (color: string) => void
  disabled?: boolean
  ariaLabel: string
  className?: string
}

type HslState = { h: number; s: number; l: number }

function hslFromHex(hex: string): HslState {
  return hexToHsl(hex) ?? { h: 220, s: 70, l: 50 }
}

function drawColorWheel(
  ctx: CanvasRenderingContext2D,
  size: number,
  lightness: number,
): void {
  const cx = size / 2
  const cy = size / 2
  const image = ctx.createImageData(size, size)
  const data = image.data

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.hypot(dx, dy)
      const i = (y * size + x) * 4
      if (dist > WHEEL_RADIUS) {
        data[i + 3] = 0
        continue
      }
      const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
      const sat = (dist / WHEEL_RADIUS) * 100
      const { r, g, b } = (() => {
        const sn = sat / 100
        const ln = lightness / 100
        if (sn === 0) {
          const v = ln * 255
          return { r: v, g: v, b: v }
        }
        const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
        const p = 2 * ln - q
        const hk = hue / 360
        const hue2rgb = (t: number) => {
          let tt = t
          if (tt < 0) tt += 1
          if (tt > 1) tt -= 1
          if (tt < 1 / 6) return p + (q - p) * 6 * tt
          if (tt < 1 / 2) return q
          if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
          return p
        }
        return {
          r: hue2rgb(hk + 1 / 3) * 255,
          g: hue2rgb(hk) * 255,
          b: hue2rgb(hk - 1 / 3) * 255,
        }
      })()
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }

  ctx.clearRect(0, 0, size, size)
  ctx.putImageData(image, 0, 0)
}

function wheelPointFromHsl(h: number, s: number): { x: number; y: number } {
  const angle = (h * Math.PI) / 180
  const dist = (s / 100) * WHEEL_RADIUS
  return {
    x: WHEEL_SIZE / 2 + Math.cos(angle) * dist,
    y: WHEEL_SIZE / 2 + Math.sin(angle) * dist,
  }
}

function hslFromWheelPoint(x: number, y: number, lightness: number): HslState {
  const cx = WHEEL_SIZE / 2
  const cy = WHEEL_SIZE / 2
  const dx = x - cx
  const dy = y - cy
  const dist = Math.min(WHEEL_RADIUS, Math.hypot(dx, dy))
  const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360
  const sat = (dist / WHEEL_RADIUS) * 100
  return { h: hue, s: sat, l: lightness }
}

export function ColorPickerPopover({
  color,
  onChange,
  disabled = false,
  ariaLabel,
  className,
}: ColorPickerPopoverProps) {
  const popoverId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const [open, setOpen] = useState(false)
  const [hsl, setHsl] = useState<HslState>(() => hslFromHex(color))
  const [hexDraft, setHexDraft] = useState(color)
  const [hexError, setHexError] = useState<string | null>(null)

  const normalizedColor = normalizeHexColor(color) ?? '#3b82f6'
  const displayColor = normalizeHexColor(hexDraft) ?? normalizedColor

  const applyHsl = useCallback(
    (next: HslState) => {
      setHsl(next)
      const hex = hslToHex(next.h, next.s, next.l)
      setHexDraft(hex)
      setHexError(null)
      onChange(hex)
    },
    [onChange],
  )

  const redrawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawColorWheel(ctx, WHEEL_SIZE, hsl.l)
  }, [hsl.l])

  useLayoutEffect(() => {
    if (!open) return
    redrawWheel()
  }, [open, redrawWheel])

  useLayoutEffect(() => {
    if (!open || !rootRef.current || !popoverRef.current) return
    const trigger = rootRef.current.querySelector('.vtt-color-swatch-btn')
    if (!(trigger instanceof HTMLElement)) return
    const rect = trigger.getBoundingClientRect()
    const pop = popoverRef.current
    const margin = 8
    let top = rect.bottom + margin
    let left = rect.left
    const popW = pop.offsetWidth
    const popH = pop.offsetHeight
    if (left + popW > window.innerWidth - margin) {
      left = window.innerWidth - popW - margin
    }
    if (left < margin) left = margin
    if (top + popH > window.innerHeight - margin) {
      top = rect.top - popH - margin
    }
    if (top < margin) top = margin
    pop.style.position = 'fixed'
    pop.style.top = `${top}px`
    pop.style.left = `${left}px`
    pop.style.zIndex = '10000'
  }, [open, hexError])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function commitHexDraft(): boolean {
    const normalized = normalizeHexColor(hexDraft)
    if (!normalized) {
      setHexError(hexValidationMessage(hexDraft))
      return false
    }
    setHexError(null)
    setHexDraft(normalized)
    const nextHsl = hslFromHex(normalized)
    setHsl(nextHsl)
    onChange(normalized)
    return true
  }

  function handleWheelPointer(e: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * WHEEL_SIZE
    const y = ((e.clientY - rect.top) / rect.height) * WHEEL_SIZE
    applyHsl(hslFromWheelPoint(x, y, hsl.l))
  }

  function onWheelPointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.preventDefault()
    handleWheelPointer(e)
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const onMove = (ev: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const px = ((ev.clientX - rect.left) / rect.width) * WHEEL_SIZE
      const py = ((ev.clientY - rect.top) / rect.height) * WHEEL_SIZE
      applyHsl(hslFromWheelPoint(px, py, hsl.l))
    }
    const onUp = () => {
      canvas.releasePointerCapture(e.pointerId)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
    }
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
  }

  const marker = wheelPointFromHsl(hsl.h, hsl.s)

  return (
    <div
      ref={rootRef}
      className={['vtt-color-picker', className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        className="vtt-color-swatch-btn vtt-token-swatch"
        style={{ background: displayColor }}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={(e) => {
          e.stopPropagation()
          if (disabled) return
          if (open) {
            setOpen(false)
            return
          }
          const next = hslFromHex(color)
          setHsl(next)
          setHexDraft(normalizeHexColor(color) ?? color)
          setHexError(null)
          setOpen(true)
        }}
      />
      {open ? (
        <div
          ref={popoverRef}
          id={popoverId}
          className="vtt-color-popover"
          role="dialog"
          aria-label={`${ariaLabel} picker`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="vtt-color-wheel-wrap">
            <canvas
              ref={canvasRef}
              className="vtt-color-wheel"
              width={WHEEL_SIZE}
              height={WHEEL_SIZE}
              aria-hidden
              onPointerDown={onWheelPointerDown}
            />
            <span
              className="vtt-color-wheel-marker"
              style={{
                left: `${(marker.x / WHEEL_SIZE) * 100}%`,
                top: `${(marker.y / WHEEL_SIZE) * 100}%`,
                background: hslToHex(hsl.h, hsl.s, hsl.l),
              }}
              aria-hidden
            />
          </div>

          <div className="form-row vtt-color-lightness-row">
            <label htmlFor={`${popoverId}-lightness`}>Lightness</label>
            <input
              id={`${popoverId}-lightness`}
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(hsl.l)}
              onChange={(e) => {
                const l = Number(e.target.value)
                applyHsl({ ...hsl, l })
              }}
            />
          </div>

          <div className="form-row vtt-color-hex-row">
            <label htmlFor={`${popoverId}-hex`}>Hex</label>
            <input
              id={`${popoverId}-hex`}
              type="text"
              className={hexError ? 'is-invalid' : undefined}
              value={hexDraft}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={hexError ? true : undefined}
              aria-describedby={hexError ? `${popoverId}-hex-error` : undefined}
              onChange={(e) => {
                setHexDraft(e.target.value)
                const msg = hexValidationMessage(e.target.value)
                setHexError(msg)
              }}
              onBlur={() => {
                if (hexDraft.trim()) commitHexDraft()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (commitHexDraft()) setOpen(false)
                }
              }}
            />
          </div>
          {hexError ? (
            <p id={`${popoverId}-hex-error`} className="vtt-color-hex-error" role="alert">
              {hexError}
            </p>
          ) : null}
          <button
            type="button"
            className="vtt-color-apply"
            onClick={() => {
              if (commitHexDraft()) setOpen(false)
            }}
          >
            Apply
          </button>
        </div>
      ) : null}
    </div>
  )
}
