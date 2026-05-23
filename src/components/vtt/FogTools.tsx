import { NumericInput } from '../NumericInput'
import type { FogTool } from './fogUtils'

export type VttMemberOption = {
  userId: string
  displayName: string | null
}

type FogToolsProps = {
  isGM: boolean
  members: VttMemberOption[]
  fogTool: FogTool | null
  brushRadius: number
  forPlayerId: string | null
  previewAsPlayer: boolean
  previewPlayerId: string | null
  hidePcTokensInFog: boolean
  hideNpcTokensInFog: boolean
  onFogToolChange: (tool: FogTool | null) => void
  onBrushRadiusChange: (radius: number) => void
  onForPlayerIdChange: (userId: string | null) => void
  onPreviewAsPlayerChange: (enabled: boolean) => void
  onPreviewPlayerIdChange: (userId: string | null) => void
  onHidePcTokensInFogChange: (enabled: boolean) => void
  onHideNpcTokensInFogChange: (enabled: boolean) => void
  onClearFog: () => void
}

export function FogTools({
  isGM,
  members,
  fogTool,
  brushRadius,
  forPlayerId,
  previewAsPlayer,
  previewPlayerId,
  hidePcTokensInFog,
  hideNpcTokensInFog,
  onFogToolChange,
  onBrushRadiusChange,
  onForPlayerIdChange,
  onPreviewAsPlayerChange,
  onPreviewPlayerIdChange,
  onHidePcTokensInFogChange,
  onHideNpcTokensInFogChange,
  onClearFog,
}: FogToolsProps) {
  const anyTokenFog = hidePcTokensInFog || hideNpcTokensInFog

  if (!isGM) {
    return (
      <section className="vtt-fog-tools vtt-fog-tools-player" aria-label="Fog of war">
        <h3 className="vtt-tray-heading">Fog of war</h3>
        <p className="muted">
          The Game Master reveals areas as you explore. You only see parts of the map they
          have uncovered.
        </p>
        {anyTokenFog ? (
          <p className="muted">
            {hidePcTokensInFog && hideNpcTokensInFog
              ? 'Tokens outside revealed areas are hidden.'
              : hidePcTokensInFog
                ? 'Character tokens outside revealed areas are hidden.'
                : 'NPC tokens outside revealed areas are hidden.'}
          </p>
        ) : null}
      </section>
    )
  }

  return (
    <section className="vtt-fog-tools" aria-label="Fog of war tools">
      <h3 className="vtt-tray-heading">Fog of war</h3>

      <div className="vtt-fog-tool-row">
        <button
          type="button"
          className={fogTool === 'reveal' ? 'is-active' : undefined}
          onClick={() => onFogToolChange(fogTool === 'reveal' ? null : 'reveal')}
        >
          Reveal
        </button>
        <button
          type="button"
          className={fogTool === 'hide' ? 'is-active' : undefined}
          onClick={() => onFogToolChange(fogTool === 'hide' ? null : 'hide')}
        >
          Hide
        </button>
      </div>

      {fogTool ? (
        <p className="vtt-fog-hint muted" role="status">
          Paint on the map with the left mouse button. Right-drag still pans.
        </p>
      ) : null}

      <div className="form-row">
        <label htmlFor="vtt-fog-radius">Brush size (px)</label>
        <NumericInput
          id="vtt-fog-radius"
          min={8}
          max={256}
          emptyFallback={brushRadius}
          value={brushRadius}
          onChange={onBrushRadiusChange}
        />
      </div>

      <div className="form-row">
        <label htmlFor="vtt-fog-target">Reveal for</label>
        <select
          id="vtt-fog-target"
          value={forPlayerId ?? ''}
          onChange={(e) => onForPlayerIdChange(e.target.value || null)}
        >
          <option value="">Everyone</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.displayName?.trim() || 'Player'}
            </option>
          ))}
        </select>
      </div>

      <details className="vtt-fog-preview">
        <summary>Player view preview</summary>
        <label className="vtt-checkbox-row">
          <input
            type="checkbox"
            checked={previewAsPlayer}
            onChange={(e) => onPreviewAsPlayerChange(e.target.checked)}
          />
          Show fog mask (as a player sees it)
        </label>
        {previewAsPlayer ? (
          <div className="form-row">
            <label htmlFor="vtt-fog-preview-player">Preview as</label>
            <select
              id="vtt-fog-preview-player"
              value={previewPlayerId ?? ''}
              onChange={(e) => onPreviewPlayerIdChange(e.target.value || null)}
            >
              <option value="">Pick a player…</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName?.trim() || 'Player'}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="muted">
            Guide mode: green = reveal strokes, red = hide. The map stays fully visible.
          </p>
        )}
      </details>

      <fieldset className="vtt-fog-token-fieldset">
        <legend>Hide tokens outside revealed fog</legend>
        <label className="vtt-checkbox-row">
          <input
            type="checkbox"
            checked={hidePcTokensInFog}
            onChange={(e) => onHidePcTokensInFogChange(e.target.checked)}
          />
          Player characters (PCs)
        </label>
        <label className="vtt-checkbox-row">
          <input
            type="checkbox"
            checked={hideNpcTokensInFog}
            onChange={(e) => onHideNpcTokensInFogChange(e.target.checked)}
          />
          NPCs
        </label>
        <p className="muted vtt-fog-hint">
          Applies to players and GM player-preview. When both off, all tokens stay visible
          on top of fog.
        </p>
      </fieldset>

      <button type="button" className="vtt-fog-clear" onClick={onClearFog}>
        Clear all fog
      </button>
    </section>
  )
}
