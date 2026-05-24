import { conditions } from '../../rules/dnd5e/data'
import {
  setExhaustionLevel,
  toggleActiveCondition,
  type CharacterSheet,
} from '../../rules/dnd5e/character'
import { rulesReferenceHref } from '../../rules/dnd5e/data/rulesReference'
import { NumericInput } from '../NumericInput'

type CharacterConditionsPanelProps = {
  sheet: CharacterSheet
  onChange?: (sheet: CharacterSheet) => void
  disabled?: boolean
}

export function CharacterConditionsPanel({
  sheet,
  onChange,
  disabled = false,
}: CharacterConditionsPanelProps) {
  const editable = !!onChange && !disabled
  const activeSet = new Set(sheet.activeConditions)

  function openRulesEntry(entryId: string) {
    window.open(rulesReferenceHref(entryId), '_blank', 'noopener,noreferrer')
  }

  function handleConditionToggle(conditionId: string, next: boolean) {
    if (!onChange) return
    onChange(toggleActiveCondition(sheet, conditionId, next))
    if (next) {
      openRulesEntry(conditionId)
    }
  }

  return (
    <section className="character-conditions-panel">
      <div className="character-conditions-header">
        <h4>Conditions</h4>
        {editable ? (
          <a
            href={rulesReferenceHref()}
            target="_blank"
            rel="noopener noreferrer"
            className="character-conditions-rules-link"
          >
            Rules reference
          </a>
        ) : null}
      </div>

      {editable || sheet.exhaustionLevel > 0 ? (
        <div className="character-exhaustion-row">
          <label htmlFor="char-exhaustion-level">Exhaustion level</label>
          {editable ? (
            <NumericInput
              id="char-exhaustion-level"
              min={0}
              max={6}
              emptyFallback={0}
              value={sheet.exhaustionLevel}
              onChange={(level) => onChange!(setExhaustionLevel(sheet, level))}
              disabled={disabled}
            />
          ) : (
            <span>{sheet.exhaustionLevel}</span>
          )}
          <button
            type="button"
            className="character-conditions-info-btn"
            onClick={() => openRulesEntry('exhaustion-levels')}
            title="Open exhaustion rules"
          >
            ?
          </button>
        </div>
      ) : null}

      <div className="character-condition-chips" role="list" aria-label="Conditions">
        {conditions.map((condition) => {
          const active = activeSet.has(condition.id)
          if (!editable && !active) return null

          if (editable) {
            return (
              <label
                key={condition.id}
                className={`character-condition-chip${active ? ' character-condition-chip--active' : ''}`}
                role="listitem"
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => handleConditionToggle(condition.id, e.target.checked)}
                  disabled={disabled}
                />
                <span>{condition.name}</span>
              </label>
            )
          }

          return (
            <button
              key={condition.id}
              type="button"
              className="character-condition-chip character-condition-chip--active character-condition-chip--view"
              role="listitem"
              onClick={() => openRulesEntry(condition.id)}
            >
              {condition.name}
            </button>
          )
        })}
      </div>

      {!editable && sheet.activeConditions.length === 0 && sheet.exhaustionLevel === 0 ? (
        <p className="muted">No conditions.</p>
      ) : null}
    </section>
  )
}
