import { useMemo, useState } from 'react'
import { isSpellOnClassList } from '../../rules/dnd5e/data/class-spell-lists'
import {
  formatSpellSummary,
  searchSpells,
  type SpellRef,
} from '../../rules/dnd5e/data/spells'

type SpellCatalogPickerProps = {
  open: boolean
  className: string
  characterLevel: number
  levelFilter?: number | ''
  onClose: () => void
  onAdd: (slug: string) => void
}

export function SpellCatalogPicker({
  open,
  className,
  characterLevel,
  levelFilter = '',
  onClose,
  onAdd,
}: SpellCatalogPickerProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const raw = searchSpells(query, { level: levelFilter }, 80)
    return raw.filter((spell) => {
      const spellLevel = spell.level ?? 0
      if (spellLevel > characterLevel) return false
      if (className) {
        return isSpellOnClassList(className, spell.slug, spellLevel)
      }
      return true
    })
  }, [query, levelFilter, className, characterLevel])

  if (!open) return null

  function handlePick(spell: SpellRef) {
    onAdd(spell.slug)
    onClose()
    setQuery('')
  }

  return (
    <div className="equipment-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="equipment-picker-dialog app-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spell-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="equipment-picker-header">
          <h3 id="spell-picker-title">Add spell</h3>
          <button type="button" className="equipment-picker-close" onClick={onClose}>
            Close
          </button>
        </header>

        <p className="muted">
          {className
            ? `Spells on the ${className} list up to level ${characterLevel}.`
            : 'Select a class on the sheet to filter by class list.'}
        </p>

        <div className="form-row">
          <label htmlFor="spell-picker-search">Search</label>
          <input
            id="spell-picker-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name…"
            autoFocus
            autoComplete="off"
          />
        </div>

        <ul className="equipment-picker-list">
          {results.map((spell) => (
            <li key={spell.slug}>
              <button
                type="button"
                className="equipment-picker-row"
                onClick={() => handlePick(spell)}
              >
                <span className="equipment-picker-row-name">{spell.name}</span>
                <span className="equipment-picker-row-meta muted">{formatSpellSummary(spell)}</span>
              </button>
            </li>
          ))}
        </ul>

        {results.length === 0 ? <p className="muted">No spells match.</p> : null}
      </div>
    </div>
  )
}
