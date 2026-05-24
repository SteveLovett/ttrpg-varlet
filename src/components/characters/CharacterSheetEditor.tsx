import { NumericInput } from '../NumericInput'
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  characterOptions,
  classHasSpellcasting,
  createDefaultSpellcasting,
  normalizeInventoryIds,
  SKILL_DEFS,
  suggestHpMax,
  type CharacterSheet,
  type CharacterSpellcasting,
} from '../../rules/dnd5e/character'
import type { SpellcastingValidationMode } from '../../settings/validation'
import { CharacterInventoryEditor } from './CharacterInventoryEditor'
import { CharacterSpellcastingEditor } from './CharacterSpellcastingEditor'

type CharacterSheetEditorProps = {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
  spellcastingValidationMode?: SpellcastingValidationMode
}

export function CharacterSheetEditor({
  sheet,
  onChange,
  disabled = false,
  spellcastingValidationMode = 'warn',
}: CharacterSheetEditorProps) {
  function patch(partial: Partial<CharacterSheet>) {
    onChange({ ...sheet, ...partial })
  }

  function setAbility(key: (typeof ABILITY_KEYS)[number], value: number) {
    onChange({
      ...sheet,
      abilities: { ...sheet.abilities, [key]: value },
    })
  }

  function toggleSkill(key: (typeof SKILL_DEFS)[number]['key'], on: boolean) {
    onChange({
      ...sheet,
      skills: { ...sheet.skills, [key]: on },
    })
  }

  return (
    <div className="character-sheet-editor">
      <div className="form-row">
        <label htmlFor="edit-char-name">Character name</label>
        <input
          id="edit-char-name"
          type="text"
          value={sheet.name}
          onChange={(e) => patch({ name: e.target.value })}
          disabled={disabled}
          maxLength={128}
          required
        />
      </div>

      <div className="character-editor-row">
        <div className="form-row">
          <label htmlFor="edit-species">Species</label>
          <select
            id="edit-species"
            value={sheet.species}
            onChange={(e) => patch({ species: e.target.value })}
            disabled={disabled}
          >
            <option value="">— Select —</option>
            {characterOptions.species.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="edit-class">Class</label>
          <select
            id="edit-class"
            value={sheet.className}
            onChange={(e) => {
              const className = e.target.value
              if (className === sheet.className) return

              const hadSpells = spellListCount(sheet.spellcasting)
              if (
                hadSpells > 0 &&
                !window.confirm(
                  'Changing class will clear this character’s spell selections. Continue?',
                )
              ) {
                return
              }

              let next: CharacterSheet = { ...sheet, className, spellcasting: null }
              if (classHasSpellcasting(className)) {
                next = {
                  ...next,
                  spellcasting: createDefaultSpellcasting(next),
                }
              }
              onChange(next)
            }}
            disabled={disabled}
          >
            <option value="">— Select —</option>
            {characterOptions.classes.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="edit-level">Level</label>
          <NumericInput
            id="edit-level"
            min={1}
            max={20}
            emptyFallback={1}
            value={sheet.level}
            onChange={(level) => patch({ level })}
            disabled={disabled}
          />
        </div>
      </div>

      <fieldset className="character-fieldset">
        <legend>Abilities</legend>
        <div className="ability-editor-grid">
          {ABILITY_KEYS.map((key) => (
            <div key={key} className="form-row">
              <label htmlFor={`edit-ab-${key}`}>{ABILITY_LABELS[key]}</label>
              <NumericInput
                id={`edit-ab-${key}`}
                min={3}
                max={20}
                emptyFallback={10}
                value={sheet.abilities[key]}
                onChange={(value) => setAbility(key, value)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="character-fieldset">
        <legend>Proficient skills</legend>
        <div className="skill-editor-grid">
          {SKILL_DEFS.map(({ key, label }) => (
            <label key={key} className="skill-check-label">
              <input
                type="checkbox"
                checked={!!sheet.skills[key]}
                onChange={(e) => toggleSkill(key, e.target.checked)}
                disabled={disabled}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="character-editor-row">
        <div className="form-row">
          <label htmlFor="edit-ac">AC</label>
          <NumericInput
            id="edit-ac"
            min={1}
            max={40}
            emptyFallback={10}
            value={sheet.ac}
            onChange={(ac) => patch({ ac })}
            disabled={disabled}
          />
        </div>
        <div className="form-row">
          <label htmlFor="edit-hp-max">HP max</label>
          <NumericInput
            id="edit-hp-max"
            min={1}
            emptyFallback={1}
            value={sheet.hpMax}
            onChange={(hpMax) => patch({ hpMax })}
            disabled={disabled}
          />
        </div>
        <div className="form-row">
          <label htmlFor="edit-hp-cur">HP current</label>
          <NumericInput
            id="edit-hp-cur"
            min={0}
            emptyFallback={0}
            value={sheet.hpCurrent}
            onChange={(hpCurrent) => patch({ hpCurrent })}
            disabled={disabled}
          />
        </div>
        <div className="form-row">
          <label htmlFor="edit-speed">Speed (ft.)</label>
          <NumericInput
            id="edit-speed"
            min={0}
            emptyFallback={0}
            value={sheet.speed}
            onChange={(speed) => patch({ speed })}
            disabled={disabled}
          />
        </div>
      </div>
      <button
        type="button"
        className="character-suggest-hp"
        disabled={disabled || !sheet.className}
        onClick={() => {
          const hpMax = suggestHpMax(sheet)
          patch({ hpMax, hpCurrent: Math.min(sheet.hpCurrent, hpMax) || hpMax })
        }}
      >
        Suggest HP from class &amp; CON
      </button>

      <CharacterSpellcastingEditor
        sheet={sheet}
        onChange={onChange}
        disabled={disabled}
        validationMode={spellcastingValidationMode}
      />

      <section className="character-inventory-section">
        <h4>Inventory</h4>
        <CharacterInventoryEditor
          sheet={normalizeInventoryIds(sheet)}
          onChange={onChange}
          disabled={disabled}
        />
      </section>
      <div className="form-row">
        <label htmlFor="edit-notes">Notes</label>
        <textarea
          id="edit-notes"
          value={sheet.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          disabled={disabled}
          rows={4}
        />
      </div>
    </div>
  )
}

function spellListCount(sc: CharacterSpellcasting | null): number {
  if (!sc) return 0
  return sc.cantripSlugs.length + sc.knownSlugs.length + sc.preparedSlugs.length
}
