import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

type MessageRow = {
  id: string
  from_user_id: string
  to_user_id: string
  subject: string
  body: string
  read_at: string | null
  created_at: string
}

type InviteRow = {
  id: string
  game_id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  decided_at: string | null
}

type ProfileLookup = Record<string, string> // user id -> display name
type GameLookup = Record<string, string> // game id -> name

type Tab = 'inbox' | 'sent' | 'invites'

export function MailboxPage() {
  const [tab, setTab] = useState<Tab>('inbox')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [me, setMe] = useState<string | null>(null)
  const [inbox, setInbox] = useState<MessageRow[]>([])
  const [sent, setSent] = useState<MessageRow[]>([])
  const [invites, setInvites] = useState<InviteRow[]>([])
  const [profiles, setProfiles] = useState<ProfileLookup>({})
  const [games, setGames] = useState<GameLookup>({})
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [sending, setSending] = useState(false)
  const [composeError, setComposeError] = useState<string | null>(null)
  const [composeInfo, setComposeInfo] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      setError(userError.message)
      setLoading(false)
      return
    }
    if (!user) {
      setError('You must be signed in.')
      setLoading(false)
      return
    }
    setMe(user.id)

    const [
      { data: inboxData, error: inboxError },
      { data: sentData, error: sentError },
      { data: invitesData, error: invitesError },
    ] = await Promise.all([
      supabase
        .from('messages')
        .select('id, from_user_id, to_user_id, subject, body, read_at, created_at')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('messages')
        .select('id, from_user_id, to_user_id, subject, body, read_at, created_at')
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('game_invites')
        .select('id, game_id, from_user_id, to_user_id, status, created_at, decided_at')
        .or(`to_user_id.eq.${user.id},from_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false }),
    ])

    if (inboxError) {
      setError(inboxError.message)
      setLoading(false)
      return
    }
    if (sentError) {
      setError(sentError.message)
      setLoading(false)
      return
    }
    if (invitesError) {
      setError(invitesError.message)
      setLoading(false)
      return
    }

    const inboxRows = (inboxData ?? []) as MessageRow[]
    const sentRows = (sentData ?? []) as MessageRow[]
    const inviteRows = (invitesData ?? []) as InviteRow[]

    setInbox(inboxRows)
    setSent(sentRows)
    setInvites(inviteRows)

    const userIds = new Set<string>()
    inboxRows.forEach((r) => userIds.add(r.from_user_id))
    sentRows.forEach((r) => userIds.add(r.to_user_id))
    inviteRows.forEach((r) => {
      userIds.add(r.from_user_id)
      userIds.add(r.to_user_id)
    })
    userIds.delete(user.id)

    const gameIds = new Set<string>(inviteRows.map((r) => r.game_id))

    const [{ data: profileRows }, { data: gameRows }] = await Promise.all([
      userIds.size > 0
        ? supabase.from('profiles').select('id, display_name').in('id', Array.from(userIds))
        : Promise.resolve({ data: [] as Array<{ id: string; display_name: string | null }> }),
      gameIds.size > 0
        ? supabase.from('games').select('id, name').in('id', Array.from(gameIds))
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    ])

    const profileMap: ProfileLookup = {}
    ;(profileRows ?? []).forEach((p) => {
      profileMap[p.id] = p.display_name ?? '(unknown)'
    })
    setProfiles(profileMap)

    const gameMap: GameLookup = {}
    ;(gameRows ?? []).forEach((g) => {
      gameMap[g.id] = g.name
    })
    setGames(gameMap)

    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const pendingInvites = useMemo(
    () => invites.filter((inv) => inv.to_user_id === me && inv.status === 'pending'),
    [invites, me],
  )
  const sentInvites = useMemo(
    () => invites.filter((inv) => inv.from_user_id === me),
    [invites, me],
  )

  async function handleMarkRead(messageId: string) {
    const { error: rpcError } = await supabase.rpc('mark_message_read', { p_message_id: messageId })
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    setInbox((prev) =>
      prev.map((m) => (m.id === messageId && !m.read_at ? { ...m, read_at: new Date().toISOString() } : m)),
    )
  }

  async function handleRespondInvite(inviteId: string, accept: boolean) {
    setRespondingInviteId(inviteId)
    try {
      const { error: rpcError } = await supabase.rpc('respond_to_invite', {
        p_invite_id: inviteId,
        p_accept: accept,
      })
      if (rpcError) {
        setError(rpcError.message)
        return
      }
      await refresh()
    } finally {
      setRespondingInviteId(null)
    }
  }

  async function handleSendMessage(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setComposeError(null)
    setComposeInfo(null)
    const toEmail = composeTo.trim()
    const body = composeBody.trim()
    const subject = composeSubject.trim()
    if (!toEmail) {
      setComposeError('Recipient email is required.')
      return
    }
    if (!body) {
      setComposeError('Message body is required.')
      return
    }

    setSending(true)
    try {
      const { data: found, error: findError } = await supabase.rpc('find_user_by_email', { p_email: toEmail })
      if (findError) {
        setComposeError(findError.message)
        return
      }
      const recipient = Array.isArray(found) ? found[0] : found
      if (!recipient?.id) {
        setComposeError('No user found with that email.')
        return
      }

      const { error: insertError } = await supabase.from('messages').insert({
        to_user_id: recipient.id,
        subject,
        body,
      })
      if (insertError) {
        setComposeError(insertError.message)
        return
      }

      setComposeInfo('Message sent.')
      setComposeTo('')
      setComposeSubject('')
      setComposeBody('')
      await refresh()
    } finally {
      setSending(false)
    }
  }

  function nameFor(userId: string): string {
    if (userId === me) return 'You'
    return profiles[userId] ?? '(unknown user)'
  }

  function gameNameFor(gameId: string): string {
    return games[gameId] ?? '(unknown game)'
  }

  function formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  return (
    <div className="app-panel">
      <h2>Mailbox</h2>

      <nav className="mailbox-tabs">
        <button
          type="button"
          className={tab === 'inbox' ? 'tab active' : 'tab'}
          onClick={() => setTab('inbox')}
        >
          Inbox ({inbox.filter((m) => !m.read_at).length})
        </button>
        <button
          type="button"
          className={tab === 'sent' ? 'tab active' : 'tab'}
          onClick={() => setTab('sent')}
        >
          Sent ({sent.length})
        </button>
        <button
          type="button"
          className={tab === 'invites' ? 'tab active' : 'tab'}
          onClick={() => setTab('invites')}
        >
          Invites ({pendingInvites.length})
        </button>
      </nav>

      <div className="mailbox-actions">
        <button type="button" onClick={() => setComposeOpen((o) => !o)}>
          {composeOpen ? 'Cancel compose' : 'Compose message'}
        </button>
      </div>

      {composeOpen ? (
        <form onSubmit={handleSendMessage} className="create-game-form">
          <div className="form-row">
            <label htmlFor="compose-to">To (email)</label>
            <input
              id="compose-to"
              type="email"
              autoComplete="off"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              disabled={sending}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="compose-subject">Subject</label>
            <input
              id="compose-subject"
              type="text"
              autoComplete="off"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="form-row">
            <label htmlFor="compose-body">Message</label>
            <textarea
              id="compose-body"
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              disabled={sending}
              required
            />
          </div>
          <button type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send message'}
          </button>
          {composeError ? <p>{composeError}</p> : null}
          {composeInfo ? <p>{composeInfo}</p> : null}
        </form>
      ) : null}

      {loading ? <p>Loading mailbox...</p> : null}
      {!loading && error ? <p>{error}</p> : null}

      {!loading && !error && tab === 'inbox' ? (
        inbox.length === 0 ? (
          <p>No messages.</p>
        ) : (
          <ul className="mailbox-list">
            {inbox.map((m) => (
              <li key={m.id} className={m.read_at ? 'mailbox-item read' : 'mailbox-item unread'}>
                <p>
                  <strong>{m.subject || '(no subject)'}</strong>
                </p>
                <p>
                  From {nameFor(m.from_user_id)} · {formatDate(m.created_at)}
                  {m.read_at ? ' · Read' : ''}
                </p>
                <p>{m.body}</p>
                {!m.read_at ? (
                  <button type="button" onClick={() => void handleMarkRead(m.id)}>
                    Mark read
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}

      {!loading && !error && tab === 'sent' ? (
        sent.length === 0 ? (
          <p>No sent messages.</p>
        ) : (
          <ul className="mailbox-list">
            {sent.map((m) => (
              <li key={m.id} className="mailbox-item">
                <p>
                  <strong>{m.subject || '(no subject)'}</strong>
                </p>
                <p>
                  To {nameFor(m.to_user_id)} · {formatDate(m.created_at)}
                </p>
                <p>{m.body}</p>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {!loading && !error && tab === 'invites' ? (
        <>
          <h3>Pending invitations</h3>
          {pendingInvites.length === 0 ? (
            <p>No pending invites.</p>
          ) : (
            <ul className="mailbox-list">
              {pendingInvites.map((inv) => (
                <li key={inv.id} className="mailbox-item unread">
                  <p>
                    <strong>{gameNameFor(inv.game_id)}</strong>
                  </p>
                  <p>
                    From {nameFor(inv.from_user_id)} · {formatDate(inv.created_at)}
                  </p>
                  <div className="form-row form-row-inline">
                    <button
                      type="button"
                      onClick={() => void handleRespondInvite(inv.id, true)}
                      disabled={respondingInviteId === inv.id}
                    >
                      {respondingInviteId === inv.id ? 'Working...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRespondInvite(inv.id, false)}
                      disabled={respondingInviteId === inv.id}
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h3>Invites you have sent</h3>
          {sentInvites.length === 0 ? (
            <p>You have not sent any invites.</p>
          ) : (
            <ul className="mailbox-list">
              {sentInvites.map((inv) => (
                <li key={inv.id} className="mailbox-item">
                  <p>
                    <strong>{gameNameFor(inv.game_id)}</strong> — <Link to={`/app/games/${inv.game_id}`}>Open game</Link>
                  </p>
                  <p>
                    To {nameFor(inv.to_user_id)} · {formatDate(inv.created_at)} · Status: {inv.status}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  )
}
