import type { FogStroke } from './types'

export type FogTool = 'reveal' | 'hide'

export function newFogStrokeId(): string {
  return crypto.randomUUID()
}

/** Strokes that affect what this viewer sees through the fog mask. */
export function fogStrokesForViewer(
  strokes: FogStroke[],
  viewerUserId: string,
): FogStroke[] {
  return strokes.filter(
    (s) => s.forPlayerId === null || s.forPlayerId === viewerUserId,
  )
}

export function labelForFogTarget(forPlayerId: string | null, memberName?: string): string {
  if (!forPlayerId) return 'Everyone'
  return memberName?.trim() || 'One player'
}
