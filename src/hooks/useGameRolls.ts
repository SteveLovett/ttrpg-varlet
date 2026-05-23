import { useCallback, useState } from 'react'
import type { RollResult } from '../rules/dnd5e/dice/types'
import { supabase } from '../supabaseClient'

export type GameRollRow = {
  id: string
  game_id: string
  user_id: string
  formula: string
  label: string
  result_json: RollResult
  created_at: string
  display_name: string | null
}

type RollInsert = {
  gameId: string
  formula: string
  label: string
  result: RollResult
}

export function useGameRolls(gameId: string | undefined) {
  const [rolls, setRolls] = useState<GameRollRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadRolls = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('game_rolls')
      .select('id, game_id, user_id, formula, label, result_json, created_at')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (fetchError) {
      setError(fetchError.message)
      setRolls([])
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

    setRolls(
      rows.map((r) => ({
        ...r,
        result_json: r.result_json as RollResult,
        display_name: nameByUser.get(r.user_id) ?? null,
      })),
    )
    setLoading(false)
  }, [gameId])

  const saveRoll = useCallback(
    async ({ gameId: gid, formula, label, result }: RollInsert): Promise<string | null> => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) return userError.message
      if (!user) return 'You must be signed in.'

      const { error: insertError } = await supabase.from('game_rolls').insert({
        game_id: gid,
        user_id: user.id,
        formula,
        label,
        result_json: result,
      })

      if (insertError) return insertError.message

      await loadRolls()
      return null
    },
    [loadRolls],
  )

  return { rolls, loading, error, loadRolls, saveRoll }
}
