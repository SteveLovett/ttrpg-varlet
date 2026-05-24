import { useEffect, useMemo, useRef, useState } from 'react'
import type { DiceColorThemeId } from '../../settings/diceColors'
import { getDiceTrayBackground, type DiceTrayBackgroundId } from '../../settings/diceTrayBackground'
import type { RollResult } from '../../rules/dnd5e/dice/types'
import { rollResultToDiceBoxNotation } from './rollToDiceBoxNotation'
import { createDiceBox, type DiceBoxInstance } from './diceBoxClient'

const INIT_POLL_MS = 50
const INIT_TIMEOUT_MS = 8000

type DiceBoxViewportProps = {
  colorThemeId: DiceColorThemeId
  backgroundId: DiceTrayBackgroundId
  /** When set, triggers a 3D roll animation. */
  rollResult: RollResult | null
  rolling: boolean
}

function rollAnimationKey(themeId: DiceColorThemeId, result: RollResult): string {
  return `${themeId}:${result.formula}:${result.total}:${result.dice.map((d) => d.value).join(',')}`
}

async function waitForBox(
  getBox: () => DiceBoxInstance | null,
  timeoutMs = INIT_TIMEOUT_MS,
): Promise<DiceBoxInstance | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const box = getBox()
    if (box) return box
    await new Promise<void>((resolve) => setTimeout(resolve, INIT_POLL_MS))
  }
  return null
}

export function DiceBoxViewport({
  colorThemeId,
  backgroundId,
  rollResult,
  rolling,
}: DiceBoxViewportProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const boxRef = useRef<DiceBoxInstance | null>(null)
  const initialThemeIdRef = useRef(colorThemeId)
  const [boxReady, setBoxReady] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const lastRollKey = useRef<string>('')

  const truncated = useMemo(() => {
    if (!rollResult) return false
    return rollResultToDiceBoxNotation(rollResult).truncated
  }, [rollResult])

  const trayBackground = useMemo(() => getDiceTrayBackground(backgroundId), [backgroundId])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let resizeObserver: ResizeObserver | undefined

    void (async () => {
      try {
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        })
        if (cancelled) return

        const instance = await createDiceBox(host, initialThemeIdRef.current)
        if (cancelled) {
          instance.destroy()
          return
        }
        boxRef.current = instance
        setInitError(null)
        setBoxReady(true)

        resizeObserver = new ResizeObserver(() => {
          window.dispatchEvent(new Event('resize'))
        })
        resizeObserver.observe(host)
      } catch (err) {
        if (!cancelled) {
          boxRef.current = null
          setBoxReady(false)
          setInitError(err instanceof Error ? err.message : 'Could not start 3D dice.')
        }
      }
    })()

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      boxRef.current?.destroy()
      boxRef.current = null
      setBoxReady(false)
    }
  }, [])

  useEffect(() => {
    if (!boxReady || !boxRef.current) return

    let cancelled = false

    void (async () => {
      try {
        await boxRef.current!.applyColorTheme(colorThemeId)
        if (!cancelled) {
          setInitError(null)
          lastRollKey.current = ''
        }
      } catch (err) {
        if (!cancelled) {
          setInitError(
            err instanceof Error ? err.message : 'Could not apply dice color theme.',
          )
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [colorThemeId, boxReady])

  useEffect(() => {
    if (!rolling || !rollResult) return

    let cancelled = false

    void (async () => {
      const box = await waitForBox(() => boxRef.current)
      if (cancelled || !box) return

      const key = rollAnimationKey(colorThemeId, rollResult)
      if (key === lastRollKey.current) return
      lastRollKey.current = key

      try {
        await box.rollResult(rollResult)
        if (!cancelled) {
          setInitError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : '3D roll failed.')
          lastRollKey.current = ''
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [rolling, rollResult, colorThemeId, boxReady])

  return (
    <div className="dice-box-viewport-wrap">
      <div
        ref={hostRef}
        id="dice-box-canvas-host"
        className={`dice-box-viewport dice-box-viewport--bg-${backgroundId}`}
        style={{ background: trayBackground.cssBackground }}
        aria-hidden={!!initError}
      />
      {initError ? (
        <p className="dice-box-viewport-fallback muted" role="status">
          {initError} Showing 2D results below.
        </p>
      ) : null}
      {truncated && !initError ? (
        <p className="dice-box-viewport-note muted">
          Showing the first 12 dice in 3D; extra dice appear in the breakdown below.
        </p>
      ) : null}
    </div>
  )
}
