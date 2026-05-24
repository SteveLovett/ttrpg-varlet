import {
  formatEquipmentSummary,
  getCatalogEntry,
  type EquipmentKind,
} from '../../rules/dnd5e/data/equipment'
type EquipmentDetailDialogProps = {
  kind: EquipmentKind | null
  slug: string | null
  onClose: () => void
}

export function EquipmentDetailDialog({ kind, slug, onClose }: EquipmentDetailDialogProps) {
  if (!kind || !slug) return null
  const entry = getCatalogEntry(kind, slug)
  if (!entry) return null

  const summary = formatEquipmentSummary(entry)
  const weight =
    entry.kind === 'item' && entry.ref.weight != null
      ? `${entry.ref.weight} ${entry.ref.weight_unit ?? 'lb'}`
      : null

  return (
    <div className="equipment-picker-backdrop" role="presentation" onClick={onClose}>
      <div
        className="equipment-picker-dialog spell-detail-dialog app-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="equipment-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="equipment-picker-header">
          <div>
            <h3 id="equipment-detail-title">{entry.ref.name}</h3>
            <p className="muted spell-detail-subtitle">
              {kind}
              {summary ? ` · ${summary}` : ''}
            </p>
          </div>
          <button type="button" className="equipment-picker-close" onClick={onClose}>
            Close
          </button>
        </header>

        <dl className="spell-detail-stats">
          <div>
            <dt>Catalog slug</dt>
            <dd className="equipment-detail-slug">{slug}</dd>
          </div>
          {weight ? (
            <div>
              <dt>Weight</dt>
              <dd>{weight}</dd>
            </div>
          ) : null}
          {entry.kind === 'item' && entry.ref.cost ? (
            <div>
              <dt>Cost</dt>
              <dd>{entry.ref.cost}</dd>
            </div>
          ) : null}
          {entry.kind === 'item' && entry.ref.category ? (
            <div>
              <dt>Category</dt>
              <dd>{entry.ref.category}</dd>
            </div>
          ) : null}
        </dl>

        <p className="muted">Stats from the bundled SRD 2024 Open5e catalog.</p>
      </div>
    </div>
  )
}
