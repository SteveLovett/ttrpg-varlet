import { useEffect, useRef, useState } from 'react'
import { Application, Assets, Container, Graphics, Sprite } from 'pixi.js'
import { useOthers, useSelf } from '@liveblocks/react'
import { useYjsDoc } from '../../hooks/useYjsDoc'
import { drawSquareGrid } from './drawGrid'
import type { SceneState } from './types'

type SceneCanvasProps = {
  mapUrl: string
  sceneState: SceneState
  sceneName: string
}

const MIN_SCALE = 0.05
const MAX_SCALE = 4

/**
 * Phase F6 slice 2 — map image, square grid overlay, pan (right-drag) and zoom
 * (scroll). Viewport is per-client; shared map metadata comes from Yjs/Postgres.
 */
export function SceneCanvas({ mapUrl, sceneState, sceneName }: SceneCanvasProps) {
  const { synced } = useYjsDoc()
  const self = useSelf()
  const others = useOthers()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const viewportRef = useRef<Container | null>(null)
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
        viewportRef.current = viewport

        const texture = await Assets.load(mapUrl)
        if (disposed) return

        const mapSprite = new Sprite(texture)
        const world = new Container()
        world.addChild(mapSprite)

        const grid = new Graphics()
        drawSquareGrid(grid, mapW, mapH, gridSize)
        world.addChild(grid)

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

        appRef.current = app
        setReady(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load battle map.')
      }
    })()

    return () => {
      disposed = true
      const current = appRef.current
      appRef.current = null
      viewportRef.current = null
      setReady(false)
      if (current) {
        const canvas = current.canvas
        canvas.removeEventListener('contextmenu', preventDefault)
        try {
          canvas.remove()
        } catch {
          /* detached */
        }
        void Assets.unload(mapUrl)
        current.destroy(true, { children: true, texture: true })
      }
    }
  }, [mapUrl, mapW, mapH, gridSize])

  const presenceCount = (self ? 1 : 0) + others.length

  return (
    <div className="vtt-canvas-wrapper">
      <header className="vtt-canvas-header">
        <strong>{sceneName}</strong>
        <span className="muted">
          {synced ? 'Live' : 'Connecting…'} · {presenceCount} in room · Right-drag
          pan · Scroll zoom
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

function preventDefault(e: Event) {
  e.preventDefault()
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
