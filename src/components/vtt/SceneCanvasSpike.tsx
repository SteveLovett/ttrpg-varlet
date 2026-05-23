import { useEffect, useRef, useState } from 'react'
import { Application, Container, Graphics, Text } from 'pixi.js'
import { useOthers, useSelf } from '@liveblocks/react'
import { useYjsDoc } from '../../hooks/useYjsDoc'
import { SPIKE_MARKER_KEY } from './types'

/**
 * Phase F6 spike — minimum demo that a Yjs document inside the F5
 * Liveblocks room round-trips between browsers and can drive a Pixi v8
 * canvas. There are no tokens, fog, or maps here; only a single shared
 * marker. Clicking the canvas moves the marker for every connected
 * viewer.
 *
 * Will be replaced by the real SceneCanvas in the next slice.
 */
export function SceneCanvasSpike() {
  const { doc, synced } = useYjsDoc()
  const self = useSelf()
  const others = useOthers()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<Graphics | null>(null)
  const appRef = useRef<Application | null>(null)
  const [pixiReady, setPixiReady] = useState(false)
  const [pixiError, setPixiError] = useState<string | null>(null)

  /* ----- Pixi lifecycle ------------------------------------------------- */
  useEffect(() => {
    const host = containerRef.current
    if (!host) return
    let disposed = false
    const app = new Application()

    void (async () => {
      try {
        await app.init({
          background: 0x111827,
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

        const stage: Container = app.stage
        stage.eventMode = 'static'
        stage.hitArea = app.screen

        const marker = new Graphics()
        marker.circle(0, 0, 18).fill({ color: 0xdc2626 }).stroke({ color: 0xffffff, width: 2 })
        marker.position.set(app.screen.width / 2, app.screen.height / 2)
        stage.addChild(marker)
        markerRef.current = marker

        const hint = new Text({
          text: 'Click anywhere — others in this room will see the marker move.',
          style: { fill: 0x9ca3af, fontSize: 13, fontFamily: 'system-ui, sans-serif' },
        })
        hint.position.set(12, 12)
        stage.addChild(hint)

        appRef.current = app
        setPixiReady(true)
      } catch (err) {
        setPixiError(err instanceof Error ? err.message : 'Pixi failed to start.')
      }
    })()

    return () => {
      disposed = true
      const current = appRef.current
      appRef.current = null
      markerRef.current = null
      setPixiReady(false)
      if (current) {
        try {
          current.canvas.remove()
        } catch {
          /* canvas may already be detached if init aborted */
        }
        current.destroy(true, { children: true, texture: true })
      }
    }
  }, [])

  /* ----- Yjs <-> Pixi sync ---------------------------------------------- */
  useEffect(() => {
    if (!pixiReady) return
    const app = appRef.current
    const marker = markerRef.current
    if (!app || !marker) return

    const spike = doc.getMap<number | string>(SPIKE_MARKER_KEY)

    function syncFromYjs() {
      const x = spike.get('x')
      const y = spike.get('y')
      if (typeof x === 'number' && typeof y === 'number') {
        marker!.position.set(x * app!.screen.width, y * app!.screen.height)
      }
    }

    if (synced && !spike.has('x')) {
      // First client into the room initializes the marker at center so other
      // late joiners see something rather than a blank canvas.
      doc.transact(() => {
        spike.set('x', 0.5)
        spike.set('y', 0.5)
        spike.set('color', '#dc2626')
      })
    }
    syncFromYjs()
    const observer = () => syncFromYjs()
    spike.observe(observer)

    function handleClick(e: { global: { x: number; y: number } }) {
      const px = e.global.x / app!.screen.width
      const py = e.global.y / app!.screen.height
      doc.transact(() => {
        spike.set('x', clamp01(px))
        spike.set('y', clamp01(py))
      })
    }
    app.stage.on('pointerdown', handleClick)

    return () => {
      spike.unobserve(observer)
      app.stage.off('pointerdown', handleClick)
    }
  }, [doc, synced, pixiReady])

  const presenceCount = (self ? 1 : 0) + others.length

  return (
    <div className="vtt-canvas-wrapper">
      <header className="vtt-canvas-header">
        <span className="vtt-spike-badge">F6 spike</span>
        <span className="muted">
          {synced ? 'Yjs synced' : 'Connecting…'} · {presenceCount} in room
        </span>
      </header>
      <div ref={containerRef} className="vtt-canvas-host" aria-label="VTT canvas" />
      {pixiError ? (
        <p className="vtt-canvas-error" role="alert">
          Pixi error: {pixiError}
        </p>
      ) : null}
    </div>
  )
}

function clamp01(n: number): number {
  if (n < 0) return 0
  if (n > 1) return 1
  return n
}
