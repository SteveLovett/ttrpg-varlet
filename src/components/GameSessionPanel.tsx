import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameRolls, type GameRollRow } from '../hooks/useGameRolls'
import {
  useBroadcastGameEvent,
  useLiveRollListener,
} from '../hooks/useGameRoomEvents'
import type { RollResult } from '../rules/dnd5e/dice/types'
import { InitiativeTracker } from './gm/InitiativeTracker'
import { DiceTray } from './DiceTray'
import { SessionChatRoom } from './session/SessionChatRoom'
import { RollLog } from './RollLog'

type GameSessionPanelProps = {
  gameId: string
  currentUserId: string | null
  isGM: boolean
  displayName: string | null
  memberNames?: string[]
}

/**
 * Phase F5 session tools. Liveblocks room is provided by `GameLiveRoom` on the
 * game detail page so Session and VTT share one connection.
 */
export function GameSessionPanel({
  gameId,
  currentUserId,
  isGM,
  displayName,
  memberNames = [],
}: GameSessionPanelProps) {
  const { rolls, loading, error, loadRolls, saveRoll, addLiveRoll } = useGameRolls(gameId)
  const [lastResult, setLastResult] = useState<RollResult | null>(null)
  const broadcast = useBroadcastGameEvent()

  useEffect(() => {
    void loadRolls()
  }, [loadRolls])

  useLiveRollListener((event) => {
    if (event.userId === currentUserId) return
    const row: GameRollRow = {
      id: event.rollId,
      game_id: gameId,
      user_id: event.userId,
      formula: event.formula,
      label: event.label,
      result_json: event.result,
      created_at: event.createdAt,
      display_name: event.displayName,
    }
    addLiveRoll(row)
  })

  async function handleRoll(result: RollResult, formula: string, label: string) {
    setLastResult(result)
    const outcome = await saveRoll({ gameId, formula, label, result })
    if ('error' in outcome) return outcome.error
    const row = outcome.row
    broadcast({
      type: 'roll',
      rollId: row.id,
      userId: row.user_id,
      displayName: row.display_name ?? displayName,
      formula: row.formula,
      label: row.label,
      result: row.result_json,
      createdAt: row.created_at,
    })
    return null
  }

  return (
    <section className="game-session-layout">
      <div className="game-session-dice">
        <h3>Session dice</h3>
        <p className="muted">
          Quick rolls for this table.{' '}
          <Link to={`/app/tools/dice?gameId=${gameId}`}>Full dice tray</Link>
        </p>
        <DiceTray
          variant="compact"
          gameId={gameId}
          onRoll={handleRoll}
          lastResult={lastResult}
        />
      </div>
      <div className="game-session-side">
        <InitiativeTracker
          gameId={gameId}
          isGM={isGM}
          currentUserId={currentUserId}
          memberNames={memberNames}
        />
        <RollLog
          rolls={rolls}
          loading={loading}
          error={error}
          currentUserId={currentUserId}
        />
      </div>
      <div className="game-session-chat">
        <SessionChatRoom
          gameId={gameId}
          currentUserId={currentUserId}
          displayName={displayName}
        />
      </div>
    </section>
  )
}
