import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppBreadcrumbs } from '../components/AppBreadcrumbs'
import {
  flattenRulesReference,
  rulesReferenceEntryById,
  rulesReferenceMeta,
  rulesReferenceSections,
  searchRulesReference,
} from '../rules/dnd5e/data/rulesReference'

const TOTAL_ENTRIES = flattenRulesReference().length

export function RulesReferencePage() {
  const [searchParams] = useSearchParams()
  const highlightParam = searchParams.get('highlight')?.trim() ?? ''

  return (
    <div className="app-panel app-panel-wide rules-reference-page">
      <AppBreadcrumbs
        items={[
          { label: 'Games', to: '/app' },
          { label: 'Tools', to: '/app/tools' },
          { label: 'Rules reference' },
        ]}
      />
      <header className="rules-reference-header">
        <div>
          <h2>Rules quick reference</h2>
          <p className="muted">
            {rulesReferenceMeta.ruleset} — short summaries for table play ({TOTAL_ENTRIES}{' '}
            entries). Not a substitute for the full rules or your campaign&apos;s house rules.
          </p>
        </div>
        <Link to="/app/tools/dice" className="rules-reference-dice-link">
          Open dice tray
        </Link>
      </header>

      <RulesReferenceContent key={highlightParam || '__all__'} highlightParam={highlightParam} />

      <footer className="rules-reference-footer muted">
        <p>
          Summaries are based on the 2024 Player&apos;s Handbook and maintained in{' '}
          <code>rules-reference.json</code> and <code>conditions.json</code>. Campaign house rules
          appear on each game&apos;s detail page.
        </p>
      </footer>
    </div>
  )
}

function RulesReferenceContent({ highlightParam }: { highlightParam: string }) {
  const highlightEntry = highlightParam ? rulesReferenceEntryById(highlightParam) : undefined
  const [query, setQuery] = useState('')
  const [sectionFilter, setSectionFilter] = useState(() => highlightEntry?.sectionId ?? '')
  const highlightApplied = useRef<string | null>(null)

  const { sections, matchCount } = useMemo(
    () => searchRulesReference(query, sectionFilter),
    [query, sectionFilter],
  )

  const activeSections = sectionFilter
    ? sections.filter((s) => s.id === sectionFilter)
    : sections

  useEffect(() => {
    if (!highlightParam || highlightApplied.current === highlightParam) return
    const hasEntry = sections.some((s) => s.items.some((i) => i.id === highlightParam))
    if (!hasEntry) return

    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(`ref-entry-${highlightParam}`)
      if (!el) return
      const details = el.querySelector('details')
      if (details instanceof HTMLDetailsElement) {
        details.open = true
      }
      el.classList.add('rules-reference-card--highlight')
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      highlightApplied.current = highlightParam
    })

    return () => window.cancelAnimationFrame(frame)
  }, [highlightParam, sections])

  return (
    <>
      {highlightParam && !highlightEntry ? (
        <p className="rules-reference-highlight-warn muted">
          No entry found for &ldquo;{highlightParam}&rdquo;.
        </p>
      ) : null}

      <div className="bestiary-filters rules-reference-filters">
        <div className="form-row">
          <label htmlFor="rules-ref-search">Search</label>
          <input
            id="rules-ref-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Condition, action, DC…"
            autoComplete="off"
          />
        </div>
        <div className="form-row">
          <label htmlFor="rules-ref-section">Topic</label>
          <select
            id="rules-ref-section"
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
          >
            <option value="">All topics</option>
            {rulesReferenceSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="muted rules-reference-count">
        Showing {matchCount} of {TOTAL_ENTRIES} entries
        {query.trim() ? ` matching “${query.trim()}”` : ''}
      </p>

      {matchCount === 0 ? (
        <p className="muted">No entries match your search. Try another keyword or clear filters.</p>
      ) : (
        <div className="rules-reference-sections">
          {activeSections.map((section) => (
            <section key={section.id} className="rules-reference-section" id={`ref-${section.id}`}>
              <h3 className="rules-reference-section-title">{section.title}</h3>
              {section.intro ? (
                <p className="muted rules-reference-section-intro">{section.intro}</p>
              ) : null}
              <ul className="rules-reference-list">
                {section.items.map((item) => (
                  <li
                    key={item.id}
                    id={`ref-entry-${item.id}`}
                    className={`rules-reference-card${
                      highlightParam === item.id ? ' rules-reference-card--highlight' : ''
                    }`}
                  >
                    <details className="rules-reference-details">
                      <summary>
                        <span className="rules-reference-card-name">{item.name}</span>
                      </summary>
                      <p className="rules-reference-card-body">{item.summary}</p>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
