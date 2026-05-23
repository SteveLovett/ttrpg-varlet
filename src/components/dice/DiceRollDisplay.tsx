import type { RollResult } from '../../rules/dnd5e/dice/types'
import { DieGraphic } from './DieGraphic'
import { displayDiceFromResult } from './diceDisplay'

type DiceRollDisplayProps = {
  result: RollResult
  rolling?: boolean
  compact?: boolean
}

export function DiceRollDisplay({ result, rolling = false, compact = false }: DiceRollDisplayProps) {
  const dice = displayDiceFromResult(result)
  const size = compact ? 'sm' : 'md'

  return (
    <div className={`dice-roll-display${compact ? ' dice-roll-display--compact' : ''}`} role="status">
      <div className="dice-roll-display-faces">
        {dice.map((die, index) => (
          <DieGraphic
            key={`${die.sides}-${index}-${die.value}`}
            sides={die.sides}
            value={die.dropped ? die.value : die.value}
            dropped={die.dropped}
            rolling={rolling}
            size={dice.length > 4 ? 'sm' : size}
          />
        ))}
      </div>
      <div className="dice-roll-display-total">
        <span className="dice-roll-display-total-label">Total</span>
        <strong className="dice-roll-display-total-value">{result.total}</strong>
      </div>
      <p className="dice-roll-display-breakdown muted">{result.breakdown.replace(/\*\*/g, '')}</p>
    </div>
  )
}
