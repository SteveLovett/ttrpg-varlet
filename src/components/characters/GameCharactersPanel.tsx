import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useGameCharacters, type CharacterRow } from '../../hooks/useGameCharacters'
import { useResolvedSpellcastingValidation } from '../../hooks/useResolvedSpellcastingValidation'
import { checkInventorySave } from '../../rules/dnd5e/character/inventorySave'
import { checkSpellcastingSave } from '../../rules/dnd5e/character/spellcastingSave'
import type { CharacterSheet } from '../../rules/dnd5e/character'
import type { GameSpellcastingPolicy } from '../../settings/validation'
import { CharacterSheetEditor } from './CharacterSheetEditor'
import { CharacterSheetView } from './CharacterSheetView'
import { CharacterWizard } from './CharacterWizard'

type GameCharactersPanelProps = {
  gameId: string
  currentUserId: string | null
  gameSpellcastingPolicy: GameSpellcastingPolicy
}

export function GameCharactersPanel({
  gameId,
  currentUserId,
  gameSpellcastingPolicy,
}: GameCharactersPanelProps) {
  const { mode: validationMode } = useResolvedSpellcastingValidation(gameSpellcastingPolicy)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedId = searchParams.get('characterId')
  const showNew = searchParams.get('new') === '1'

  const {
    characters,
    myUnattached,
    loading,
    error,
    loadCharacters,
    loadMyUnattached,
    createCharacter,
    updateCharacter,
    attachCharacter,
    detachCharacter,
    deleteCharacter,
  } = useGameCharacters(gameId)

  const [editing, setEditing] = useState(false)
  const [draftSheet, setDraftSheet] = useState<CharacterSheet | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [saveWarnings, setSaveWarnings] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void loadCharacters()
    void loadMyUnattached()
  }, [loadCharacters, loadMyUnattached])

  const selected = characters.find((c) => c.id === selectedId) ?? null

  function setCharacterParam(id: string | null) {
    setEditing(false)
    setDraftSheet(null)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', 'characters')
        next.delete('new')
        if (id) {
          next.set('characterId', id)
        } else {
          next.delete('characterId')
        }
        return next
      },
      { replace: true },
    )
  }

  function setNewWizard(open: boolean) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('tab', 'characters')
        if (open) {
          next.set('new', '1')
          next.delete('characterId')
        } else {
          next.delete('new')
        }
        return next
      },
      { replace: true },
    )
  }

  const isOwner = selected?.owner_id === currentUserId

  async function handleCreate(name: string, sheet: CharacterSheet) {
    const spellCheck = checkSpellcastingSave(sheet, validationMode)
    const invCheck = checkInventorySave(sheet, validationMode)
    if (spellCheck.blocked || invCheck.blocked) {
      throw new Error(
        `Cannot create character until issues are fixed:\n${[...spellCheck.blockMessages, ...invCheck.blockMessages].join('\n')}`,
      )
    }
    const result = await createCharacter(name, sheet)
    if ('error' in result) {
      throw new Error(result.error)
    }
    setNewWizard(false)
    setCharacterParam(result.id)
  }

  async function handleSaveEdit() {
    if (!selected || !draftSheet) return
    setSaving(true)
    setActionError(null)
    setSaveWarnings([])
    const spellCheck = checkSpellcastingSave(draftSheet, validationMode)
    const invCheck = checkInventorySave(draftSheet, validationMode)
    if (spellCheck.blocked || invCheck.blocked) {
      setSaving(false)
      setActionError(
        `Save blocked (strict validation). Fix:\n${[...spellCheck.blockMessages, ...invCheck.blockMessages].join('\n')}`,
      )
      setSaveWarnings([...spellCheck.warningMessages, ...invCheck.warningMessages])
      return
    }

    const err = await updateCharacter(selected.id, draftSheet.name, draftSheet)
    setSaving(false)
    if (err) {
      setActionError(err)
      return
    }
    if (spellCheck.warningMessages.length > 0 || invCheck.warningMessages.length > 0) {
      setSaveWarnings([...spellCheck.warningMessages, ...invCheck.warningMessages])
    }
    setEditing(false)
    setDraftSheet(null)
  }

  function startEdit() {
    if (!selected) return
    setSaveWarnings([])
    setDraftSheet({ ...selected.sheet_json })
    setEditing(true)
  }

  return (
    <section className="game-characters">
      <div className="game-characters-toolbar">
        <h3>Party characters</h3>
        {validationMode === 'block' ? (
          <p className="muted game-characters-validation-note">
            This campaign blocks saving characters with spellcasting errors (limits, slots,
            level). Class-list mismatches are warnings only.
          </p>
        ) : null}
        <button type="button" onClick={() => setNewWizard(true)} disabled={showNew}>
          Create character
        </button>
      </div>

      {loading ? <p className="muted">Loading characters…</p> : null}
      {error ? <p>{error}</p> : null}
      {actionError ? <p>{actionError}</p> : null}
      {saveWarnings.length > 0 ? (
        <div className="character-spellcasting-warnings" role="status">
          <p className="character-spellcasting-warnings-title">
            {validationMode === 'block' ? 'Spellcasting notes:' : 'Saved with spellcasting notes:'}
          </p>
          <ul>
            {saveWarnings.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {showNew ? (
        <CharacterWizard onComplete={handleCreate} onCancel={() => setNewWizard(false)} />
      ) : null}

      {!showNew && !loading && !error ? (
        <>
          {characters.length === 0 ? (
            <p className="muted">No characters in this campaign yet.</p>
          ) : (
            <ul className="character-card-list">
              {characters.map((c) => (
                <CharacterCard
                  key={c.id}
                  character={c}
                  active={c.id === selectedId}
                  onSelect={() => setCharacterParam(c.id)}
                />
              ))}
            </ul>
          )}

          {myUnattached.length > 0 ? (
            <details className="attach-characters-panel">
              <summary>Attach an existing character ({myUnattached.length})</summary>
              <ul className="character-card-list">
                {myUnattached.map((c) => (
                  <li key={c.id} className="character-card character-card--compact">
                    <span className="character-card-main">
                      <strong>{c.name}</strong>
                      <span className="muted">
                        L{c.sheet_json.level} {c.sheet_json.className}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void attachCharacter(c.id).then((err) => err && setActionError(err))}
                    >
                      Attach
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {selected ? (
            <div className="character-detail">
              <div className="character-detail-toolbar">
                <button type="button" onClick={() => setCharacterParam(null)}>
                  ← Back to list
                </button>
                {isOwner ? (
                  editing ? (
                    <>
                      <button type="button" onClick={() => void handleSaveEdit()} disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(false)
                          setDraftSheet(null)
                        }}
                        disabled={saving}
                      >
                        Cancel edit
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={startEdit}>
                      Edit
                    </button>
                  )
                ) : null}
                {isOwner ? (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => {
                      if (!window.confirm(`Delete ${selected.name}? This cannot be undone.`)) return
                      void deleteCharacter(selected.id).then((err) => {
                        if (err) setActionError(err)
                        else setCharacterParam(null)
                      })
                    }}
                  >
                    Delete
                  </button>
                ) : null}
                {isOwner ? (
                  <button
                    type="button"
                    onClick={() => {
                      void detachCharacter(selected.id).then((err) => {
                        if (err) setActionError(err)
                        else setCharacterParam(null)
                      })
                    }}
                  >
                    Detach from game
                  </button>
                ) : null}
              </div>

              {editing && isOwner && draftSheet ? (
                <CharacterSheetEditor
                  sheet={draftSheet}
                  onChange={setDraftSheet}
                  disabled={saving}
                  spellcastingValidationMode={validationMode}
                />
              ) : (
                <CharacterSheetView
                  sheet={selected.sheet_json}
                  ownerLabel={
                    selected.owner_id === currentUserId
                      ? 'You'
                      : (selected.owner_display_name ?? 'Player')
                  }
                />
              )}
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function CharacterCard({
  character,
  active,
  onSelect,
}: {
  character: CharacterRow
  active: boolean
  onSelect: () => void
}) {
  const { sheet_json: sheet } = character
  return (
    <li>
      <button
        type="button"
        className={`character-card${active ? ' character-card--active' : ''}`}
        onClick={onSelect}
      >
        <strong>{character.name}</strong>
        <span className="muted">
          L{sheet.level} {sheet.className}
          {sheet.species ? ` · ${sheet.species}` : ''}
        </span>
        {character.owner_display_name ? (
          <span className="character-card-owner muted">{character.owner_display_name}</span>
        ) : null}
      </button>
    </li>
  )
}
