import { Suspense, lazy, useEffect, useState, type FormEvent } from 'react'
import { NumericInput } from '../NumericInput'
import { useYjsDoc } from '../../hooks/useYjsDoc'
import { useVttScene } from '../../hooks/useVttScene'
import { useVttSceneSync } from '../../hooks/useVttSceneSync'
import { sceneStateFromRow, writeYjsScene } from './yjsScene'
import { SceneSetupForm } from './SceneSetupForm'

const SceneCanvas = lazy(() =>
  import('./SceneCanvas').then((m) => ({ default: m.SceneCanvas })),
)

type VttPanelProps = {
  gameId: string
  isGM: boolean
}

/**
 * Phase F6 slice 2 — scene CRUD, map upload, Pixi canvas with grid and pan/zoom.
 * Expects to render inside `GameLiveRoom` (Liveblocks + Yjs already connected).
 */
function GridSizeField({
  sceneId,
  initialGrid,
  disabled,
  onSave,
}: {
  sceneId: string
  initialGrid: number
  disabled: boolean
  onSave: (gridSizePx: number) => Promise<string | null>
}) {
  const [gridDraft, setGridDraft] = useState(initialGrid)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setInfo(null)
    const err = await onSave(gridDraft)
    setBusy(false)
    setInfo(err ?? 'Grid size updated.')
  }

  return (
    <form className="vtt-grid-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="form-row">
        <label htmlFor={`vtt-grid-edit-${sceneId}`}>Grid size (px)</label>
        <NumericInput
          id={`vtt-grid-edit-${sceneId}`}
          min={8}
          max={512}
          emptyFallback={initialGrid}
          value={gridDraft}
          onChange={setGridDraft}
          disabled={disabled || busy}
        />
      </div>
      <button type="submit" disabled={disabled || busy}>
        {busy ? 'Saving…' : 'Update grid'}
      </button>
      {info ? <p className="muted">{info}</p> : null}
    </form>
  )
}

export function VttPanel({ gameId, isGM }: VttPanelProps) {
  const {
    scene,
    loading,
    error,
    load,
    createSceneWithMap,
    replaceMap,
    updateGridSize,
    getMapSignedUrl,
    saveSnapshot,
  } = useVttScene(gameId)

  const { doc, synced } = useYjsDoc()
  const liveScene = useVttSceneSync({ doc, synced, scene, isGM, saveSnapshot })

  const [signedMap, setSignedMap] = useState<{
    path: string
    url: string | null
    error: string | null
  } | null>(null)
  const [replaceBusy, setReplaceBusy] = useState(false)
  const [replaceError, setReplaceError] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  const mapPath = liveScene?.mapPath ?? scene?.map_path ?? null
  const mapUrl =
    mapPath && signedMap?.path === mapPath && signedMap.url ? signedMap.url : null
  const mapUrlError =
    mapPath && signedMap?.path === mapPath ? signedMap.error : null

  useEffect(() => {
    if (!mapPath) return
    let cancelled = false
    void (async () => {
      const url = await getMapSignedUrl(mapPath)
      if (cancelled) return
      setSignedMap({
        path: mapPath,
        url,
        error: url ? null : 'Could not load map image URL.',
      })
    })()
    return () => {
      cancelled = true
    }
  }, [mapPath, getMapSignedUrl])

  async function handleCreate(input: {
    name: string
    gridSizePx: number
    file: File
  }): Promise<string | null> {
    const outcome = await createSceneWithMap(input)
    if ('error' in outcome) return outcome.error
    writeYjsScene(doc, sceneStateFromRow(outcome.scene))
    return null
  }

  async function handleReplaceMap(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!scene || !isGM) return
    const fileInput = e.currentTarget.elements.namedItem('replace-map') as HTMLInputElement
    const file = fileInput.files?.[0]
    if (!file) {
      setReplaceError('Choose an image file.')
      return
    }
    setReplaceBusy(true)
    setReplaceError(null)
    const outcome = await replaceMap(scene.id, file)
    setReplaceBusy(false)
    if ('error' in outcome) {
      setReplaceError(outcome.error)
      return
    }
    writeYjsScene(doc, sceneStateFromRow(outcome.scene))
    fileInput.value = ''
  }

  async function handleGridSave(gridSizePx: number): Promise<string | null> {
    if (!scene || !isGM) return 'Not allowed.'
    const err = await updateGridSize(scene.id, gridSizePx)
    if (err) return err
    if (liveScene) {
      writeYjsScene(doc, { ...liveScene, gridSizePx })
    }
    return null
  }

  if (loading) {
    return (
      <section className="vtt-panel">
        <div className="vtt-skeleton" aria-hidden />
        <p className="muted">Loading battle map…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="vtt-panel">
        <p>{error}</p>
        <p className="muted">
          If the table is missing, run <code>supabase db push</code> for Phase F6
          migrations.
        </p>
      </section>
    )
  }

  if (!scene) {
    return (
      <section className="vtt-panel">
        {isGM ? (
          <SceneSetupForm onSubmit={handleCreate} />
        ) : (
          <p className="muted">
            The Game Master has not set up a battle map for this game yet.
          </p>
        )}
      </section>
    )
  }

  if (!mapPath || !liveScene?.mapWidthPx || !liveScene.mapHeightPx) {
    return (
      <section className="vtt-panel">
        <p className="muted">Map is still uploading or missing. Try refreshing.</p>
        {isGM ? <SceneSetupForm onSubmit={handleCreate} /> : null}
      </section>
    )
  }

  return (
    <section className="vtt-panel">
      {isGM ? (
        <details className="vtt-gm-tools">
          <summary>GM map tools</summary>
          <GridSizeField
            key={scene.id}
            sceneId={scene.id}
            initialGrid={scene.grid_size_px}
            disabled={!isGM}
            onSave={handleGridSave}
          />
          <form className="vtt-replace-form" onSubmit={(e) => void handleReplaceMap(e)}>
            <div className="form-row">
              <label htmlFor="replace-map">Replace map image</label>
              <input
                id="replace-map"
                name="replace-map"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={replaceBusy}
              />
            </div>
            <button type="submit" disabled={replaceBusy}>
              {replaceBusy ? 'Uploading…' : 'Replace map'}
            </button>
            {replaceError ? <p>{replaceError}</p> : null}
          </form>
        </details>
      ) : null}

      {mapUrlError ? <p>{mapUrlError}</p> : null}

      {mapUrl && liveScene ? (
        <Suspense fallback={<div className="vtt-skeleton" aria-hidden />}>
          <SceneCanvas mapUrl={mapUrl} sceneState={liveScene} sceneName={scene.name} />
        </Suspense>
      ) : (
        <div className="vtt-skeleton" aria-hidden />
      )}
    </section>
  )
}
