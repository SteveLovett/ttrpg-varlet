import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { applyThemeToDocument } from '../themes/applyTheme'
import { parseUserPreferences } from '../themes/parsePreferences'
import { readThemeCache, readThemeCacheUserId, writeThemeCache } from '../themes/themeCache'
import type { SpellcastingValidationMode } from '../settings/validation'
import {
  DEFAULT_FONT_OVERRIDE_ID,
  DEFAULT_THEME_ID,
  type FontOverrideId,
  type ThemeId,
  type UserPreferences,
} from '../themes/types'

const DEBOUNCE_MS = 300

type PreferencesState = {
  preferences: UserPreferences
  loading: boolean
  saving: boolean
  error: string | null
  savedAt: number | null
}

export function useUserPreferences() {
  const [state, setState] = useState<PreferencesState>({
    preferences: {
      themeId: DEFAULT_THEME_ID,
      fontOverrideId: DEFAULT_FONT_OVERRIDE_ID,
    },
    loading: true,
    saving: false,
    error: null,
    savedAt: null,
  })

  const pendingRef = useRef<UserPreferences | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revertRef = useRef<UserPreferences>(state.preferences)
  const userIdRef = useRef<string | null>(null)

  const persistThemeCache = useCallback((prefs: UserPreferences) => {
    if (!userIdRef.current) return
    writeThemeCache(prefs, userIdRef.current)
  }, [])

  const flushSave = useCallback(async (next: UserPreferences) => {
    setState((s) => ({ ...s, saving: true, error: null }))
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData.session?.user?.id
    if (!userId) {
      setState((s) => ({
        ...s,
        saving: false,
        error: 'Not signed in.',
      }))
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({ preferences: next })
      .eq('id', userId)

    if (error) {
      setState((s) => ({
        ...s,
        saving: false,
        error: error.message,
        preferences: revertRef.current,
      }))
      applyThemeToDocument(
        revertRef.current.themeId ?? DEFAULT_THEME_ID,
        revertRef.current.fontOverrideId ?? DEFAULT_FONT_OVERRIDE_ID,
      )
      persistThemeCache(revertRef.current)
      return
    }

    revertRef.current = next
    persistThemeCache(next)
    setState((s) => ({
      ...s,
      saving: false,
      error: null,
      savedAt: Date.now(),
      preferences: next,
    }))
  }, [persistThemeCache])

  const scheduleSave = useCallback(
    (next: UserPreferences) => {
      pendingRef.current = next
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const payload = pendingRef.current
        pendingRef.current = null
        if (payload) void flushSave(payload)
      }, DEBOUNCE_MS)
    },
    [flushSave],
  )

  const setThemeId = useCallback(
    (themeId: ThemeId) => {
      setState((s) => {
        const next = { ...s.preferences, themeId }
        applyThemeToDocument(themeId, next.fontOverrideId ?? DEFAULT_FONT_OVERRIDE_ID)
        persistThemeCache(next)
        scheduleSave(next)
        return { ...s, preferences: next, error: null }
      })
    },
    [scheduleSave, persistThemeCache],
  )

  const setFontOverrideId = useCallback(
    (fontOverrideId: FontOverrideId) => {
      setState((s) => {
        const next = { ...s.preferences, fontOverrideId }
        applyThemeToDocument(s.preferences.themeId ?? DEFAULT_THEME_ID, fontOverrideId)
        persistThemeCache(next)
        scheduleSave(next)
        return { ...s, preferences: next, error: null }
      })
    },
    [scheduleSave, persistThemeCache],
  )

  const setSpellcastingValidation = useCallback(
    (spellcastingValidation: SpellcastingValidationMode) => {
      setState((s) => {
        const next = { ...s.preferences, spellcastingValidation }
        persistThemeCache(next)
        scheduleSave(next)
        return { ...s, preferences: next, error: null }
      })
    },
    [scheduleSave, persistThemeCache],
  )

  useEffect(() => {
    let cancelled = false

    const cached = readThemeCache()
    if (cached) {
      applyThemeToDocument(
        cached.themeId ?? DEFAULT_THEME_ID,
        cached.fontOverrideId ?? DEFAULT_FONT_OVERRIDE_ID,
      )
    }

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData.session?.user?.id
      if (!userId) {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false }))
        }
        return
      }

      userIdRef.current = userId
      const cachedUserId = readThemeCacheUserId()
      if (cachedUserId && cachedUserId !== userId) {
        /* Different account on this browser — profile load below replaces cache. */
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        setState((s) => ({
          ...s,
          loading: false,
          error: error.message,
        }))
        return
      }

      const prefs = parseUserPreferences(data?.preferences)
      revertRef.current = prefs
      applyThemeToDocument(
        prefs.themeId ?? DEFAULT_THEME_ID,
        prefs.fontOverrideId ?? DEFAULT_FONT_OVERRIDE_ID,
      )
      persistThemeCache(prefs)
      setState((s) => ({
        ...s,
        preferences: prefs,
        loading: false,
        error: null,
      }))
    })()

    return () => {
      cancelled = true
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [persistThemeCache])

  return {
    ...state,
    setThemeId,
    setFontOverrideId,
    setSpellcastingValidation,
  }
}
