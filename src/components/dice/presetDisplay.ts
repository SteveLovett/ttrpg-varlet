import type { DicePreset } from '../../rules/dnd5e/data'
import type { DieSides } from './diceDisplay'
import { sidesFromFormula } from './diceDisplay'

/** d20 rolls live in the dedicated modifier row — never duplicate in quick dice. */
const D20_PRESET_IDS = new Set(['d20', 'd20-adv', 'd20-dis'])

export function quickDicePresets(presets: DicePreset[]): DicePreset[] {
  return presets.filter((p) => !D20_PRESET_IDS.has(p.id) && !p.advantage)
}

/** Single-die presets get an icon; multi-die / special formulas use text only. */
export function presetUsesDieIcon(preset: DicePreset): boolean {
  if (preset.kind === 'percentile-tens') return true
  return /^1d(4|6|8|10|12)$/i.test(preset.formula.trim())
}

export function presetDieSides(preset: DicePreset): DieSides | null {
  if (preset.kind === 'percentile-tens') return 100
  return sidesFromFormula(preset.formula)
}

/** Short label under icon or on text button. */
export function presetButtonLabel(preset: DicePreset): string {
  if (preset.kind === 'percentile-tens') return 'd100'
  const m = preset.formula.match(/^(\d*)d(\d+)$/i)
  if (m) {
    const count = m[1] || '1'
    return `${count}d${m[2]}`
  }
  return preset.label
}
