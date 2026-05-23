import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import {
  Application,
  Assets,
  Circle,
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
} from 'pixi.js'
import { useOthers, useSelf } from '@liveblocks/react'
import { useYjsDoc } from '../../hooks/useYjsDoc'
import { drawSquareGrid } from './drawGrid'
import { drawLinePreview, syncDrawingsLayer } from './drawDrawings'
import { drawFogGuide, drawFogPreview, renderFogMaskSprite } from './drawFog'
import { isPointVisibleInFog, shouldHideTokensByFog } from './fogVisibility'
import { newDrawingId, type DrawingTool, type DrawingVisibility } from './drawingUtils'
import type { FogTool } from './fogUtils'
import type { PlacementMode } from './placementTypes'
import {
  canMoveToken,
  shouldSyncLiveDrag,
  snapTokenCenter,
  tokenRadiusPx,
} from './tokenUtils'
import type { DrawingShape, FogStroke, SceneState, TokenState } from './types'

type SceneCanvasProps = {
  mapUrl: string
  sceneState: SceneState
  sceneName: string
  tokens: Record<string, TokenState>
  selectedTokenId: string | null
  placementMode: PlacementMode | null
  isGM: boolean
  currentUserId: string | null
  onSelectToken: (id: string | null) => void
  onMoveToken: (id: string, x: number, y: number) => void
  onPlaceToken: (x: number, y: number) => void
  fogStrokes: FogStroke[]
  /** When set, render the fog mask as this player sees it. */
  fogViewerUserId: string | null
  showPlayerFog: boolean
  gmFogGuide: boolean
  fogTool: FogTool | null
  fogBrushRadius: number
  fogForPlayerId: string | null
  onFogStrokeStart: (stroke: FogStroke) => void
  onFogStrokeUpdate: (stroke: FogStroke) => void
  hideTokensInFog: boolean
  drawings: DrawingShape[]
  drawingTool: DrawingTool | null
  drawingColor: string
  drawingVisibility: DrawingVisibility
  textPlacementReady: boolean
  onDrawingStart: (shape: DrawingShape) => void
  onDrawingUpdate: (shape: DrawingShape) => void
  onPlaceTextDrawing: (x: number, y: number) => void
}

const MIN_SCALE = 0.05
const MAX_SCALE = 4

type PixiScene = {
  app: Application
  viewport: Container
  world: Container
  publicDrawingsLayer: Container
  fogMaskSprite: Sprite | null
  fogGuideGfx: Graphics
  fogPreviewGfx: Graphics
  drawingPreviewGfx: Graphics
  gmDrawingsLayer: Container
  tokensLayer: Container
}

type ActiveFogPaint = {
  stroke: FogStroke
  lastSyncX: number
  lastSyncY: number
  lastSyncAt: number
}

type ActiveLinePaint = {
  shape: DrawingShape & { kind: 'line' }
  lastSyncX: number
  lastSyncY: number
  lastSyncAt: number
}

type ActiveDrag = {
  tokenId: string
  container: Container
  sizeCells: TokenState['sizeCells']
  lastSyncX: number
  lastSyncY: number
  lastSyncAt: number
}

/**
 * Phase F6 slice 2–3 — map, grid, pan/zoom, draggable tokens (live Yjs sync + snap on release).
 */
export function SceneCanvas({
  mapUrl,
  sceneState,
  sceneName,
  tokens,
  selectedTokenId,
  placementMode,
  isGM,
  currentUserId,
  onSelectToken,
  onMoveToken,
  onPlaceToken,
  fogStrokes,
  fogViewerUserId,
  showPlayerFog,
  gmFogGuide,
  fogTool,
  fogBrushRadius,
  fogForPlayerId,
  onFogStrokeStart,
  onFogStrokeUpdate,
  hideTokensInFog,
  drawings,
  drawingTool,
  drawingColor,
  drawingVisibility,
  textPlacementReady,
  onDrawingStart,
  onDrawingUpdate,
  onPlaceTextDrawing,
}: SceneCanvasProps) {
  const { synced } = useYjsDoc()
  const self = useSelf()
  const others = useOthers()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<PixiScene | null>(null)
  const dragRef = useRef<ActiveDrag | null>(null)
  const fogPaintRef = useRef<ActiveFogPaint | null>(null)
  const linePaintRef = useRef<ActiveLinePaint | null>(null)
  const tokenViewsRef = useRef<Map<string, Container>>(new Map())

  const onSelectRef = useRef(onSelectToken)
  const onMoveRef = useRef(onMoveToken)
  const onPlaceRef = useRef(onPlaceToken)
  const placementRef = useRef(placementMode)
  const tokensRef = useRef(tokens)
  const selectedRef = useRef(selectedTokenId)
  const isGMRef = useRef(isGM)
  const userIdRef = useRef(currentUserId)
  const fogToolRef = useRef(fogTool)
  const fogBrushRef = useRef(fogBrushRadius)
  const fogForPlayerRef = useRef(fogForPlayerId)
  const onFogStartRef = useRef(onFogStrokeStart)
  const onFogUpdateRef = useRef(onFogStrokeUpdate)
  const drawingToolRef = useRef(drawingTool)
  const drawingColorRef = useRef(drawingColor)
  const drawingVisibilityRef = useRef(drawingVisibility)
  const textPlacementRef = useRef(textPlacementReady)
  const onDrawingStartRef = useRef(onDrawingStart)
  const onDrawingUpdateRef = useRef(onDrawingUpdate)
  const onPlaceTextRef = useRef(onPlaceTextDrawing)
  const fogStrokesRef = useRef(fogStrokes)
  const hideTokensInFogRef = useRef(hideTokensInFog)

  useEffect(() => {
    onSelectRef.current = onSelectToken
    onMoveRef.current = onMoveToken
    onPlaceRef.current = onPlaceToken
    placementRef.current = placementMode
    tokensRef.current = tokens
    selectedRef.current = selectedTokenId
    isGMRef.current = isGM
    userIdRef.current = currentUserId
    fogToolRef.current = fogTool
    fogBrushRef.current = fogBrushRadius
    fogForPlayerRef.current = fogForPlayerId
    onFogStartRef.current = onFogStrokeStart
    onFogUpdateRef.current = onFogStrokeUpdate
    drawingToolRef.current = drawingTool
    drawingColorRef.current = drawingColor
    drawingVisibilityRef.current = drawingVisibility
    textPlacementRef.current = textPlacementReady
    onDrawingStartRef.current = onDrawingStart
    onDrawingUpdateRef.current = onDrawingUpdate
    onPlaceTextRef.current = onPlaceTextDrawing
    fogStrokesRef.current = fogStrokes
    hideTokensInFogRef.current = hideTokensInFog
  }, [
    onSelectToken,
    onMoveToken,
    onPlaceToken,
    placementMode,
    tokens,
    selectedTokenId,
    isGM,
    currentUserId,
    fogTool,
    fogBrushRadius,
    fogForPlayerId,
    onFogStrokeStart,
    onFogStrokeUpdate,
    drawingTool,
    drawingColor,
    drawingVisibility,
    textPlacementReady,
    onDrawingStart,
    onDrawingUpdate,
    onPlaceTextDrawing,
    fogStrokes,
    hideTokensInFog,
  ])

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mapW = sceneState.mapWidthPx ?? 1
  const mapH = sceneState.mapHeightPx ?? 1
  const gridSize = sceneState.gridSizePx

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    const app = new Application()
    const pan = { active: false, lastX: 0, lastY: 0 }

    void (async () => {
      try {
        await app.init({
          background: 0x0f172a,
          antialias: true,
          resizeTo: host,
          autoDensity: true,
          resolution: window.devicePixelRatio || 1,
        })
        if (disposed) {
          app.destroy(true, { children: true })
          return
        }
        host.appendChild(app.canvas)

        const viewport = new Container()
        viewport.eventMode = 'static'
        app.stage.addChild(viewport)

        const texture = await Assets.load(mapUrl)
        if (disposed) return

        const mapSprite = new Sprite(texture)
        const world = new Container()
        world.eventMode = 'static'
        world.hitArea = new Rectangle(0, 0, mapW, mapH)
        world.addChild(mapSprite)

        const grid = new Graphics()
        drawSquareGrid(grid, mapW, mapH, gridSize)
        world.addChild(grid)

        const publicDrawingsLayer = new Container()
        publicDrawingsLayer.label = 'publicDrawings'
        world.addChild(publicDrawingsLayer)

        const fogGuideGfx = new Graphics()
        fogGuideGfx.label = 'fogGuide'
        world.addChild(fogGuideGfx)

        const fogPreviewGfx = new Graphics()
        fogPreviewGfx.label = 'fogPreview'
        world.addChild(fogPreviewGfx)

        const drawingPreviewGfx = new Graphics()
        drawingPreviewGfx.label = 'drawingPreview'
        world.addChild(drawingPreviewGfx)

        const tokensLayer = new Container()
        world.addChild(tokensLayer)

        const gmDrawingsLayer = new Container()
        gmDrawingsLayer.label = 'gmDrawings'
        world.addChild(gmDrawingsLayer)

        viewport.addChild(world)

        function fitToView() {
          const pad = 24
          const vw = app.screen.width - pad * 2
          const vh = app.screen.height - pad * 2
          const scale = Math.min(vw / mapW, vh / mapH, 1)
          viewport.scale.set(scale)
          viewport.position.set(
            (app.screen.width - mapW * scale) / 2,
            (app.screen.height - mapH * scale) / 2,
          )
        }
        fitToView()

        function zoomAt(screenX: number, screenY: number, factor: number) {
          const oldScale = viewport.scale.x
          const newScale = clamp(oldScale * factor, MIN_SCALE, MAX_SCALE)
          const worldX = (screenX - viewport.x) / oldScale
          const worldY = (screenY - viewport.y) / oldScale
          viewport.scale.set(newScale)
          viewport.position.set(
            screenX - worldX * newScale,
            screenY - worldY * newScale,
          )
        }

        function beginFogPaint(p: { x: number; y: number }) {
          const tool = fogToolRef.current
          const authorId = userIdRef.current
          if (!tool || !authorId) return
          const stroke: FogStroke = {
            id: crypto.randomUUID(),
            op: tool,
            points: [{ x: p.x, y: p.y }],
            radius: fogBrushRef.current,
            authorId,
            createdAt: new Date().toISOString(),
            forPlayerId: fogForPlayerRef.current,
          }
          fogPaintRef.current = {
            stroke,
            lastSyncX: p.x,
            lastSyncY: p.y,
            lastSyncAt: 0,
          }
          drawFogPreview(fogPreviewGfx, stroke)
          onFogStartRef.current(stroke)
        }

        function continueFogPaint(p: { x: number; y: number }) {
          const paint = fogPaintRef.current
          if (!paint) return
          const last = paint.stroke.points[paint.stroke.points.length - 1]
          if (last && last.x === p.x && last.y === p.y) return
          paint.stroke.points.push({ x: p.x, y: p.y })
          drawFogPreview(fogPreviewGfx, paint.stroke)
          if (
            shouldSyncLiveDrag(
              paint.lastSyncX,
              paint.lastSyncY,
              paint.lastSyncAt,
              p.x,
              p.y,
            )
          ) {
            paint.lastSyncX = p.x
            paint.lastSyncY = p.y
            paint.lastSyncAt = performance.now()
            onFogUpdateRef.current(paint.stroke)
          }
        }

        function endFogPaint() {
          const paint = fogPaintRef.current
          if (!paint) return
          fogPreviewGfx.clear()
          onFogUpdateRef.current(paint.stroke)
          fogPaintRef.current = null
        }

        function beginLinePaint(p: { x: number; y: number }) {
          if (drawingToolRef.current !== 'line' || !isGMRef.current) return
          const shape: DrawingShape = {
            id: newDrawingId(),
            kind: 'line',
            points: [{ x: p.x, y: p.y }],
            color: drawingColorRef.current,
            visibility: drawingVisibilityRef.current,
          }
          linePaintRef.current = {
            shape,
            lastSyncX: p.x,
            lastSyncY: p.y,
            lastSyncAt: 0,
          }
          drawLinePreview(drawingPreviewGfx, shape.points, shape.color)
          onDrawingStartRef.current(shape)
        }

        function continueLinePaint(p: { x: number; y: number }) {
          const paint = linePaintRef.current
          if (!paint) return
          const last = paint.shape.points[paint.shape.points.length - 1]
          if (last && last.x === p.x && last.y === p.y) return
          paint.shape.points.push({ x: p.x, y: p.y })
          drawLinePreview(drawingPreviewGfx, paint.shape.points, paint.shape.color)
          if (
            shouldSyncLiveDrag(
              paint.lastSyncX,
              paint.lastSyncY,
              paint.lastSyncAt,
              p.x,
              p.y,
            )
          ) {
            paint.lastSyncX = p.x
            paint.lastSyncY = p.y
            paint.lastSyncAt = performance.now()
            onDrawingUpdateRef.current(paint.shape)
          }
        }

        function endLinePaint() {
          const paint = linePaintRef.current
          if (!paint) return
          drawingPreviewGfx.clear()
          onDrawingUpdateRef.current(paint.shape)
          linePaintRef.current = null
        }

        world.on('pointerdown', (e: FederatedPointerEvent) => {
          if (e.button !== 0) return
          const p = e.getLocalPosition(world)
          if (fogToolRef.current && isGMRef.current) {
            e.stopPropagation()
            beginFogPaint(p)
            return
          }
          if (drawingToolRef.current === 'line' && isGMRef.current) {
            e.stopPropagation()
            beginLinePaint(p)
            return
          }
          if (textPlacementRef.current && isGMRef.current) {
            e.stopPropagation()
            onPlaceTextRef.current(p.x, p.y)
            return
          }
          if (!placementRef.current) return
          onPlaceRef.current(p.x, p.y)
        })

        app.stage.eventMode = 'static'
        app.stage.on('globalpointermove', (e: FederatedPointerEvent) => {
          const fogPaint = fogPaintRef.current
          if (fogPaint) {
            const p = e.getLocalPosition(world)
            continueFogPaint(p)
            return
          }
          const linePaint = linePaintRef.current
          if (linePaint) {
            const p = e.getLocalPosition(world)
            continueLinePaint(p)
            return
          }
          const drag = dragRef.current
          if (!drag) return
          const p = e.getLocalPosition(world)
          drag.container.position.set(p.x, p.y)
          if (
            shouldSyncLiveDrag(drag.lastSyncX, drag.lastSyncY, drag.lastSyncAt, p.x, p.y)
          ) {
            drag.lastSyncX = p.x
            drag.lastSyncY = p.y
            drag.lastSyncAt = performance.now()
            onMoveRef.current(drag.tokenId, p.x, p.y)
          }
        })

        function endDrag(e: FederatedPointerEvent) {
          if (fogPaintRef.current) {
            endFogPaint()
            e.stopPropagation()
            return
          }
          if (linePaintRef.current) {
            endLinePaint()
            e.stopPropagation()
            return
          }
          const drag = dragRef.current
          if (!drag) return
          const token = tokensRef.current[drag.tokenId]
          if (token) {
            const snapped = snapTokenCenter(
              drag.container.x,
              drag.container.y,
              gridSize,
              mapW,
              mapH,
              drag.sizeCells,
            )
            drag.container.position.set(snapped.x, snapped.y)
            onMoveRef.current(drag.tokenId, snapped.x, snapped.y)
            drag.container.cursor = canMoveToken(token, userIdRef.current, isGMRef.current)
              ? 'grab'
              : 'default'
          }
          dragRef.current = null
          e.stopPropagation()
        }

        app.stage.on('pointerup', endDrag)
        app.stage.on('pointerupoutside', endDrag)

        const canvas = app.canvas
        canvas.addEventListener('contextmenu', preventDefault)
        canvas.addEventListener(
          'wheel',
          (e) => {
            e.preventDefault()
            const factor = e.deltaY < 0 ? 1.1 : 0.9
            zoomAt(e.offsetX, e.offsetY, factor)
          },
          { passive: false },
        )

        canvas.addEventListener('pointerdown', (e) => {
          if (e.button !== 2) return
          e.preventDefault()
          pan.active = true
          pan.lastX = e.clientX
          pan.lastY = e.clientY
          canvas.setPointerCapture(e.pointerId)
        })
        canvas.addEventListener('pointermove', (e) => {
          if (!pan.active) return
          const dx = e.clientX - pan.lastX
          const dy = e.clientY - pan.lastY
          pan.lastX = e.clientX
          pan.lastY = e.clientY
          viewport.position.x += dx
          viewport.position.y += dy
        })
        function endPan(e: PointerEvent) {
          if (!pan.active) return
          pan.active = false
          try {
            canvas.releasePointerCapture(e.pointerId)
          } catch {
            /* already released */
          }
        }
        canvas.addEventListener('pointerup', endPan)
        canvas.addEventListener('pointercancel', endPan)

        sceneRef.current = {
          app,
          viewport,
          world,
          publicDrawingsLayer,
          fogMaskSprite: null,
          fogGuideGfx,
          fogPreviewGfx,
          drawingPreviewGfx,
          gmDrawingsLayer,
          tokensLayer,
        }
        tokenViewsRef.current = new Map()
        setReady(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load battle map.')
      }
    })()

    return () => {
      disposed = true
      dragRef.current = null
      fogPaintRef.current = null
      linePaintRef.current = null
      const current = sceneRef.current
      sceneRef.current = null
      tokenViewsRef.current = new Map()
      setReady(false)
      if (current) {
        const canvas = current.app.canvas
        canvas.removeEventListener('contextmenu', preventDefault)
        try {
          canvas.remove()
        } catch {
          /* detached */
        }
        void Assets.unload(mapUrl)
        current.app.destroy(true, { children: true, texture: true })
      }
    }
  }, [mapUrl, mapW, mapH, gridSize])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || !ready) return

    const { tokensLayer } = scene
    const views = tokenViewsRef.current
    const draggingId = dragRef.current?.tokenId

    for (const [id, container] of [...views.entries()]) {
      if (!tokens[id]) {
        tokensLayer.removeChild(container)
        container.destroy({ children: true })
        views.delete(id)
      }
    }

    for (const token of Object.values(tokens)) {
      if (token.id === draggingId) continue

      let container = views.get(token.id)
      if (!container) {
        container = buildTokenContainer(token, gridSize, () => {
          const t = tokensRef.current[token.id]
          return t ? canMoveToken(t, userIdRef.current, isGMRef.current) : false
        })
        attachTokenHandlers(container, token, {
          dragRef,
          placementRef,
          fogToolRef,
          drawingToolRef,
          textPlacementRef,
          onSelectRef,
          tokensRef,
          userIdRef,
          isGMRef,
        })
        views.set(token.id, container)
        tokensLayer.addChild(container)
      }

      updateTokenVisual(
        container,
        token,
        gridSize,
        token.id === selectedRef.current,
      )
      container.position.set(token.x, token.y)

      const applyTokenFog = shouldHideTokensByFog(
        hideTokensInFogRef.current,
        showPlayerFog,
        fogViewerUserId,
      )
      if (applyTokenFog && fogViewerUserId && token.id !== draggingId) {
        const visible = isPointVisibleInFog(
          token.x,
          token.y,
          fogStrokesRef.current,
          fogViewerUserId,
        )
        container.visible = visible
        container.eventMode = visible ? 'static' : 'none'
      } else {
        container.visible = true
        container.eventMode = 'static'
      }
    }
  }, [
    tokens,
    selectedTokenId,
    gridSize,
    mapW,
    mapH,
    ready,
    hideTokensInFog,
    showPlayerFog,
    fogViewerUserId,
    fogStrokes,
  ])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || !ready) return

    const { world, app, fogGuideGfx, tokensLayer } = scene

    if (scene.fogMaskSprite) {
      world.removeChild(scene.fogMaskSprite)
      scene.fogMaskSprite.texture.destroy(true)
      scene.fogMaskSprite.destroy()
      scene.fogMaskSprite = null
    }

    if (showPlayerFog && fogViewerUserId) {
      const sprite = renderFogMaskSprite(app, mapW, mapH, fogStrokes, fogViewerUserId)
      scene.fogMaskSprite = sprite
      const tokenIndex = world.getChildIndex(tokensLayer)
      world.addChildAt(sprite, tokenIndex)
    }

    if (gmFogGuide) {
      drawFogGuide(fogGuideGfx, fogStrokes)
      fogGuideGfx.visible = true
    } else {
      fogGuideGfx.clear()
      fogGuideGfx.visible = false
    }
  }, [fogStrokes, showPlayerFog, fogViewerUserId, gmFogGuide, mapW, mapH, ready])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || !ready) return
    syncDrawingsLayer(scene.publicDrawingsLayer, drawings, isGM, 'public')
    syncDrawingsLayer(scene.gmDrawingsLayer, drawings, isGM, 'gm')
  }, [drawings, isGM, ready])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    if (fogTool || drawingTool === 'line' || textPlacementReady) {
      scene.world.cursor = 'crosshair'
      return
    }
    scene.world.cursor = placementMode ? 'crosshair' : 'default'
  }, [placementMode, fogTool, drawingTool, textPlacementReady])

  const presenceCount = (self ? 1 : 0) + others.length
  const placing = placementMode !== null
  const fogPainting = fogTool !== null
  const lineDrawing = drawingTool === 'line'
  const textPlacing = textPlacementReady

  return (
    <div className="vtt-canvas-wrapper">
      <header className="vtt-canvas-header">
        <strong>{sceneName}</strong>
        <span className="muted">
          {synced ? 'Live' : 'Connecting…'} · {presenceCount} in room · Right-drag
          pan · Scroll zoom
          {fogPainting
            ? ' · Paint fog (left drag)'
            : lineDrawing
              ? ' · Draw line (left drag)'
              : textPlacing
                ? ' · Click map to place text'
                : placing
                  ? ' · Click map to place token'
                  : ' · Drag tokens (live for everyone, snap on release)'}
        </span>
      </header>
      <div ref={hostRef} className="vtt-canvas-host" aria-label="Battle map canvas" />
      {!ready && !error ? <p className="muted vtt-canvas-loading">Loading map…</p> : null}
      {error ? (
        <p className="vtt-canvas-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function buildTokenContainer(
  token: TokenState,
  gridSize: number,
  canMove: () => boolean,
): Container {
  const container = new Container()
  container.eventMode = 'static'
  const radius = tokenRadiusPx(token, gridSize)
  container.hitArea = new Circle(0, 0, radius + 4)
  container.cursor = canMove() ? 'grab' : 'default'

  const disc = new Graphics()
  disc.label = 'disc'
  const label = new Text({
    text: token.label,
    style: new TextStyle({
      fill: 0xffffff,
      fontSize: Math.max(10, radius * 0.85),
      fontWeight: '700',
      align: 'center',
    }),
  })
  label.anchor.set(0.5)
  label.label = 'label'

  container.addChild(disc, label)
  return container
}

function updateTokenVisual(
  container: Container,
  token: TokenState,
  gridSize: number,
  selected: boolean,
) {
  const radius = tokenRadiusPx(token, gridSize)
  const disc = container.getChildByLabel('disc') as Graphics
  const label = container.getChildByLabel('label') as Text
  const color = hexColor(token.color)

  disc.clear()
  disc.circle(0, 0, radius)
  disc.fill({ color })
  if (selected) {
    disc.circle(0, 0, radius + 3)
    disc.stroke({ width: 2, color: 0xfacc15 })
  }

  label.text = token.label
  label.style.fontSize = Math.max(10, radius * 0.85)
  container.hitArea = new Circle(0, 0, radius + 4)
}

function attachTokenHandlers(
  container: Container,
  token: TokenState,
  refs: {
    dragRef: MutableRefObject<ActiveDrag | null>
    placementRef: MutableRefObject<PlacementMode | null>
    fogToolRef: MutableRefObject<FogTool | null>
    drawingToolRef: MutableRefObject<DrawingTool | null>
    textPlacementRef: MutableRefObject<boolean>
    onSelectRef: MutableRefObject<(id: string | null) => void>
    tokensRef: MutableRefObject<Record<string, TokenState>>
    userIdRef: MutableRefObject<string | null>
    isGMRef: MutableRefObject<boolean>
  },
) {
  container.on('pointerdown', (e: FederatedPointerEvent) => {
    e.stopPropagation()
    if (e.button !== 0) return

    const live = refs.tokensRef.current[token.id] ?? token
    refs.onSelectRef.current(live.id)

    if (
      refs.placementRef.current ||
      refs.fogToolRef.current ||
      refs.drawingToolRef.current === 'line' ||
      refs.textPlacementRef.current
    ) {
      return
    }
    if (!canMoveToken(live, refs.userIdRef.current, refs.isGMRef.current)) return

    refs.dragRef.current = {
      tokenId: live.id,
      container,
      sizeCells: live.sizeCells,
      lastSyncX: live.x,
      lastSyncY: live.y,
      lastSyncAt: 0,
    }
    container.cursor = 'grabbing'
  })
}

function hexColor(css: string): number {
  const hex = css.replace('#', '')
  const n = Number.parseInt(hex, 16)
  return Number.isFinite(n) ? n : 0xdc2626
}

function preventDefault(e: Event) {
  e.preventDefault()
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
