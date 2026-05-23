import { ColorPickerPopover } from './ColorPickerPopover'
import type { DrawingShape } from './types'
import {
  drawingListLabel,
  DRAWING_COLORS,
  type DrawingTool,
  type DrawingVisibility,
} from './drawingUtils'

type DrawingToolsProps = {
  drawings: DrawingShape[]
  selectedDrawingId: string | null
  drawingTool: DrawingTool | null
  drawingColor: string
  drawingVisibility: DrawingVisibility
  textDraft: string
  textPlacementReady: boolean
  onDrawingToolChange: (tool: DrawingTool | null) => void
  onDrawingColorChange: (color: string) => void
  onDrawingVisibilityChange: (visibility: DrawingVisibility) => void
  onTextDraftChange: (text: string) => void
  onTextPlacementReadyChange: (ready: boolean) => void
  onSelectDrawing: (id: string | null) => void
  onDeleteDrawing: (id: string) => void
  onClearDrawings: () => void
  onDrawingItemColorChange: (id: string, color: string) => void
}

export function DrawingTools({
  drawings,
  selectedDrawingId,
  drawingTool,
  drawingColor,
  drawingVisibility,
  textDraft,
  textPlacementReady,
  onDrawingToolChange,
  onDrawingColorChange,
  onDrawingVisibilityChange,
  onTextDraftChange,
  onTextPlacementReadyChange,
  onSelectDrawing,
  onDeleteDrawing,
  onClearDrawings,
  onDrawingItemColorChange,
}: DrawingToolsProps) {
  const sorted = [...drawings].reverse()

  return (
    <section className="vtt-drawing-tools" aria-label="Drawing tools">
      <h3 className="vtt-tray-heading">Drawings</h3>

      <div className="vtt-fog-tool-row">
        <button
          type="button"
          className={drawingTool === 'line' ? 'is-active' : undefined}
          onClick={() => onDrawingToolChange(drawingTool === 'line' ? null : 'line')}
        >
          Line
        </button>
        <button
          type="button"
          className={drawingTool === 'text' ? 'is-active' : undefined}
          onClick={() => onDrawingToolChange(drawingTool === 'text' ? null : 'text')}
        >
          Text
        </button>
        <button
          type="button"
          className={drawingTool === 'erase' ? 'is-active' : undefined}
          onClick={() => onDrawingToolChange(drawingTool === 'erase' ? null : 'erase')}
        >
          Erase
        </button>
      </div>

      {drawingTool === 'line' ? (
        <p className="vtt-fog-hint muted" role="status">
          Draw on the map with the left mouse button.
        </p>
      ) : null}

      {drawingTool === 'erase' ? (
        <p className="vtt-fog-hint muted" role="status">
          Click a line or label on the map to delete it.
        </p>
      ) : null}

      {drawingTool === 'text' ? (
        <div className="vtt-text-draw-form">
          <div className="form-row">
            <label htmlFor="vtt-drawing-text">Label</label>
            <input
              id="vtt-drawing-text"
              value={textDraft}
              onChange={(e) => onTextDraftChange(e.target.value)}
              maxLength={120}
              placeholder="Door, trap, note…"
            />
          </div>
          <button
            type="button"
            disabled={!textDraft.trim()}
            className={textPlacementReady ? 'is-active' : undefined}
            onClick={() => onTextPlacementReadyChange(!textPlacementReady)}
          >
            {textPlacementReady ? 'Click map to place (cancel)' : 'Place on map'}
          </button>
        </div>
      ) : null}

      <div className="form-row vtt-color-tool-row">
        <span className="vtt-color-tool-label">Color</span>
        <ColorPickerPopover
          color={drawingColor}
          ariaLabel="Drawing color"
          onChange={onDrawingColorChange}
        />
        <div className="vtt-color-presets" role="group" aria-label="Color presets">
          {DRAWING_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className="vtt-color-preset"
              style={{ background: c }}
              title={c}
              aria-label={`Use ${c}`}
              onClick={() => onDrawingColorChange(c)}
            />
          ))}
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="vtt-drawing-visibility">Visible to</label>
        <select
          id="vtt-drawing-visibility"
          value={drawingVisibility}
          onChange={(e) =>
            onDrawingVisibilityChange(e.target.value as DrawingVisibility)
          }
        >
          <option value="all">Everyone</option>
          <option value="gm">GM only</option>
        </select>
      </div>

      <section className="vtt-tray-section">
        <h4 className="vtt-tray-subheading">On map ({drawings.length})</h4>
        {sorted.length === 0 ? (
          <p className="muted">No drawings yet.</p>
        ) : (
          <ul className="vtt-drawing-list">
            {sorted.map((d) => {
              const selected = d.id === selectedDrawingId
              return (
                <li key={d.id} className={selected ? 'is-selected' : undefined}>
                  <ColorPickerPopover
                    color={d.color}
                    ariaLabel={`Color for ${drawingListLabel(d)}`}
                    onChange={(color) => onDrawingItemColorChange(d.id, color)}
                  />
                  <button
                    type="button"
                    className="vtt-drawing-row"
                    onClick={() => onSelectDrawing(selected ? null : d.id)}
                  >
                    <span className="vtt-drawing-row-label">
                      {drawingListLabel(d)}
                      {d.visibility === 'gm' ? ' (GM)' : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="vtt-token-remove"
                    aria-label={`Delete ${drawingListLabel(d)}`}
                    onClick={() => onDeleteDrawing(d.id)}
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <button type="button" className="vtt-fog-clear" onClick={onClearDrawings}>
        Clear all drawings
      </button>
    </section>
  )
}
