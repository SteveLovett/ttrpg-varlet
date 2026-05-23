import { DND5E_2024_RULESET_LABEL } from '../constants'

export const SHEET_VERSION = 1 as const

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

export type CharacterSheet = {
  version: typeof SHEET_VERSION
  ruleset: string
  name: string
  species: string
  className: string
  level: number
  abilities: Record<AbilityKey, number>
  skills: Partial<Record<SkillKey, boolean>>
  ac: number
  hpMax: number
  hpCurrent: number
  speed: number
  notes: string
  inventory: string
}

export function createEmptySheet(name = ''): CharacterSheet {
  return {
    version: SHEET_VERSION,
    ruleset: DND5E_2024_RULESET_LABEL,
    name,
    species: '',
    className: '',
    level: 1,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skills: {},
    ac: 10,
    hpMax: 8,
    hpCurrent: 8,
    speed: 30,
    notes: '',
    inventory: '',
  }
}

export function parseSheetJson(raw: unknown): CharacterSheet | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Partial<CharacterSheet>
  if (typeof o.name !== 'string') return null
  const base = createEmptySheet(o.name)
  return {
    ...base,
    ...o,
    version: SHEET_VERSION,
    abilities: { ...base.abilities, ...(o.abilities as CharacterSheet['abilities']) },
    skills: { ...(o.skills ?? {}) },
  }
}
