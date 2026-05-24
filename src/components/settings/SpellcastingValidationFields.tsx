import {
  GAME_SPELLCASTING_POLICIES,
  SPELLCASTING_VALIDATION_MODES,
  type GameSpellcastingPolicy,
  type SpellcastingValidationMode,
} from '../../settings/validation'

const USER_LABELS: Record<SpellcastingValidationMode, string> = {
  warn: 'Warn only — show issues but always allow save',
  block: 'Block save — prevent saving until errors are fixed',
}

const GAME_LABELS: Record<GameSpellcastingPolicy, string> = {
  inherit: 'Use each player’s setting (default)',
  warn: 'Warn only — for all players in this game',
  block: 'Block save — for all players in this game',
}

type UserSpellcastingValidationFieldProps = {
  id: string
  value: SpellcastingValidationMode
  disabled?: boolean
  onChange: (mode: SpellcastingValidationMode) => void
}

export function UserSpellcastingValidationField({
  id,
  value,
  disabled,
  onChange,
}: UserSpellcastingValidationFieldProps) {
  return (
    <div className="form-row settings-validation-row">
      <label htmlFor={id}>Spellcasting validation</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as SpellcastingValidationMode)}
      >
        {SPELLCASTING_VALIDATION_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {USER_LABELS[mode]}
          </option>
        ))}
      </select>
      <p className="muted settings-validation-hint">
        Applies when a campaign uses “each player’s setting.” Class-list mismatches are always
        warnings; over limits and invalid slots block only when blocking is enabled.
      </p>
    </div>
  )
}

type GameSpellcastingValidationFieldProps = {
  id: string
  value: GameSpellcastingPolicy
  disabled?: boolean
  onChange: (policy: GameSpellcastingPolicy) => void
}

export function GameSpellcastingValidationField({
  id,
  value,
  disabled,
  onChange,
}: GameSpellcastingValidationFieldProps) {
  return (
    <div className="form-row settings-validation-row">
      <label htmlFor={id}>Spellcasting validation (campaign)</label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as GameSpellcastingPolicy)}
      >
        {GAME_SPELLCASTING_POLICIES.map((policy) => (
          <option key={policy} value={policy}>
            {GAME_LABELS[policy]}
          </option>
        ))}
      </select>
      <p className="muted settings-validation-hint">
        Overrides personal settings for characters saved in this game.
      </p>
    </div>
  )
}
