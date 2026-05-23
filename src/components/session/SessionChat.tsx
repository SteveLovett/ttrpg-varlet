import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useGameChat, type GameChatRow } from '../../hooks/useGameChat'
import {
  useBroadcastGameEvent,
  useLiveChatListener,
} from '../../hooks/useGameRoomEvents'

type SessionChatProps = {
  gameId: string
  currentUserId: string | null
  displayName: string | null
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function SessionChat({ gameId, currentUserId, displayName }: SessionChatProps) {
  const { messages, loading, error, load, send, addLiveMessage } = useGameChat(gameId)
  const broadcast = useBroadcastGameEvent()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    void load()
  }, [load])

  useLiveChatListener((event) => {
    if (event.userId === currentUserId) return
    const row: GameChatRow = {
      id: event.messageId,
      game_id: gameId,
      user_id: event.userId,
      body: event.body,
      created_at: event.createdAt,
      display_name: event.displayName,
    }
    addLiveMessage(row)
  })

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  async function handleSend(e: FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setSendError(null)
    const result = await send(body)
    setSending(false)
    if ('error' in result) {
      setSendError(result.error)
      return
    }
    broadcast({
      type: 'chat',
      messageId: result.row.id,
      userId: result.row.user_id,
      displayName: result.row.display_name ?? displayName,
      body: result.row.body,
      createdAt: result.row.created_at,
    })
    setDraft('')
  }

  return (
    <section className="session-chat">
      <h3>Chat</h3>
      {loading ? <p className="muted">Loading…</p> : null}
      {error ? <p>{error}</p> : null}
      <ol className="session-chat-list" ref={listRef}>
        {messages.length === 0 && !loading ? (
          <li className="muted">No messages yet — say hi.</li>
        ) : null}
        {messages.map((m) => {
          const who =
            m.user_id === currentUserId ? 'You' : (m.display_name ?? 'Player')
          return (
            <li key={m.id} className="session-chat-row">
              <div className="session-chat-meta muted">
                <strong>{who}</strong> · {formatTime(m.created_at)}
              </div>
              <div className="session-chat-body">{m.body}</div>
            </li>
          )
        })}
      </ol>
      <form className="session-chat-form" onSubmit={(e) => void handleSend(e)}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something to the table…"
          disabled={sending}
          maxLength={2000}
          aria-label="Chat message"
        />
        <button type="submit" disabled={sending || draft.trim().length === 0}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
      {sendError ? <p className="session-chat-error">{sendError}</p> : null}
    </section>
  )
}
