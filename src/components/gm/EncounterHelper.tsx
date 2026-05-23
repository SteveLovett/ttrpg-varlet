import { useState } from 'react'
import { NumericInput } from '../NumericInput'
import {
  formatEncounterForNotes,
  generateEncounter,
  type EncounterDifficulty,
  type GeneratedEncounter,
} from '../../rules/dnd5e/encounter'
import { monsters } from '../../rules/dnd5e/data/monsters'

const DIFFICULTIES: EncounterDifficulty[] = ['easy', 'medium', 'hard', 'deadly']

const MONSTER_TYPES = [...new Set(monsters.map((m) => m.type).filter(Boolean) as string[])].sort()

type EncounterHelperProps = {
  defaultPartySize?: number
  defaultPartyLevel?: number
  onAppendToSessionNotes: (block: string) => Promise<string | null>
}

export function EncounterHelper({
  defaultPartySize = 4,
  defaultPartyLevel = 5,
  onAppendToSessionNotes,
}: EncounterHelperProps) {
  const [partySize, setPartySize] = useState(defaultPartySize)
  const [partyLevel, setPartyLevel] = useState(defaultPartyLevel)
  const [difficulty, setDifficulty] = useState<EncounterDifficulty>('medium')
  const [typeFilter, setTypeFilter] = useState('')
  const [result, setResult] = useState<GeneratedEncounter | null>(null)
  const [appending, setAppending] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    setInfo(null)
    setResult(
      generateEncounter({
        partySize,
        partyLevel,
        difficulty,
        typeFilter: typeFilter || undefined,
      }),
    )
  }

  async function handleAppend() {
    if (!result) return
    setAppending(true)
    setError(null)
    setInfo(null)
    const block = formatEncounterForNotes(result)
    const err = await onAppendToSessionNotes(block)
    setAppending(false)
    if (err) {
      setError(err)
      return
    }
    setInfo('Encounter appended to session notes.')
  }

  return (
    <section className="encounter-helper">
      <h3>Encounter generator</h3>
      <p className="muted">
        Builds a random SRD encounter from estimated CR and XP budget. Re-roll until it fits, then
        append to session notes.
      </p>

      <div className="encounter-helper-form">
        <div className="form-row">
          <label htmlFor="enc-party-size">Party size</label>
          <NumericInput
            id="enc-party-size"
            min={1}
            max={8}
            emptyFallback={1}
            value={partySize}
            onChange={setPartySize}
          />
        </div>
        <div className="form-row">
          <label htmlFor="enc-party-level">Average level</label>
          <NumericInput
            id="enc-party-level"
            min={1}
            max={20}
            emptyFallback={1}
            value={partyLevel}
            onChange={setPartyLevel}
          />
        </div>
        <div className="form-row">
          <label htmlFor="enc-difficulty">Difficulty</label>
          <select
            id="enc-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as EncounterDifficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="enc-type">Monster type (optional)</label>
          <select
            id="enc-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Any type</option>
            {MONSTER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="encounter-helper-actions">
        <button type="button" onClick={handleGenerate}>
          Generate encounter
        </button>
        {result ? (
          <button type="button" onClick={handleGenerate}>
            Re-roll
          </button>
        ) : null}
      </div>

      {result ? (
        <div className="encounter-result">
          <p className="muted">
            Budget {result.xpBudget} XP · used ~{result.xpUsed} XP
          </p>
          <ul>
            {result.monsters.map((row) => (
              <li key={row.monster.slug}>
                {row.count > 1 ? `${row.count}× ` : ''}
                <strong>{row.monster.name}</strong> (est. CR {row.cr}) — {row.monster.type}
                {row.monster.size ? `, ${row.monster.size}` : ''}
              </li>
            ))}
          </ul>
          <button type="button" disabled={appending} onClick={() => void handleAppend()}>
            {appending ? 'Appending…' : 'Append to session notes'}
          </button>
        </div>
      ) : null}

      {error ? <p className="dice-tray-error">{error}</p> : null}
      {info ? <p className="muted">{info}</p> : null}
    </section>
  )
}
