import { useCallback } from 'react'
import { useBroadcastEvent, useEventListener } from '@liveblocks/react'
import type {
  GameRoomEvent,
  LiveChatEvent,
  LiveInitiativeEvent,
  LiveRollEvent,
} from '../lib/liveblocks'

/**
 * Phase F5 — thin wrappers around Liveblocks broadcast/listener hooks so the
 * rest of the app speaks in domain events ({ type: 'roll' | 'initiative' |
 * 'chat' }) rather than touching Liveblocks directly.
 */

type BroadcastFn = (event: GameRoomEvent) => void

export function useBroadcastGameEvent(): BroadcastFn {
  const broadcast = useBroadcastEvent()
  return useCallback(
    (event: GameRoomEvent) => {
      broadcast(event)
    },
    [broadcast],
  )
}

export function useLiveRollListener(handler: (event: LiveRollEvent) => void) {
  useEventListener(({ event }) => {
    if (event.type === 'roll') handler(event)
  })
}

export function useLiveInitiativeListener(
  handler: (event: LiveInitiativeEvent) => void,
) {
  useEventListener(({ event }) => {
    if (event.type === 'initiative') handler(event)
  })
}

export function useLiveChatListener(handler: (event: LiveChatEvent) => void) {
  useEventListener(({ event }) => {
    if (event.type === 'chat') handler(event)
  })
}
