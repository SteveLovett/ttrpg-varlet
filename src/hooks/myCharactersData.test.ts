import { describe, expect, it } from 'vitest'
import { createEmptySheet } from '../rules/dnd5e/character'
import {
  buildMyCharacterRows,
  resolveValidationModeForCharacter,
} from './myCharactersData'

describe('buildMyCharacterRows', () => {
  it('resolves per-character validation from game settings', () => {
    const sheet = createEmptySheet('Ada')
    const rows = buildMyCharacterRows(
      [
        {
          id: 'c1',
          name: 'Ada',
          game_id: 'g1',
          sheet_json: sheet,
          updated_at: '2026-01-01',
        },
        {
          id: 'c2',
          name: 'Bob',
          game_id: null,
          sheet_json: sheet,
          updated_at: '2026-01-01',
        },
      ],
      [{ id: 'g1', name: 'Campaign', settings: { spellcastingValidation: 'block' } }],
      'warn',
    )

    expect(rows).toHaveLength(2)
    expect(rows[0]?.spellcastingValidationMode).toBe('block')
    expect(rows[1]?.spellcastingValidationMode).toBe('warn')
    expect(rows[0]?.game_name).toBe('Campaign')
  })
})

describe('resolveValidationModeForCharacter', () => {
  it('looks up game policy by id', () => {
    const policies = new Map([['g1', 'block' as const]])
    expect(resolveValidationModeForCharacter('warn', 'g1', policies)).toBe('block')
    expect(resolveValidationModeForCharacter('warn', null, policies)).toBe('warn')
  })
})
