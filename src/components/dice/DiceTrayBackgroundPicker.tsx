import {
  DICE_TRAY_BACKGROUNDS,
  getDiceTrayBackground,
  type DiceTrayBackgroundId,
} from '../../settings/diceTrayBackground'

type DiceTrayBackgroundPickerProps = {
  value: DiceTrayBackgroundId
  onChange: (id: DiceTrayBackgroundId) => void
  disabled?: boolean
}

export function DiceTrayBackgroundPicker({
  value,
  onChange,
  disabled,
}: DiceTrayBackgroundPickerProps) {
  const active = getDiceTrayBackground(value)

  return (
    <fieldset className="dice-tray-background-picker" disabled={disabled}>
      <legend className="dice-tray-background-picker-label">Tray background</legend>
      <div
        className="dice-tray-background-picker-options"
        role="radiogroup"
        aria-label="Dice tray background"
      >
        {DICE_TRAY_BACKGROUNDS.map((bg) => {
          const selected = bg.id === value
          return (
            <label
              key={bg.id}
              className={`dice-tray-background-option${selected ? ' dice-tray-background-option--selected' : ''}`}
            >
              <input
                type="radio"
                name="dice-tray-background"
                value={bg.id}
                checked={selected}
                onChange={() => onChange(bg.id)}
              />
              <span
                className="dice-tray-background-swatch"
                style={{ background: bg.swatch }}
                aria-hidden
              />
              <span className="dice-tray-background-name">{bg.label}</span>
            </label>
          )
        })}
      </div>
      <p className="dice-tray-background-picker-hint muted">{active.label} tray.</p>
    </fieldset>
  )
}
