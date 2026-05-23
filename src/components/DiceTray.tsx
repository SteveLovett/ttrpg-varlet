import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { DiceRollDisplay } from './dice/DiceRollDisplay'
import { DieGraphic } from './dice/DieGraphic'
import {
  presetButtonLabel,
  presetDieSides,
  presetUsesDieIcon,
  quickDicePresets,
} from './dice/presetDisplay'
import { useDiceGraphicsPreference } from '../hooks/useDiceGraphicsPreference'
import { dicePresets } from '../rules/dnd5e/data'
import type { DicePreset } from '../rules/dnd5e/data'
import { rollD20, rollD100, rollFormula } from '../rules/dnd5e/dice'
import type { AdvantageMode, RollResult } from '../rules/dnd5e/dice/types'

const ROLL_ANIM_MS = 480

export type DiceTrayProps = {
  variant: 'full' | 'compact'
  /** When set, rolls can be persisted via onRoll. */
  gameId?: string
  onRoll?: (result: RollResult, formula: string, label: string) => Promise<string | null | void>
  lastResult?: RollResult | null
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function DiceTray({ variant, gameId, onRoll, lastResult }: DiceTrayProps) {
  const [graphicsEnabled, setGraphicsEnabled] = useDiceGraphicsPreference()
  const [formula, setFormula] = useState('1d20')
  const [modifier, setModifier] = useState('0')
  const [label, setLabel] = useState('')
  const [localResult, setLocalResult] = useState<RollResult | null>(null)
  const [rollError, setRollError] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)
  const [showRollAnim, setShowRollAnim] = useState(false)

  const displayResult = lastResult ?? localResult
  const isCompact = variant === 'compact'

  async function revealResult(result: RollResult, rolledFormula: string, rollLabel: string) {
    setRollError(null)
    if (graphicsEnabled) {
      setShowRollAnim(true)
      setLocalResult(result)
      await delay(ROLL_ANIM_MS)
      setShowRollAnim(false)
    } else {
      setLocalResult(result)
    }

    if (onRoll) {
      setRolling(true)
      try {
        const err = await onRoll(result, rolledFormula, rollLabel)
        if (err) {
          setRollError(err)
        }
      } finally {
        setRolling(false)
      }
    }
  }

  async function handleFormulaRoll(rolledFormula: string, rollLabel: string) {
    const outcome = rollFormula(rolledFormula)
    if ('error' in outcome) {
      setRollError(outcome.error)
      return
    }
    await revealResult(outcome, rolledFormula, rollLabel)
  }

  async function handleD20(mode: AdvantageMode) {
    const mod = Number.parseInt(modifier, 10) || 0
    const outcome = rollD20(mod, mode, mode === 'normal' ? '1d20' : `d20 (${mode})`)
    if ('error' in outcome) {
      setRollError(outcome.error)
      return
    }
    const formulaLabel =
      mode === 'advantage'
        ? `2d20kh1${mod >= 0 ? `+${mod}` : mod}`
        : mode === 'disadvantage'
          ? `2d20kl1${mod >= 0 ? `+${mod}` : mod}`
          : `1d20${mod >= 0 ? `+${mod}` : mod}`
    await revealResult(outcome, formulaLabel, label.trim() || 'd20')
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = formula.trim()
    if (!trimmed) {
      setRollError('Enter a formula.')
      return
    }
    await handleFormulaRoll(trimmed, label.trim() || trimmed)
  }

  async function handlePreset(preset: DicePreset) {
    if (preset.kind === 'percentile-tens') {
      const outcome = rollD100()
      await revealResult(outcome, 'd100 (×10)', preset.label)
      return
    }
    if (preset.advantage && preset.advantage !== 'normal') {
      await handleD20(preset.advantage)
      return
    }
    await handleFormulaRoll(preset.formula, preset.label)
  }

  const visiblePresets = quickDicePresets(dicePresets)

  return (
    <div className={`dice-tray dice-tray--${variant}`}>
      <label className="dice-tray-graphics-toggle">
        <input
          type="checkbox"
          checked={graphicsEnabled}
          onChange={(e) => setGraphicsEnabled(e.target.checked)}
        />
        Animated dice
      </label>

      <div className="dice-tray-d20-block">
        <label className="dice-tray-mod-label" htmlFor={isCompact ? 'd20-mod-compact' : 'd20-mod'}>
          d20 modifier
        </label>
        <input
          id={isCompact ? 'd20-mod-compact' : 'd20-mod'}
          type="number"
          className="dice-tray-mod-input"
          value={modifier}
          onChange={(e) => setModifier(e.target.value)}
          disabled={rolling}
        />
        <div className="dice-tray-adv-row">
          {graphicsEnabled ? (
            <>
              <button
                type="button"
                className="dice-preset-btn dice-preset-btn--graphic"
                disabled={rolling}
                onClick={() => void handleD20('normal')}
                aria-label="Roll d20"
              >
                <DieGraphic sides={20} size="sm" showLabel />
              </button>
              <button type="button" disabled={rolling} onClick={() => void handleD20('advantage')}>
                Adv
              </button>
              <button type="button" disabled={rolling} onClick={() => void handleD20('disadvantage')}>
                Dis
              </button>
            </>
          ) : (
            <>
              <button type="button" disabled={rolling} onClick={() => void handleD20('normal')}>
                Roll d20
              </button>
              <button type="button" disabled={rolling} onClick={() => void handleD20('advantage')}>
                Adv
              </button>
              <button type="button" disabled={rolling} onClick={() => void handleD20('disadvantage')}>
                Dis
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className={`dice-tray-presets${graphicsEnabled ? ' dice-tray-presets--graphic' : ''}`}
        role="group"
        aria-label="Quick dice"
      >
        {visiblePresets.map((preset) => {
          const caption = presetButtonLabel(preset)
          const sides = presetDieSides(preset)
          const showIcon = graphicsEnabled && presetUsesDieIcon(preset) && sides != null

          if (showIcon) {
            return (
              <button
                key={preset.id}
                type="button"
                className="dice-preset-btn dice-preset-btn--graphic"
                disabled={rolling}
                onClick={() => void handlePreset(preset)}
                aria-label={`Roll ${preset.label}`}
              >
                <DieGraphic sides={sides} size="sm" showLabel caption={caption} />
              </button>
            )
          }
          return (
            <button
              key={preset.id}
              type="button"
              className="dice-preset-btn dice-preset-btn--text"
              disabled={rolling}
              onClick={() => void handlePreset(preset)}
              aria-label={`Roll ${preset.label}`}
            >
              {caption}
            </button>
          )
        })}
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="dice-tray-form">
        {!isCompact ? (
          <div className="form-row">
            <label htmlFor="roll-label">Label (optional)</label>
            <input
              id="roll-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Attack, Fireball"
              disabled={rolling}
              maxLength={64}
            />
          </div>
        ) : null}
        <div className="form-row">
          <label htmlFor={isCompact ? 'dice-formula-compact' : 'dice-formula'}>Formula</label>
          <input
            id={isCompact ? 'dice-formula-compact' : 'dice-formula'}
            type="text"
            value={formula}
            onChange={(e) => setFormula(e.target.value)}
            placeholder="2d6+3, 4d6dl1"
            disabled={rolling}
            autoComplete="off"
          />
        </div>
        <button type="submit" disabled={rolling}>
          {rolling ? 'Rolling…' : 'Roll'}
        </button>
      </form>

      {gameId && isCompact ? (
        <p className="muted dice-tray-hint">
          Rolls are saved to this game&apos;s log.{' '}
          <Link to={`/app/tools/dice?gameId=${gameId}`}>Open full dice tray</Link>
        </p>
      ) : null}

      {rollError ? <p className="dice-tray-error">{rollError}</p> : null}

      {displayResult ? (
        graphicsEnabled ? (
          <DiceRollDisplay
            result={displayResult}
            rolling={showRollAnim}
            compact={isCompact}
          />
        ) : (
          <div className="dice-result" role="status">
            <p className="dice-result-total">
              <strong>{displayResult.total}</strong>
            </p>
            <p className="dice-result-breakdown muted">
              {displayResult.breakdown.replace(/\*\*/g, '')}
            </p>
          </div>
        )
      ) : null}
    </div>
  )
}
