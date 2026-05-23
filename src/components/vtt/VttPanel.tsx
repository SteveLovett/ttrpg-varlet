import { Suspense, lazy } from 'react'
import { VttRoom } from './VttRoom'

/**
 * Pixi pulls in ~400 kB gzipped, so the canvas is split out of the main
 * bundle. Other VTT tabs (and other game tabs) never load it.
 */
const SceneCanvasSpike = lazy(() =>
  import('./SceneCanvasSpike').then((m) => ({ default: m.SceneCanvasSpike })),
)

type VttPanelProps = {
  gameId: string
  isGM: boolean
  displayName: string | null
}

/**
 * Phase F6 entry point on the game detail page. Right now this only mounts
 * the spike canvas; the empty-state, scene creation, and real map rendering
 * come in subsequent slices.
 */
export function VttPanel({ gameId, isGM, displayName }: VttPanelProps) {
  return (
    <VttRoom gameId={gameId} isGM={isGM} displayName={displayName}>
      <section className="vtt-panel">
        <p className="muted">
          The battle map is the shared canvas for this game. Everyone in the
          game sees the same view in real time. Phase F6 is in early
          spike — only a shared test marker for now.
        </p>
        <Suspense
          fallback={<p className="muted">Loading canvas…</p>}
        >
          <SceneCanvasSpike />
        </Suspense>
      </section>
    </VttRoom>
  )
}
