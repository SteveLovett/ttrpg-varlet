import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'

type MembershipRow = {
  game_role: 'Game Master' | 'Player' | null
  games:
    | {
        id: string
        name: string
        description: string | null
        is_public: boolean
      }
    | Array<{
        id: string
        name: string
        description: string | null
        is_public: boolean
      }>
    | null
}

type PublicGameRow = {
  id: string
  name: string
  description: string | null
  is_public: boolean
}

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [description, setDescription] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState<boolean>(false)
  const [role, setRole] = useState<'Game Master' | 'Player' | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteInfo, setInviteInfo] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!gameId) {
        setError('Missing game id.')
        setLoading(false)
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (cancelled) return

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

      // First try membership row (gives role + game in one query).
      const { data: membershipData, error: membershipError } = await supabase
        .from('game_members')
        .select('game_role, games ( id, name, description, is_public )')
        .eq('user_id', user.id)
        .eq('game_id', gameId)
        .maybeSingle()

      if (cancelled) return

      if (membershipError) {
        setError(membershipError.message)
        setLoading(false)
        return
      }

      if (membershipData) {
        const row = membershipData as MembershipRow
        const game = Array.isArray(row.games) ? row.games[0] : row.games
        if (game) {
          setName(game.name)
          setDescription(game.description)
          setIsPublic(game.is_public)
          setRole(row.game_role === 'Game Master' ? 'Game Master' : 'Player')
          setLoading(false)
          return
        }
      }

      // Fallback: fetch public game directly (RLS allows public reads).
      const { data: publicGame, error: publicError } = await supabase
        .from('games')
        .select('id, name, description, is_public')
        .eq('id', gameId)
        .maybeSingle()

      if (cancelled) return

      if (publicError) {
        setError(publicError.message)
        setLoading(false)
        return
      }

      if (!publicGame) {
        setError('Game not found, or it is private and you have not joined.')
        setLoading(false)
        return
      }

      const pg = publicGame as PublicGameRow
      setName(pg.name)
      setDescription(pg.description)
      setIsPublic(pg.is_public)
      setRole(null)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [gameId])

  async function handleSendInvite(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setInviteError(null)
    setInviteInfo(null)
    if (!gameId) {
      setInviteError('Missing game id.')
      return
    }
    const email = inviteEmail.trim()
    if (!email) {
      setInviteError('Recipient email is required.')
      return
    }
    setInviteSending(true)
    try {
      const { data: found, error: findError } = await supabase.rpc('find_user_by_email', { p_email: email })
      if (findError) {
        setInviteError(findError.message)
        return
      }
      const recipient = Array.isArray(found) ? found[0] : found
      if (!recipient?.id) {
        setInviteError('No user found with that email.')
        return
      }

      const { error: rpcError } = await supabase.rpc('send_game_invite', {
        p_game_id: gameId,
        p_to_user_id: recipient.id,
      })
      if (rpcError) {
        setInviteError(rpcError.message)
        return
      }

      setInviteEmail('')
      setInviteInfo(`Invite sent to ${recipient.display_name ?? email}.`)
    } finally {
      setInviteSending(false)
    }
  }

  return (
    <div className="app-panel">
      <h2>Game detail</h2>
      {loading ? <p>Loading game...</p> : null}
      {!loading && error ? <p>{error}</p> : null}
      {!loading && !error ? (
        <>
          <p>
            <strong>{name}</strong>
          </p>
          <p>{description && description.length > 0 ? description : 'No description yet.'}</p>
          {role ? (
            <p>Role: {role}</p>
          ) : (
            <p>
              Visibility: {isPublic ? 'Public' : 'Private'} — you are not a member yet.
              {isPublic ? (
                <>
                  {' '}
                  <Link to="/app/search">Join from Search games</Link>
                </>
              ) : null}
            </p>
          )}

          {role === 'Game Master' ? (
            <section>
              <h3>Invite a player</h3>
              <form onSubmit={handleSendInvite} className="create-game-form">
                <div className="form-row">
                  <label htmlFor="invite-email">Recipient email </label>
                  <input
                    id="invite-email"
                    name="invite-email"
                    type="email"
                    autoComplete="off"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    disabled={inviteSending}
                    required
                  />
                </div>
                <button type="submit" disabled={inviteSending}>
                  {inviteSending ? 'Sending...' : 'Send invite'}
                </button>
                {inviteError ? <p>{inviteError}</p> : null}
                {inviteInfo ? <p>{inviteInfo}</p> : null}
              </form>
            </section>
          ) : null}
        </>
      ) : null}
      <p>
        <Link to="/app">Back to My games</Link>
      </p>
    </div>
  )
}
