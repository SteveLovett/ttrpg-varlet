import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { drawingsForViewer } from './drawingUtils'
import type { DrawingShape } from './types'

const LINE_WIDTH = 3

function hexColor(css: string): number {
  const hex = css.replace('#', '')
  const n = Number.parseInt(hex, 16)
  return Number.isFinite(n) ? n : 0xffffff
}

export function syncDrawingsLayer(
  layer: Container,
  drawings: DrawingShape[],
  isGM: boolean,
  placement: 'public' | 'gm',
): void {
  layer.removeChildren()

  for (const shape of drawingsForViewer(drawings, isGM)) {
    if (placement === 'public' && shape.visibility !== 'all') continue
    if (placement === 'gm' && shape.visibility !== 'gm') continue

    if (shape.kind === 'line') {
      const gfx = new Graphics()
      const color = hexColor(shape.color)
      const first = shape.points[0]
      if (!first) continue
      gfx.moveTo(first.x, first.y)
      for (let i = 1; i < shape.points.length; i++) {
        const pt = shape.points[i]!
        gfx.lineTo(pt.x, pt.y)
      }
      gfx.stroke({ width: LINE_WIDTH, color, cap: 'round', join: 'round' })
      layer.addChild(gfx)
      continue
    }

    const label = new Text({
      text: shape.text,
      style: new TextStyle({
        fill: hexColor(shape.color),
        fontSize: 16,
        fontWeight: '600',
        stroke: { color: 0x000000, width: 3 },
      }),
    })
    label.anchor.set(0, 0.5)
    label.position.set(shape.x, shape.y)
    layer.addChild(label)
  }
}

export function drawLinePreview(
  gfx: Graphics,
  points: Array<{ x: number; y: number }>,
  color: string,
): void {
  gfx.clear()
  if (points.length === 0) return
  const first = points[0]!
  gfx.moveTo(first.x, first.y)
  for (let i = 1; i < points.length; i++) {
    const pt = points[i]!
    gfx.lineTo(pt.x, pt.y)
  }
  gfx.stroke({ width: LINE_WIDTH, color: hexColor(color), cap: 'round', join: 'round', alpha: 0.85 })
}
