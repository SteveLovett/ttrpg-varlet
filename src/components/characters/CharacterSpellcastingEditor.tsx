import { useMemo, useState } from 'react'
import { NumericInput } from '../NumericInput'
import { SpellCatalogPicker } from '../spells/SpellCatalogPicker'
import { SpellDetailDialog } from '../spells/SpellDetailDialog'
import {
  ABILITY_KEYS,
  ABILITY_LABELS,
  addSpellToSpellcasting,
  classHasSpellcasting,
  ensureSpellcasting,
  longRestSpellcasting,
  maxCantripsKnown,
  maxSpellsKnown,
  maxSpellsPrepared,
  removeSpellFromSpellcasting,
  spellSlotsMax,
  usesKnownList,
  usesPreparedList,
  partitionSpellcastingIssues,
  validateSpellcasting,
  type CharacterSheet,
} from '../../rules/dnd5e/character'
import type { SpellcastingValidationMode } from '../../settings/validation'
import { getSpellBySlug } from '../../rules/dnd5e/data/spells'

type CharacterSpellcastingEditorProps = {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
  validationMode?: SpellcastingValidationMode
}

type PickerTarget = 'cantrip' | 'spell' | null

export function CharacterSpellcastingEditor({
  sheet,
  onChange,
  disabled = false,
  validationMode = 'warn',
}: CharacterSpellcastingEditorProps) {
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null)
  const [detailSlug, setDetailSlug] = useState<string | null>(null)

  const hasSpellcasting = classHasSpellcasting(sheet.className)
  const working = useMemo(
    () => (hasSpellcasting ? ensureSpellcasting(sheet) : sheet),
    [hasSpellcasting, sheet],
  )
  const { errors, warnings } = useMemo(() => {
    if (!hasSpellcasting) return { errors: [], warnings: [] }
    return partitionSpellcastingIssues(validateSpellcasting(working))
  }, [hasSpellcasting, working])
  const detailSpell = detailSlug ? getSpellBySlug(detailSlug) : null

  if (!hasSpellcasting || !working.spellcasting) {
    return null
  }

  const sc = working.spellcasting
  const className = sheet.className
  const level = sheet.level
  const abilityScore = working.abilities[sc.ability]

  const maxCantrips = maxCantripsKnown(className, level)
  const maxPrep = maxSpellsPrepared(className, level, abilityScore)
  const maxKnown = maxSpellsKnown(className, level)
  const slotMax = spellSlotsMax(className, level)
  const preparedMode = usesPreparedList(className)
  const knownMode = usesKnownList(className)

  function updateSpellcasting(patch: Partial<typeof sc>) {
    onChange({
      ...working,
      spellcasting: { ...sc, ...patch },
    })
  }

  function setAbility(key: (typeof ABILITY_KEYS)[number]) {
    updateSpellcasting({ ability: key })
  }

  function addSlug(slug: string) {
    onChange(addSpellToSpellcasting(working, slug))
  }

  function removeSlug(slug: string) {
    onChange(removeSpellFromSpellcasting(working, slug))
  }

  function setSlotUsed(slotLevel: number, used: number) {
    const next = { ...sc.slotsUsed }
    if (used <= 0) {
      delete next[slotLevel]
    } else {
      next[slotLevel] = used
    }
    updateSpellcasting({ slotsUsed: next })
  }

  function renderSpellList(slugs: string[], emptyLabel: string) {
    if (slugs.length === 0) {
      return <p className="muted">{emptyLabel}</p>
    }
    return (
      <ul className="character-spell-list">
        {slugs.map((slug) => {
          const spell = getSpellBySlug(slug)
          const name = spell?.name ?? slug
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
                </span>
              ) : null}
              <button
                type="button"
                className="character-spell-remove"
                disabled={disabled}
                onClick={() => removeSlug(slug)}
                aria-label={`Remove ${name}`}
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
    pickerTarget === 'cantrip' ? 0 : pickerTarget === 'spell' ? '' : ''

  return (
    <section className="character-spellcasting-section">
      <h4>Spellcasting</h4>

      <div className="character-editor-row">
        <div className="form-row">
          <label htmlFor="edit-spell-ability">Spellcasting ability</label>
          <select
            id="edit-spell-ability"
            value={sc.ability}
            onChange={(e) => setAbility(e.target.value as (typeof ABILITY_KEYS)[number])}
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
          <h5>
            Cantrips{' '}
            <span className="muted">
              ({sc.cantripSlugs.length}
              {maxCantrips > 0 ? ` / ${maxCantrips}` : ''})
            </span>
          </h5>
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

      {preparedMode ? (
        <div className="character-spell-block">
          <div className="character-spell-block-header">
            <h5>
              Prepared spells{' '}
              <span className="muted">
                ({sc.preparedSlugs.length} / {maxPrep})
              </span>
            </h5>
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
            <h5>
              Spells known{' '}
              <span className="muted">
                ({sc.knownSlugs.length}
                {maxKnown > 0 ? ` / ${maxKnown}` : ''})
              </span>
            </h5>
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

      {slotMax.some((n) => n > 0) ? (
        <div className="character-spell-block">
          <div className="character-spell-block-header">
            <h5>Spell slots</h5>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(longRestSpellcasting(working))}
            >
              Long rest (restore slots)
            </button>
          </div>
          <ul className="character-spell-slots">
            {slotMax.map((max, index) => {
              const slotLevel = index + 1
              if (max <= 0) return null
              const used = sc.slotsUsed[slotLevel] ?? 0
              return (
                <li key={slotLevel} className="character-spell-slot-row">
                  <span>Level {slotLevel}</span>
                  <NumericInput
                    min={0}
                    max={max}
                    emptyFallback={0}
                    value={used}
                    onChange={(v) => setSlotUsed(slotLevel, v)}
                    disabled={disabled}
                    aria-label={`Level ${slotLevel} slots used`}
                  />
                  <span className="muted">/ {max}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {errors.length > 0 || warnings.length > 0 ? (
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
      ) : null}

      <SpellCatalogPicker
        open={pickerTarget !== null}
        className={className}
        characterLevel={level}
        levelFilter={pickerLevelFilter}
        onClose={() => setPickerTarget(null)}
        onAdd={addSlug}
      />

      <SpellDetailDialog spell={detailSpell ?? null} onClose={() => setDetailSlug(null)} />
    </section>
  )
}
