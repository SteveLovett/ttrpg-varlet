export type DieRoll = {
  sides: number
  value: number
  dropped?: boolean
}

export type RollResult = {
  formula: string
  dice: DieRoll[]
  modifier: number
  total: number
  /** Human-readable breakdown, e.g. "1d20 (14) + 5 = 19" */
  breakdown: string
}

export type AdvantageMode = 'normal' | 'advantage' | 'disadvantage'
