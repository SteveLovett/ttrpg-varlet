import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  characterOptions,
  SKILL_DEFS,
  suggestHpMax,
  type CharacterSheet,
} from '../../rules/dnd5e/character'

type CharacterSheetEditorProps = {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
}

export function CharacterSheetEditor({ sheet, onChange, disabled = false }: CharacterSheetEditorProps) {
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
            onChange={(e) => patch({ className: e.target.value })}
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
          <input
            id="edit-level"
            type="number"
            min={1}
            max={20}
            value={sheet.level}
            onChange={(e) => patch({ level: Number.parseInt(e.target.value, 10) || 1 })}
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
              <input
                id={`edit-ab-${key}`}
                type="number"
                min={3}
                max={20}
                value={sheet.abilities[key]}
                onChange={(e) => setAbility(key, Number.parseInt(e.target.value, 10) || 10)}
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
          <input
            id="edit-ac"
            type="number"
            min={1}
            max={40}
            value={sheet.ac}
            onChange={(e) => patch({ ac: Number.parseInt(e.target.value, 10) || 10 })}
            disabled={disabled}
          />
        </div>
        <div className="form-row">
          <label htmlFor="edit-hp-max">HP max</label>
          <input
            id="edit-hp-max"
            type="number"
            min={1}
            value={sheet.hpMax}
            onChange={(e) => patch({ hpMax: Number.parseInt(e.target.value, 10) || 1 })}
            disabled={disabled}
          />
        </div>
        <div className="form-row">
          <label htmlFor="edit-hp-cur">HP current</label>
          <input
            id="edit-hp-cur"
            type="number"
            min={0}
            value={sheet.hpCurrent}
            onChange={(e) => patch({ hpCurrent: Number.parseInt(e.target.value, 10) || 0 })}
            disabled={disabled}
          />
        </div>
        <div className="form-row">
          <label htmlFor="edit-speed">Speed (ft.)</label>
          <input
            id="edit-speed"
            type="number"
            min={0}
            value={sheet.speed}
            onChange={(e) => patch({ speed: Number.parseInt(e.target.value, 10) || 0 })}
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

      <div className="form-row">
        <label htmlFor="edit-inventory">Inventory</label>
        <textarea
          id="edit-inventory"
          value={sheet.inventory}
          onChange={(e) => patch({ inventory: e.target.value })}
          disabled={disabled}
          rows={3}
        />
      </div>
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
