import { useCallback, useState } from 'react'
import { supabase } from '../supabaseClient'

export type GameChatRow = {
  id: string
  game_id: string
  user_id: string
  body: string
  created_at: string
  display_name: string | null
}

const MAX_CHAT = 100

export function useGameChat(gameId: string | undefined) {
  const [messages, setMessages] = useState<GameChatRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('game_chat_messages')
      .select('id, game_id, user_id, body, created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(MAX_CHAT)

    if (fetchError) {
      setError(fetchError.message)
      setMessages([])
      setLoading(false)
      return
    }

    const rows = data ?? []
    const userIds = [...new Set(rows.map((r) => r.user_id))]
    let nameByUser = new Map<string, string | null>()
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds)
      nameByUser = new Map((profiles ?? []).map((p) => [p.id, p.display_name]))
    }

    setMessages(
      rows
        .map((r) => ({ ...r, display_name: nameByUser.get(r.user_id) ?? null }))
        .reverse(),
    )
    setLoading(false)
  }, [gameId])

  const send = useCallback(
    async (body: string): Promise<{ row: GameChatRow } | { error: string }> => {
      const trimmed = body.trim()
      if (!gameId) return { error: 'Missing game.' }
      if (trimmed.length === 0) return { error: 'Message is empty.' }
      if (trimmed.length > 2000) return { error: 'Message is too long.' }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) return { error: userError.message }
      if (!user) return { error: 'You must be signed in.' }

      const { data, error: insertError } = await supabase
        .from('game_chat_messages')
        .insert({ game_id: gameId, user_id: user.id, body: trimmed })
        .select('id, game_id, user_id, body, created_at')
        .single()
      if (insertError) return { error: insertError.message }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle()

      const row: GameChatRow = {
        ...data,
        display_name: profile?.display_name ?? null,
      }
      setMessages((prev) => appendChat(prev, row))
      return { row }
    },
    [gameId],
  )

  const addLiveMessage = useCallback((row: GameChatRow) => {
    setMessages((prev) => appendChat(prev, row))
  }, [])

  return { messages, loading, error, load, send, addLiveMessage }
}

function appendChat(prev: GameChatRow[], row: GameChatRow): GameChatRow[] {
  if (prev.some((m) => m.id === row.id)) return prev
  const next = [...prev, row]
  return next.length > MAX_CHAT ? next.slice(next.length - MAX_CHAT) : next
}
