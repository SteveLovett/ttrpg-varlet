import { useOthers, useSelf } from '@liveblocks/react'

/**
 * Online users in the game room — shown beside session chat.
 */
export function SessionPresence() {
  const self = useSelf()
  const others = useOthers()
  const all = [
    ...(self ? [{ id: self.id, name: presenceName(self), isSelf: true }] : []),
    ...others.map((o) => ({ id: o.id, name: presenceName(o), isSelf: false })),
  ]

  return (
    <section className="session-presence" aria-label="People in this room">
      <h3>In this room</h3>
      {all.length === 0 ? (
        <p className="session-presence-empty muted">No one connected</p>
      ) : (
        <ul className="session-presence-list">
          {all.map((p, idx) => (
            <li key={`${p.id ?? 'anon'}-${idx}`} className="session-presence-user">
              <span className="presence-dot" aria-hidden />
              <span className="session-presence-name">
                {p.name}
                {p.isSelf ? <span className="muted"> (you)</span> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
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
