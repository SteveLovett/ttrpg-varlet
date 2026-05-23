import type { TokenFogOverride, TokenState } from './types'

const OWNER_COLORS = [
  '#dc2626',
  '#2563eb',
  '#16a34a',
  '#ca8a04',
  '#9333ea',
  '#0891b2',
  '#ea580c',
  '#4f46e5',
]

export function colorForOwner(ownerId: string): string {
  let hash = 0
  for (let i = 0; i < ownerId.length; i++) {
    hash = (hash + ownerId.charCodeAt(i)) | 0
  }
  return OWNER_COLORS[Math.abs(hash) % OWNER_COLORS.length] ?? '#dc2626'
}

export function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 3).toUpperCase()
  return (parts[0]![0]! + parts[1]![0]! + (parts[2]?.[0] ?? '')).toUpperCase()
}

export function tokenRadiusPx(token: TokenState, gridSizePx: number): number {
  return (token.sizeCells * gridSizePx) / 2
}

export function snapTokenCenter(
  x: number,
  y: number,
  gridSizePx: number,
  mapWidth: number,
  mapHeight: number,
  sizeCells: TokenState['sizeCells'],
): { x: number; y: number } {
  const half = (sizeCells * gridSizePx) / 2
  const snappedX = Math.round((x - half) / gridSizePx) * gridSizePx + half
  const snappedY = Math.round((y - half) / gridSizePx) * gridSizePx + half
  return {
    x: clamp(snappedX, half, Math.max(half, mapWidth - half)),
    y: clamp(snappedY, half, Math.max(half, mapHeight - half)),
  }
}

export function canMoveToken(
  token: TokenState,
  currentUserId: string | null,
  isGM: boolean,
): boolean {
  if (isGM) return true
  if (!currentUserId) return false
  return token.ownerId === currentUserId
}

export function canDeleteToken(
  token: TokenState,
  currentUserId: string | null,
  isGM: boolean,
): boolean {
  return canMoveToken(token, currentUserId, isGM)
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

export function newTokenId(): string {
  return crypto.randomUUID()
}

export function tokenKindLabel(token: TokenState): string {
  return token.characterId ? 'PC' : 'NPC'
}

export function labelForFogOverride(override: TokenFogOverride): string {
  switch (override) {
    case 'visible':
      return 'Shown'
    case 'hidden':
      return 'Hidden'
    default:
      return 'Auto'
  }
}

/** Throttle live drag sync to Yjs (~20 Hz) and skip tiny jitter. */
export const LIVE_DRAG_SYNC_MS = 50
export const LIVE_DRAG_MIN_DELTA_PX = 1

export function shouldSyncLiveDrag(
  lastX: number,
  lastY: number,
  lastAt: number,
  x: number,
  y: number,
  now = performance.now(),
): boolean {
  if (now - lastAt < LIVE_DRAG_SYNC_MS) return false
  const dx = x - lastX
  const dy = y - lastY
  const min = LIVE_DRAG_MIN_DELTA_PX
  return dx * dx + dy * dy >= min * min
}
