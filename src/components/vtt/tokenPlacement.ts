import type { PlacementMode } from './placementTypes'
import { colorForOwner, initialsForName, newTokenId } from './tokenUtils'
import type { TokenState } from './types'

/** Build a new token for placement at map coordinates (already snapped). */
export function tokenFromPlacement(
  mode: PlacementMode,
  x: number,
  y: number,
  placedByUserId: string,
): TokenState {
  const ownerId = mode.kind === 'character' ? mode.ownerId : placedByUserId
  const name = mode.name
  return {
    id: newTokenId(),
    x,
    y,
    color: colorForOwner(ownerId),
    label: initialsForName(name),
    characterId: mode.kind === 'character' ? mode.characterId : null,
    ownerId,
    sizeCells: mode.sizeCells,
    fogOverride: 'default',
  }
}
