import { fogStrokesForViewer } from './fogUtils'
import type { FogStroke, TokenState } from './types'

function pointInStroke(x: number, y: number, stroke: FogStroke): boolean {
  const r2 = stroke.radius * stroke.radius
  for (const pt of stroke.points) {
    const dx = x - pt.x
    const dy = y - pt.y
    if (dx * dx + dy * dy <= r2) return true
  }
  return false
}

/**
 * Whether map coordinate `(x, y)` is visible through fog for a viewer.
 * Matches stroke-order semantics used by the fog mask renderer.
 */
export function isPointVisibleInFog(
  x: number,
  y: number,
  strokes: FogStroke[],
  viewerUserId: string,
): boolean {
  const filtered = fogStrokesForViewer(strokes, viewerUserId)
  if (filtered.length === 0) return false

  let hidden = true
  for (const stroke of filtered) {
    if (pointInStroke(x, y, stroke)) {
      hidden = stroke.op === 'hide'
    }
  }
  return !hidden
}

export function isPcToken(token: TokenState): boolean {
  return token.characterId !== null
}

export function shouldApplyFogToToken(
  token: TokenState,
  hidePcTokensInFog: boolean,
  hideNpcTokensInFog: boolean,
  showPlayerFog: boolean,
  fogViewerUserId: string | null,
): boolean {
  if (!showPlayerFog || !fogViewerUserId) return false
  if (isPcToken(token)) return hidePcTokensInFog
  return hideNpcTokensInFog
}
