import { DICE_COLOR_THEMES, type DiceColorThemeId } from '../../settings/diceColors'

type DiceColorThemePickerProps = {
  value: DiceColorThemeId
  onChange: (id: DiceColorThemeId) => void
  disabled?: boolean
}

export function DiceColorThemePicker({ value, onChange, disabled }: DiceColorThemePickerProps) {
  return (
    <fieldset className="dice-color-theme-picker" disabled={disabled}>
      <legend className="dice-color-theme-picker-label">Dice color</legend>
      <div className="dice-color-theme-picker-options" role="radiogroup" aria-label="Dice color theme">
        {DICE_COLOR_THEMES.map((theme) => {
          const selected = theme.id === value
          return (
            <label
              key={theme.id}
              className={`dice-color-theme-option${selected ? ' dice-color-theme-option--selected' : ''}`}
            >
              <input
                type="radio"
                name="dice-color-theme"
                value={theme.id}
                checked={selected}
                onChange={() => onChange(theme.id)}
              />
              <span
                className="dice-color-theme-swatch"
                style={{ background: theme.swatch }}
                aria-hidden
              />
              <span className="dice-color-theme-name">{theme.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
