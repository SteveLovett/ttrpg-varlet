import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { supabase } from '../supabaseClient'

export function useDisplayName() {
  const [email, setEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [displayNameDraft, setDisplayNameDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) {
      setError(userError.message)
      setLoading(false)
      return
    }
    if (!user) {
      setLoading(false)
      return
    }

    setEmail(user.email ?? null)

    try {
      const { data: row, error: selectError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle()

      if (selectError) {
        setError(selectError.message)
        return
      }

      const fallback = user.email?.split('@')[0]?.trim() || 'Player'

      if (row?.display_name) {
        setDisplayName(row.display_name)
        setDisplayNameDraft(row.display_name)
        return
      }

      if (row && row.display_name == null) {
        const { data: updated, error: updateError } = await supabase
          .from('profiles')
          .update({ display_name: fallback })
          .eq('id', user.id)
          .select('display_name')
          .maybeSingle()

        if (updateError) {
          setError(updateError.message)
          return
        }
        if (updated?.display_name) {
          setDisplayName(updated.display_name)
          setDisplayNameDraft(updated.display_name)
        }
        return
      }

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id, display_name: fallback })
        .select('display_name')
        .maybeSingle()

      if (insertError) {
        setError(insertError.message)
        return
      }
      if (inserted?.display_name) {
        setDisplayName(inserted.display_name)
        setDisplayNameDraft(inserted.display_name)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const saveDisplayName = useCallback(
    async (e: SubmitEvent<HTMLFormElement>) => {
      e.preventDefault()
      setError(null)
      setInfo(null)

      const trimmed = displayNameDraft.trim()
      if (!trimmed) {
        setError('Display name cannot be empty.')
        return
      }
      if (trimmed === displayName) {
        setInfo('No changes to save.')
        return
      }

      setSaving(true)
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError) {
          setError(userError.message)
          return
        }
        if (!user) {
          setError('You must be signed in.')
          return
        }

        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({ display_name: trimmed })
          .eq('id', user.id)
          .select('display_name')
          .maybeSingle()

        if (updateError) {
          setError(updateError.message)
          return
        }

        if (data?.display_name) {
          setDisplayName(data.display_name)
          setDisplayNameDraft(data.display_name)
          setInfo('Display name updated.')
        }
      } finally {
        setSaving(false)
      }
    },
    [displayName, displayNameDraft],
  )

  const greetingLabel = loading ? null : (displayName ?? email)

  return {
    email,
    displayName,
    displayNameDraft,
    setDisplayNameDraft,
    loading,
    saving,
    error,
    info,
    greetingLabel,
    saveDisplayName,
    reload: loadProfile,
  }
}
