import { useCallback, useEffect, useState } from 'react'
import type * as Y from 'yjs'
import { parseVttSnapshot } from '../components/vtt/vttSnapshot'
import {
  readAllTokens,
  removeToken,
  upsertToken,
  writeTokensFromRecord,
} from '../components/vtt/yjsTokens'
import { YJS_TOKENS_KEY, type TokenState } from '../components/vtt/types'
import type { VttSceneRow } from './useVttScene'

export function useYjsTokens(
  doc: Y.Doc,
  options: { synced: boolean; scene: VttSceneRow | null },
) {
  const [tokens, setTokens] = useState<Record<string, TokenState>>({})

  useEffect(() => {
    const map = doc.getMap(YJS_TOKENS_KEY)

    function refresh() {
      setTokens(readAllTokens(map))
    }

    refresh()
    map.observe(refresh)
    return () => map.unobserve(refresh)
  }, [doc])

  useEffect(() => {
    if (!options.synced || !options.scene) return
    const map = doc.getMap(YJS_TOKENS_KEY)
    if (map.size > 0) return

    const snapshot = parseVttSnapshot(options.scene.state_json)
    if (!snapshot || Object.keys(snapshot.tokens).length === 0) return
    writeTokensFromRecord(doc, snapshot.tokens)
  }, [doc, options.synced, options.scene])

  const addToken = useCallback(
    (token: TokenState) => {
      upsertToken(doc, token)
    },
    [doc],
  )

  const deleteToken = useCallback(
    (tokenId: string) => {
      removeToken(doc, tokenId)
    },
    [doc],
  )

  const moveToken = useCallback(
    (tokenId: string, x: number, y: number) => {
      const existing = readAllTokens(doc.getMap(YJS_TOKENS_KEY))[tokenId]
      if (!existing) return
      upsertToken(doc, { ...existing, x, y })
    },
    [doc],
  )

  return { tokens, addToken, deleteToken, moveToken }
}
