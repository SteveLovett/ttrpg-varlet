import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { MyGameCard } from '../components/MyGameCard'
import { supabase } from '../supabaseClient'
import { DND5E_2024_RULESET_LABEL } from '../rules/dnd5e/constants'

type GameSummary = {
  id: string
  name: string
  description: string | null
  role: 'Game Master' | 'Player'
  createdAt: string | null
  ruleset: string | null
}

type GameMembershipRow = {
  game_role: GameSummary['role'] | null
  games:
    | {
        id: string
        name: string
        description: string | null
        created_at: string | null
        ruleset: string | null
      }
    | Array<{
        id: string
        name: string
        description: string | null
        created_at: string | null
        ruleset: string | null
      }>
    | null
}

function mapMembershipRowsToGames(rows: GameMembershipRow[]): GameSummary[] {
  return rows
    .map((row) => {
      const game = Array.isArray(row.games) ? row.games[0] : row.games
      if (!game) return null
      return {
        id: game.id,
        name: game.name,
        description: game.description,
        role: row.game_role === 'Game Master' ? 'Game Master' : 'Player',
        createdAt: game.created_at,
        ruleset: game.ruleset && game.ruleset.length > 0 ? game.ruleset : null,
      } satisfies GameSummary
    })
    .filter((game): game is GameSummary => game !== null)
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.localeCompare(a.createdAt)
      }
      if (a.createdAt) return -1
      if (b.createdAt) return 1
      return 0
    })
}

/**
 * /app — main authenticated home (rendered inside AppShellLayout).
 * Loads `profiles.display_name` when the Phase 0 migration is applied; backfills a row if missing.
 */
export function HomePage() {
  const [email, setEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [games, setGames] = useState<GameSummary[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [gamesError, setGamesError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [gameName, setGameName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [displayNameDraft, setDisplayNameDraft] = useState('')
  const [savingDisplayName, setSavingDisplayName] = useState(false)
  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [displayNameInfo, setDisplayNameInfo] = useState<string | null>(null)

  /** Loads “my games” from Supabase (memberships + nested game rows). */
  const loadMyGames = useCallback(async (userId: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase
      .from('game_members')
      .select('game_role, games ( id, name, description, created_at, ruleset )')
      .eq('user_id', userId)

    if (error) {
      return { error: error.message }
    }

    const rows = (data ?? []) as GameMembershipRow[]
    setGames(mapMembershipRowsToGames(rows))
    return { error: null }
  }, [])

  const handleSaveDisplayName = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setDisplayNameError(null)
    setDisplayNameInfo(null)

    const trimmed = displayNameDraft.trim()
    if (!trimmed) {
      setDisplayNameError('Display name cannot be empty.')
      return
    }
    if (trimmed === displayName) {
      setDisplayNameInfo('No changes to save.')
      return
    }

    setSavingDisplayName(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) {
        setDisplayNameError(userError.message)
        return
      }
      if (!user) {
        setDisplayNameError('You must be signed in.')
        return
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', user.id)
        .select('display_name')
        .maybeSingle()

      if (updateError) {
        setDisplayNameError(updateError.message)
        return
      }

      if (data?.display_name) {
        setDisplayName(data.display_name)
        setDisplayNameDraft(data.display_name)
        setDisplayNameInfo('Display name updated.')
      }
    } finally {
      setSavingDisplayName(false)
    }
  }

  const handleCreateGame = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCreateError(null)

    const trimmedName = gameName.trim()
    if (!trimmedName) {
      setCreateError('Game name is required.')
      return
    }

    setIsCreating(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) {
        setCreateError(userError.message)
        return
      }
      if (!user) {
        setCreateError('You must be signed in to create a game.')
        return
      }

      const desc = description.trim()

      const { data: newGameId, error: gameError } = await supabase.rpc('create_game', {
        p_name: trimmedName,
        p_description: desc.length > 0 ? desc : '',
        p_is_public: isPublic,
        p_ruleset: DND5E_2024_RULESET_LABEL,
      })

      if (gameError) {
        setCreateError(gameError.message)
        return
      }

      if (!newGameId) {
        setCreateError('Could not create game (no id returned).')
        return
      }

      const refresh = await loadMyGames(user.id)
      if (refresh.error) {
        setGamesError(refresh.error)
      }

      setGameName('')
      setDescription('')
      setIsPublic(false)
    } finally {
      setIsCreating(false)
    }
  }
  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoadingGames(true)
      setLoadingProfile(true)
      setGamesError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setLoadingGames(false)
        setLoadingProfile(false)
        return
      }

      const refresh = await loadMyGames(user.id)
      if (cancelled) return

      if (refresh.error) {
        setGamesError(refresh.error)
        setGames([])
        setLoadingGames(false)
        return
      }

      setLoadingGames(false)

      
      setEmail(user.email ?? null)
      try {
        const { data: row, error: selectError } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .maybeSingle()

        if (selectError) {
          console.warn('profiles select:', selectError.message)
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
            console.warn('profiles update:', updateError.message)
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
          console.warn('profiles insert:', insertError.message)
          return
        }

        if (inserted?.display_name) {
          setDisplayName(inserted.display_name)
          setDisplayNameDraft(inserted.display_name)
        }
      } finally {
        setLoadingProfile(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [loadMyGames])

  const label = loadingProfile ? null : (displayName ?? email)

  return (
    <div className="app-panel">
      <h2>Games</h2>
      <p>
        {"You're signed in"}
        {label ? (
          <>
            {' '}
            as <strong>{label}</strong>
            {displayName && email && displayName !== email ? (
              <span style={{ color: 'var(--text)' }}> ({email})</span>
            ) : null}
          </>
        ) : null}
        .
      </p>
      <section>
        <h3>Your display name</h3>
        <form onSubmit={handleSaveDisplayName} className="create-game-form">
          <div className="form-row">
            <label htmlFor="display-name">Display name </label>
            <input
              id="display-name"
              name="display-name"
              type="text"
              autoComplete="off"
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              disabled={savingDisplayName || loadingProfile}
              minLength={1}
              required
            />
          </div>
          <button type="submit" disabled={savingDisplayName || loadingProfile}>
            {savingDisplayName ? 'Saving...' : 'Save display name'}
          </button>
          {displayNameError ? <p>{displayNameError}</p> : null}
          {displayNameInfo ? <p>{displayNameInfo}</p> : null}
        </form>
      </section>
      <section>
        <h3>Create a new game</h3>
        <form onSubmit={handleCreateGame} className="create-game-form">
          <div className="form-row">
            <label htmlFor="game-name">Game name </label>
            <input
              id="game-name"
              name="game-name"
              type="text"
              autoComplete="off"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              disabled={isCreating}
              minLength={3}
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="description">Description </label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
            />
          </div>

          <div className="form-row form-row-inline">
            <input
              id="is-public"
              name="is-public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label htmlFor="is-public">Public game </label>
          </div>

          <p className="muted create-game-ruleset-hint">
            New games use ruleset: <strong>{DND5E_2024_RULESET_LABEL}</strong>
          </p>

          <button type="submit" disabled={isCreating}>
            Create game
          </button>
          {createError ? <p>{createError}</p> : null}
        </form>
      </section>
      <section>
        <h3>My games</h3>
        {loadingGames ? (
          <p>Loading games...</p>
        ) : gamesError ? (
          <p>Could not load games: {gamesError}</p>
        ) : games.length === 0 ? (
          <p>You are not in any games yet.</p>
        ) : (
          <ul className="game-card-list">
            {games.map((game) => (
              <MyGameCard key={game.id} game={game} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}