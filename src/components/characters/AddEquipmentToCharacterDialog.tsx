import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { EquipmentKind } from '../../rules/dnd5e/data/equipment'
import { inventoryItemFromCatalog } from '../../rules/dnd5e/character'
import type { MyCharacterRow } from '../../hooks/useMyCharacters'
import { AddToCharacterQuantityField } from './AddToCharacterQuantityField'

type AddEquipmentToCharacterDialogProps = {
  open: boolean
  kind: EquipmentKind
  slug: string
  itemName: string
  characters: MyCharacterRow[]
  loading: boolean
  onClose: () => void
  onAdd: (characterId: string, quantity: number) => Promise<string | null>
}

export function AddEquipmentToCharacterDialog({
  open,
  kind,
  slug,
  itemName,
  characters,
  loading,
  onClose,
  onAdd,
}: AddEquipmentToCharacterDialogProps) {
  const [characterId, setCharacterId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleAdd() {
    if (!characterId) {
      setError('Choose a character.')
      return
    }
    const item = inventoryItemFromCatalog(kind, slug, quantity)
    if (!item) {
      setError('Item not found in catalog.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    const err = await onAdd(characterId, quantity)
    setSaving(false)
    if (err) {
      setError(err)
      return
    }
    const name = characters.find((c) => c.id === characterId)?.name ?? 'Character'
    setMessage(`Added ${quantity > 1 ? `${quantity}× ` : ''}${itemName} to ${name}.`)
    setCharacterId('')
    setQuantity(1)
  }

  return (
    <div className="equipment-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="equipment-picker-dialog app-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-char-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="equipment-picker-header">
          <h3 id="add-to-char-title">Add to character</h3>
          <button type="button" className="equipment-picker-close" onClick={onClose}>
            Close
          </button>
        </header>

        <p>
          Add <strong>{itemName}</strong> to one of your characters.
        </p>

        {loading ? (
          <p className="muted">Loading your characters…</p>
        ) : characters.length === 0 ? (
          <p className="muted">
            You have no characters yet. Create one from a{' '}
            <Link to="/app" onClick={onClose}>
              game
            </Link>{' '}
            overview.
          </p>
        ) : (
          <>
            <div className="form-row">
              <label htmlFor="add-to-char-select">Character</label>
              <select
                id="add-to-char-select"
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                disabled={saving}
              >
                <option value="">— Select —</option>
                {characters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.game_name ? ` · ${c.game_name}` : ' · (unattached)'}
                  </option>
                ))}
              </select>
            </div>
            <AddToCharacterQuantityField
              id="add-equipment-qty"
              value={quantity}
              disabled={saving}
              onChange={setQuantity}
            />
          </>
        )}

        {error ? <p className="dice-tray-error">{error}</p> : null}
        {message ? <p className="muted">{message}</p> : null}

        <div className="starting-equipment-actions">
          <button
            type="button"
            disabled={saving || loading || characters.length === 0}
            onClick={() => void handleAdd()}
          >
            {saving ? 'Adding…' : 'Add item'}
          </button>
        </div>
      </div>
    </div>
  )
}
