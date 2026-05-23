import type { TokenState } from './types'

export type PlacementMode =
  | {
      kind: 'npc'
      name: string
      sizeCells: TokenState['sizeCells']
    }
  | {
      kind: 'character'
      characterId: string
      name: string
      ownerId: string
      sizeCells: TokenState['sizeCells']
    }
