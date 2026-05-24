import { useState } from 'react'
import { NumericInput } from '../NumericInput'
import {
  addInventoryItem,
  consolidateInventoryItems,
  displayInventoryItem,
  formatCurrencySummary,
  hasAnyCurrency,
  inventoryItemCustom,
  isBodyArmorItem,
  isShieldItem,
  setInventoryItemEquipped,
  suggestAcFromEquipment,
  type CharacterSheet,
  type Currency,
  type InventoryItem,
} from '../../rules/dnd5e/character'
import { EquipmentCatalogPicker } from './EquipmentCatalogPicker'
import { InventoryListDisclosure } from './InventoryListDisclosure'
import { StartingEquipmentChooser } from './StartingEquipmentChooser'

type CharacterInventoryEditorProps = {
  sheet: CharacterSheet
  onChange: (sheet: CharacterSheet) => void
  disabled?: boolean
  showStartingKit?: boolean
}

export function CharacterInventoryEditor({
  sheet,
  onChange,
  disabled = false,
  showStartingKit = false,
}: CharacterInventoryEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [customName, setCustomName] = useState('')

  function patchItems(inventoryItems: InventoryItem[]) {
    onChange({ ...sheet, inventoryItems: consolidateInventoryItems(inventoryItems) })
  }

  function updateItem(id: string, partial: Partial<InventoryItem>) {
    patchItems(
      sheet.inventoryItems.map((item) => (item.id === id ? { ...item, ...partial } : item)),
    )
  }

  function removeFromStack(id: string) {
    const item = sheet.inventoryItems.find((i) => i.id === id)
    if (!item) return
    if (item.quantity > 1) {
      updateItem(id, { quantity: item.quantity - 1 })
      return
    }
    patchItems(sheet.inventoryItems.filter((i) => i.id !== id))
  }

  function addItem(item: InventoryItem) {
    onChange(addInventoryItem(sheet, item))
  }

  function setCurrency(currency: Currency) {
    onChange({ ...sheet, currency })
  }

  function addCustom() {
    const trimmed = customName.trim()
    if (!trimmed) return
    addItem(inventoryItemCustom(trimmed))
    setCustomName('')
  }

  function toggleEquipped(id: string, equipped: boolean) {
    const target = sheet.inventoryItems.find((i) => i.id === id)
    let next = setInventoryItemEquipped(sheet, id, equipped)
    if (target && (isBodyArmorItem(target) || isShieldItem(target))) {
      next = { ...next, ac: suggestAcFromEquipment(next) }
    }
    onChange(next)
  }

  const suggestedAc = suggestAcFromEquipment(sheet)
  const currencySummary = formatCurrencySummary(sheet.currency)

  return (
    <div className="character-inventory-editor">
      {showStartingKit && sheet.className ? (
        <StartingEquipmentChooser
          key={sheet.className}
          sheet={sheet}
          onChange={onChange}
          disabled={disabled}
        />
      ) : null}

      <div className="character-inventory-currency-block">
        {hasAnyCurrency(sheet.currency) ? (
          <p className="character-currency-summary" aria-live="polite">
            {currencySummary}
          </p>
        ) : (
          <p className="character-currency-summary muted">No coin carried</p>
        )}
        <fieldset className="character-currency-fieldset" disabled={disabled}>
          <legend className="visually-hidden">Edit currency</legend>
          <div className="character-currency-grid">
            {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((coin) => (
              <div key={coin} className="form-row">
                <label htmlFor={`currency-${coin}`}>{coin.toUpperCase()}</label>
                <NumericInput
                  id={`currency-${coin}`}
                  min={0}
                  max={999999}
                  emptyFallback={0}
                  value={sheet.currency[coin]}
                  onChange={(value) => setCurrency({ ...sheet.currency, [coin]: value })}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>
        </fieldset>
      </div>

      <InventoryListDisclosure itemCount={sheet.inventoryItems.length}>
        {sheet.inventoryItems.length === 0 ? (
          <p className="muted">No catalog items yet.</p>
        ) : (
          <ul className="character-inventory-list">
            {sheet.inventoryItems.map((item) => (
              <li key={item.id} className="character-inventory-row">
                <div className="character-inventory-row-main">
                  <span className="character-inventory-row-name" title={displayInventoryItem(item)}>
                    {item.name}
                  </span>
                  <span className="muted character-inventory-row-kind">{item.kind}</span>
                </div>
                <label className="character-inventory-qty-side">
                  <span className="visually-hidden">Quantity</span>
                  <NumericInput
                    min={1}
                    max={999}
                    emptyFallback={1}
                    value={item.quantity}
                    onChange={(quantity) => updateItem(item.id, { quantity })}
                    disabled={disabled}
                  />
                </label>
                <div className="character-inventory-row-controls">
                  {(item.kind === 'weapon' ||
                    item.kind === 'armor' ||
                    item.catalogSlug === 'srd-2024_shield') && (
                    <label className="character-inventory-equipped">
                      <input
                        type="checkbox"
                        checked={!!item.equipped}
                        disabled={disabled}
                        onChange={(e) => toggleEquipped(item.id, e.target.checked)}
                      />
                      Equipped
                    </label>
                  )}
                  <button type="button" disabled={disabled} onClick={() => removeFromStack(item.id)}>
                    {item.quantity > 1 ? 'Remove one' : 'Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="form-row character-inventory-additional">
          <label htmlFor="inventory-notes">Additional items</label>
          <textarea
            id="inventory-notes"
            value={sheet.inventory}
            onChange={(e) => onChange({ ...sheet, inventory: e.target.value })}
            disabled={disabled}
            rows={2}
            placeholder="Misc items, notes, or loot not in the catalog…"
          />
        </div>
      </InventoryListDisclosure>

      <div className="character-inventory-actions">
        <button type="button" disabled={disabled} onClick={() => setPickerOpen(true)}>
          Add from catalog
        </button>
        <button
          type="button"
          className="character-suggest-hp"
          disabled={disabled}
          onClick={() => onChange({ ...sheet, ac: suggestedAc })}
        >
          Suggest AC from equipment ({suggestedAc})
        </button>
        <div className="character-inventory-custom">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Custom item name"
            disabled={disabled}
            maxLength={128}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
          />
          <button type="button" disabled={disabled || !customName.trim()} onClick={addCustom}>
            Add custom
          </button>
        </div>
      </div>

      <EquipmentCatalogPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addItem}
      />
    </div>
  )
}
