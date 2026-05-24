import { useState } from 'react'
import { NumericInput } from './NumericInput'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { DiceBoxViewport } from './dice/DiceBoxViewport'
import { DiceTrayAppearanceRow } from './dice/DiceTrayAppearanceRow'
import { DiceRollDisplay } from './dice/DiceRollDisplay'
import { DieGraphic } from './dice/DieGraphic'
import {
  presetButtonLabel,
  presetDieSides,
  presetUsesDieIcon,
  quickDicePresets,
} from './dice/presetDisplay'
import { useDiceColorTheme } from '../hooks/useDiceColorTheme'
import { useDiceTrayBackground } from '../hooks/useDiceTrayBackground'
import { useDicePresentation } from '../hooks/useDicePresentation'
import {
  DICE_3D_ANIMATION_MS,
  DICE_PSEUDO_ANIMATION_MS,
} from '../settings/diceAnimation'
import { dicePresets } from '../rules/dnd5e/data'
import type { DicePreset } from '../rules/dnd5e/data'
import { rollD20, rollD100, rollFormula } from '../rules/dnd5e/dice'
import type { AdvantageMode, RollResult } from '../rules/dnd5e/dice/types'

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

function animationDurationMs(presentation: {
  instant: boolean
  full3d: boolean
  pseudo3d: boolean
}): number {
  if (presentation.instant) return 0
  if (presentation.full3d) return DICE_3D_ANIMATION_MS
  if (presentation.pseudo3d) return DICE_PSEUDO_ANIMATION_MS
  return 0
}

export function DiceTray({ variant, gameId, onRoll, lastResult }: DiceTrayProps) {
  const { presentation } = useDicePresentation(variant)
  const { themeId: diceColorThemeId, setTheme: setDiceColorTheme } = useDiceColorTheme()
  const { backgroundId: diceTrayBackgroundId, setBackground: setDiceTrayBackground } =
    useDiceTrayBackground()
  const [formula, setFormula] = useState('1d20')
  const [modifier, setModifier] = useState(0)
  const [label, setLabel] = useState('')
  const [localResult, setLocalResult] = useState<RollResult | null>(null)
  const [rollError, setRollError] = useState<string | null>(null)
  const [rolling, setRolling] = useState(false)
  const [showRollAnim, setShowRollAnim] = useState(false)

  const displayResult = lastResult ?? localResult
  const isCompact = variant === 'compact'
  const showGraphics = !presentation.instant
  const usePseudo3d = presentation.pseudo3d
  const useFull3d = presentation.full3d && !isCompact

  async function revealResult(result: RollResult, rolledFormula: string, rollLabel: string) {
    setRollError(null)
    setLocalResult(result)

    const animMs = animationDurationMs(presentation)
    if (animMs > 0) {
      setShowRollAnim(true)
      await delay(animMs)
      setShowRollAnim(false)
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
    const mod = modifier
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
      {isCompact ? (
        <p className="muted dice-tray-graphics-hint">
          Compact tray uses quick 3D-style dice.{' '}
          <Link to="/app/tools/dice">Full tray</Link> has physics dice.{' '}
          <Link to="/app/settings">Settings</Link>
        </p>
      ) : (
        <p className="muted dice-tray-graphics-hint">
          3D resin dice — faces match your roll. Change behavior in{' '}
          <Link to="/app/settings">Settings</Link>.
        </p>
      )}

      {useFull3d ? (
        <>
          <DiceTrayAppearanceRow
            colorThemeId={diceColorThemeId}
            onColorThemeChange={setDiceColorTheme}
            backgroundId={diceTrayBackgroundId}
            onBackgroundChange={setDiceTrayBackground}
            disabled={rolling}
          />
          <DiceBoxViewport
            colorThemeId={diceColorThemeId}
            backgroundId={diceTrayBackgroundId}
            rollResult={showRollAnim ? displayResult : null}
            rolling={showRollAnim}
          />
        </>
      ) : null}

      <div className="dice-tray-d20-block">
        <label className="dice-tray-mod-label" htmlFor={isCompact ? 'd20-mod-compact' : 'd20-mod'}>
          d20 modifier
        </label>
        <NumericInput
          id={isCompact ? 'd20-mod-compact' : 'd20-mod'}
          className="dice-tray-mod-input"
          emptyFallback={0}
          value={modifier}
          onChange={setModifier}
          disabled={rolling}
        />
        <div className="dice-tray-adv-row">
          {showGraphics ? (
            <>
              <button
                type="button"
                className="dice-preset-btn dice-preset-btn--graphic"
                disabled={rolling}
                onClick={() => void handleD20('normal')}
                aria-label="Roll d20"
              >
                <DieGraphic sides={20} size="sm" showLabel pseudo3d={usePseudo3d} />
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
        className={`dice-tray-presets${showGraphics ? ' dice-tray-presets--graphic' : ''}`}
        role="group"
        aria-label="Quick dice"
      >
        {visiblePresets.map((preset) => {
          const caption = presetButtonLabel(preset)
          const sides = presetDieSides(preset)
          const showIcon = showGraphics && presetUsesDieIcon(preset) && sides != null

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
                <DieGraphic
                  sides={sides}
                  size="sm"
                  showLabel
                  caption={caption}
                  pseudo3d={usePseudo3d}
                />
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
        showGraphics && !useFull3d ? (
          <DiceRollDisplay
            result={displayResult}
            rolling={showRollAnim}
            compact={isCompact}
            pseudo3d={usePseudo3d}
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
