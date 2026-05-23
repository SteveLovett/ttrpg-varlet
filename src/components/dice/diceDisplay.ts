import type { DieRoll, RollResult } from '../../rules/dnd5e/dice/types'

export type DieSides = 4 | 6 | 8 | 10 | 12 | 20 | 100

export type DisplayDie = {
  sides: DieSides
  value: number | null
  dropped?: boolean
}

export function sidesFromFormula(formula: string): DieSides | null {
  const match = formula.trim().match(/(\d*)d(\d+)/i)
  if (!match) return null
  const sides = Number.parseInt(match[2], 10)
  if (sides === 4 || sides === 6 || sides === 8 || sides === 10 || sides === 12 || sides === 20) {
    return sides
  }
  if (sides === 100) return 100
  return null
}

export function displayDiceFromResult(result: RollResult | null): DisplayDie[] {
  if (!result) return []
  return result.dice.map((d) => ({
    sides: normalizeSides(d.sides),
    value: d.dropped ? d.value : d.value,
    dropped: d.dropped,
  }))
}

function normalizeSides(sides: number): DieSides {
  if (sides === 4 || sides === 6 || sides === 8 || sides === 10 || sides === 12 || sides === 20) {
    return sides
  }
  return 100
}

export function primarySidesFromRoll(result: RollResult): DieSides {
  const active = result.dice.filter((d: DieRoll) => !d.dropped)
  if (active.length === 0) return 20
  const maxSides = Math.max(...active.map((d) => d.sides))
  return normalizeSides(maxSides)
}
