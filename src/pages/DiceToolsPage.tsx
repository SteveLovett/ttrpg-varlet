import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppBreadcrumbs } from '../components/AppBreadcrumbs'
import { DiceTray } from '../components/DiceTray'
import { RollLog } from '../components/RollLog'
import { useGameRolls } from '../hooks/useGameRolls'
import { conditions, loadMonstersIndex, loadSpellsIndex, srdManifest } from '../rules/dnd5e/data'
import type { RollResult } from '../rules/dnd5e/dice/types'
import { supabase } from '../supabaseClient'

/**
 * /app/tools/dice — full dice tray; optional ?gameId= to log rolls to a campaign.
 */
export function DiceToolsPage() {
  const [searchParams] = useSearchParams()
  const gameId = searchParams.get('gameId') ?? undefined
  const { rolls, loading, error, saveRoll, loadRolls } = useGameRolls(gameId)
  const [lastResult, setLastResult] = useState<RollResult | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [srdStats, setSrdStats] = useState<string | null>(null)

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null)
    })
    if (gameId) {
      void loadRolls()
    }
  }, [gameId, loadRolls])

  useEffect(() => {
    void (async () => {
      const [monsters, spells] = await Promise.all([loadMonstersIndex(), loadSpellsIndex()])
      const parts: string[] = []
      if (monsters) parts.push(`${monsters.count} monsters`)
      if (spells) parts.push(`${spells.count} spells`)
      const total = (monsters?.count ?? 0) + (spells?.count ?? 0)
      if (total > 0) {
        setSrdStats(`SRD data loaded: ${parts.join(', ')}.`)
      } else {
        setSrdStats('Run npm run fetch:srd to download Open5e monster and spell indexes.')
      }
    })()
  }, [])

  async function handleRoll(result: RollResult, formula: string, label: string) {
    setLastResult(result)
    if (!gameId) return null
    const outcome = await saveRoll({ gameId, formula, label, result })
    return 'error' in outcome ? outcome.error : null
  }

  return (
    <div className="app-panel app-panel-wide">
      <AppBreadcrumbs
        items={[
          { label: 'Games', to: '/app' },
          { label: 'Tools', to: '/app/tools' },
          { label: 'Dice tray' },
        ]}
      />
      <h2>Dice tray</h2>
      {gameId ? (
        <p className="muted">
          Rolls are saved to your game log.{' '}
          <Link to={`/app/games/${gameId}?tab=session`}>Return to session</Link>
        </p>
      ) : (
        <p className="muted">
          Practice rolls here, or open dice from a game&apos;s Session tab to log rolls for the table.
        </p>
      )}

      <div className={gameId ? 'dice-tools-layout' : ''}>
        <DiceTray
          variant="full"
          gameId={gameId}
          onRoll={gameId ? handleRoll : undefined}
          lastResult={lastResult}
        />
        {gameId ? (
          <RollLog rolls={rolls} loading={loading} error={error} currentUserId={userId} />
        ) : null}
      </div>

      {gameId && error?.includes('game_rolls') ? (
        <p className="muted">
          Could not load roll log — apply the Phase F2 migration with{' '}
          <code>supabase db push</code>.
          <button type="button" onClick={() => void loadRolls()}>
            Retry
          </button>
        </p>
      ) : null}

      <section className="dice-tools-reference">
        <h3>Quick reference</h3>
        <p className="muted">{srdManifest.note}</p>
        {srdStats ? <p className="muted">{srdStats}</p> : null}
        <details className="conditions-ref">
          <summary>Conditions ({conditions.length})</summary>
          <ul className="conditions-list">
            {conditions.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> — {c.summary}
              </li>
            ))}
          </ul>
        </details>
      </section>

    </div>
  )
}
