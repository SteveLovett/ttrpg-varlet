import { describe, expect, it } from 'vitest'
import {
  parseGameSettings,
  parseSpellcastingValidationMode,
  resolveSpellcastingValidationMode,
} from './validation'

describe('resolveSpellcastingValidationMode', () => {
  it('uses user mode when game policy is inherit', () => {
    expect(resolveSpellcastingValidationMode('block', 'inherit')).toBe('block')
    expect(resolveSpellcastingValidationMode('warn', 'inherit')).toBe('warn')
  })

  it('overrides user mode when game policy is warn or block', () => {
    expect(resolveSpellcastingValidationMode('block', 'warn')).toBe('warn')
    expect(resolveSpellcastingValidationMode('warn', 'block')).toBe('block')
  })

  it('defaults to warn when user mode is undefined', () => {
    expect(resolveSpellcastingValidationMode(undefined, 'inherit')).toBe('warn')
  })
})

describe('parseGameSettings', () => {
  it('parses spellcastingValidation policy', () => {
    expect(parseGameSettings({ spellcastingValidation: 'block' })).toEqual({
      spellcastingValidation: 'block',
    })
  })

  it('returns empty object for invalid input', () => {
    expect(parseGameSettings(null)).toEqual({})
  })
})

describe('parseSpellcastingValidationMode', () => {
  it('only block is strict', () => {
    expect(parseSpellcastingValidationMode('block')).toBe('block')
    expect(parseSpellcastingValidationMode('warn')).toBe('warn')
    expect(parseSpellcastingValidationMode('inherit')).toBe('warn')
  })
})
