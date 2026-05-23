import { Application, Container, Graphics, Sprite, RenderTexture } from 'pixi.js'
import type { FogStroke } from './types'
import { fogStrokesForViewer } from './fogUtils'

const FOG_COLOR = 0x050508
const FOG_ALPHA = 0.93

/**
 * Builds a fog mask sprite for players (or GM player-preview mode).
 * Strokes are applied in order via sequential render passes.
 */
export function renderFogMaskSprite(
  app: Application,
  mapW: number,
  mapH: number,
  strokes: FogStroke[],
  viewerUserId: string,
): Sprite {
  const filtered = fogStrokesForViewer(strokes, viewerUserId)
  const root = new Container()

  const base = new Graphics()
  base.rect(0, 0, mapW, mapH)
  base.fill({ color: FOG_COLOR, alpha: FOG_ALPHA })
  root.addChild(base)

  for (const stroke of filtered) {
    const strokeGfx = new Graphics()
    for (const pt of stroke.points) {
      strokeGfx.circle(pt.x, pt.y, stroke.radius)
      strokeGfx.fill({ color: 0xffffff })
    }
    if (stroke.op === 'reveal') {
      strokeGfx.blendMode = 'erase'
      root.addChild(strokeGfx)
    } else {
      const hideGfx = new Graphics()
      for (const pt of stroke.points) {
        hideGfx.circle(pt.x, pt.y, stroke.radius)
        hideGfx.fill({ color: FOG_COLOR, alpha: FOG_ALPHA })
      }
      root.addChild(hideGfx)
    }
  }

  const rt = RenderTexture.create({ width: mapW, height: mapH })
  app.renderer.render({ container: root, target: rt })
  root.destroy({ children: true })
  return new Sprite(rt)
}

/** GM guide overlay — tinted circles, does not block the map. */
export function drawFogGuide(gfx: Graphics, strokes: FogStroke[]): void {
  gfx.clear()
  for (const stroke of strokes) {
    const color = stroke.op === 'reveal' ? 0x4ade80 : 0xf87171
    for (const pt of stroke.points) {
      gfx.circle(pt.x, pt.y, stroke.radius)
      gfx.fill({ color, alpha: 0.2 })
    }
  }
}

/** In-progress stroke preview while painting. */
export function drawFogPreview(
  gfx: Graphics,
  stroke: Pick<FogStroke, 'op' | 'points' | 'radius'>,
): void {
  gfx.clear()
  const color = stroke.op === 'reveal' ? 0x4ade80 : 0xf87171
  for (const pt of stroke.points) {
    gfx.circle(pt.x, pt.y, stroke.radius)
    gfx.fill({ color, alpha: 0.35 })
  }
}
