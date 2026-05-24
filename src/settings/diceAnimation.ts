export const DICE_ANIMATION_MODES = ['auto', 'instant', 'pseudo3d', 'full3d'] as const

export type DiceAnimationMode = (typeof DICE_ANIMATION_MODES)[number]

export const DEFAULT_DICE_ANIMATION_MODE: DiceAnimationMode = 'auto'

export function parseDiceAnimationMode(raw: unknown): DiceAnimationMode {
  if (typeof raw === 'string' && (DICE_ANIMATION_MODES as readonly string[]).includes(raw)) {
    return raw as DiceAnimationMode
  }
  return DEFAULT_DICE_ANIMATION_MODE
}

export type DiceTrayVariant = 'compact' | 'full'

export type ResolvedDicePresentation = {
  /** Show pseudo-3D CSS dice (compact tray). */
  pseudo3d: boolean
  /** Run WebGL dice-box animation (full tray). */
  full3d: boolean
  /** Skip all animation delays. */
  instant: boolean
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function resolveDicePresentation(
  mode: DiceAnimationMode,
  variant: DiceTrayVariant,
  options?: { reducedMotion?: boolean; webglAvailable?: boolean },
): ResolvedDicePresentation {
  const reduced = options?.reducedMotion ?? prefersReducedMotion()
  const webgl = options?.webglAvailable ?? true

  if (mode === 'instant' || reduced) {
    return { pseudo3d: false, full3d: false, instant: true }
  }

  if (mode === 'pseudo3d') {
    return { pseudo3d: true, full3d: false, instant: false }
  }

  if (mode === 'full3d') {
    if (variant === 'full' && webgl) {
      return { pseudo3d: false, full3d: true, instant: false }
    }
    return { pseudo3d: variant === 'compact', full3d: false, instant: false }
  }

  // auto
  if (variant === 'full' && webgl) {
    return { pseudo3d: false, full3d: true, instant: false }
  }
  return { pseudo3d: true, full3d: false, instant: false }
}

/** Target animation window for 3D rolls (ms). */
export const DICE_3D_ANIMATION_MS = 1200
export const DICE_PSEUDO_ANIMATION_MS = 600
export const MAX_DICE_3D_COUNT = 12
