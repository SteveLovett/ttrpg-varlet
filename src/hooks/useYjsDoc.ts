import { useCallback, useMemo, useSyncExternalStore } from 'react'
import { useRoom } from '@liveblocks/react'
import { getYjsProviderForRoom, type LiveblocksYjsProvider } from '@liveblocks/yjs'
import type * as Y from 'yjs'

/**
 * Phase F6 — bridge from the current Liveblocks room to a single Yjs
 * document. Late joiners auto-sync the doc from Liveblocks; local
 * mutations are propagated in the background.
 *
 * Returns the Y.Doc, the provider (for advanced use), and a `synced` flag
 * that flips true once the local doc has reconciled with the server.
 */
export function useYjsDoc(): {
  doc: Y.Doc
  provider: LiveblocksYjsProvider
  synced: boolean
} {
  const room = useRoom()
  const provider = useMemo(() => getYjsProviderForRoom(room), [room])
  const doc = useMemo(() => provider.getYDoc(), [provider])

  const subscribe = useCallback(
    (notify: () => void) => {
      provider.on('synced', notify)
      return () => {
        provider.off('synced', notify)
      }
    },
    [provider],
  )
  const getSnapshot = useCallback(() => provider.synced, [provider])
  const synced = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  return { doc, provider, synced }
}
