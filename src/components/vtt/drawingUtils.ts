import type { DrawingShape } from './types'

export type DrawingTool = 'line' | 'text' | 'erase'

const HIT_LINE_PX = 14
const HIT_TEXT_PX = 28

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

export function drawingListLabel(shape: DrawingShape): string {
  if (shape.kind === 'text') {
    const t = shape.text.trim()
    return t.length > 0 ? t : 'Text label'
  }
  return `Line (${shape.points.length} pts)`
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  const len2 = dx * dx + dy * dy
  if (len2 === 0) {
    const ox = px - x1
    const oy = py - y1
    return Math.sqrt(ox * ox + oy * oy)
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  const ex = px - cx
  const ey = py - cy
  return Math.sqrt(ex * ex + ey * ey)
}

/** Nearest drawing at map coordinates (GM can hit GM-only shapes). */
export function findDrawingAtPoint(
  x: number,
  y: number,
  drawings: DrawingShape[],
  isGM: boolean,
): string | null {
  const visible = drawingsForViewer(drawings, isGM)
  let bestId: string | null = null
  let bestDist = Infinity

  for (const shape of visible) {
    if (shape.kind === 'line') {
      const points = shape.points
      if (points.length === 1) {
        const p = points[0]!
        const dist = Math.hypot(x - p.x, y - p.y)
        if (dist < HIT_LINE_PX && dist < bestDist) {
          bestDist = dist
          bestId = shape.id
        }
        continue
      }
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i]!
        const b = points[i + 1]!
        const dist = distToSegment(x, y, a.x, a.y, b.x, b.y)
        if (dist < HIT_LINE_PX && dist < bestDist) {
          bestDist = dist
          bestId = shape.id
        }
      }
      continue
    }

    const dist = Math.hypot(x - shape.x, y - shape.y)
    if (dist < HIT_TEXT_PX && dist < bestDist) {
      bestDist = dist
      bestId = shape.id
    }
  }

  return bestId
}
