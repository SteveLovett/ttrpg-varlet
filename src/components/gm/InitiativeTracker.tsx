import { useEffect, useState, type FormEvent } from 'react'
import { NumericInput } from '../NumericInput'
import { useGameInitiative } from '../../hooks/useGameInitiative'
import {
  useBroadcastGameEvent,
  useLiveInitiativeListener,
} from '../../hooks/useGameRoomEvents'
import {
  newInitiativeEntry,
  type InitiativeEntry,
} from '../../rules/dnd5e/initiative/types'

type InitiativeTrackerProps = {
  gameId: string
  isGM: boolean
  currentUserId: string | null
  memberNames?: string[]
}

export function InitiativeTracker({
  gameId,
  isGM,
  currentUserId,
  memberNames = [],
}: InitiativeTrackerProps) {
  const { entries, loading, error, load, save, setEntries } = useGameInitiative(gameId)
  const [draftName, setDraftName] = useState('')
  const [draftValue, setDraftValue] = useState(10)
  const [draftPc, setDraftPc] = useState(true)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const broadcast = useBroadcastGameEvent()

  useEffect(() => {
    void load()
  }, [load])

  useLiveInitiativeListener((event) => {
    if (event.userId === currentUserId) return
    setEntries(sortInitiative(event.entries))
  })

  async function persist(next: typeof entries) {
    setSaving(true)
    setLocalError(null)
    const err = await save(next)
    setSaving(false)
    if (err) {
      setLocalError(err)
      return
    }
    broadcast({
      type: 'initiative',
      userId: currentUserId ?? 'unknown',
      entries: sortInitiative(next),
    })
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!isGM) return
    const name = draftName.trim()
    const value = draftValue
    if (!name) return
    const next = [...entries, newInitiativeEntry(name, value, draftPc)]
    await persist(next)
    setDraftName('')
  }

  return (
    <section className="initiative-tracker">
      <h3>Initiative</h3>
      <p className="muted">
        {isGM
          ? 'Add combatants and sort by roll. Everyone in the game can see this list.'
          : 'Current turn order for this game.'}
      </p>

      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p>{error}</p> : null}
      {localError ? <p>{localError}</p> : null}

      {entries.length === 0 && !loading ? (
        <p className="muted">No initiative entries yet.</p>
      ) : (
        <ol className="initiative-list">
          {entries.map((entry, index) => (
            <li key={entry.id} className="initiative-row">
              <span className="initiative-rank">{index + 1}</span>
              <span className="initiative-name">
                {entry.name}
                {entry.isPc ? ' (PC)' : ''}
              </span>
              <span className="initiative-value">{entry.value}</span>
              {isGM ? (
                <button
                  type="button"
                  className="initiative-remove"
                  disabled={saving}
                  aria-label={`Remove ${entry.name}`}
                  onClick={() => void persist(entries.filter((e) => e.id !== entry.id))}
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {isGM ? (
        <form onSubmit={(e) => void handleAdd(e)} className="initiative-add-form">
          <div className="form-row">
            <label htmlFor="init-name">Name</label>
            <input
              id="init-name"
              list="init-name-suggestions"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              disabled={saving}
              placeholder="Character or creature"
            />
            <datalist id="init-name-suggestions">
              {memberNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div className="initiative-add-row">
            <div className="form-row">
              <label htmlFor="init-value">Initiative</label>
              <NumericInput
                id="init-value"
                emptyFallback={10}
                value={draftValue}
                onChange={setDraftValue}
                disabled={saving}
              />
            </div>
            <label className="skill-check-label">
              <input
                type="checkbox"
                checked={draftPc}
                onChange={(e) => setDraftPc(e.target.checked)}
                disabled={saving}
              />
              PC
            </label>
            <button type="submit" disabled={saving}>
              Add
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

function sortInitiative(entries: InitiativeEntry[]): InitiativeEntry[] {
  return [...entries].sort((a, b) => b.value - a.value)
}
