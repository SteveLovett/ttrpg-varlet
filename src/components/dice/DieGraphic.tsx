import './dice-graphics.css'
import type { DieSides } from './diceDisplay'

export type DieGraphicProps = {
  sides: DieSides
  value?: number | null
  rolling?: boolean
  dropped?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Show label under shape (preset buttons). */
  showLabel?: boolean
  /** Overrides default d4/d6/… caption. */
  caption?: string
}

const SIDE_LABELS: Record<DieSides, string> = {
  4: 'd4',
  6: 'd6',
  8: 'd8',
  10: 'd10',
  12: 'd12',
  20: 'd20',
  100: 'd100',
}

function DieShape({ sides }: { sides: DieSides }) {
  switch (sides) {
    case 4:
      return (
        <polygon
          className="die-graphic-shape die-graphic-shape--d4"
          points="32,6 58,54 6,54"
        />
      )
    case 6:
      return <rect className="die-graphic-shape die-graphic-shape--d6" x="10" y="10" width="44" height="44" rx="6" />
    case 8:
      return (
        <polygon
          className="die-graphic-shape die-graphic-shape--d8"
          points="32,8 56,32 32,56 8,32"
        />
      )
    case 10:
      return (
        <polygon
          className="die-graphic-shape die-graphic-shape--d10"
          points="32,6 54,24 46,54 18,54 10,24"
        />
      )
    case 12:
      return (
        <polygon
          className="die-graphic-shape die-graphic-shape--d12"
          points="32,6 52,18 52,42 32,58 12,42 12,18"
        />
      )
    case 20:
      return <circle className="die-graphic-shape die-graphic-shape--d20" cx="32" cy="32" r="26" />
    case 100:
      return (
        <g className="die-graphic-d100-group">
          <rect
            className="die-graphic-shape die-graphic-shape--d100"
            x="8"
            y="14"
            width="48"
            height="36"
            rx="4"
          />
          <text className="die-graphic-d100-mark" x="32" y="28" textAnchor="middle">
            00
          </text>
        </g>
      )
    default:
      return <circle className="die-graphic-shape" cx="32" cy="32" r="26" />
  }
}

function formatFaceValue(sides: DieSides, value: number | null | undefined): string {
  if (value == null) return '?'
  if (sides === 100) return String(value)
  return String(value)
}

export function DieGraphic({
  sides,
  value = null,
  rolling = false,
  dropped = false,
  size = 'md',
  showLabel = false,
  caption,
}: DieGraphicProps) {
  const face = rolling ? '?' : formatFaceValue(sides, value)
  const classes = [
    'die-graphic',
    `die-graphic--${sides}`,
    `die-graphic--${size}`,
    rolling ? 'die-graphic--rolling' : '',
    dropped ? 'die-graphic--dropped' : '',
    value != null && !rolling ? 'die-graphic--revealed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes} aria-hidden={showLabel}>
      <svg viewBox="0 0 64 64" className="die-graphic-svg" role="img" aria-label={`${SIDE_LABELS[sides]} ${face}`}>
        <DieShape sides={sides} />
        <text className="die-graphic-value" x="32" y="36" textAnchor="middle">
          {face}
        </text>
      </svg>
      {showLabel ? (
        <span className="die-graphic-label">{caption ?? SIDE_LABELS[sides]}</span>
      ) : null}
    </div>
  )
}
