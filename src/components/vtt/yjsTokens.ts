import type * as Y from 'yjs'
import { YJS_TOKENS_KEY, type TokenState } from './types'

function parseTokenValue(value: unknown): TokenState | null {
  if (!value || typeof value !== 'object') return null
  const o = value as Partial<TokenState>
  if (typeof o.id !== 'string' || typeof o.x !== 'number' || typeof o.y !== 'number') {
    return null
  }
  const size = o.sizeCells
  const sizeCells: TokenState['sizeCells'] =
    size === 2 || size === 3 || size === 4 ? size : 1
  return {
    id: o.id,
    x: o.x,
    y: o.y,
    color: typeof o.color === 'string' ? o.color : '#dc2626',
    label: typeof o.label === 'string' ? o.label.slice(0, 3) : '?',
    characterId: typeof o.characterId === 'string' ? o.characterId : null,
    ownerId: typeof o.ownerId === 'string' ? o.ownerId : '',
    sizeCells,
  }
}

export function readAllTokens(map: Y.Map<unknown>): Record<string, TokenState> {
  const out: Record<string, TokenState> = {}
  map.forEach((value, key) => {
    const token = parseTokenValue(value)
    if (token) out[key] = token
  })
  return out
}

export function upsertToken(doc: Y.Doc, token: TokenState): void {
  const map = doc.getMap(YJS_TOKENS_KEY)
  doc.transact(() => {
    map.set(token.id, token)
  })
}

export function removeToken(doc: Y.Doc, tokenId: string): void {
  const map = doc.getMap(YJS_TOKENS_KEY)
  doc.transact(() => {
    map.delete(tokenId)
  })
}

export function writeTokensFromRecord(
  doc: Y.Doc,
  tokens: Record<string, TokenState>,
): void {
  const map = doc.getMap(YJS_TOKENS_KEY)
  doc.transact(() => {
    map.clear()
    for (const token of Object.values(tokens)) {
      map.set(token.id, token)
    }
  })
}
