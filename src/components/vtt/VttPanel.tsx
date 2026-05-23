import { Suspense, lazy, useCallback, useEffect, useState, type FormEvent } from 'react'
import { NumericInput } from '../NumericInput'
import { useYjsDoc } from '../../hooks/useYjsDoc'
import { useYjsDrawings } from '../../hooks/useYjsDrawings'
import { useYjsFog } from '../../hooks/useYjsFog'
import { useYjsTokens } from '../../hooks/useYjsTokens'
import { useVttScene } from '../../hooks/useVttScene'
import { useVttSceneSync } from '../../hooks/useVttSceneSync'
import { DrawingTools } from './DrawingTools'
import { FogTools, type VttMemberOption } from './FogTools'
import {
  DRAWING_COLORS,
  newDrawingId,
  type DrawingTool,
  type DrawingVisibility,
} from './drawingUtils'
import type { FogTool } from './fogUtils'
import type { PlacementMode } from './placementTypes'
import { SceneSetupForm } from './SceneSetupForm'
import { TokenTray } from './TokenTray'
import { tokenFromPlacement } from './tokenPlacement'
import { sceneStateFromRow, writeYjsScene } from './yjsScene'
import { canDeleteToken, snapTokenCenter } from './tokenUtils'
import type { DrawingShape, FogStroke } from './types'

const SceneCanvas = lazy(() =>
  import('./SceneCanvas').then((m) => ({ default: m.SceneCanvas })),
)

type VttPanelProps = {
  gameId: string
  isGM: boolean
  currentUserId: string | null
  members: VttMemberOption[]
}

/**
 * Phase F6 — scene CRUD, map canvas, Yjs tokens (slice 3).
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

export function VttPanel({ gameId, isGM, currentUserId, members }: VttPanelProps) {
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
  const { tokens, addToken, deleteToken, moveToken } = useYjsTokens(doc, {
    synced,
    scene,
  })
  const { fogStrokes, addFogStroke, updateFogStroke, resetFog } = useYjsFog(doc, {
    synced,
    scene,
  })
  const { drawings, addDrawing, updateDrawing, resetDrawings } = useYjsDrawings(doc, {
    synced,
    scene,
  })

  const [placementMode, setPlacementMode] = useState<PlacementMode | null>(null)
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null)
  const [fogTool, setFogTool] = useState<FogTool | null>(null)
  const [fogBrushRadius, setFogBrushRadius] = useState(48)
  const [fogForPlayerId, setFogForPlayerId] = useState<string | null>(null)
  const [gmFogPreview, setGmFogPreview] = useState(false)
  const [previewPlayerId, setPreviewPlayerId] = useState<string | null>(null)
  const [drawingTool, setDrawingTool] = useState<DrawingTool | null>(null)
  const [drawingColor, setDrawingColor] = useState<string>(DRAWING_COLORS[3]!)
  const [drawingVisibility, setDrawingVisibility] =
    useState<DrawingVisibility>('all')
  const [drawingTextDraft, setDrawingTextDraft] = useState('')
  const [textPlacementReady, setTextPlacementReady] = useState(false)

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

  const handlePlaceToken = useCallback(
    (worldX: number, worldY: number) => {
      if (!placementMode || !currentUserId || !liveScene) return
      const mapW = liveScene.mapWidthPx ?? 1
      const mapH = liveScene.mapHeightPx ?? 1
      const snapped = snapTokenCenter(
        worldX,
        worldY,
        liveScene.gridSizePx,
        mapW,
        mapH,
        placementMode.sizeCells,
      )
      addToken(tokenFromPlacement(placementMode, snapped.x, snapped.y, currentUserId))
      setPlacementMode(null)
    },
    [placementMode, currentUserId, liveScene, addToken],
  )

  const showPlayerFog = isGM ? gmFogPreview && !!previewPlayerId : !!currentUserId
  const fogViewerUserId = isGM
    ? previewPlayerId
    : currentUserId
  const gmFogGuide = isGM && !showPlayerFog
  const hideTokensInFog = liveScene?.hideTokensInFog ?? false

  const handleHideTokensInFog = useCallback(
    (enabled: boolean) => {
      if (!liveScene) return
      writeYjsScene(doc, { ...liveScene, hideTokensInFog: enabled })
    },
    [doc, liveScene],
  )

  const handleFogStrokeStart = useCallback(
    (stroke: FogStroke) => {
      addFogStroke(stroke)
    },
    [addFogStroke],
  )

  const handleFogStrokeUpdate = useCallback(
    (stroke: FogStroke) => {
      updateFogStroke(stroke)
    },
    [updateFogStroke],
  )

  const handleDrawingStart = useCallback(
    (shape: DrawingShape) => {
      addDrawing(shape)
    },
    [addDrawing],
  )

  const handleDrawingUpdate = useCallback(
    (shape: DrawingShape) => {
      updateDrawing(shape)
    },
    [updateDrawing],
  )

  const handlePlaceTextDrawing = useCallback(
    (worldX: number, worldY: number) => {
      if (!textPlacementReady || !drawingTextDraft.trim()) return
      addDrawing({
        id: newDrawingId(),
        kind: 'text',
        x: worldX,
        y: worldY,
        text: drawingTextDraft.trim(),
        color: drawingColor,
        visibility: drawingVisibility,
      })
      setTextPlacementReady(false)
    },
    [
      textPlacementReady,
      drawingTextDraft,
      drawingColor,
      drawingVisibility,
      addDrawing,
    ],
  )

  const handleClearDrawings = useCallback(() => {
    if (!window.confirm('Clear all drawings on this map?')) return
    resetDrawings()
  }, [resetDrawings])

  const handleClearFog = useCallback(() => {
    if (
      !window.confirm(
        'Clear all fog strokes? Players will see a fully hidden map until you reveal again.',
      )
    ) {
      return
    }
    resetFog()
  }, [resetFog])

  const handleDeleteToken = useCallback(
    (tokenId: string) => {
      const token = tokens[tokenId]
      if (!token || !canDeleteToken(token, currentUserId, isGM)) return
      deleteToken(tokenId)
      if (selectedTokenId === tokenId) setSelectedTokenId(null)
    },
    [tokens, currentUserId, isGM, deleteToken, selectedTokenId],
  )

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
      writeYjsScene(doc, { ...liveScene, gridSizePx, hideTokensInFog: liveScene.hideTokensInFog })
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

      <div className="vtt-stage">
        <div className="vtt-sidebar">
          <FogTools
            isGM={isGM}
            members={members}
            fogTool={fogTool}
            brushRadius={fogBrushRadius}
            forPlayerId={fogForPlayerId}
            previewAsPlayer={gmFogPreview}
            previewPlayerId={previewPlayerId}
            hideTokensInFog={hideTokensInFog}
            onFogToolChange={(tool) => {
              setFogTool(tool)
              if (tool) {
                setPlacementMode(null)
                setDrawingTool(null)
                setTextPlacementReady(false)
              }
            }}
            onBrushRadiusChange={setFogBrushRadius}
            onForPlayerIdChange={setFogForPlayerId}
            onPreviewAsPlayerChange={setGmFogPreview}
            onPreviewPlayerIdChange={setPreviewPlayerId}
            onHideTokensInFogChange={handleHideTokensInFog}
            onClearFog={handleClearFog}
          />
          {isGM ? (
            <DrawingTools
              drawingTool={drawingTool}
              drawingColor={drawingColor}
              drawingVisibility={drawingVisibility}
              textDraft={drawingTextDraft}
              textPlacementReady={textPlacementReady}
              onDrawingToolChange={(tool) => {
                setDrawingTool(tool)
                if (tool) {
                  setFogTool(null)
                  setPlacementMode(null)
                }
                if (tool !== 'text') setTextPlacementReady(false)
              }}
              onDrawingColorChange={setDrawingColor}
              onDrawingVisibilityChange={setDrawingVisibility}
              onTextDraftChange={setDrawingTextDraft}
              onTextPlacementReadyChange={setTextPlacementReady}
              onClearDrawings={handleClearDrawings}
            />
          ) : null}
          <TokenTray
            gameId={gameId}
            isGM={isGM}
            currentUserId={currentUserId}
            tokens={tokens}
            placementMode={placementMode}
            selectedTokenId={selectedTokenId}
            onPlacementModeChange={(mode) => {
              setPlacementMode(mode)
              if (mode) {
                setFogTool(null)
                setDrawingTool(null)
                setTextPlacementReady(false)
              }
            }}
            onSelectToken={setSelectedTokenId}
            onDeleteToken={handleDeleteToken}
          />
        </div>

        {mapUrl && liveScene ? (
          <Suspense fallback={<div className="vtt-skeleton" aria-hidden />}>
            <SceneCanvas
              mapUrl={mapUrl}
              sceneState={liveScene}
              sceneName={scene.name}
              tokens={tokens}
              selectedTokenId={selectedTokenId}
              placementMode={placementMode}
              isGM={isGM}
              currentUserId={currentUserId}
              onSelectToken={setSelectedTokenId}
              onMoveToken={moveToken}
              onPlaceToken={handlePlaceToken}
              fogStrokes={fogStrokes}
              fogViewerUserId={fogViewerUserId}
              showPlayerFog={showPlayerFog}
              gmFogGuide={gmFogGuide}
              fogTool={fogTool}
              fogBrushRadius={fogBrushRadius}
              fogForPlayerId={fogForPlayerId}
              onFogStrokeStart={handleFogStrokeStart}
              onFogStrokeUpdate={handleFogStrokeUpdate}
              hideTokensInFog={hideTokensInFog}
              drawings={drawings}
              drawingTool={drawingTool}
              drawingColor={drawingColor}
              drawingVisibility={drawingVisibility}
              textPlacementReady={textPlacementReady}
              onDrawingStart={handleDrawingStart}
              onDrawingUpdate={handleDrawingUpdate}
              onPlaceTextDrawing={handlePlaceTextDrawing}
            />
          </Suspense>
        ) : (
          <div className="vtt-skeleton" aria-hidden />
        )}
      </div>
    </section>
  )
}
