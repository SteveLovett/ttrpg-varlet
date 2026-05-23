import type { DrawingTool, DrawingVisibility } from './drawingUtils'
import { DRAWING_COLORS } from './drawingUtils'

type DrawingToolsProps = {
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
  onClearDrawings: () => void
}

export function DrawingTools({
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
  onClearDrawings,
}: DrawingToolsProps) {
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
      </div>

      {drawingTool === 'line' ? (
        <p className="vtt-fog-hint muted" role="status">
          Draw on the map with the left mouse button.
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

      <div className="form-row">
        <label htmlFor="vtt-drawing-color">Color</label>
        <select
          id="vtt-drawing-color"
          value={drawingColor}
          onChange={(e) => onDrawingColorChange(e.target.value)}
        >
          {DRAWING_COLORS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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

      <button type="button" className="vtt-fog-clear" onClick={onClearDrawings}>
        Clear all drawings
      </button>
    </section>
  )
}
