import { useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_DICE_ANIMATION_MODE,
  prefersReducedMotion,
  resolveDicePresentation,
  type DiceTrayVariant,
} from '../settings/diceAnimation'
import { useThemeSettings } from '../themes/themeContext'

function detectWebGL(): boolean {
  if (typeof document === 'undefined') return true
  try {
    const canvas = document.createElement('canvas')
    return !!(
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
    )
  } catch {
    return false
  }
}

export function useDicePresentation(variant: DiceTrayVariant) {
  const { preferences } = useThemeSettings()
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion())
  const [webglAvailable] = useState(detectWebGL)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const mode = preferences.diceAnimation ?? DEFAULT_DICE_ANIMATION_MODE

  const presentation = useMemo(
    () =>
      resolveDicePresentation(mode, variant, {
        reducedMotion,
        webglAvailable,
      }),
    [mode, variant, reducedMotion, webglAvailable],
  )

  return { mode, presentation, webglAvailable, reducedMotion }
}
