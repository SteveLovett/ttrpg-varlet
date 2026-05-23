import { Graphics } from 'pixi.js'

/** Square grid in map pixel space (slice 2 — square only). */
export function drawSquareGrid(
  graphics: Graphics,
  mapWidth: number,
  mapHeight: number,
  gridSizePx: number,
): void {
  graphics.clear()
  if (gridSizePx < 1) return

  const stroke = { width: 1, color: 0xffffff, alpha: 0.22 }

  for (let x = 0; x <= mapWidth; x += gridSizePx) {
    graphics.moveTo(x, 0).lineTo(x, mapHeight).stroke(stroke)
  }
  for (let y = 0; y <= mapHeight; y += gridSizePx) {
    graphics.moveTo(0, y).lineTo(mapWidth, y).stroke(stroke)
  }
}
