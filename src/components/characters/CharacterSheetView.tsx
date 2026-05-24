import { useState } from 'react'
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  abilityModifier,
  classHasSpellcasting,
  displayInventoryItem,
  equippedWeaponAttacks,
  formatCurrencySummary,
  formatModifier,
  hasAnyCurrency,
  pactSlotSummary,
  proficiencyBonus,
  spellAttackBonus,
  spellcastingMode,
  spellcastingModeLabel,
  spellSaveDc,
  spellSlotsMax,
  suggestAcFromEquipment,
  totalInventoryWeightLb,
  carryingCapacityLb,
  usesPreparedList,
  usesKnownList,
  usesSpellbook,
  SKILL_DEFS,
  type CharacterSheet,
} from '../../rules/dnd5e/character'
import { getSpellBySlug } from '../../rules/dnd5e/data/spells'
import { SpellDetailDialog } from '../spells/SpellDetailDialog'
import { InventoryListDisclosure } from './InventoryListDisclosure'

type CharacterSheetViewProps = {
  sheet: CharacterSheet
  ownerLabel?: string | null
}

export function CharacterSheetView({ sheet, ownerLabel }: CharacterSheetViewProps) {
  const [detailSlug, setDetailSlug] = useState<string | null>(null)
  const prof = proficiencyBonus(sheet.level)
  const sc = sheet.spellcasting
  const showSpellcasting = classHasSpellcasting(sheet.className) && sc
  const detailSpell = detailSlug ? getSpellBySlug(detailSlug) : null
  const suggestedAc = suggestAcFromEquipment(sheet)
  const acDiffers = suggestedAc !== sheet.ac
  const weaponAttacks = equippedWeaponAttacks(sheet)
  const saveDc = showSpellcasting ? spellSaveDc(sheet) : null
  const spellAttack = showSpellcasting ? spellAttackBonus(sheet) : null
  const pactSummary = showSpellcasting ? pactSlotSummary(sheet.className, sheet.level) : null
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
              <dd>
                {sheet.ac}
                {acDiffers ? (
                  <span className="muted character-ac-suggested"> · suggested {suggestedAc}</span>
                ) : null}
              </dd>
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
            {weaponAttacks.length > 0 ? (
              <div className="character-weapon-attacks-view">
                <dt>Attacks</dt>
                <dd>
                  <ul>
                    {weaponAttacks.map((line) => (
                      <li key={line.itemId}>
                        {line.name} {line.attackBonus}, {line.damage}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ) : null}
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

        {showSpellcasting ? (
          <section className="character-sheet-block character-sheet-block--wide character-spellcasting-section">
            <h4>Spellcasting</h4>
            <p className="muted">
              {ABILITY_LABELS[sc.ability]}
              {spellcastingModeLabel(sheet.className)
                ? ` · ${spellcastingModeLabel(sheet.className)}`
                : ''}
              {saveDc != null && spellAttack != null
                ? ` · DC ${saveDc} · attack ${formatModifier(spellAttack)}`
                : ''}
            </p>
            {pactSummary ? <p className="muted">{pactSummary}</p> : null}

            {sc.cantripSlugs.length > 0 ? (
              <>
                <h5 className="character-spell-view-heading">Cantrips</h5>
                <SpellSlugList slugs={sc.cantripSlugs} onOpen={setDetailSlug} />
              </>
            ) : null}

            {usesSpellbook(sheet.className) && sc.spellbookSlugs.length > 0 ? (
              <>
                <h5 className="character-spell-view-heading">Spellbook</h5>
                <SpellSlugList slugs={sc.spellbookSlugs} onOpen={setDetailSlug} />
              </>
            ) : null}

            {usesPreparedList(sheet.className) && sc.preparedSlugs.length > 0 ? (
              <>
                <h5 className="character-spell-view-heading">Prepared</h5>
                <SpellSlugList slugs={sc.preparedSlugs} onOpen={setDetailSlug} />
              </>
            ) : null}

            {usesKnownList(sheet.className) && sc.knownSlugs.length > 0 ? (
              <>
                <h5 className="character-spell-view-heading">
                  {spellcastingMode(sheet.className) === 'pact' ? 'Pact spells' : 'Known'}
                </h5>
                <SpellSlugList slugs={sc.knownSlugs} onOpen={setDetailSlug} />
              </>
            ) : null}

            {sc.cantripSlugs.length === 0 &&
            sc.spellbookSlugs.length === 0 &&
            sc.preparedSlugs.length === 0 &&
            sc.knownSlugs.length === 0 ? (
              <p className="muted">No spells recorded.</p>
            ) : null}

            {(() => {
              const max = spellSlotsMax(sheet.className, sheet.level)
              const rows = max
                .map((m, i) => ({ level: i + 1, max: m, used: sc.slotsUsed[i + 1] ?? 0 }))
                .filter((r) => r.max > 0)
              if (rows.length === 0) return null
              return (
                <>
                  <h5 className="character-spell-view-heading">Slots used</h5>
                  <ul className="character-spell-slots-view">
                    {rows.map((r) => (
                      <li key={r.level}>
                        Level {r.level}: {r.used} / {r.max}
                      </li>
                    ))}
                  </ul>
                </>
              )
            })()}
          </section>
        ) : null}

        {showInventorySection ? (
          <section className="character-sheet-block character-sheet-block--wide character-inventory-section">
            <h4>Inventory</h4>

            {hasInventoryItems ? (
              <p className="muted character-inventory-weight">
                {totalInventoryWeightLb(sheet).toFixed(1)} lb carried ·{' '}
                {carryingCapacityLb(sheet)} lb capacity
              </p>
            ) : null}

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

      <SpellDetailDialog spell={detailSpell ?? null} onClose={() => setDetailSlug(null)} />
    </div>
  )
}

function SpellSlugList({
  slugs,
  onOpen,
}: {
  slugs: string[]
  onOpen: (slug: string) => void
}) {
  return (
    <ul className="character-spell-list character-spell-list--view">
      {slugs.map((slug) => {
        const spell = getSpellBySlug(slug)
        return (
          <li key={slug}>
            <button type="button" className="character-spell-name" onClick={() => onOpen(slug)}>
              {spell?.name ?? slug}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
