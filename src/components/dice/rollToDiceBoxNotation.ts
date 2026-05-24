import { MAX_DICE_3D_COUNT } from '../../settings/diceAnimation'
import type { DieRoll, RollResult } from '../../rules/dnd5e/dice/types'

/** @deprecated Use string notation from rollResultToDiceBoxNotation. */
export type DiceBoxRollItem = {
  qty: number
  sides: number
  themeColor?: string
}

export type DiceBoxNotation = {
  /** dice-box-threejs notation, e.g. `2d20@14,3` or `2d6+1d20@3,5,14` */
  notation: string
  truncated: boolean
}

type DieEntry = {
  sides: number
  face: number
}

/**
 * Build predetermined dice-box-threejs notation from a finalized RollResult.
 * Uses a single `@` with comma-separated faces (library parses only the first `@`).
 * Includes dropped dice so advantage/disadvantage shows both d20s in 3D.
 */
export function rollResultToDiceBoxNotation(
  result: RollResult,
  maxDice = MAX_DICE_3D_COUNT,
): DiceBoxNotation {
  const entries = expandToEntries(result.dice)
  const limited = entries.slice(0, maxDice)
  const truncated = entries.length > maxDice

  return { notation: entriesToNotation(limited), truncated }
}

function expandToEntries(dice: DieRoll[]): DieEntry[] {
  const entries: DieEntry[] = []

  for (const die of dice) {
    if (die.sides === 100) {
      const { tens, ones } = percentileValues(die.value)
      entries.push({ sides: 10, face: percentileFace(tens) })
      entries.push({ sides: 10, face: percentileFace(ones) })
      continue
    }

    const sides = normalizeSides(die.sides)
    entries.push({ sides, face: faceValueForDie(sides, die.value) })
  }

  return entries
}

function entriesToNotation(entries: DieEntry[]): string {
  if (entries.length === 0) return ''

  const segments: { sides: number; faces: number[] }[] = []

  for (const entry of entries) {
    const last = segments[segments.length - 1]
    if (last && last.sides === entry.sides) {
      last.faces.push(entry.face)
    } else {
      segments.push({ sides: entry.sides, faces: [entry.face] })
    }
  }

  const dicePart = segments.map((s) => `${s.faces.length}d${s.sides}`).join('+')
  const faces = segments.flatMap((s) => s.faces)
  return `${dicePart}@${faces.join(',')}`
}

function percentileValues(value: number): { tens: number; ones: number } {
  const clamped = Math.max(0, Math.min(100, Math.floor(value)))
  if (clamped === 100) {
    return { tens: 0, ones: 0 }
  }
  return { tens: Math.floor(clamped / 10), ones: clamped % 10 }
}

/** Percentile d10 faces use 0–9 (0 on the tens die is 00). */
function percentileFace(digit: number): number {
  return Math.max(0, Math.min(9, Math.floor(digit)))
}

function faceValueForDie(sides: number, value: number): number {
  const v = Math.floor(value)
  if (sides === 10) {
    return v === 0 ? 10 : Math.max(1, Math.min(10, v))
  }
  return Math.max(1, Math.min(sides, v))
}

function normalizeSides(sides: number): number {
  if ([4, 6, 8, 10, 12, 20].includes(sides)) return sides
  if (sides === 100) return 10
  return 6
}
