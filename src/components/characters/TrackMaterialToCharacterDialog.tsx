import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MyCharacterRow } from '../../hooks/useMyCharacters'

type TrackMaterialToCharacterDialogProps = {
  open: boolean
  materialLabel: string
  spellName: string
  characters: MyCharacterRow[]
  loading: boolean
  onClose: () => void
  onAdd: (characterId: string) => Promise<string | null>
}

export function TrackMaterialToCharacterDialog({
  open,
  materialLabel,
  spellName,
  characters,
  loading,
  onClose,
  onAdd,
}: TrackMaterialToCharacterDialogProps) {
  const [characterId, setCharacterId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const roster = useMemo(() => characters, [characters])

  if (!open) return null

  async function handleAdd() {
    if (!characterId) {
      setError('Choose a character.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    const err = await onAdd(characterId)
    setSaving(false)
    if (err) {
      setError(err)
      return
    }
    const name = roster.find((c) => c.id === characterId)?.name ?? 'Character'
    setMessage(`Added material to ${name}.`)
    setCharacterId('')
  }

  return (
    <div className="equipment-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="equipment-picker-dialog app-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="track-material-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="equipment-picker-header">
          <h3 id="track-material-title">Track material in inventory</h3>
          <button type="button" className="equipment-picker-close" onClick={onClose}>
            Close
          </button>
        </header>

        <p>
          Add <strong>{materialLabel}</strong> as a custom inventory row for{' '}
          <strong>{spellName}</strong>. This is a reminder only (like Foundry’s material text);
          the app does not auto-consume components when you cast.
        </p>

        {loading ? (
          <p className="muted">Loading your characters…</p>
        ) : roster.length === 0 ? (
          <p className="muted">
            No characters found.{' '}
            <Link to="/app" onClick={onClose}>
              Create a character
            </Link>{' '}
            first.
          </p>
        ) : (
          <div className="form-row">
            <label htmlFor="track-material-char">Character</label>
            <select
              id="track-material-char"
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              disabled={saving}
            >
              <option value="">— Select —</option>
              {roster.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.game_name ? ` · ${c.game_name}` : ' · (unattached)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {error ? <p className="dice-tray-error">{error}</p> : null}
        {message ? <p className="muted">{message}</p> : null}

        <div className="starting-equipment-actions">
          <button type="button" disabled={saving || loading || roster.length === 0} onClick={() => void handleAdd()}>
            {saving ? 'Adding…' : 'Add to inventory'}
          </button>
        </div>
      </div>
    </div>
  )
}
