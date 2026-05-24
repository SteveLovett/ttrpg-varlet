declare module '@3d-dice/dice-box-threejs' {
  export default class DiceBox {
    theme_customColorset: Record<string, unknown> | null
    constructor(selector: string, config?: Record<string, unknown>)
    initialize(): Promise<void>
    roll(notation: string): Promise<unknown>
    clearDice(): void
    loadTheme(opts: {
      colorset: string
      texture?: string
      material?: string
    }): Promise<void>
  }
}
