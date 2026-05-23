import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useGameCharacters } from '../../hooks/useGameCharacters'
import type { PlacementMode } from './placementTypes'
import { canDeleteToken, colorForOwner, labelForFogOverride, tokenKindLabel } from './tokenUtils'
import type { TokenFogOverride, TokenState } from './types'

type TokenTrayProps = {
  gameId: string
  isGM: boolean
  currentUserId: string | null
  tokens: Record<string, TokenState>
  placementMode: PlacementMode | null
  selectedTokenId: string | null
  onPlacementModeChange: (mode: PlacementMode | null) => void
  onSelectToken: (id: string | null) => void
  onDeleteToken: (id: string) => void
  onTokenFogOverrideChange: (tokenId: string, fogOverride: TokenFogOverride) => void
}

export function TokenTray({
  gameId,
  isGM,
  currentUserId,
  tokens,
  placementMode,
  selectedTokenId,
  onPlacementModeChange,
  onSelectToken,
  onDeleteToken,
  onTokenFogOverrideChange,
}: TokenTrayProps) {
  const { characters, loading, loadCharacters } = useGameCharacters(gameId)
  const [npcName, setNpcName] = useState('NPC')
  const [npcSize, setNpcSize] = useState<TokenState['sizeCells']>(1)

  useEffect(() => {
    void loadCharacters()
  }, [loadCharacters])

  const tokenList = useMemo(
    () =>
      Object.values(tokens).sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
      ),
    [tokens],
  )

  const usedCharacterIds = useMemo(() => {
    const ids = new Set<string>()
    for (const t of Object.values(tokens)) {
      if (t.characterId) ids.add(t.characterId)
    }
    return ids
  }, [tokens])

  const placeableCharacters = useMemo(() => {
    return characters.filter((c) => {
      if (usedCharacterIds.has(c.id)) return false
      if (isGM) return true
      return c.owner_id === currentUserId
    })
  }, [characters, usedCharacterIds, isGM, currentUserId])

  function startNpcPlacement(e: FormEvent) {
    e.preventDefault()
    const name = npcName.trim() || 'NPC'
    onPlacementModeChange({ kind: 'npc', name, sizeCells: npcSize })
    onSelectToken(null)
  }

  function startCharacterPlacement(character: (typeof characters)[0]) {
    onPlacementModeChange({
      kind: 'character',
      characterId: character.id,
      name: character.name,
      ownerId: character.owner_id,
      sizeCells: 1,
    })
    onSelectToken(null)
  }

  return (
    <aside className="vtt-token-tray" aria-label="Token tray">
      {placementMode ? (
        <p className="vtt-placement-hint" role="status">
          Click the map to place{' '}
          <strong>
            {placementMode.kind === 'npc' ? placementMode.name : placementMode.name}
          </strong>
          .{' '}
          <button
            type="button"
            className="vtt-cancel-place"
            onClick={() => onPlacementModeChange(null)}
          >
            Cancel
          </button>
        </p>
      ) : null}

      {isGM ? (
        <form className="vtt-npc-form" onSubmit={startNpcPlacement}>
          <h3 className="vtt-tray-heading">Add NPC</h3>
          <div className="form-row">
            <label htmlFor="vtt-npc-name">Label</label>
            <input
              id="vtt-npc-name"
              value={npcName}
              onChange={(e) => setNpcName(e.target.value)}
              maxLength={32}
              disabled={!!placementMode}
            />
          </div>
          <div className="form-row">
            <label htmlFor="vtt-npc-size">Size (cells)</label>
            <select
              id="vtt-npc-size"
              value={npcSize}
              onChange={(e) =>
                setNpcSize(Number(e.target.value) as TokenState['sizeCells'])
              }
              disabled={!!placementMode}
            >
              <option value={1}>1×1</option>
              <option value={2}>2×2</option>
              <option value={3}>3×3</option>
              <option value={4}>4×4</option>
            </select>
          </div>
          <button type="submit" disabled={!!placementMode}>
            Place on map
          </button>
        </form>
      ) : null}

      <section className="vtt-tray-section">
        <h3 className="vtt-tray-heading">Characters</h3>
        {loading ? <p className="muted">Loading characters…</p> : null}
        {!loading && placeableCharacters.length === 0 ? (
          <p className="muted">No characters available to place.</p>
        ) : null}
        <ul className="vtt-place-list">
          {placeableCharacters.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="vtt-place-btn"
                disabled={!!placementMode}
                onClick={() => startCharacterPlacement(c)}
              >
                <span
                  className="vtt-token-swatch"
                  style={{ background: colorForOwner(c.owner_id) }}
                  aria-hidden
                />
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="vtt-tray-section">
        <h3 className="vtt-tray-heading">On map ({tokenList.length})</h3>
        {isGM && tokenList.length > 0 ? (
          <p className="muted vtt-fog-hint">
            Per-token fog: Auto follows group rules; Shown/Hidden overrides for individual
            PCs and NPCs.
          </p>
        ) : null}
        {tokenList.length === 0 ? (
          <p className="muted">No tokens yet.</p>
        ) : (
          <ul className="vtt-token-list">
            {tokenList.map((t) => {
              const selected = t.id === selectedTokenId
              const canDelete = canDeleteToken(t, currentUserId, isGM)
              return (
                <li key={t.id} className={selected ? 'is-selected' : undefined}>
                  <button
                    type="button"
                    className="vtt-token-row"
                    onClick={() => onSelectToken(selected ? null : t.id)}
                  >
                    <span
                      className="vtt-token-swatch"
                      style={{ background: t.color }}
                      aria-hidden
                    />
                    <span className="vtt-token-row-label">
                      {t.label}
                      <span className="vtt-token-kind"> · {tokenKindLabel(t)}</span>
                      {t.sizeCells > 1 ? ` (${t.sizeCells}×${t.sizeCells})` : ''}
                    </span>
                  </button>
                  {isGM ? (
                    <select
                      className="vtt-token-fog-select"
                      value={t.fogOverride}
                      aria-label={`Fog visibility for ${t.label}`}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) =>
                        onTokenFogOverrideChange(
                          t.id,
                          e.target.value as TokenFogOverride,
                        )
                      }
                    >
                      <option value="default">{labelForFogOverride('default')}</option>
                      <option value="visible">{labelForFogOverride('visible')}</option>
                      <option value="hidden">{labelForFogOverride('hidden')}</option>
                    </select>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      className="vtt-token-remove"
                      aria-label={`Remove ${t.label}`}
                      onClick={() => onDeleteToken(t.id)}
                    >
                      ×
                    </button>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </aside>
  )
}
