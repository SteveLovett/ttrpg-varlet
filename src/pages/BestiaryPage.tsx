import { useMemo, useState } from 'react'
import { AppBreadcrumbs } from '../components/AppBreadcrumbs'
import { estimateMonsterCr } from '../rules/dnd5e/encounter'
import { monsters } from '../rules/dnd5e/data/monsters'

export function BestiaryPage() {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const types = useMemo(() => {
    const set = new Set<string>()
    for (const m of monsters) {
      if (m.type) set.add(m.type)
    }
    return [...set].sort()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return monsters.filter((m) => {
      if (typeFilter && (m.type ?? '') !== typeFilter) return false
      if (!q) return true
      return m.name.toLowerCase().includes(q) || m.slug.toLowerCase().includes(q)
    })
  }, [query, typeFilter])

  return (
    <div className="app-panel app-panel-wide">
      <AppBreadcrumbs
        items={[
          { label: 'Games', to: '/app' },
          { label: 'Tools', to: '/app/tools' },
          { label: 'Bestiary' },
        ]}
      />
      <h2>Bestiary</h2>
      <p className="muted">
        SRD 2024 creatures from Open5e ({monsters.length} entries). CR is estimated when not
        bundled.
      </p>

      <div className="bestiary-filters">
        <div className="form-row">
          <label htmlFor="bestiary-search">Search</label>
          <input
            id="bestiary-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name…"
            autoComplete="off"
          />
        </div>
        <div className="form-row">
          <label htmlFor="bestiary-type">Type</label>
          <select
            id="bestiary-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="muted">
        Showing {filtered.length} of {monsters.length}
      </p>

      <ul className="bestiary-list">
        {filtered.slice(0, 120).map((m) => {
          const cr = estimateMonsterCr(m)
          return (
            <li key={m.slug} className="bestiary-item">
              <strong>{m.name}</strong>
              <span className="muted">
                est. CR {cr}
                {m.type ? ` · ${m.type}` : ''}
                {m.size ? ` · ${m.size}` : ''}
                {m.ac != null ? ` · AC ${m.ac}` : ''}
              </span>
            </li>
          )
        })}
      </ul>

      {filtered.length > 120 ? (
        <p className="muted">Narrow your search to see more than 120 results.</p>
      ) : null}

    </div>
  )
}
