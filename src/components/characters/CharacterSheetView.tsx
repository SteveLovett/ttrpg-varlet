import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  abilityModifier,
  formatModifier,
  proficiencyBonus,
  SKILL_DEFS,
  type CharacterSheet,
} from '../../rules/dnd5e/character'

type CharacterSheetViewProps = {
  sheet: CharacterSheet
  ownerLabel?: string | null
}

export function CharacterSheetView({ sheet, ownerLabel }: CharacterSheetViewProps) {
  const prof = proficiencyBonus(sheet.level)

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

        {sheet.inventory.trim().length > 0 ? (
          <section className="character-sheet-block character-sheet-block--wide">
            <h4>Inventory</h4>
            <pre className="character-sheet-pre">{sheet.inventory}</pre>
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
