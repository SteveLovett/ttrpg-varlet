import { describe, expect, it } from 'vitest'
import type { RollResult } from '../../rules/dnd5e/dice/types'
import { rollResultToDiceBoxNotation } from './rollToDiceBoxNotation'

function mockResult(dice: RollResult['dice']): RollResult {
  return {
    formula: 'test',
    dice,
    modifier: 0,
    total: dice.filter((d) => !d.dropped).reduce((s, d) => s + d.value, 0),
    breakdown: '',
  }
}

describe('rollResultToDiceBoxNotation', () => {
  it('builds predetermined notation for a single d20', () => {
    const { notation } = rollResultToDiceBoxNotation(
      mockResult([{ sides: 20, value: 14 }]),
    )
    expect(notation).toBe('1d20@14')
  })

  it('groups multiple d20 into one set with comma-separated faces', () => {
    const { notation } = rollResultToDiceBoxNotation(
      mockResult([
        { sides: 20, value: 14 },
        { sides: 20, value: 3 },
      ]),
    )
    expect(notation).toBe('2d20@14,3')
  })

  it('includes dropped dice so advantage shows both d20s', () => {
    const { notation } = rollResultToDiceBoxNotation(
      mockResult([
        { sides: 20, value: 18 },
        { sides: 20, value: 3, dropped: true },
      ]),
    )
    expect(notation).toBe('2d20@18,3')
  })

  it('splits d100 into a percentile d10 pair in one set', () => {
    const { notation } = rollResultToDiceBoxNotation(
      mockResult([{ sides: 100, value: 47 }]),
    )
    expect(notation).toBe('2d10@4,7')
  })

  it('supports mixed dice groups before a single @', () => {
    const { notation } = rollResultToDiceBoxNotation(
      mockResult([
        { sides: 6, value: 3 },
        { sides: 6, value: 5 },
        { sides: 20, value: 14 },
      ]),
    )
    expect(notation).toBe('2d6+1d20@3,5,14')
  })

  it('caps dice count', () => {
    const dice = Array.from({ length: 20 }, (_, i) => ({ sides: 6, value: (i % 6) + 1 }))
    const { notation, truncated } = rollResultToDiceBoxNotation(mockResult(dice), 12)
    expect(notation).toBe('12d6@1,2,3,4,5,6,1,2,3,4,5,6')
    expect(truncated).toBe(true)
  })
})
