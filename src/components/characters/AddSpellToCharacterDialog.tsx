import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { classHasSpellcasting } from '../../rules/dnd5e/character'
import type { MyCharacterRow } from '../../hooks/useMyCharacters'

type AddSpellToCharacterDialogProps = {
  open: boolean
  spellName: string
  characters: MyCharacterRow[]
  loading: boolean
  onClose: () => void
  onAdd: (characterId: string) => Promise<string | null>
}

export function AddSpellToCharacterDialog({
  open,
  spellName,
  characters,
  loading,
  onClose,
  onAdd,
}: AddSpellToCharacterDialogProps) {
  const [characterId, setCharacterId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const spellcasters = useMemo(
    () => characters.filter((c) => classHasSpellcasting(c.sheet_json.className)),
    [characters],
  )

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
    const name = spellcasters.find((c) => c.id === characterId)?.name ?? 'Character'
    setMessage(`Added ${spellName} to ${name}.`)
    setCharacterId('')
  }

  return (
    <div className="equipment-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="equipment-picker-dialog app-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-spell-to-char-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="equipment-picker-header">
          <h3 id="add-spell-to-char-title">Add to character</h3>
          <button type="button" className="equipment-picker-close" onClick={onClose}>
            Close
          </button>
        </header>

        <p>
          Add <strong>{spellName}</strong> to a spellcasting character (cantrip, prepared, or
          known list depending on class).
        </p>

        {loading ? (
          <p className="muted">Loading your characters…</p>
        ) : spellcasters.length === 0 ? (
          <p className="muted">
            No spellcasting characters found. Create a character with a spellcasting class from a{' '}
            <Link to="/app" onClick={onClose}>
              game
            </Link>
            .
          </p>
        ) : (
          <div className="form-row">
            <label htmlFor="add-spell-to-char-select">Character</label>
            <select
              id="add-spell-to-char-select"
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              disabled={saving}
            >
              <option value="">— Select —</option>
              {spellcasters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · L{c.sheet_json.level} {c.sheet_json.className}
                  {c.game_name ? ` · ${c.game_name}` : ' · (unattached)'}
                </option>
              ))}
            </select>
          </div>
        )}

        {error ? <p className="dice-tray-error">{error}</p> : null}
        {message ? <p className="muted">{message}</p> : null}

        <div className="starting-equipment-actions">
          <button
            type="button"
            disabled={saving || loading || spellcasters.length === 0}
            onClick={() => void handleAdd()}
          >
            {saving ? 'Adding…' : 'Add spell'}
          </button>
        </div>
      </div>
    </div>
  )
}
