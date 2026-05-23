import type { GameRollRow } from '../hooks/useGameRolls'

type RollLogProps = {
  rolls: GameRollRow[]
  loading: boolean
  error: string | null
  currentUserId: string | null
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function RollLog({ rolls, loading, error, currentUserId }: RollLogProps) {
  return (
    <details className="roll-log-panel" open>
      <summary className="roll-log-summary">
        <span>Recent rolls</span>
        <span className="roll-log-count muted">{rolls.length > 0 ? rolls.length : ''}</span>
      </summary>
      <div className="roll-log-body">
        {loading ? <p className="muted">Loading rolls…</p> : null}
        {error ? <p>{error}</p> : null}
        {!loading && !error && rolls.length === 0 ? (
          <p className="muted">No rolls yet. Use the dice tray to roll.</p>
        ) : null}
        {!loading && !error && rolls.length > 0 ? (
          <ul className="roll-log-list">
            {rolls.map((row) => {
              const result = row.result_json
              const who =
                row.user_id === currentUserId
                  ? 'You'
                  : (row.display_name ?? 'Player')
              const title = row.label.length > 0 ? row.label : row.formula
              return (
                <li key={row.id} className="roll-log-item">
                  <div className="roll-log-item-head">
                    <strong>{result.total}</strong>
                    <span className="roll-log-item-title">{title}</span>
                  </div>
                  <p className="roll-log-item-meta muted">
                    {who} · {formatTime(row.created_at)}
                  </p>
                  <p className="roll-log-item-detail muted">
                    {result.breakdown.replace(/\*\*/g, '')}
                  </p>
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    </details>
  )
}
