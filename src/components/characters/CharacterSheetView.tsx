import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  abilityModifier,
  displayInventoryItem,
  formatCurrencySummary,
  formatModifier,
  hasAnyCurrency,
  proficiencyBonus,
  SKILL_DEFS,
  type CharacterSheet,
} from '../../rules/dnd5e/character'
import { InventoryListDisclosure } from './InventoryListDisclosure'

type CharacterSheetViewProps = {
  sheet: CharacterSheet
  ownerLabel?: string | null
}

export function CharacterSheetView({ sheet, ownerLabel }: CharacterSheetViewProps) {
  const prof = proficiencyBonus(sheet.level)
  const hasInventoryItems = sheet.inventoryItems.length > 0
  const hasAdditionalInventory = sheet.inventory.trim().length > 0
  const showInventorySection =
    hasInventoryItems ||
    hasAdditionalInventory ||
    hasAnyCurrency(sheet.currency)

  return (
    <div className="character-sheet">
      <header className="character-sheet-header">
        <h3>{sheet.name}</h3>
        <p className="character-sheet-subtitle muted">
          Level {sheet.level} {sheet.className}
          {sheet.species ? ` · ${sheet.species}` : ''}
          {ownerLabel ? ` · ${ownerLabel}` : ''}
        </p>
      </header>

      <div className="character-sheet-grid">
        <section className="character-sheet-block">
          <h4>Abilities</h4>
          <ul className="ability-scores">
            {ABILITY_KEYS.map((key) => {
              const score = sheet.abilities[key]
              const mod = abilityModifier(score)
              return (
                <li key={key}>
                  <span className="ability-label">{ABILITY_LABELS[key]}</span>
                  <span className="ability-score">{score}</span>
                  <span className="ability-mod">{formatModifier(mod)}</span>
                </li>
              )
            })}
          </ul>
          <p className="muted character-sheet-prof">Proficiency {formatModifier(prof)}</p>
        </section>

        <section className="character-sheet-block">
          <h4>Combat</h4>
          <dl className="character-stat-dl">
            <div>
              <dt>AC</dt>
              <dd>{sheet.ac}</dd>
            </div>
            <div>
              <dt>HP</dt>
              <dd>
                {sheet.hpCurrent} / {sheet.hpMax}
              </dd>
            </div>
            <div>
              <dt>Speed</dt>
              <dd>{sheet.speed} ft.</dd>
            </div>
          </dl>
        </section>

        <section className="character-sheet-block character-sheet-block--wide">
          <h4>Skills</h4>
          <ul className="character-skill-list">
            {SKILL_DEFS.map(({ key, label, ability }) => {
              if (!sheet.skills[key]) return null
              const mod =
                abilityModifier(sheet.abilities[ability]) +
                (sheet.skills[key] ? prof : 0)
              return (
                <li key={key}>
                  {label} {formatModifier(mod)}
                </li>
              )
            })}
          </ul>
          {SKILL_DEFS.every(({ key }) => !sheet.skills[key]) ? (
            <p className="muted">No proficient skills marked.</p>
          ) : null}
        </section>

        {showInventorySection ? (
          <section className="character-sheet-block character-sheet-block--wide character-inventory-section">
            <h4>Inventory</h4>

            {hasAnyCurrency(sheet.currency) ? (
              <p className="character-currency-summary">{formatCurrencySummary(sheet.currency)}</p>
            ) : (
              <p className="character-currency-summary muted">No coin carried</p>
            )}

            {hasInventoryItems || hasAdditionalInventory ? (
              <InventoryListDisclosure itemCount={sheet.inventoryItems.length}>
                {hasInventoryItems ? (
                  <ul className="character-inventory-view-list">
                    {sheet.inventoryItems.map((item) => (
                      <li key={item.id} className="character-inventory-view-row">
                        <span>{displayInventoryItem(item)}</span>
                        <span
                          className="character-inventory-view-qty"
                          aria-label={`Quantity: ${item.quantity}`}
                        >
                          ×{item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No catalog items.</p>
                )}

                {hasAdditionalInventory ? (
                  <div className="character-inventory-additional">
                    <h5 className="character-inventory-additional-label">Additional items</h5>
                    <pre className="character-sheet-pre">{sheet.inventory}</pre>
                  </div>
                ) : null}
              </InventoryListDisclosure>
            ) : (
              <p className="muted">No items recorded.</p>
            )}
          </section>
        ) : null}

        {sheet.notes.trim().length > 0 ? (
          <section className="character-sheet-block character-sheet-block--wide">
            <h4>Notes</h4>
            <pre className="character-sheet-pre">{sheet.notes}</pre>
          </section>
        ) : null}
      </div>
    </div>
  )
}
