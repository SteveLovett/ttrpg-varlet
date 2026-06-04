import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { SessionChat } from './SessionChat'
import { SessionPresence } from './SessionPresence'

const STORAGE_KEY = 'session-chat-presence-width-px'
const SPLITTER_PX = 6
/** Fits "Chat" + horizontal padding at 1rem */
const MIN_CHAT_PX = 92
/** Fits "In this room" + horizontal padding at 1rem */
const MIN_PRESENCE_PX = 172
const DEFAULT_PRESENCE_PX = 224
const MAX_PRESENCE_RATIO = 0.45

type SessionChatRoomProps = {
  gameId: string
  currentUserId: string | null
  displayName: string | null
}

function readStoredPresenceWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PRESENCE_PX
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= MIN_PRESENCE_PX ? n : DEFAULT_PRESENCE_PX
  } catch {
    return DEFAULT_PRESENCE_PX
  }
}

function clampPresenceWidth(
  next: number,
  containerWidth: number,
): number {
  const maxPresence = Math.max(
    MIN_PRESENCE_PX,
    containerWidth * MAX_PRESENCE_RATIO,
  )
  const maxByChat = containerWidth - MIN_CHAT_PX - SPLITTER_PX
  const upper = Math.min(maxPresence, maxByChat)
  return Math.min(Math.max(next, MIN_PRESENCE_PX), Math.max(MIN_PRESENCE_PX, upper))
}

/**
 * Chat + presence with a draggable vertical split. Min widths keep both titles visible.
 */
export function SessionChatRoom({
  gameId,
  currentUserId,
  displayName,
}: SessionChatRoomProps) {
  const roomRef = useRef<HTMLDivElement>(null)
  const [presenceWidth, setPresenceWidth] = useState(readStoredPresenceWidth)
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const clampToContainer = useCallback((width: number) => {
    const el = roomRef.current
    if (!el) return width
    return clampPresenceWidth(width, el.getBoundingClientRect().width)
  }, [])

  useEffect(() => {
    const el = roomRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      setPresenceWidth((w) => clampToContainer(w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [clampToContainer])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Math.round(presenceWidth)))
    } catch {
      /* ignore quota / private mode */
    }
  }, [presenceWidth])

  function beginDrag(clientX: number) {
    dragRef.current = { startX: clientX, startWidth: presenceWidth }
    setDragging(true)
  }

  function onSplitterPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    beginDrag(e.clientX)
  }

  function onSplitterPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag || !roomRef.current) return
    const rect = roomRef.current.getBoundingClientRect()
    const delta = drag.startX - e.clientX
    const next = clampPresenceWidth(drag.startWidth + delta, rect.width)
    setPresenceWidth(next)
  }

  function endDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  function onSplitterKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const step = e.shiftKey ? 24 : 8
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setPresenceWidth((w) => clampToContainer(w + step))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setPresenceWidth((w) => clampToContainer(w - step))
    }
  }

  return (
    <div
      ref={roomRef}
      className={`session-chat-room${dragging ? ' session-chat-room--dragging' : ''}`}
    >
      <div className="session-chat-room-main">
        <SessionChat
          gameId={gameId}
          currentUserId={currentUserId}
          displayName={displayName}
        />
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize chat and member list"
        aria-valuemin={MIN_PRESENCE_PX}
        aria-valuemax={Math.round(presenceWidth + 200)}
        aria-valuenow={Math.round(presenceWidth)}
        tabIndex={0}
        className="session-chat-room-split"
        onPointerDown={onSplitterPointerDown}
        onPointerMove={onSplitterPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onSplitterKeyDown}
      />
      <div
        className="session-chat-room-presence"
        style={{ width: presenceWidth, flex: `0 0 ${presenceWidth}px` }}
      >
        <SessionPresence />
      </div>
    </div>
  )
}
