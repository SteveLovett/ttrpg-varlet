import {
  getDiceColorTheme,
  type DiceBoxCustomColorset,
  type DiceColorThemeId,
} from '../../settings/diceColors'
import type { RollResult } from '../../rules/dnd5e/dice/types'
import { DICE_3D_ANIMATION_MS } from '../../settings/diceAnimation'
import { rollResultToDiceBoxNotation } from './rollToDiceBoxNotation'

export type DiceBoxInstance = {
  rollResult: (result: RollResult) => Promise<void>
  applyColorTheme: (themeId: DiceColorThemeId) => Promise<void>
  clear: () => void
  destroy: () => void
}

type DiceBoxThreeConfig = {
  assetPath: string
  framerate?: number
  sounds?: boolean
  shadows?: boolean
  theme_surface?: string
  theme_colorset?: string
  theme_texture?: string
  theme_material?: string
  theme_customColorset?: DiceBoxCustomColorset | null
  gravity_multiplier?: number
  strength?: number
  light_intensity?: number
  baseScale?: number
}

type DiceBoxThree = {
  theme_customColorset: DiceBoxCustomColorset | null
  initialize: () => Promise<void>
  roll: (notation: string) => Promise<unknown>
  clearDice: () => void
  loadTheme: (opts: {
    colorset: string
    texture?: string
    material?: string
  }) => Promise<void>
}

type DiceBoxThreeClass = new (
  selector: string,
  config?: DiceBoxThreeConfig,
) => DiceBoxThree

let diceBoxModule: { default: DiceBoxThreeClass } | null = null

async function loadDiceBoxModule(): Promise<DiceBoxThreeClass> {
  if (!diceBoxModule) {
    const mod = await import('@3d-dice/dice-box-threejs')
    diceBoxModule = { default: mod.default as DiceBoxThreeClass }
  }
  return diceBoxModule.default
}

function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches
}

/** Remove canvases left by a prior dice-box instance on this host. */
export function clearDiceBoxHost(host: HTMLElement): void {
  host.replaceChildren()
}

async function applyColorThemeToBox(box: DiceBoxThree, themeId: DiceColorThemeId): Promise<void> {
  const theme = getDiceColorTheme(themeId)
  box.theme_customColorset = theme.customColorset ?? null
  await box.loadTheme({
    colorset: theme.colorset,
    texture: '',
    material: theme.theme_material,
  })
}

export async function createDiceBox(
  host: HTMLElement,
  themeId: DiceColorThemeId,
): Promise<DiceBoxInstance> {
  const DiceBox = await loadDiceBoxModule()
  const mobile = isMobileViewport()
  const theme = getDiceColorTheme(themeId)
  const hostId = host.id || 'dice-box-canvas-host'
  if (!host.id) {
    host.id = hostId
  }

  clearDiceBoxHost(host)

  const box = new DiceBox(`#${hostId}`, {
    assetPath: '/assets/dice-threejs/',
    framerate: 1 / 60,
    sounds: false,
    shadows: !mobile,
    theme_surface: 'default',
    theme_colorset: theme.colorset,
    theme_customColorset: theme.customColorset ?? null,
    theme_texture: '',
    theme_material: theme.theme_material,
    gravity_multiplier: mobile ? 320 : 400,
    strength: mobile ? 0.85 : 1,
    light_intensity: 0.75,
    baseScale: mobile ? 68 : 78,
  })

  await box.initialize()

  return {
    async rollResult(result: RollResult) {
      const { notation } = rollResultToDiceBoxNotation(result)
      if (!notation) return

      const timeout = new Promise<void>((resolve) => {
        setTimeout(resolve, DICE_3D_ANIMATION_MS)
      })
      await Promise.race([box.roll(notation), timeout])
    },
    applyColorTheme(themeId: DiceColorThemeId) {
      return applyColorThemeToBox(box, themeId)
    },
    clear() {
      box.clearDice()
    },
    destroy() {
      box.clearDice()
      clearDiceBoxHost(host)
    },
  }
}
