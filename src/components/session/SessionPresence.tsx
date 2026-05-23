import { useOthers, useSelf } from '@liveblocks/react'

/**
 * Compact presence row: who else is currently in the game room.
 */
export function SessionPresence() {
  const self = useSelf()
  const others = useOthers()
  const all = [
    ...(self ? [{ id: self.id, name: presenceName(self), isSelf: true }] : []),
    ...others.map((o) => ({ id: o.id, name: presenceName(o), isSelf: false })),
  ]
  if (all.length === 0) return null
  return (
    <div className="session-presence" aria-label="People in this room">
      <span className="muted">In room:</span>
      <ul>
        {all.map((p, idx) => (
          <li key={`${p.id ?? 'anon'}-${idx}`}>
            <span className="presence-dot" aria-hidden />
            {p.name}
            {p.isSelf ? ' (you)' : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}

type PresenceSource = {
  id?: string | null
  info?: { name?: string } | null
  presence?: { displayName?: string | null } | null
}

function presenceName(source: PresenceSource): string {
  return (
    source.info?.name ?? source.presence?.displayName ?? source.id ?? 'Player'
  )
}
