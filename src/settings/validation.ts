export const SPELLCASTING_VALIDATION_MODES = ['warn', 'block'] as const
export type SpellcastingValidationMode = (typeof SPELLCASTING_VALIDATION_MODES)[number]

export const GAME_SPELLCASTING_POLICIES = ['inherit', 'warn', 'block'] as const
export type GameSpellcastingPolicy = (typeof GAME_SPELLCASTING_POLICIES)[number]

export const DEFAULT_SPELLCASTING_VALIDATION_MODE: SpellcastingValidationMode = 'warn'
export const DEFAULT_GAME_SPELLCASTING_POLICY: GameSpellcastingPolicy = 'inherit'

export type GameSettings = {
  spellcastingValidation?: GameSpellcastingPolicy
}

export function parseSpellcastingValidationMode(raw: unknown): SpellcastingValidationMode {
  return raw === 'block' ? 'block' : DEFAULT_SPELLCASTING_VALIDATION_MODE
}

export function parseGameSpellcastingPolicy(raw: unknown): GameSpellcastingPolicy {
  if (raw === 'warn' || raw === 'block' || raw === 'inherit') return raw
  return DEFAULT_GAME_SPELLCASTING_POLICY
}

export function parseGameSettings(raw: unknown): GameSettings {
  if (!raw || typeof raw !== 'object') return {}
  const o = raw as Record<string, unknown>
  const policy = o.spellcastingValidation
  if (policy === undefined) return {}
  return { spellcastingValidation: parseGameSpellcastingPolicy(policy) }
}

export function resolveSpellcastingValidationMode(
  userMode: SpellcastingValidationMode | undefined,
  gamePolicy: GameSpellcastingPolicy | undefined,
): SpellcastingValidationMode {
  const policy = gamePolicy ?? DEFAULT_GAME_SPELLCASTING_POLICY
  if (policy === 'warn' || policy === 'block') return policy
  return userMode ?? DEFAULT_SPELLCASTING_VALIDATION_MODE
}
