import { parseFormula, type ParsedFormula } from './parse'
import type { AdvantageMode, DieRoll, RollResult } from './types'

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1
}

function applyKeepDrop(
  rolls: DieRoll[],
  keep?: { mode: 'highest' | 'lowest'; count: number },
  drop?: { mode: 'highest' | 'lowest'; count: number },
): DieRoll[] {
  const working = rolls.map((r) => ({ ...r }))

  if (drop) {
    const sorted = [...working].sort((a, b) =>
      drop.mode === 'lowest' ? a.value - b.value : b.value - a.value,
    )
    const toDrop = new Set(sorted.slice(0, drop.count))
    for (const die of working) {
      if (toDrop.has(die)) {
        die.dropped = true
        toDrop.delete(die)
      }
    }
  }

  if (keep) {
    const active = working.filter((d) => !d.dropped)
    const sorted = [...active].sort((a, b) =>
      keep.mode === 'highest' ? b.value - a.value : a.value - b.value,
    )
    const toKeep = new Set(sorted.slice(0, keep.count))
    for (const die of working) {
      if (!die.dropped && !toKeep.has(die)) {
        die.dropped = true
      }
    }
  }

  return working
}

function rollDieGroup(
  count: number,
  sides: number,
  keep?: { mode: 'highest' | 'lowest'; count: number },
  drop?: { mode: 'highest' | 'lowest'; count: number },
): DieRoll[] {
  const rolls: DieRoll[] = []
  for (let i = 0; i < count; i++) {
    rolls.push({ sides, value: rollDie(sides) })
  }
  return applyKeepDrop(rolls, keep, drop)
}

function formatDieGroup(rolls: DieRoll[], label: string): string {
  const parts = rolls.map((d) => {
    const inner = `d${d.sides} (${d.value})`
    return d.dropped ? `~~${inner}~~` : inner
  })
  const active = rolls.filter((d) => !d.dropped)
  const subtotal = active.reduce((sum, d) => sum + d.value, 0)
  return `${label} [${parts.join(', ')}] → ${subtotal}`
}

export function rollParsed(parsed: ParsedFormula, formulaLabel: string): RollResult {
  const allDice: DieRoll[] = []
  const groupLabels: string[] = []

  for (const group of parsed.dice) {
    const rolls = rollDieGroup(group.count, group.sides, group.keep, group.drop)
    allDice.push(...rolls)
    const label = `${group.count}d${group.sides}`
    groupLabels.push(formatDieGroup(rolls, label))
  }

  const diceTotal = allDice.filter((d) => !d.dropped).reduce((sum, d) => sum + d.value, 0)
  const total = diceTotal + parsed.modifier
  const modPart =
    parsed.modifier === 0
      ? ''
      : parsed.modifier > 0
        ? ` + ${parsed.modifier}`
        : ` − ${Math.abs(parsed.modifier)}`

  return {
    formula: formulaLabel,
    dice: allDice,
    modifier: parsed.modifier,
    total,
    breakdown: `${groupLabels.join('; ')}${modPart} = **${total}**`,
  }
}

export function rollFormula(formula: string): RollResult | { error: string } {
  const parsed = parseFormula(formula)
  if ('error' in parsed) {
    return parsed
  }
  return rollParsed(parsed, formula.trim())
}

/** D&D 5e advantage/disadvantage on a d20: 2d20 keep highest or lowest. */
export function rollD20(
  modifier = 0,
  mode: AdvantageMode = 'normal',
  label = '1d20',
): RollResult | { error: string } {
  const formula =
    mode === 'advantage'
      ? `2d20kh1${modifier >= 0 ? `+${modifier}` : modifier}`
      : mode === 'disadvantage'
        ? `2d20kl1${modifier >= 0 ? `+${modifier}` : modifier}`
        : `1d20${modifier >= 0 ? `+${modifier}` : modifier}`

  const parsed = parseFormula(formula)
  if ('error' in parsed) {
    return { error: parsed.error }
  }
  const result = rollParsed(parsed, label)
  if (mode === 'advantage') {
    result.breakdown = `Advantage: ${result.breakdown}`
  } else if (mode === 'disadvantage') {
    result.breakdown = `Disadvantage: ${result.breakdown}`
  }
  return result
}

/** Percentile tens die: result is always 10, 20, … 100. */
export function rollD100(): RollResult {
  const tensDigit = Math.floor(Math.random() * 10) + 1
  const value = tensDigit * 10
  return {
    formula: 'd100 (×10)',
    dice: [{ sides: 100, value }],
    modifier: 0,
    total: value,
    breakdown: `d100 → **${value}**`,
  }
}
