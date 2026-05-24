import { useMemo, useState } from 'react'
import {
  applyStartingEquipmentSelections,
  getStartingEquipmentPack,
  isStartingSelectionComplete,
  startingChoiceIds,
  startingEntryLabel,
  suggestAcFromEquipment,
  type CharacterSheet,
} from '../../rules/dnd5e/character'

type StartingEquipmentChooserProps = {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
}

export function StartingEquipmentChooser({
  sheet,
  onChange,
  disabled = false,
}: StartingEquipmentChooserProps) {
  const pack = sheet.className ? getStartingEquipmentPack(sheet.className) : null
  const choiceIds = useMemo(
    () => (sheet.className ? startingChoiceIds(sheet.className) : []),
    [sheet.className],
  )

  const [selections, setSelections] = useState<Record<string, string>>({})

  if (!pack || choiceIds.length === 0) {
    return null
  }

  const complete = isStartingSelectionComplete(sheet.className, selections)
  const currencyNote =
    pack.currency?.gp != null && pack.currency.gp > 0
      ? ` Includes ${pack.currency.gp} gp.`
      : ''

  function applyKit(replace: boolean) {
    let next = applyStartingEquipmentSelections(sheet, sheet.className, selections, replace)
    next = { ...next, ac: suggestAcFromEquipment(next) }
    onChange(next)
  }

  return (
    <div className="starting-equipment-chooser">
      <p className="muted">
        {pack.description}
        {currencyNote}
      </p>

      {pack.fixed && pack.fixed.length > 0 ? (
        <p className="muted starting-equipment-fixed">
          Always included: {pack.fixed.map((e) => startingEntryLabel(e)).join(', ')}
        </p>
      ) : null}

      <ol className="starting-equipment-choices">
        {pack.choices.map((choice) => (
          <li key={choice.id} className="starting-equipment-choice">
            <p className="starting-equipment-prompt">{choice.prompt}</p>
            <div className="starting-equipment-options" role="radiogroup" aria-label={choice.prompt}>
              {choice.options.map((option) => (
                <label key={option.id} className="starting-equipment-option">
                  <input
                    type="radio"
                    name={`start-${sheet.className}-${choice.id}`}
                    value={option.id}
                    checked={selections[choice.id] === option.id}
                    disabled={disabled}
                    onChange={() =>
                      setSelections((prev) => ({ ...prev, [choice.id]: option.id }))
                    }
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </li>
        ))}
      </ol>

      <div className="starting-equipment-actions">
        <button
          type="button"
          disabled={disabled || !complete}
          onClick={() => applyKit(false)}
        >
          Add selections to inventory
        </button>
        <button
          type="button"
          className="muted-button"
          disabled={disabled || !complete}
          onClick={() => applyKit(true)}
        >
          Replace inventory with selections
        </button>
      </div>
      {!complete ? (
        <p className="muted">Pick one option in each group above.</p>
      ) : null}
    </div>
  )
}
