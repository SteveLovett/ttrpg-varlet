import { useCallback, useEffect, useRef, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link } from 'react-router-dom'
import { GameCardSkeleton } from '../components/GameCardSkeleton'
import { MyGameCard } from '../components/MyGameCard'
import { useDisplayNameProfile } from '../hooks/displayNameProfileContext'
import {
  readCreateGamePanelExpanded,
  writeCreateGamePanelExpanded,
} from '../hooks/createGamePanelStorage'
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
 */
export function HomePage() {
  const { greetingLabel, displayName, email, loading: loadingProfile } = useDisplayNameProfile()

  const [games, setGames] = useState<GameSummary[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [gamesError, setGamesError] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [gameName, setGameName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)

  const [createExpanded, setCreateExpandedState] = useState(false)
  const createPrefsInitRef = useRef(false)

  const setCreateExpanded = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setCreateExpandedState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        writeCreateGamePanelExpanded(next)
        return next
      })
    },
    [],
  )

  const loadMyGames = useCallback(
    async (userId: string): Promise<{ error: string | null; count: number }> => {
      const { data, error } = await supabase
        .from('game_members')
        .select('game_role, games ( id, name, description, created_at, ruleset )')
        .eq('user_id', userId)

      if (error) {
        return { error: error.message, count: 0 }
      }

      const rows = (data ?? []) as GameMembershipRow[]
      const mapped = mapMembershipRowsToGames(rows)
      setGames(mapped)
      return { error: null, count: mapped.length }
    },
    [],
  )

  useEffect(() => {
    if (!createExpanded) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setCreateExpanded(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [createExpanded, setCreateExpanded])

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
      setCreateExpanded(false)
    } finally {
      setIsCreating(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    void (async () => {
      setLoadingGames(true)
      setGamesError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        setLoadingGames(false)
        return
      }

      const refresh = await loadMyGames(user.id)
      if (cancelled) return

      if (refresh.error) {
        setGamesError(refresh.error)
        setGames([])
      }

      if (!createPrefsInitRef.current) {
        createPrefsInitRef.current = true
        const gameCount = refresh.error ? 0 : refresh.count
        const shouldOpen =
          gameCount === 0 ? true : (readCreateGamePanelExpanded() ?? false)
        setCreateExpandedState(shouldOpen)
      }

      setLoadingGames(false)
    })()

    return () => {
      cancelled = true
    }
  }, [loadMyGames])

  function toggleCreatePanel() {
    setCreateExpanded((open) => {
      const next = !open
      if (next) {
        requestAnimationFrame(() => {
          document.getElementById('game-name')?.focus()
        })
      }
      return next
    })
  }

  return (
    <div className="app-panel app-panel-wide">
      <h2>Games</h2>
      <p className="games-intro">
        {loadingProfile ? (
          'Loading…'
        ) : greetingLabel ? (
          <>
            Signed in as <strong>{greetingLabel}</strong>
            {displayName && email && displayName !== email ? (
              <span className="muted"> ({email})</span>
            ) : null}
            . Change your display name in{' '}
            <Link to="/app/settings">Settings</Link>.
          </>
        ) : (
          <>
            Signed in. Set your display name in <Link to="/app/settings">Settings</Link>.
          </>
        )}
      </p>

      <section className="games-section">
        <h3>My games</h3>
        {loadingGames ? (
          <GameCardSkeleton count={games.length > 0 ? games.length : 3} />
        ) : gamesError ? (
          <p role="alert">Could not load games: {gamesError}</p>
        ) : games.length === 0 ? (
          <div className="games-empty-state">
            <p className="muted">You are not in any games yet.</p>
            <p className="games-empty-actions">
              <button type="button" className="link-button" onClick={() => setCreateExpanded(true)}>
                Create a game
              </button>
              {' · '}
              <Link to="/app/search">Search public games to join</Link>
            </p>
          </div>
        ) : (
          <ul className="game-card-list">
            {games.map((game) => (
              <MyGameCard key={game.id} game={game} />
            ))}
          </ul>
        )}
      </section>

      <section className="games-section games-create-section">
        <button
          type="button"
          className="disclosure-trigger"
          aria-expanded={createExpanded}
          aria-controls="create-game-panel"
          onClick={toggleCreatePanel}
        >
          <span className="disclosure-trigger-label">Create a new game</span>
          <span className="disclosure-chevron" aria-hidden />
        </button>
        <div
          id="create-game-panel"
          className="disclosure-panel"
          hidden={!createExpanded}
        >
          <form onSubmit={handleCreateGame} className="create-game-form">
            <div className="form-row">
              <label htmlFor="game-name">Game name</label>
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
              <label htmlFor="description">Description</label>
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
              <label htmlFor="is-public">Public game</label>
            </div>

            <p className="muted create-game-ruleset-hint">
              New games use ruleset: <strong>{DND5E_2024_RULESET_LABEL}</strong>
            </p>

            <button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating…' : 'Create game'}
            </button>
            {createError ? (
              <p className="form-error" role="alert">
                {createError}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </div>
  )
}
