import type * as Y from 'yjs'
import { normalizeHexColor } from './colorUtils'
import { YJS_DRAWINGS_KEY, type DrawingShape } from './types'

function parseDrawingColor(raw: unknown): string {
  return (typeof raw === 'string' ? normalizeHexColor(raw) : null) ?? '#3b82f6'
}

function parseDrawing(value: unknown): DrawingShape | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Partial<DrawingShape>
  if (typeof o.id !== 'string' || typeof o.color !== 'string') return null
  const visibility = o.visibility === 'gm' ? 'gm' : 'all'

  if (o.kind === 'text') {
    if (typeof o.x !== 'number' || typeof o.y !== 'number' || typeof o.text !== 'string') {
      return null
    }
    return {
      id: o.id,
      kind: 'text',
      x: o.x,
      y: o.y,
      text: o.text.slice(0, 120),
      color: parseDrawingColor(o.color),
      visibility,
    }
  }

  if (o.kind === 'line') {
    if (!Array.isArray(o.points)) return null
    const points: Array<{ x: number; y: number }> = []
    for (const p of o.points) {
      if (p && typeof p === 'object' && typeof p.x === 'number' && typeof p.y === 'number') {
        points.push({ x: p.x, y: p.y })
      }
    }
    if (points.length === 0) return null
    return { id: o.id, kind: 'line', points, color: parseDrawingColor(o.color), visibility }
  }

  return null
}

export function readDrawings(arr: Y.Array<unknown>): DrawingShape[] {
  const out: DrawingShape[] = []
  for (let i = 0; i < arr.length; i++) {
    const shape = parseDrawing(arr.get(i))
    if (shape) out.push(shape)
  }
  return out
}

export function appendDrawing(doc: Y.Doc, shape: DrawingShape): void {
  const arr = doc.getArray(YJS_DRAWINGS_KEY)
  doc.transact(() => {
    arr.push([shape])
  })
}

export function replaceDrawing(doc: Y.Doc, shapeId: string, shape: DrawingShape): void {
  const arr = doc.getArray(YJS_DRAWINGS_KEY)
  doc.transact(() => {
    for (let i = 0; i < arr.length; i++) {
      const existing = parseDrawing(arr.get(i))
      if (existing?.id === shapeId) {
        arr.delete(i, 1)
        arr.insert(i, [shape])
        return
      }
    }
  })
}

export function removeDrawing(doc: Y.Doc, shapeId: string): void {
  const arr = doc.getArray(YJS_DRAWINGS_KEY)
  doc.transact(() => {
    for (let i = 0; i < arr.length; i++) {
      const existing = parseDrawing(arr.get(i))
      if (existing?.id === shapeId) {
        arr.delete(i, 1)
        return
      }
    }
  })
}

export function clearDrawings(doc: Y.Doc): void {
  const arr = doc.getArray(YJS_DRAWINGS_KEY)
  doc.transact(() => {
    arr.delete(0, arr.length)
  })
}

export function writeDrawingsFromSnapshot(doc: Y.Doc, drawings: DrawingShape[]): void {
  const arr = doc.getArray(YJS_DRAWINGS_KEY)
  doc.transact(() => {
    arr.delete(0, arr.length)
    if (drawings.length > 0) {
      arr.push(drawings)
    }
  })
}
