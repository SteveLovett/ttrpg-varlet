import { type ReactNode } from 'react'
import { LiveblocksProvider, RoomProvider } from '@liveblocks/react'
import {
  liveblocksClientOptions,
  roomIdForGame,
  type GameRoomPresence,
} from '../../lib/liveblocks'

type VttRoomProps = {
  gameId: string
  isGM: boolean
  displayName: string | null
  children: ReactNode
}

/**
 * Wraps the VTT tab in the same Liveblocks room as the Session tab so the
 * Yjs map document and the F5 broadcast events share authorization and
 * presence. Tabs are mutually exclusive in the UI, so there's only ever
 * one Room subscription per user at a time.
 */
export function VttRoom({ gameId, isGM, displayName, children }: VttRoomProps) {
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
