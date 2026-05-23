import type * as Y from 'yjs'
import { YJS_FOG_KEY, type FogStroke } from './types'

function parseFogStroke(value: unknown): FogStroke | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Partial<FogStroke>
  if (typeof o.id !== 'string' || (o.op !== 'reveal' && o.op !== 'hide')) return null
  if (!Array.isArray(o.points) || typeof o.radius !== 'number') return null
  const points: FogStroke['points'] = []
  for (const p of o.points) {
    if (p && typeof p === 'object' && typeof p.x === 'number' && typeof p.y === 'number') {
      points.push({ x: p.x, y: p.y })
    }
  }
  return {
    id: o.id,
    op: o.op,
    points,
    radius: o.radius,
    authorId: typeof o.authorId === 'string' ? o.authorId : '',
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : '',
    forPlayerId: typeof o.forPlayerId === 'string' ? o.forPlayerId : null,
  }
}

export function readFogStrokes(arr: Y.Array<unknown>): FogStroke[] {
  const out: FogStroke[] = []
  for (let i = 0; i < arr.length; i++) {
    const stroke = parseFogStroke(arr.get(i))
    if (stroke) out.push(stroke)
  }
  return out
}

export function appendFogStroke(doc: Y.Doc, stroke: FogStroke): void {
  const arr = doc.getArray(YJS_FOG_KEY)
  doc.transact(() => {
    arr.push([stroke])
  })
}

export function replaceFogStroke(doc: Y.Doc, strokeId: string, stroke: FogStroke): void {
  const arr = doc.getArray(YJS_FOG_KEY)
  doc.transact(() => {
    for (let i = 0; i < arr.length; i++) {
      const existing = parseFogStroke(arr.get(i))
      if (existing?.id === strokeId) {
        arr.delete(i, 1)
        arr.insert(i, [stroke])
        return
      }
    }
  })
}

export function clearFogStrokes(doc: Y.Doc): void {
  const arr = doc.getArray(YJS_FOG_KEY)
  doc.transact(() => {
    arr.delete(0, arr.length)
  })
}

export function writeFogFromSnapshot(doc: Y.Doc, strokes: FogStroke[]): void {
  const arr = doc.getArray(YJS_FOG_KEY)
  doc.transact(() => {
    arr.delete(0, arr.length)
    if (strokes.length > 0) {
      arr.push(strokes)
    }
  })
}
