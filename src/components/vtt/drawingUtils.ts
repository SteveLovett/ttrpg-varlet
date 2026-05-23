import type { DrawingShape } from './types'

export type DrawingTool = 'line' | 'text'

export type DrawingVisibility = DrawingShape['visibility']

export const DRAWING_COLORS = [
  '#ef4444',
  '#facc15',
  '#22c55e',
  '#3b82f6',
  '#f97316',
  '#ffffff',
] as const

export function newDrawingId(): string {
  return crypto.randomUUID()
}

export function drawingsForViewer(
  drawings: DrawingShape[],
  isGM: boolean,
): DrawingShape[] {
  return drawings.filter((d) => d.visibility === 'all' || isGM)
}
