import { useMemo, useState } from 'react'
import {
  formatEquipmentSummary,
  searchEquipment,
  type EquipmentKind,
  type EquipmentSearchResult,
} from '../../rules/dnd5e/data/equipment'
import { inventoryItemFromCatalog } from '../../rules/dnd5e/character'
import type { InventoryItem } from '../../rules/dnd5e/character'

type EquipmentCatalogPickerProps = {
  open: boolean
  onClose: () => void
  onAdd: (item: InventoryItem) => void
}

export function EquipmentCatalogPicker({ open, onClose, onAdd }: EquipmentCatalogPickerProps) {
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<EquipmentKind | ''>('')

  const results = useMemo(
    () => searchEquipment(query, kindFilter, 60),
    [query, kindFilter],
  )

  if (!open) return null

  function handlePick(result: EquipmentSearchResult) {
    const item = inventoryItemFromCatalog(result.kind, result.slug, 1)
    if (!item) return
    onAdd(item)
    onClose()
    setQuery('')
  }

  return (
    <div className="equipment-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="equipment-picker-dialog app-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-picker-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="equipment-picker-header">
          <h3 id="equipment-picker-title">Add from catalog</h3>
          <button type="button" className="equipment-picker-close" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="equipment-picker-filters">
          <div className="form-row">
            <label htmlFor="equipment-picker-search">Search</label>
            <input
              id="equipment-picker-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name…"
              autoFocus
              autoComplete="off"
            />
          </div>
          <div className="form-row">
            <label htmlFor="equipment-picker-kind">Type</label>
            <select
              id="equipment-picker-kind"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as EquipmentKind | '')}
            >
              <option value="">All</option>
              <option value="weapon">Weapons</option>
              <option value="armor">Armor</option>
              <option value="item">Items</option>
            </select>
          </div>
        </div>

        <ul className="equipment-picker-list">
          {results.map((r) => (
            <li key={`${r.kind}-${r.slug}`}>
              <button type="button" className="equipment-picker-row" onClick={() => handlePick(r)}>
                <span className="equipment-picker-row-name">{r.ref.name}</span>
                <span className="muted equipment-picker-row-meta">
                  {r.kind}
                  {' · '}
                  {formatEquipmentSummary(r)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {results.length === 0 ? <p className="muted">No matches. Try another search.</p> : null}
      </div>
    </div>
  )
}
