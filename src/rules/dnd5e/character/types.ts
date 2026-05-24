import { DND5E_2024_RULESET_LABEL } from '../constants'
import { parseActiveConditions, parseExhaustionLevel } from './conditions'
import { consolidateInventoryItems } from './inventoryStack'

export const SHEET_VERSION = 4 as const

export type ClassLevel = {
  className: string
  level: number
}

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
}

export type SkillKey =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival'

export const SKILL_DEFS: { key: SkillKey; label: string; ability: AbilityKey }[] = [
  { key: 'acrobatics', label: 'Acrobatics', ability: 'dex' },
  { key: 'animalHandling', label: 'Animal Handling', ability: 'wis' },
  { key: 'arcana', label: 'Arcana', ability: 'int' },
  { key: 'athletics', label: 'Athletics', ability: 'str' },
  { key: 'deception', label: 'Deception', ability: 'cha' },
  { key: 'history', label: 'History', ability: 'int' },
  { key: 'insight', label: 'Insight', ability: 'wis' },
  { key: 'intimidation', label: 'Intimidation', ability: 'cha' },
  { key: 'investigation', label: 'Investigation', ability: 'int' },
  { key: 'medicine', label: 'Medicine', ability: 'wis' },
  { key: 'nature', label: 'Nature', ability: 'int' },
  { key: 'perception', label: 'Perception', ability: 'wis' },
  { key: 'performance', label: 'Performance', ability: 'cha' },
  { key: 'persuasion', label: 'Persuasion', ability: 'cha' },
  { key: 'religion', label: 'Religion', ability: 'int' },
  { key: 'sleightOfHand', label: 'Sleight of Hand', ability: 'dex' },
  { key: 'stealth', label: 'Stealth', ability: 'dex' },
  { key: 'survival', label: 'Survival', ability: 'wis' },
]

export type InventoryItemKind = 'weapon' | 'armor' | 'item' | 'custom'

export type InventoryItem = {
  id: string
  kind: InventoryItemKind
  /** Open5e catalog key when kind is weapon, armor, or item. */
  catalogSlug?: string
  name: string
  quantity: number
  equipped?: boolean
  attuned?: boolean
  /** Per-stack weight in lb; overrides catalog default. Zero is allowed. */
  weightLb?: number
  notes?: string
}

export type Currency = {
  cp: number
  sp: number
  ep: number
  gp: number
  pp: number
}

export const EMPTY_CURRENCY: Currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 }

export type CharacterSpellcasting = {
  ability: AbilityKey
  cantripSlugs: string[]
  /** Wizard spellbook (prepared spells must be in this list). */
  spellbookSlugs: string[]
  knownSlugs: string[]
  preparedSlugs: string[]
  slotsUsed: Partial<Record<number, number>>
}

export type CharacterSheet = {
  version: typeof SHEET_VERSION
  ruleset: string
  name: string
  species: string
  /** Legacy primary class; kept in sync with classes[0]. */
  className: string
  /** Total character level (sum of class levels, max 20). */
  level: number
  /** Multiclass breakdown; empty means use className + level only. */
  classes: ClassLevel[]
  abilities: Record<AbilityKey, number>
  skills: Partial<Record<SkillKey, boolean>>
  ac: number
  hpMax: number
  hpCurrent: number
  speed: number
  notes: string
  /** Free-text extras (legacy v1 inventory text is preserved here). */
  inventory: string
  inventoryItems: InventoryItem[]
  currency: Currency
  /** @deprecated Use spellcastingByClass; migrated on load. */
  spellcasting: CharacterSpellcasting | null
  /** Per-class spell lists and abilities. */
  spellcastingByClass: Partial<Record<string, CharacterSpellcasting>>
  /** Shared slots for full/half multiclass casters. */
  spellSlotsUsed: Partial<Record<number, number>>
  /** Warlock pact slots (separate from shared pool). */
  pactSlotsUsed: Partial<Record<number, number>>
  /** Active condition ids (see conditions.json). */
  activeConditions: string[]
  /** Exhaustion level 0–6 (2024 PHB). */
  exhaustionLevel: number
}

export function createEmptySheet(name = ''): CharacterSheet {
  return {
    version: SHEET_VERSION,
    ruleset: DND5E_2024_RULESET_LABEL,
    name,
    species: '',
    className: '',
    level: 1,
    classes: [],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skills: {},
    ac: 10,
    hpMax: 8,
    hpCurrent: 8,
    speed: 30,
    notes: '',
    inventory: '',
    inventoryItems: [],
    currency: { ...EMPTY_CURRENCY },
    spellcasting: null,
    spellcastingByClass: {},
    spellSlotsUsed: {},
    pactSlotsUsed: {},
    activeConditions: [],
    exhaustionLevel: 0,
  }
}

function parseSpellcasting(raw: unknown): CharacterSpellcasting | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const r = raw as Partial<CharacterSpellcasting>
  const ability =
    r.ability && ['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(r.ability)
      ? r.ability
      : 'int'

  const parseSlugs = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return []
    return arr.filter((s): s is string => typeof s === 'string' && s.length > 0)
  }

  const slotsUsed: Partial<Record<number, number>> = {}
  if (r.slotsUsed && typeof r.slotsUsed === 'object') {
    for (const [key, val] of Object.entries(r.slotsUsed)) {
      const lvl = Number.parseInt(key, 10)
      if (lvl >= 1 && lvl <= 9 && typeof val === 'number' && val >= 0) {
        slotsUsed[lvl] = Math.floor(val)
      }
    }
  }

  return {
    ability,
    cantripSlugs: parseSlugs(r.cantripSlugs),
    spellbookSlugs: parseSlugs(r.spellbookSlugs),
    knownSlugs: parseSlugs(r.knownSlugs),
    preparedSlugs: parseSlugs(r.preparedSlugs),
    slotsUsed,
  }
}

function parseInventoryItems(raw: unknown): InventoryItem[] {
  if (!Array.isArray(raw)) return []
  const items: InventoryItem[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Partial<InventoryItem>
    if (typeof r.name !== 'string' || !r.name.trim()) continue
    const kind =
      r.kind === 'weapon' || r.kind === 'armor' || r.kind === 'item' || r.kind === 'custom'
        ? r.kind
        : 'custom'
    const quantity =
      typeof r.quantity === 'number' && Number.isFinite(r.quantity)
        ? Math.max(1, Math.floor(r.quantity))
        : 1
    items.push({
      id: typeof r.id === 'string' && r.id ? r.id : `legacy-${items.length}`,
      kind,
      catalogSlug: typeof r.catalogSlug === 'string' ? r.catalogSlug : undefined,
      name: r.name.trim(),
      quantity,
      equipped: r.equipped === true,
      attuned: r.attuned === true,
      weightLb:
        typeof r.weightLb === 'number' && Number.isFinite(r.weightLb) && r.weightLb >= 0
          ? r.weightLb
          : undefined,
      notes: typeof r.notes === 'string' ? r.notes : undefined,
    })
  }
  return consolidateInventoryItems(items)
}

function parseCurrency(raw: unknown): Currency {
  const base = { ...EMPTY_CURRENCY }
  if (!raw || typeof raw !== 'object') return base
  const c = raw as Partial<Currency>
  for (const key of ['cp', 'sp', 'ep', 'gp', 'pp'] as const) {
    const v = c[key]
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
      base[key] = Math.floor(v)
    }
  }
  return base
}

function parseSlotMap(raw: unknown): Partial<Record<number, number>> {
  const slotsUsed: Partial<Record<number, number>> = {}
  if (!raw || typeof raw !== 'object') return slotsUsed
  for (const [key, val] of Object.entries(raw)) {
    const lvl = Number.parseInt(key, 10)
    if (lvl >= 1 && lvl <= 9 && typeof val === 'number' && val >= 0) {
      slotsUsed[lvl] = Math.floor(val)
    }
  }
  return slotsUsed
}

function parseClasses(
  raw: unknown,
  className: string,
  level: number,
): ClassLevel[] {
  if (!Array.isArray(raw)) {
    return className ? [{ className, level: Math.max(1, level) }] : []
  }
  const rows: ClassLevel[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Partial<ClassLevel>
    if (typeof r.className !== 'string' || !r.className.trim()) continue
    const lvl =
      typeof r.level === 'number' && Number.isFinite(r.level)
        ? Math.max(1, Math.min(20, Math.floor(r.level)))
        : 1
    rows.push({ className: r.className.trim(), level: lvl })
  }
  return rows
}

function parseSpellcastingByClass(
  raw: unknown,
): Partial<Record<string, CharacterSpellcasting>> {
  if (!raw || typeof raw !== 'object') return {}
  const out: Partial<Record<string, CharacterSpellcasting>> = {}
  for (const [className, value] of Object.entries(raw)) {
    const sc = parseSpellcasting(value)
    if (sc) out[className] = sc
  }
  return out
}

export function parseSheetJson(raw: unknown): CharacterSheet | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<CharacterSheet> & { version?: number }
  if (typeof o.name !== 'string') return null

  const base = createEmptySheet(o.name)
  const legacyVersion = typeof o.version === 'number' ? o.version : 1
  const className = typeof o.className === 'string' ? o.className : ''
  const level =
    typeof o.level === 'number' && Number.isFinite(o.level)
      ? Math.max(1, Math.min(20, Math.floor(o.level)))
      : 1

  const legacySpellcasting = parseSpellcasting(o.spellcasting)
  let spellcastingByClass = parseSpellcastingByClass(o.spellcastingByClass)
  if (Object.keys(spellcastingByClass).length === 0 && legacySpellcasting && className) {
    spellcastingByClass = { [className]: legacySpellcasting }
  }

  let spellSlotsUsed = parseSlotMap(o.spellSlotsUsed)
  const pactSlotsUsed = parseSlotMap(o.pactSlotsUsed)
  if (Object.keys(spellSlotsUsed).length === 0 && legacySpellcasting?.slotsUsed) {
    spellSlotsUsed = { ...legacySpellcasting.slotsUsed }
  }

  const classes =
    legacyVersion >= 4 || Array.isArray(o.classes)
      ? parseClasses(o.classes, className, level)
      : className
        ? [{ className, level }]
        : []

  const merged: CharacterSheet = {
    ...base,
    ...o,
    version: SHEET_VERSION,
    className,
    level,
    classes,
    abilities: { ...base.abilities, ...(o.abilities as CharacterSheet['abilities']) },
    skills: { ...(o.skills ?? {}) },
    inventory: typeof o.inventory === 'string' ? o.inventory : '',
    inventoryItems:
      legacyVersion >= 2 || Array.isArray(o.inventoryItems)
        ? parseInventoryItems(o.inventoryItems)
        : [],
    currency: parseCurrency(o.currency),
    spellcasting: legacySpellcasting,
    spellcastingByClass,
    spellSlotsUsed,
    pactSlotsUsed,
    activeConditions: parseActiveConditions(o.activeConditions),
    exhaustionLevel: parseExhaustionLevel(o.exhaustionLevel),
  }

  return merged
}
