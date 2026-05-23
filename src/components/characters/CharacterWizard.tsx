import { useState } from 'react'
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  createEmptySheet,
  characterOptions,
  SKILL_DEFS,
  STANDARD_ARRAY,
  suggestHpMax,
  type AbilityKey,
  type CharacterSheet,
} from '../../rules/dnd5e/character'

const STEPS = ['Basics', 'Abilities', 'Skills', 'Review'] as const

type CharacterWizardProps = {
  onComplete: (name: string, sheet: CharacterSheet) => Promise<void>
  onCancel: () => void
}

type AssignMode = 'standard' | 'manual'

export function CharacterWizard({ onComplete, onCancel }: CharacterWizardProps) {
  const [step, setStep] = useState(0)
  const [sheet, setSheet] = useState<CharacterSheet>(() => createEmptySheet())
  const [assignMode, setAssignMode] = useState<AssignMode>('standard')
  const [standardSlots, setStandardSlots] = useState<Record<AbilityKey, number>>(() => {
    const slots = {} as Record<AbilityKey, number>
    ABILITY_KEYS.forEach((k, i) => {
      slots[k] = STANDARD_ARRAY[i] ?? 10
    })
    return slots
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function applyStandardToSheet() {
    setSheet((s) => ({
      ...s,
      abilities: { ...standardSlots },
    }))
  }

  async function handleFinish() {
    const trimmed = sheet.name.trim()
    if (trimmed.length < 1) {
      setError('Character name is required.')
      setStep(0)
      return
    }
    if (!sheet.className) {
      setError('Choose a class.')
      setStep(0)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const hpMax = suggestHpMax(sheet)
      const final: CharacterSheet = {
        ...sheet,
        name: trimmed,
        hpMax,
        hpCurrent: hpMax,
      }
      await onComplete(trimmed, final)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save character.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="character-wizard">
      <nav className="character-wizard-steps" aria-label="Wizard steps">
        {STEPS.map((label, i) => (
          <span key={label} className={i === step ? 'active' : i < step ? 'done' : ''}>
            {i + 1}. {label}
          </span>
        ))}
      </nav>

      {step === 0 ? (
        <div className="character-wizard-panel">
          <div className="form-row">
            <label htmlFor="wiz-name">Character name</label>
            <input
              id="wiz-name"
              type="text"
              value={sheet.name}
              onChange={(e) => setSheet((s) => ({ ...s, name: e.target.value }))}
              autoFocus
              maxLength={128}
            />
          </div>
          <div className="character-editor-row">
            <div className="form-row">
              <label htmlFor="wiz-species">Species</label>
              <select
                id="wiz-species"
                value={sheet.species}
                onChange={(e) => setSheet((s) => ({ ...s, species: e.target.value }))}
              >
                <option value="">— Select —</option>
                {characterOptions.species.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="wiz-class">Class</label>
              <select
                id="wiz-class"
                value={sheet.className}
                onChange={(e) => setSheet((s) => ({ ...s, className: e.target.value }))}
              >
                <option value="">— Select —</option>
                {characterOptions.classes.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} (d{c.hitDie})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="wiz-level">Level</label>
              <input
                id="wiz-level"
                type="number"
                min={1}
                max={20}
                value={sheet.level}
                onChange={(e) =>
                  setSheet((s) => ({ ...s, level: Number.parseInt(e.target.value, 10) || 1 }))
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="character-wizard-panel">
          <div className="character-assign-mode">
            <label>
              <input
                type="radio"
                name="assign-mode"
                checked={assignMode === 'standard'}
                onChange={() => setAssignMode('standard')}
              />
              Standard array (15, 14, 13, 12, 10, 8)
            </label>
            <label>
              <input
                type="radio"
                name="assign-mode"
                checked={assignMode === 'manual'}
                onChange={() => setAssignMode('manual')}
              />
              Manual entry
            </label>
          </div>
          {assignMode === 'standard' ? (
            <div className="standard-array-grid">
              {ABILITY_KEYS.map((key) => (
                <div key={key} className="form-row">
                  <label htmlFor={`std-${key}`}>{ABILITY_LABELS[key]}</label>
                  <select
                    id={`std-${key}`}
                    value={standardSlots[key]}
                    onChange={(e) => {
                      const v = Number.parseInt(e.target.value, 10)
                      setStandardSlots((slots) => ({ ...slots, [key]: v }))
                    }}
                  >
                    {STANDARD_ARRAY.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <div className="ability-editor-grid">
              {ABILITY_KEYS.map((key) => (
                <div key={key} className="form-row">
                  <label htmlFor={`man-${key}`}>{ABILITY_LABELS[key]}</label>
                  <input
                    id={`man-${key}`}
                    type="number"
                    min={3}
                    max={20}
                    value={sheet.abilities[key]}
                    onChange={(e) =>
                      setSheet((s) => ({
                        ...s,
                        abilities: {
                          ...s.abilities,
                          [key]: Number.parseInt(e.target.value, 10) || 10,
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="character-wizard-panel">
          <p className="muted">Mark skills your character is proficient in.</p>
          <div className="skill-editor-grid">
            {SKILL_DEFS.map(({ key, label }) => (
              <label key={key} className="skill-check-label">
                <input
                  type="checkbox"
                  checked={!!sheet.skills[key]}
                  onChange={(e) =>
                    setSheet((s) => ({
                      ...s,
                      skills: { ...s.skills, [key]: e.target.checked },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="character-wizard-panel">
          <p className="muted">Review your character, then save to this campaign.</p>
          <dl className="character-review-dl">
            <div>
              <dt>Name</dt>
              <dd>{sheet.name || '—'}</dd>
            </div>
            <div>
              <dt>Build</dt>
              <dd>
                Level {sheet.level} {sheet.className || '?'}
                {sheet.species ? ` · ${sheet.species}` : ''}
              </dd>
            </div>
            <div>
              <dt>HP (suggested)</dt>
              <dd>{suggestHpMax(sheet)}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {error ? <p className="dice-tray-error">{error}</p> : null}

      <div className="character-wizard-actions">
        <button type="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={saving}
          >
            Back
          </button>
        ) : null}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              if (step === 1 && assignMode === 'standard') {
                applyStandardToSheet()
              }
              setStep((s) => s + 1)
            }}
            disabled={saving}
          >
            Next
          </button>
        ) : (
          <button type="button" onClick={() => void handleFinish()} disabled={saving}>
            {saving ? 'Saving…' : 'Save character'}
          </button>
        )}
      </div>
    </div>
  )
}
