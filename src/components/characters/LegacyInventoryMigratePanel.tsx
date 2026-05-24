import { useMemo, useState } from 'react'
import {
  applyLegacyInventoryMigration,
  previewLegacyInventoryMigration,
  type CharacterSheet,
  type LegacyMigrationMatch,
} from '../../rules/dnd5e/character'

type LegacyInventoryMigratePanelProps = {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
}

function matchSummary(match: LegacyMigrationMatch): string {
  if (match.kind === 'currency') {
    return `${match.amount} ${match.coin.toUpperCase()} → coin`
  }
  if (match.kind === 'catalog') {
    return `${match.line.label} → ${match.name} (catalog)`
  }
  return `${match.line.label} → custom item`
}

export function LegacyInventoryMigratePanel({
  sheet,
  onChange,
  disabled = false,
}: LegacyInventoryMigratePanelProps) {
  const [dismissed, setDismissed] = useState(false)
  const preview = useMemo(
    () => previewLegacyInventoryMigration(sheet.inventory),
    [sheet.inventory],
  )

  if (dismissed || preview.length === 0) return null

  function apply(clearText: boolean) {
    onChange(applyLegacyInventoryMigration(sheet, { clearText }))
    setDismissed(true)
  }

  return (
    <div className="legacy-inventory-migrate" role="region" aria-labelledby="legacy-inventory-title">
      <h5 id="legacy-inventory-title">Legacy inventory text</h5>
      <p className="muted">
        This character still has items written as free text. You can convert them into catalog rows
        (best-effort name matching) or keep using the text field below.
      </p>
      <pre className="legacy-inventory-preview-source">{sheet.inventory}</pre>
      <ul className="legacy-inventory-preview-list">
        {preview.map((match, index) => (
          <li key={`${match.line.raw}-${index}`}>{matchSummary(match)}</li>
        ))}
      </ul>
      <div className="legacy-inventory-migrate-actions">
        <button type="button" disabled={disabled} onClick={() => apply(true)}>
          Migrate and clear text
        </button>
        <button type="button" disabled={disabled} onClick={() => apply(false)}>
          Migrate and keep text
        </button>
        <button type="button" disabled={disabled} onClick={() => setDismissed(true)}>
          Keep as text only
        </button>
      </div>
    </div>
  )
}
