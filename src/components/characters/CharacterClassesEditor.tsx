import { NumericInput } from '../NumericInput'
import { characterOptions } from '../../rules/dnd5e/character'
import {
  MAX_CHARACTER_LEVEL,
  classLevelsLabel,
  getSheetClasses,
  removeClassAt,
  setSheetClasses,
  totalClassLevels,
  updateClassLevelAt,
} from '../../rules/dnd5e/character/classes'
import type { CharacterSheet } from '../../rules/dnd5e/character'

type CharacterClassesEditorProps = {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
}

export function CharacterClassesEditor({
  sheet,
  onChange,
  disabled = false,
}: CharacterClassesEditorProps) {
  const classes = getSheetClasses(sheet)
  const total = totalClassLevels(classes)

  function addClass() {
    const first = characterOptions.classes[0]?.name
    if (!first || total >= MAX_CHARACTER_LEVEL) return
    onChange(setSheetClasses(sheet, [...classes, { className: first, level: 1 }]))
  }

  return (
    <fieldset className="character-fieldset character-classes-fieldset">
      <legend>Classes</legend>
      <p className="muted character-classes-summary">
        Total level {total} / {MAX_CHARACTER_LEVEL}
        {classes.length > 0 ? ` · ${classLevelsLabel(sheet)}` : ''}
      </p>

      {classes.length === 0 ? (
        <p className="muted">Add at least one class.</p>
      ) : (
        <ul className="character-classes-list">
          {classes.map((row, index) => (
            <li key={`${row.className}-${index}`} className="character-class-row">
              <div className="form-row">
                <label htmlFor={`class-name-${index}`}>Class</label>
                <select
                  id={`class-name-${index}`}
                  value={row.className}
                  disabled={disabled}
                  onChange={(e) =>
                    onChange(updateClassLevelAt(sheet, index, { className: e.target.value }))
                  }
                >
                  {characterOptions.classes.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <label htmlFor={`class-level-${index}`}>Levels in class</label>
                <NumericInput
                  id={`class-level-${index}`}
                  min={1}
                  max={MAX_CHARACTER_LEVEL}
                  emptyFallback={1}
                  value={row.level}
                  disabled={disabled}
                  onChange={(level) => onChange(updateClassLevelAt(sheet, index, { level }))}
                />
              </div>
              {classes.length > 1 ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(removeClassAt(sheet, index))}
                >
                  Remove class
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <button type="button" disabled={disabled || total >= MAX_CHARACTER_LEVEL} onClick={addClass}>
        Add class
      </button>
    </fieldset>
  )
}
