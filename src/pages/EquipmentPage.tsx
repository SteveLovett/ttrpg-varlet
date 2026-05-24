import { useEffect, useMemo, useState } from 'react'
import { AppBreadcrumbs } from '../components/AppBreadcrumbs'
import { AddEquipmentToCharacterDialog } from '../components/characters/AddEquipmentToCharacterDialog'
import { useMyCharacters } from '../hooks/useMyCharacters'
import { inventoryItemFromCatalog } from '../rules/dnd5e/character'
import { armor } from '../rules/dnd5e/data/armor'
import {
  formatEquipmentSummary,
  type EquipmentKind,
} from '../rules/dnd5e/data/equipment'
import { items } from '../rules/dnd5e/data/items'
import { weapons } from '../rules/dnd5e/data/weapons'

const TOTAL = weapons.length + armor.length + items.length

type AddTarget = {
  kind: EquipmentKind
  slug: string
  name: string
}

export function EquipmentPage() {
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<EquipmentKind | ''>('')
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null)
  const { characters, loading, error, reload, addItemToCharacter } = useMyCharacters()

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const match = (name: string, slug: string) =>
      !q || name.toLowerCase().includes(q) || slug.toLowerCase().includes(q)

    const rows: { key: string; kind: EquipmentKind; name: string; meta: string }[] = []

    if (!kindFilter || kindFilter === 'weapon') {
      for (const w of weapons) {
        if (!match(w.name, w.slug)) continue
        rows.push({
          key: w.slug,
          kind: 'weapon',
          name: w.name,
          meta: formatEquipmentSummary({ kind: 'weapon', ref: w }),
        })
      }
    }
    if (!kindFilter || kindFilter === 'armor') {
      for (const a of armor) {
        if (!match(a.name, a.slug)) continue
        rows.push({
          key: a.slug,
          kind: 'armor',
          name: a.name,
          meta: formatEquipmentSummary({ kind: 'armor', ref: a }),
        })
      }
    }
    if (!kindFilter || kindFilter === 'item') {
      for (const i of items) {
        if (!match(i.name, i.slug)) continue
        rows.push({
          key: i.slug,
          kind: 'item',
          name: i.name,
          meta: formatEquipmentSummary({ kind: 'item', ref: i }),
        })
      }
    }

    rows.sort((a, b) => a.name.localeCompare(b.name))
    return rows
  }, [query, kindFilter])

  async function handleAddToCharacter(
    characterId: string,
    kind: EquipmentKind,
    slug: string,
    quantity: number,
  ) {
    const item = inventoryItemFromCatalog(kind, slug, quantity)
    if (!item) return 'Item not found in catalog.'
    return addItemToCharacter(characterId, item)
  }

  return (
    <div className="app-panel app-panel-wide">
      <AppBreadcrumbs
        items={[
          { label: 'Games', to: '/app' },
          { label: 'Tools', to: '/app/tools' },
          { label: 'Equipment' },
        ]}
      />
      <h2>Equipment</h2>
      <p className="muted">
        SRD 2024 weapons, armor, and gear from Open5e ({TOTAL} entries: {weapons.length} weapons,{' '}
        {armor.length} armor, {items.length} items).
      </p>

      {error ? <p className="dice-tray-error">{error}</p> : null}

      <div className="bestiary-filters equipment-filters">
        <div className="form-row">
          <label htmlFor="equipment-search">Search</label>
          <input
            id="equipment-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name…"
            autoComplete="off"
          />
        </div>
        <div className="form-row">
          <label htmlFor="equipment-kind">Type</label>
          <select
            id="equipment-kind"
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value as EquipmentKind | '')}
          >
            <option value="">All types</option>
            <option value="weapon">Weapons</option>
            <option value="armor">Armor</option>
            <option value="item">Items</option>
          </select>
        </div>
      </div>

      <p className="muted">
        Showing {filtered.length} of {TOTAL}
      </p>

      <ul className="bestiary-list equipment-list">
        {filtered.slice(0, 120).map((row) => (
          <li key={`${row.kind}-${row.key}`} className="bestiary-item equipment-list-item">
            <div className="equipment-list-item-text">
              <strong>{row.name}</strong>
              <span className="muted">
                {row.kind} · {row.meta}
              </span>
            </div>
            <button
              type="button"
              className="equipment-add-to-char"
              onClick={() => setAddTarget({ kind: row.kind, slug: row.key, name: row.name })}
            >
              Add to character
            </button>
          </li>
        ))}
      </ul>

      {filtered.length > 120 ? (
        <p className="muted">Narrow your search to see more than 120 results.</p>
      ) : null}

      {addTarget ? (
        <AddEquipmentToCharacterDialog
          open
          kind={addTarget.kind}
          slug={addTarget.slug}
          itemName={addTarget.name}
          characters={characters}
          loading={loading}
          onClose={() => setAddTarget(null)}
          onAdd={(characterId, quantity) =>
            handleAddToCharacter(characterId, addTarget.kind, addTarget.slug, quantity)
          }
        />
      ) : null}
    </div>
  )
}
