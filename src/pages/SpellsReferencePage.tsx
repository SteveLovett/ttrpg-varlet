import { useMemo, useState } from 'react'
import { AppBreadcrumbs } from '../components/AppBreadcrumbs'
import { AddSpellToCharacterDialog } from '../components/characters/AddSpellToCharacterDialog'
import { TrackMaterialToCharacterDialog } from '../components/characters/TrackMaterialToCharacterDialog'
import { SpellDetailDialog } from '../components/spells/SpellDetailDialog'
import { useMyCharacters } from '../hooks/useMyCharacters'
import {
  formatSpellSummary,
  type SpellRef,
  groupSpellsByLevel,
  listSpellSchools,
  searchSpells,
  SPELL_LEVELS,
  spellLevelLabel,
  spells,
} from '../rules/dnd5e/data/spells'
import { materialComponentInventoryName } from '../rules/dnd5e/character'

const FLAT_LIST_CAP = 120

export function SpellsReferencePage() {
  const { characters, loading, error, addSpellToCharacter, addMaterialToCharacter } =
    useMyCharacters({ loadOnMount: true })
  const [query, setQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<number | ''>('')
  const [schoolFilter, setSchoolFilter] = useState('')
  const [selected, setSelected] = useState<SpellRef | null>(null)
  const [addTarget, setAddTarget] = useState<SpellRef | null>(null)
  const [materialTarget, setMaterialTarget] = useState<SpellRef | null>(null)

  const schools = useMemo(() => listSpellSchools(), [])

  const filtered = useMemo(
    () => searchSpells(query, { level: levelFilter, school: schoolFilter }, 500),
    [query, levelFilter, schoolFilter],
  )

  const grouped = useMemo(() => groupSpellsByLevel(filtered), [filtered])
  const useGrouped = levelFilter === ''

  const matchCount = filtered.length
  const flatList = filtered.slice(0, FLAT_LIST_CAP)

  function renderSpellRow(spell: SpellRef) {
    return (
      <li key={spell.slug} className="bestiary-item spell-list-item">
        <button type="button" className="spell-list-button" onClick={() => setSelected(spell)}>
          <strong>{spell.name}</strong>
          <span className="muted">{formatSpellSummary(spell)}</span>
        </button>
        <button
          type="button"
          className="equipment-add-to-char"
          onClick={(e) => {
            e.stopPropagation()
            setAddTarget(spell)
          }}
        >
          Add to character
        </button>
      </li>
    )
  }

  return (
    <div className="app-panel app-panel-wide">
      <AppBreadcrumbs
        items={[
          { label: 'Games', to: '/app' },
          { label: 'Tools', to: '/app/tools' },
          { label: 'Spells' },
        ]}
      />
      <h2>Spells</h2>
      <p className="muted">
        SRD 2024 spell compendium from Open5e ({spells.length} spells). Browse by level, school,
        or search by name.
      </p>

      <div className="bestiary-filters spell-filters">
        <div className="form-row">
          <label htmlFor="spell-search">Search</label>
          <input
            id="spell-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or text…"
            autoComplete="off"
          />
        </div>
        <div className="form-row">
          <label htmlFor="spell-level">Level</label>
          <select
            id="spell-level"
            value={levelFilter === '' ? '' : String(levelFilter)}
            onChange={(e) => {
              const v = e.target.value
              setLevelFilter(v === '' ? '' : Number.parseInt(v, 10))
            }}
          >
            <option value="">All levels</option>
            <option value="0">Cantrips</option>
            {SPELL_LEVELS.filter((l) => l > 0).map((level) => (
              <option key={level} value={level}>
                Level {level}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="spell-school">School</label>
          <select
            id="spell-school"
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
          >
            <option value="">All schools</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="muted">
        {matchCount === spells.length
          ? `${spells.length} spells`
          : `${matchCount} of ${spells.length} spells`}
        {!useGrouped && matchCount > FLAT_LIST_CAP
          ? ` (showing first ${FLAT_LIST_CAP})`
          : ''}
      </p>

      {useGrouped ? (
        <div className="spell-level-sections">
          {SPELL_LEVELS.map((level) => {
            const list = grouped.get(level) ?? []
            if (list.length === 0) return null
            return (
              <section key={level} className="spell-level-section">
                <h3 className="spell-level-heading">
                  {spellLevelLabel(level)}{' '}
                  <span className="muted">({list.length})</span>
                </h3>
                <ul className="bestiary-list spell-list">{list.map(renderSpellRow)}</ul>
              </section>
            )
          })}
        </div>
      ) : (
        <ul className="bestiary-list spell-list">{flatList.map(renderSpellRow)}</ul>
      )}

      {!useGrouped && matchCount > FLAT_LIST_CAP ? (
        <p className="muted">Narrow your search to see more than {FLAT_LIST_CAP} results.</p>
      ) : null}

      {matchCount === 0 ? <p className="muted">No spells match your filters.</p> : null}

      {error ? <p className="dice-tray-error">{error}</p> : null}

      <SpellDetailDialog
        spell={selected}
        onClose={() => setSelected(null)}
        onTrackMaterial={
          selected && materialComponentInventoryName(selected)
            ? () => setMaterialTarget(selected)
            : undefined
        }
      />

      {materialTarget && materialComponentInventoryName(materialTarget) ? (
        <TrackMaterialToCharacterDialog
          open
          spellName={materialTarget.name}
          materialLabel={materialComponentInventoryName(materialTarget)!}
          characters={characters}
          loading={loading}
          onClose={() => setMaterialTarget(null)}
          onAdd={(characterId) =>
            addMaterialToCharacter(characterId, materialComponentInventoryName(materialTarget)!)
          }
        />
      ) : null}

      {addTarget ? (
        <AddSpellToCharacterDialog
          open
          spellName={addTarget.name}
          characters={characters}
          loading={loading}
          onClose={() => setAddTarget(null)}
          onAdd={(characterId) => addSpellToCharacter(characterId, addTarget.slug)}
        />
      ) : null}
    </div>
  )
}
