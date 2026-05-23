import { useCallback, useState } from 'react'
import { parseInitiativeJson, type InitiativeEntry } from '../rules/dnd5e/initiative/types'
import { supabase } from '../supabaseClient'

export function useGameInitiative(gameId: string | undefined) {
  const [entries, setEntries] = useState<InitiativeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!gameId) return
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('games')
      .select('initiative_json')
      .eq('id', gameId)
      .maybeSingle()

    if (fetchError) {
      setError(fetchError.message)
      setEntries([])
      setLoading(false)
      return
    }

    setEntries(parseInitiativeJson(data?.initiative_json))
    setLoading(false)
  }, [gameId])

  const save = useCallback(
    async (next: InitiativeEntry[]): Promise<string | null> => {
      if (!gameId) return 'Missing game.'
      const sorted = [...next].sort((a, b) => b.value - a.value)
      const { error: updateError } = await supabase
        .from('games')
        .update({ initiative_json: sorted })
        .eq('id', gameId)

      if (updateError) return updateError.message
      setEntries(sorted)
      return null
    },
    [gameId],
  )

  return { entries, loading, error, load, save, setEntries }
}
