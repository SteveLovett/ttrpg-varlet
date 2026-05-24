import {
  formatCastingTime,
  formatSpellDuration,
  formatSpellLevel,
  formatSpellRange,
  type SpellRef,
} from '../../rules/dnd5e/data/spells'

type SpellDetailDialogProps = {
  spell: SpellRef | null
  onClose: () => void
}

export function SpellDetailDialog({ spell, onClose }: SpellDetailDialogProps) {
  if (!spell) return null

  return (
    <div className="equipment-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="equipment-picker-dialog spell-detail-dialog app-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="spell-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="equipment-picker-header">
          <div>
            <h3 id="spell-detail-title">{spell.name}</h3>
            <p className="muted spell-detail-subtitle">
              {formatSpellLevel(spell.level)}
              {spell.school ? ` · ${spell.school}` : ''}
            </p>
          </div>
          <button type="button" className="equipment-picker-close" onClick={onClose}>
            Close
          </button>
        </header>

        <dl className="spell-detail-stats">
          <div>
            <dt>Casting time</dt>
            <dd>{formatCastingTime(spell.casting_time)}</dd>
          </div>
          <div>
            <dt>Range</dt>
            <dd>{formatSpellRange(spell.range)}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{formatSpellDuration(spell.duration)}</dd>
          </div>
          <div>
            <dt>Properties</dt>
            <dd>
              {[
                spell.ritual ? 'Ritual' : null,
                spell.concentration ? 'Concentration' : null,
              ]
                .filter(Boolean)
                .join(', ') || '—'}
            </dd>
          </div>
        </dl>

        {spell.desc ? (
          <div className="spell-detail-desc">
            <h4>Description</h4>
            <p>{spell.desc}</p>
          </div>
        ) : (
          <p className="muted">No description bundled for this spell.</p>
        )}
      </div>
    </div>
  )
}
