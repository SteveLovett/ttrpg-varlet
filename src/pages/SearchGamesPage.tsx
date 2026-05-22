import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

type SearchGame = {
  id: string
  name: string
  description: string | null
  is_public: boolean
}

export function SearchGamesPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joiningGameId, setJoiningGameId] = useState<string | null>(null)
  const [games, setGames] = useState<SearchGame[]>([])
  const [memberGameIds, setMemberGameIds] = useState<Set<string>>(new Set())

  const loadPublicGamesAndMemberships = useCallback(async () => {
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
      setError('You must be signed in.')
      setLoading(false)
      return
    }

    const [{ data: gamesData, error: gamesError }, { data: membershipsData, error: membershipsError }] =
      await Promise.all([
        supabase
          .from('games')
          .select('id, name, description, is_public')
          .eq('is_public', true)
          .order('created_at', { ascending: false }),
        supabase.from('game_members').select('game_id').eq('user_id', user.id),
      ])

    if (gamesError) {
      setError(gamesError.message)
      setLoading(false)
      return
    }
    if (membershipsError) {
      setError(membershipsError.message)
      setLoading(false)
      return
    }

    setGames((gamesData ?? []) as SearchGame[])
    setMemberGameIds(new Set((membershipsData ?? []).map((row) => row.game_id as string)))
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadPublicGamesAndMemberships()
  }, [loadPublicGamesAndMemberships])

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return games
    return games.filter((game) => {
      const haystack = `${game.name} ${game.description ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [games, query])

  async function handleJoin(gameId: string) {
    setError(null)
    setJoiningGameId(gameId)
    try {
      const { error: joinError } = await supabase.from('game_members').insert({
        game_id: gameId,
        game_role: 'Player',
      })

      if (joinError) {
        // Handle duplicate join attempts gracefully.
        if (joinError.code === '23505') {
          setMemberGameIds((prev) => new Set(prev).add(gameId))
          return
        }
        setError(joinError.message)
        return
      }

      setMemberGameIds((prev) => new Set(prev).add(gameId))
    } finally {
      setJoiningGameId(null)
    }
  }

  return (
    <div className="app-panel">
      <h2>Search games</h2>
      <p>Find public games and join instantly as a Player.</p>

      <div className="form-row search-form">
        <label htmlFor="search-query">Search</label>
        <input
          id="search-query"
          name="search-query"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by game name or description"
        />
      </div>

      {loading ? <p className="search-status">Loading public games...</p> : null}
      {!loading && error ? <p className="search-status">{error}</p> : null}
      {!loading && !error && filteredGames.length === 0 ? (
        <p className="search-status">No public games match your search.</p>
      ) : null}

      {!loading && !error && filteredGames.length > 0 ? (
        <ul className="search-results">
          {filteredGames.map((game) => {
            const isMember = memberGameIds.has(game.id)
            return (
              <li key={game.id}>
                <h4>{game.name}</h4>
                <p>{game.description && game.description.length > 0 ? game.description : 'No description yet.'}</p>
                {isMember ? (
                  <p>
                    Joined. <Link to={`/app/games/${game.id}`}>Open game</Link>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleJoin(game.id)}
                    disabled={joiningGameId === game.id}
                  >
                    {joiningGameId === game.id ? 'Joining...' : 'Join as Player'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
