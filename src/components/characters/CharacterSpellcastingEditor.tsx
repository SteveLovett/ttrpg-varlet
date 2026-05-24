import { useMemo, useState } from 'react'
import { NumericInput } from '../NumericInput'
import { SpellCatalogPicker } from '../spells/SpellCatalogPicker'
import { SpellDetailDialog } from '../spells/SpellDetailDialog'
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  addInventoryItem,
  addSpellToSpellcasting,
  casterClassNames,
  classLevelOnSheet,
  combinedSpellSlotsMax,
  ensureSpellcasting,
  formatModifier,
  getSheetClasses,
  getSpellcastingBlock,
  hasPactSlots,
  hasSharedCasterSlots,
  inventoryItemCustom,
  longRestSpellcasting,
  materialComponentInventoryName,
  maxCantripsKnown,
  maxSpellsKnown,
  maxSpellsPrepared,
  pactSlotSummary,
  pactSpellSlotsMax,
  partitionSpellcastingIssues,
  removeSpellFromSpellcasting,
  setPactSlotUsed,
  setSharedSlotUsed,
  setSpellcastingBlock,
  shortRestSpellcasting,
  spellAttackBonusForClass,
  spellcastingMode,
  spellSaveDcForClass,
  toggleSpellPrepared,
  usesKnownList,
  usesPreparedList,
  usesSpellbook,
  validateSpellcasting,
  type CharacterSheet,
  type CharacterSpellcasting,
} from '../../rules/dnd5e/character'
import type { SpellcastingValidationMode } from '../../settings/validation'
import { getSpellBySlug } from '../../rules/dnd5e/data/spells'

type CharacterSpellcastingEditorProps = {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
  validationMode?: SpellcastingValidationMode
}

type PickerTarget = 'cantrip' | 'spellbook' | 'spell' | null

function spellBadges(slug: string): string[] {
  const spell = getSpellBySlug(slug)
  if (!spell) return []
  const badges: string[] = []
  if (spell.ritual) badges.push('Ritual')
  if (spell.concentration) badges.push('Concentration')
  return badges
}

export function CharacterSpellcastingEditor(props: CharacterSpellcastingEditorProps) {
  const working = useMemo(() => ensureSpellcasting(props.sheet), [props.sheet])
  const casters = casterClassNames(working)
  const classes = getSheetClasses(working)
  const showShared = hasSharedCasterSlots(classes)
  const showPact = hasPactSlots(classes)
  const { errors, warnings } = useMemo(
    () => partitionSpellcastingIssues(validateSpellcasting(working)),
    [working],
  )

  if (casters.length === 0) return null

  return (
    <section className="character-spellcasting-section">
      <h4>Spellcasting</h4>

      {casters.map((casterClass) => (
        <CharacterClassSpellcastingBlock
          key={casterClass}
          casterClass={casterClass}
          sheet={working}
          onChange={props.onChange}
          disabled={props.disabled}
        />
      ))}

      {showShared ? (
        <SharedSpellSlotsBlock sheet={working} onChange={props.onChange} disabled={props.disabled} />
      ) : null}

      {showPact ? (
        <PactSpellSlotsBlock sheet={working} onChange={props.onChange} disabled={props.disabled} />
      ) : null}

      <div className="character-spell-rest-actions">
        {showPact ? (
          <button
            type="button"
            disabled={props.disabled}
            onClick={() => props.onChange(shortRestSpellcasting(working))}
          >
            Short rest (restore pact slots)
          </button>
        ) : null}
        <button
          type="button"
          disabled={props.disabled}
          onClick={() => props.onChange(longRestSpellcasting(working))}
        >
          Long rest (restore all slots)
        </button>
      </div>

      {errors.length > 0 || warnings.length > 0 ? (
        <SpellcastingWarnings
          errors={errors}
          warnings={warnings}
          validationMode={props.validationMode ?? 'warn'}
        />
      ) : null}
    </section>
  )
}

function CharacterClassSpellcastingBlock({
  casterClass,
  sheet,
  onChange,
  disabled,
}: {
  casterClass: string
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
}) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null)
  const [detailSlug, setDetailSlug] = useState<string | null>(null)

  const block = getSpellcastingBlock(sheet, casterClass)
  const detailSpell = detailSlug ? getSpellBySlug(detailSlug) : null
  if (!block) return null
  const sc = block

  const level = classLevelOnSheet(sheet, casterClass)
  const abilityScore = sheet.abilities[sc.ability]
  const wizardBook = usesSpellbook(casterClass)
  const isPact = spellcastingMode(casterClass) === 'pact'
  const multi = casterClassNames(sheet).length > 1

  const maxCantrips = maxCantripsKnown(casterClass, level)
  const maxPrep = maxSpellsPrepared(casterClass, level, abilityScore)
  const maxKnown = maxSpellsKnown(casterClass, level)
  const preparedMode = usesPreparedList(casterClass)
  const knownMode = usesKnownList(casterClass)
  const saveDc = spellSaveDcForClass(sheet, casterClass)
  const attackBonus = spellAttackBonusForClass(sheet, casterClass)
  const pactSummary = isPact ? pactSlotSummary(casterClass, level) : null

  function updateBlock(patch: Partial<CharacterSpellcasting>) {
    onChange(setSpellcastingBlock(sheet, casterClass, { ...sc, ...patch }))
  }

  function addSlug(slug: string) {
    onChange(addSpellToSpellcasting(sheet, slug, casterClass))
  }

  function removeSlug(slug: string) {
    onChange(removeSpellFromSpellcasting(sheet, slug, casterClass))
  }

  function trackMaterialFromSpell() {
    if (!detailSpell) return
    const name = materialComponentInventoryName(detailSpell)
    if (!name) return
    onChange(addInventoryItem(sheet, inventoryItemCustom(name)))
  }

  function renderSpellList(
    slugs: string[],
    emptyLabel: string,
    options?: { preparedToggle?: boolean },
  ) {
    if (slugs.length === 0) return <p className="muted">{emptyLabel}</p>
    return (
      <ul className="character-spell-list">
        {slugs.map((slug) => {
          const spell = getSpellBySlug(slug)
          const name = spell?.name ?? slug
          const badges = spellBadges(slug)
          const isPrepared = sc.preparedSlugs.includes(slug)
          return (
            <li key={slug} className="character-spell-row">
              <button
                type="button"
                className="character-spell-name"
                onClick={() => setDetailSlug(slug)}
              >
                {name}
              </button>
              {spell ? (
                <span className="muted character-spell-meta">
                  {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                  {spell.school ? ` · ${spell.school}` : ''}
                  {badges.length > 0 ? ` · ${badges.join(', ')}` : ''}
                </span>
              ) : null}
              {options?.preparedToggle ? (
                <button
                  type="button"
                  className="character-spell-prepare"
                  disabled={disabled || (!isPrepared && sc.preparedSlugs.length >= maxPrep)}
                  onClick={() => onChange(toggleSpellPrepared(sheet, slug, casterClass))}
                >
                  {isPrepared ? 'Unprepare' : 'Prepare'}
                </button>
              ) : null}
              <button
                type="button"
                className="character-spell-remove"
                disabled={disabled}
                onClick={() => removeSlug(slug)}
              >
                Remove
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  const pickerLevelFilter: number | '' =
    pickerTarget === 'cantrip' ? 0 : pickerTarget === 'spellbook' || pickerTarget === 'spell' ? '' : ''

  return (
    <div className="character-spell-class-block">
      <h5>
        {multi ? casterClass : 'Spells'}
        {spellcastingMode(casterClass) === 'pact' ? ' (pact magic)' : ''}
      </h5>

      {saveDc != null && attackBonus != null ? (
        <p className="character-spellcasting-stats muted">
          DC {saveDc} · attack {formatModifier(attackBonus)} · {ABILITY_LABELS[sc.ability]}
        </p>
      ) : null}
      {pactSummary ? <p className="muted character-pact-summary">{pactSummary}</p> : null}

      <div className="character-editor-row">
        <div className="form-row">
          <label htmlFor={`edit-spell-ability-${casterClass}`}>Spellcasting ability</label>
          <select
            id={`edit-spell-ability-${casterClass}`}
            value={sc.ability}
            onChange={(e) => updateBlock({ ability: e.target.value as (typeof ABILITY_KEYS)[number] })}
            disabled={disabled}
          >
            {ABILITY_KEYS.map((key) => (
              <option key={key} value={key}>
                {ABILITY_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="character-spell-block">
        <div className="character-spell-block-header">
          <h6>
            Cantrips ({sc.cantripSlugs.length}
            {maxCantrips > 0 ? ` / ${maxCantrips}` : ''})
          </h6>
          <button
            type="button"
            disabled={disabled || (maxCantrips > 0 && sc.cantripSlugs.length >= maxCantrips)}
            onClick={() => setPickerTarget('cantrip')}
          >
            Add cantrip
          </button>
        </div>
        {renderSpellList(sc.cantripSlugs, 'No cantrips added.')}
      </div>

      {wizardBook ? (
        <>
          <div className="character-spell-block">
            <div className="character-spell-block-header">
              <h6>Spellbook ({sc.spellbookSlugs.length})</h6>
              <button type="button" disabled={disabled} onClick={() => setPickerTarget('spellbook')}>
                Add to spellbook
              </button>
            </div>
            {renderSpellList(sc.spellbookSlugs, 'No spells in spellbook.', { preparedToggle: true })}
          </div>
          <div className="character-spell-block">
            <h6>
              Prepared ({sc.preparedSlugs.length} / {maxPrep})
            </h6>
            {sc.preparedSlugs.length === 0 ? (
              <p className="muted">Mark spells prepared from the spellbook.</p>
            ) : (
              renderSpellList(sc.preparedSlugs, '')
            )}
          </div>
        </>
      ) : null}

      {preparedMode && !wizardBook ? (
        <div className="character-spell-block">
          <div className="character-spell-block-header">
            <h6>
              Prepared ({sc.preparedSlugs.length} / {maxPrep})
            </h6>
            <button
              type="button"
              disabled={disabled || sc.preparedSlugs.length >= maxPrep}
              onClick={() => setPickerTarget('spell')}
            >
              Add prepared
            </button>
          </div>
          {renderSpellList(sc.preparedSlugs, 'No spells prepared.')}
        </div>
      ) : null}

      {knownMode ? (
        <div className="character-spell-block">
          <div className="character-spell-block-header">
            <h6>
              {isPact ? 'Pact spells' : 'Spells known'} ({sc.knownSlugs.length}
              {maxKnown > 0 ? ` / ${maxKnown}` : ''})
            </h6>
            <button
              type="button"
              disabled={disabled || (maxKnown > 0 && sc.knownSlugs.length >= maxKnown)}
              onClick={() => setPickerTarget('spell')}
            >
              Add spell
            </button>
          </div>
          {renderSpellList(sc.knownSlugs, 'No spells known.')}
        </div>
      ) : null}

      <SpellCatalogPicker
        open={pickerTarget !== null}
        className={casterClass}
        characterLevel={level}
        levelFilter={pickerLevelFilter}
        onClose={() => setPickerTarget(null)}
        onAdd={addSlug}
      />

      <SpellDetailDialog
        spell={detailSpell ?? null}
        onClose={() => setDetailSlug(null)}
        onTrackMaterial={
          detailSpell && materialComponentInventoryName(detailSpell)
            ? trackMaterialFromSpell
            : undefined
        }
      />
    </div>
  )
}

function SharedSpellSlotsBlock({
  sheet,
  onChange,
  disabled,
}: {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
}) {
  const slotMax = combinedSpellSlotsMax(getSheetClasses(sheet))
  if (!slotMax.some((n) => n > 0)) return null

  return (
    <div className="character-spell-block">
      <h5>Shared spell slots (multiclass)</h5>
      <ul className="character-spell-slots">
        {slotMax.map((max, index) => {
          const slotLevel = index + 1
          if (max <= 0) return null
          const used = sheet.spellSlotsUsed[slotLevel] ?? 0
          return (
            <li key={slotLevel} className="character-spell-slot-row">
              <span>Level {slotLevel}</span>
              <NumericInput
                min={0}
                max={max}
                emptyFallback={0}
                value={used}
                onChange={(v) => onChange(setSharedSlotUsed(sheet, slotLevel, v))}
                disabled={disabled}
              />
              <span className="muted">/ {max}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PactSpellSlotsBlock({
  sheet,
  onChange,
  disabled,
}: {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
}) {
  const slotMax = pactSpellSlotsMax(getSheetClasses(sheet))
  if (!slotMax.some((n) => n > 0)) return null

  return (
    <div className="character-spell-block">
      <h5>Pact spell slots</h5>
      <ul className="character-spell-slots">
        {slotMax.map((max, index) => {
          const slotLevel = index + 1
          if (max <= 0) return null
          const used = sheet.pactSlotsUsed[slotLevel] ?? 0
          return (
            <li key={slotLevel} className="character-spell-slot-row">
              <span>Level {slotLevel}</span>
              <NumericInput
                min={0}
                max={max}
                emptyFallback={0}
                value={used}
                onChange={(v) => onChange(setPactSlotUsed(sheet, slotLevel, v))}
                disabled={disabled}
              />
              <span className="muted">/ {max}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function SpellcastingWarnings({
  errors,
  warnings,
  validationMode,
}: {
  errors: { message: string }[]
  warnings: { message: string }[]
  validationMode: SpellcastingValidationMode
}) {
  return (
    <div className="character-spellcasting-warnings" role="status">
      {errors.length > 0 ? (
        <>
          <p className="character-spellcasting-warnings-title">
            {validationMode === 'block'
              ? 'Fix these before saving (blocking):'
              : 'Spellcasting errors (save allowed):'}
          </p>
          <ul>
            {errors.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        </>
      ) : null}
      {warnings.length > 0 ? (
        <>
          <p className="character-spellcasting-warnings-title">
            {errors.length > 0 ? 'Also note:' : 'Spellcasting notes:'}
          </p>
          <ul>
            {warnings.map((issue) => (
              <li key={issue.message}>{issue.message}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}
