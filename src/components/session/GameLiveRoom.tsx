import { type ReactNode } from 'react'
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import {
  liveblocksClientOptions,
  roomIdForGame,
  type GameRoomPresence,
} from '../../lib/liveblocks'

type GameLiveRoomProps = {
  gameId: string
  isGM: boolean
  displayName: string | null
  children: ReactNode
}

/**
 * Single Liveblocks room per game for Session (F5) and VTT (F6). Mount once
 * while the member is on either tab so Yjs and presence stay warm when
 * switching between Session and VTT.
 */
export function GameLiveRoom({
  gameId,
  isGM,
  displayName,
  children,
}: GameLiveRoomProps) {
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
