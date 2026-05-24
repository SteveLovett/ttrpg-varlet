import type { DiceColorThemeId } from '../../settings/diceColors'
import type { DiceTrayBackgroundId } from '../../settings/diceTrayBackground'
import { DiceColorThemePicker } from './DiceColorThemePicker'
import { DiceTrayBackgroundPicker } from './DiceTrayBackgroundPicker'

type DiceTrayAppearanceRowProps = {
  colorThemeId: DiceColorThemeId
  onColorThemeChange: (id: DiceColorThemeId) => void
  backgroundId: DiceTrayBackgroundId
  onBackgroundChange: (id: DiceTrayBackgroundId) => void
  disabled?: boolean
}

export function DiceTrayAppearanceRow({
  colorThemeId,
  onColorThemeChange,
  backgroundId,
  onBackgroundChange,
  disabled,
}: DiceTrayAppearanceRowProps) {
  return (
    <div className="dice-tray-appearance">
      <DiceColorThemePicker
        value={colorThemeId}
        onChange={onColorThemeChange}
        disabled={disabled}
      />
      <DiceTrayBackgroundPicker
        value={backgroundId}
        onChange={onBackgroundChange}
        disabled={disabled}
      />
    </div>
  )
}
