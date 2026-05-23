import monstersData from './monsters.json'

export type MonsterRef = {
  slug: string
  name: string
  cr: number | null
  type: string | null
  size: string | null
  ac: number | null
  hp: number | null
  speed: Record<string, unknown> | null
  document: string | null
}

export const monsters = monstersData as MonsterRef[]
