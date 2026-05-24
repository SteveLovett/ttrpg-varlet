import { searchEquipment, type EquipmentKind } from '../data/equipment'
import { addInventoryItem, inventoryItemCustom, inventoryItemFromCatalog } from './inventory'
import type { CharacterSheet, InventoryItem } from './types'

export type LegacyInventoryLine = {
  raw: string
  quantity: number
  label: string
}

export type LegacyMigrationMatch =
  | { kind: 'catalog'; line: LegacyInventoryLine; equipmentKind: EquipmentKind; slug: string; name: string }
  | { kind: 'custom'; line: LegacyInventoryLine }
  | { kind: 'currency'; line: LegacyInventoryLine; coin: 'gp' | 'pp' | 'sp' | 'cp' | 'ep'; amount: number }

const LINE_SPLIT = /[\n;]+/

const QTY_PREFIX = /^(\d+)\s*[x×]\s*(.+)$/i
const QTY_SUFFIX = /^(.+?)\s*[x×]\s*(\d+)$/i
const QTY_PAREN = /^(.+?)\s*\(\s*(\d+)\s*\)$/i

type CoinKey = 'cp' | 'sp' | 'ep' | 'gp' | 'pp'

const COIN_PATTERNS: { coin: CoinKey; re: RegExp }[] = [
  { coin: 'pp', re: /^(\d+)\s*pp\b/i },
  { coin: 'gp', re: /^(\d+)\s*gp\b/i },
  { coin: 'ep', re: /^(\d+)\s*ep\b/i },
  { coin: 'sp', re: /^(\d+)\s*sp\b/i },
  { coin: 'cp', re: /^(\d+)\s*cp\b/i },
]

function parseQuantityAndLabel(segment: string): LegacyInventoryLine | null {
  const raw = segment.trim().replace(/^[-•*]\s*/, '')
  if (!raw) return null


  let quantity = 1
  let label = raw

  const prefix = raw.match(QTY_PREFIX)
  if (prefix) {
    quantity = Math.max(1, Number.parseInt(prefix[1], 10))
    label = prefix[2].trim()
  } else {
    const suffix = raw.match(QTY_SUFFIX)
    if (suffix) {
      label = suffix[1].trim()
      quantity = Math.max(1, Number.parseInt(suffix[2], 10))
    } else {
      const paren = raw.match(QTY_PAREN)
      if (paren) {
        label = paren[1].trim()
        quantity = Math.max(1, Number.parseInt(paren[2], 10))
      }
    }
  }

  if (!label) return null
  return { raw, quantity, label }
}

export function parseLegacyInventoryText(text: string): LegacyInventoryLine[] {
  const lines: LegacyInventoryLine[] = []
  for (const part of text.split(LINE_SPLIT)) {
    for (const segment of part.split(',')) {
      const row = parseQuantityAndLabel(segment)
      if (row) lines.push(row)
    }
  }
  return lines
}

function findCatalogMatch(label: string): LegacyMigrationMatch | null {
  const normalized = label.trim().toLowerCase()
  if (!normalized) return null

  const exact = searchEquipment(label, '', 200).find(
    (r) => r.ref.name.trim().toLowerCase() === normalized,
  )
  if (exact) {
    return {
      kind: 'catalog',
      line: { raw: label, quantity: 1, label },
      equipmentKind: exact.kind,
      slug: exact.slug,
      name: exact.ref.name,
    }
  }

  const fuzzy = searchEquipment(label, '', 5)
  if (fuzzy.length === 1) {
    const hit = fuzzy[0]
    return {
      kind: 'catalog',
      line: { raw: label, quantity: 1, label },
      equipmentKind: hit.kind,
      slug: hit.slug,
      name: hit.ref.name,
    }
  }

  return null
}

export function classifyLegacyLine(line: LegacyInventoryLine): LegacyMigrationMatch {
  for (const { coin, re } of COIN_PATTERNS) {
    const m = line.raw.match(re)
    if (m) {
      return {
        kind: 'currency',
        line,
        coin,
        amount: Math.max(0, Number.parseInt(m[1], 10)),
      }
    }
  }

  const catalog = findCatalogMatch(line.label)
  if (catalog) {
    return { ...catalog, line }
  }

  return { kind: 'custom', line }
}

export function previewLegacyInventoryMigration(text: string): LegacyMigrationMatch[] {
  return parseLegacyInventoryText(text).map(classifyLegacyLine)
}

export function hasLegacyInventoryText(sheet: CharacterSheet): boolean {
  return sheet.inventory.trim().length > 0
}

/** Show migrate prompt when free-text exists but catalog list is empty. */
export function shouldOfferLegacyInventoryMigration(sheet: CharacterSheet): boolean {
  return hasLegacyInventoryText(sheet) && sheet.inventoryItems.length === 0
}

export function applyLegacyInventoryMigration(
  sheet: CharacterSheet,
  options: { clearText?: boolean } = {},
): CharacterSheet {
  const matches = previewLegacyInventoryMigration(sheet.inventory)
  let next = sheet
  const currency = { ...sheet.currency }

  for (const match of matches) {
    if (match.kind === 'currency') {
      currency[match.coin] += match.amount
      continue
    }

    let item: InventoryItem | null = null
    if (match.kind === 'catalog') {
      item = inventoryItemFromCatalog(match.equipmentKind, match.slug, match.line.quantity)
    } else {
      item = inventoryItemCustom(match.line.label, match.line.quantity)
    }
    if (item) next = addInventoryItem(next, item)
  }

  next = { ...next, currency }
  if (options.clearText) {
    next = { ...next, inventory: '' }
  }
  return next
}
