import { type ReactNode } from 'react'
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import {
  liveblocksClientOptions,
  roomIdForGame,
  type GameRoomPresence,
} from '../../lib/liveblocks'

type LiveSessionRoomProps = {
  gameId: string
  isGM: boolean
  displayName: string | null
  children: ReactNode
}

/**
 * Wraps the Session tab in a Liveblocks room scoped to a single game. Members
 * are admitted by the `liveblocks-auth` Edge Function.
 */
export function LiveSessionRoom({
  gameId,
  isGM,
  displayName,
  children,
}: LiveSessionRoomProps) {
  const initialPresence: GameRoomPresence = {
    displayName,
    role: isGM ? 'Game Master' : 'Player',
  }
  return (
    <LiveblocksProvider {...liveblocksClientOptions}>
      <RoomProvider id={roomIdForGame(gameId)} initialPresence={initialPresence}>
        {children}
      </RoomProvider>
    </LiveblocksProvider>
  )
}
