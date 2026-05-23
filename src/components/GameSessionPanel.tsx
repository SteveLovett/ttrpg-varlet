import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGameRolls } from '../hooks/useGameRolls'
import type { RollResult } from '../rules/dnd5e/dice/types'
import { InitiativeTracker } from './gm/InitiativeTracker'
import { DiceTray } from './DiceTray'
import { RollLog } from './RollLog'

type GameSessionPanelProps = {
  gameId: string
  currentUserId: string | null
  isGM: boolean
  memberNames?: string[]
}

export function GameSessionPanel({
  gameId,
  currentUserId,
  isGM,
  memberNames = [],
}: GameSessionPanelProps) {
  const { rolls, loading, error, loadRolls, saveRoll } = useGameRolls(gameId)
  const [lastResult, setLastResult] = useState<RollResult | null>(null)

  useEffect(() => {
    void loadRolls()
  }, [loadRolls])

  async function handleRoll(result: RollResult, formula: string, label: string) {
    setLastResult(result)
    return saveRoll({ gameId, formula, label, result })
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
        <InitiativeTracker gameId={gameId} isGM={isGM} memberNames={memberNames} />
        <RollLog
          rolls={rolls}
          loading={loading}
          error={error}
          currentUserId={currentUserId}
        />
      </div>
    </section>
  )
}
