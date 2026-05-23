/**
 * Phase F5 — Liveblocks client options + typed room helpers.
 *
 * The browser never holds the Liveblocks secret. Each room negotiation calls
 * our Supabase Edge Function (`liveblocks-auth`) with the user's Supabase JWT;
 * the function verifies game membership and mints a room-scoped access token.
 */

import type { ClientOptions } from '@liveblocks/client'
import type { RollResult } from '../rules/dnd5e/dice/types'
import type { InitiativeEntry } from '../rules/dnd5e/initiative/types'
import { supabase } from '../supabaseClient'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const LIVEBLOCKS_AUTH_URL = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/liveblocks-auth`
  : ''

if (!SUPABASE_URL) {
  console.warn(
    '[liveblocks] VITE_SUPABASE_URL not set — live session features will not work.',
  )
}

/**
 * Room id pattern enforced by the auth function: `game:<uuid>`. Keep this
 * helper so callers can't drift from the regex on the server.
 */
export function roomIdForGame(gameId: string): string {
  return `game:${gameId}`
}

export type GameRoomPresence = {
  displayName: string | null
  role: 'Game Master' | 'Player' | null
}

export type LiveRollEvent = {
  type: 'roll'
  rollId: string
  userId: string
  displayName: string | null
  formula: string
  label: string
  result: RollResult
  createdAt: string
}

export type LiveInitiativeEvent = {
  type: 'initiative'
  userId: string
  entries: InitiativeEntry[]
}

export type LiveChatEvent = {
  type: 'chat'
  messageId: string
  userId: string
  displayName: string | null
  body: string
  createdAt: string
}

export type GameRoomEvent = LiveRollEvent | LiveInitiativeEvent | LiveChatEvent

export type GameUserMeta = {
  id: string
  info: {
    name: string
    role: 'Game Master' | 'Player' | null
  }
}

/**
 * Options for `<LiveblocksProvider {...liveblocksClientOptions}>`. Using the
 * auth-endpoint callback variant so we can attach the user's Supabase JWT and
 * a JSON body containing the room id.
 */
export const liveblocksClientOptions: ClientOptions = {
  authEndpoint: async (room) => {
    if (!LIVEBLOCKS_AUTH_URL) {
      throw new Error('Liveblocks auth endpoint missing: set VITE_SUPABASE_URL.')
    }
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    const token = session?.access_token
    if (!token) {
      throw new Error('Not signed in — cannot enter live session room.')
    }
    const response = await fetch(LIVEBLOCKS_AUTH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ room }),
    })
    if (!response.ok) {
      let detail = ''
      try {
        const data = (await response.json()) as { error?: string }
        detail = data.error ?? ''
      } catch {
        detail = await response.text()
      }
      throw new Error(
        `Liveblocks auth failed (${response.status}): ${detail || 'unknown error'}`,
      )
    }
    return (await response.json()) as { token: string }
  },
  throttle: 80,
}

declare global {
  interface Liveblocks {
    Presence: GameRoomPresence
    RoomEvent: GameRoomEvent
    UserMeta: GameUserMeta
  }
}
