import { useCallback, useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { GameSessionPanel } from '../components/GameSessionPanel'
import { DND5E_2024_RULESET_LABEL } from '../rules/dnd5e/constants'
import { supabase } from '../supabaseClient'

const GAME_TABS = ['overview', 'characters', 'session', 'vtt'] as const
type GameTab = (typeof GAME_TABS)[number]

const TAB_LABELS: Record<GameTab, string> = {
  overview: 'Overview',
  characters: 'Characters',
  session: 'Session',
  vtt: 'VTT',
}

function tabFromParam(raw: string | null): GameTab {
  if (raw && (GAME_TABS as readonly string[]).includes(raw)) {
    return raw as GameTab
  }
  return 'overview'
}

type Role = 'Game Master' | 'Player'

type GameContent = {
  id: string
  name: string
  description: string | null
  is_public: boolean
  ruleset: string | null
  house_rules: string | null
  session_notes: string | null
}

type MembershipRow = {
  game_role: Role | null
  games: GameContent | GameContent[] | null
}

type PublicGameRow = GameContent

type MemberRow = {
  user_id: string
  display_name: string | null
  game_role: Role
  joined_at: string | null
}

function GameTabPlaceholder({
  title,
  phase,
  summary,
}: {
  title: string
  phase: string
  summary: string
}) {
  return (
    <section className="game-tab-placeholder">
      <h3>{title}</h3>
      <p className="muted">{summary}</p>
      <p>
        <span className="phase-badge">{phase}</span>
      </p>
    </section>
  )
}

export function GameDetailPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = tabFromParam(searchParams.get('tab'))

  function setActiveTab(tab: GameTab) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (tab === 'overview') {
          next.delete('tab')
        } else {
          next.set('tab', tab)
        }
        return next
      },
      { replace: true },
    )
  }

  // Game + viewer
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [isPublic, setIsPublic] = useState<boolean>(false)
  const [role, setRole] = useState<Role | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Lobby settings draft (GM only)
  const [draftName, setDraftName] = useState<string>('')
  const [draftDescription, setDraftDescription] = useState<string>('')
  const [draftPublic, setDraftPublic] = useState<boolean>(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsInfo, setSettingsInfo] = useState<string | null>(null)

  // Game content (ruleset / house rules / session notes)
  const [ruleset, setRuleset] = useState<string>('')
  const [houseRules, setHouseRules] = useState<string>('')
  const [sessionNotes, setSessionNotes] = useState<string>('')
  const [draftRuleset, setDraftRuleset] = useState<string>('')
  const [draftHouseRules, setDraftHouseRules] = useState<string>('')
  const [draftSessionNotes, setDraftSessionNotes] = useState<string>('')
  const [savingContent, setSavingContent] = useState(false)
  const [contentError, setContentError] = useState<string | null>(null)
  const [contentInfo, setContentInfo] = useState<string | null>(null)

  // Invite
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteInfo, setInviteInfo] = useState<string | null>(null)

  // Members
  const [members, setMembers] = useState<MemberRow[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [actingUserId, setActingUserId] = useState<string | null>(null)
  const [memberActionError, setMemberActionError] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)

  const loadGame = useCallback(async (): Promise<void> => {
    if (!gameId) {
      setError('Missing game id.')
      setLoading(false)
      return
    }

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
    setCurrentUserId(user.id)

    const gameSelect = 'id, name, description, is_public, ruleset, house_rules, session_notes'

    // Try membership-first query (gives role + game in one round-trip).
    const { data: membershipData, error: membershipError } = await supabase
      .from('game_members')
      .select(`game_role, games ( ${gameSelect} )`)
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .maybeSingle()

    if (membershipError) {
      setError(membershipError.message)
      setLoading(false)
      return
    }

    function seedFromGame(game: GameContent, viewerRole: Role | null) {
      setName(game.name)
      setDescription(game.description ?? '')
      setIsPublic(game.is_public)
      setRuleset(game.ruleset ?? '')
      setHouseRules(game.house_rules ?? '')
      setSessionNotes(game.session_notes ?? '')
      setRole(viewerRole)
      setDraftName(game.name)
      setDraftDescription(game.description ?? '')
      setDraftPublic(game.is_public)
      setDraftRuleset(game.ruleset ?? '')
      setDraftHouseRules(game.house_rules ?? '')
      setDraftSessionNotes(game.session_notes ?? '')
    }

    if (membershipData) {
      const row = membershipData as MembershipRow
      const game = Array.isArray(row.games) ? row.games[0] : row.games
      if (game) {
        seedFromGame(game, row.game_role === 'Game Master' ? 'Game Master' : 'Player')
        setLoading(false)
        return
      }
    }

    // Fallback: public game viewable without membership.
    const { data: publicGame, error: publicError } = await supabase
      .from('games')
      .select(gameSelect)
      .eq('id', gameId)
      .maybeSingle()

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

    seedFromGame(publicGame as PublicGameRow, null)
    setLoading(false)
  }, [gameId])

  const loadMembers = useCallback(async (): Promise<void> => {
    if (!gameId) return
    setMembersLoading(true)
    setMembersError(null)
    const { data, error: rpcError } = await supabase.rpc('list_game_members', {
      p_game_id: gameId,
    })
    if (rpcError) {
      setMembersError(rpcError.message)
      setMembers([])
      setMembersLoading(false)
      return
    }
    setMembers((data ?? []) as MemberRow[])
    setMembersLoading(false)
  }, [gameId])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      await loadGame()
      if (cancelled) return
    })()
    return () => {
      cancelled = true
    }
  }, [loadGame])

  // Members panel is only useful for members; load when we have a role.
  useEffect(() => {
    if (role === 'Game Master' || role === 'Player') {
      void loadMembers()
    } else {
      setMembers([])
    }
  }, [role, loadMembers])

  async function handleSaveSettings(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setSettingsError(null)
    setSettingsInfo(null)

    if (!gameId) return
    const trimmedName = draftName.trim()
    if (trimmedName.length < 3) {
      setSettingsError('Name must be at least 3 characters.')
      return
    }

    setSavingSettings(true)
    try {
      const { error: updateError } = await supabase
        .from('games')
        .update({
          name: trimmedName,
          description: draftDescription.trim(),
          is_public: draftPublic,
        })
        .eq('id', gameId)

      if (updateError) {
        setSettingsError(updateError.message)
        return
      }

      setName(trimmedName)
      setDescription(draftDescription.trim())
      setIsPublic(draftPublic)
      setSettingsInfo('Lobby settings saved.')
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleSaveContent(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setContentError(null)
    setContentInfo(null)
    if (!gameId) return

    const trimmedRuleset = draftRuleset.trim()
    if (trimmedRuleset.length > 64) {
      setContentError('Ruleset label must be 64 characters or less.')
      return
    }
    if (draftHouseRules.length > 20000 || draftSessionNotes.length > 20000) {
      setContentError('House rules and session notes are limited to 20,000 characters each.')
      return
    }

    setSavingContent(true)
    try {
      const { error: updateError } = await supabase
        .from('games')
        .update({
          ruleset: trimmedRuleset,
          house_rules: draftHouseRules,
          session_notes: draftSessionNotes,
        })
        .eq('id', gameId)

      if (updateError) {
        setContentError(updateError.message)
        return
      }

      setRuleset(trimmedRuleset)
      setHouseRules(draftHouseRules)
      setSessionNotes(draftSessionNotes)
      setContentInfo('Game content saved.')
    } finally {
      setSavingContent(false)
    }
  }

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

  async function callMemberRpc(
    rpc: 'promote_to_gm' | 'demote_from_gm' | 'remove_member',
    targetUserId: string,
  ) {
    if (!gameId) return
    setMemberActionError(null)
    setActingUserId(targetUserId)
    try {
      const { error: rpcError } = await supabase.rpc(rpc, {
        p_game_id: gameId,
        p_user_id: targetUserId,
      })
      if (rpcError) {
        setMemberActionError(rpcError.message)
        return
      }
      await loadMembers()
    } finally {
      setActingUserId(null)
    }
  }

  async function handleLeaveGame() {
    if (!gameId) return
    const confirmed = window.confirm('Leave this game? You can rejoin later if it is public.')
    if (!confirmed) return
    setMemberActionError(null)
    setLeaving(true)
    try {
      const { error: rpcError } = await supabase.rpc('leave_game', { p_game_id: gameId })
      if (rpcError) {
        setMemberActionError(rpcError.message)
        return
      }
      navigate('/app', { replace: true })
    } finally {
      setLeaving(false)
    }
  }

  const isGM = role === 'Game Master'
  const isMember = role === 'Game Master' || role === 'Player'
  const gmCount = members.filter((m) => m.game_role === 'Game Master').length
  const displayRuleset =
    ruleset.length > 0 ? ruleset : DND5E_2024_RULESET_LABEL

  return (
    <div className="app-panel app-panel-wide">
      {loading ? <p>Loading game...</p> : null}
      {!loading && error ? (
        <>
          <h2>Game</h2>
          <p>{error}</p>
        </>
      ) : null}
      {!loading && !error ? (
        <>
          <header className="game-detail-header">
            <h2>{name}</h2>
            <p className="game-detail-meta">
              {description.length > 0 ? description : 'No description yet.'}
            </p>
            <p className="game-detail-meta">
              {role ? (
                <>
                  Role: <strong>{role}</strong>
                  {' · '}
                  Ruleset: <strong>{displayRuleset}</strong>
                </>
              ) : (
                <>
                  Visibility: {isPublic ? 'Public' : 'Private'} — you are not a member yet.
                  {isPublic ? (
                    <>
                      {' '}
                      <Link to="/app/search">Join from Search games</Link>
                    </>
                  ) : null}
                </>
              )}
            </p>
          </header>

          <nav className="game-detail-tabs" aria-label="Game sections">
            {GAME_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab${activeTab === tab ? ' active' : ''}`}
                aria-current={activeTab === tab ? 'page' : undefined}
                onClick={() => setActiveTab(tab)}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </nav>

          {activeTab === 'overview' ? (
            <div className="game-tab-panel">
          {isGM ? (
            <section>
              <h3>Lobby settings</h3>
              <form onSubmit={handleSaveSettings} className="create-game-form">
                <div className="form-row">
                  <label htmlFor="settings-name">Game name </label>
                  <input
                    id="settings-name"
                    name="settings-name"
                    type="text"
                    autoComplete="off"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    disabled={savingSettings}
                    minLength={3}
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="settings-description">Description </label>
                  <textarea
                    id="settings-description"
                    name="settings-description"
                    value={draftDescription}
                    onChange={(e) => setDraftDescription(e.target.value)}
                    disabled={savingSettings}
                  />
                </div>
                <div className="form-row form-row-inline">
                  <input
                    id="settings-public"
                    name="settings-public"
                    type="checkbox"
                    checked={draftPublic}
                    onChange={(e) => setDraftPublic(e.target.checked)}
                    disabled={savingSettings}
                  />
                  <label htmlFor="settings-public">Public game </label>
                </div>
                <button type="submit" disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save lobby settings'}
                </button>
                {settingsError ? <p>{settingsError}</p> : null}
                {settingsInfo ? <p>{settingsInfo}</p> : null}
              </form>
            </section>
          ) : null}

          {isGM ? (
            <section>
              <h3>Game content</h3>
              <p className="muted">
                Ruleset, house rules, and session notes — visible to all members and (if public)
                anyone who can see the game.
              </p>
              <form onSubmit={handleSaveContent} className="create-game-form">
                <div className="form-row">
                  <label htmlFor="content-ruleset">Ruleset label </label>
                  <input
                    id="content-ruleset"
                    name="content-ruleset"
                    type="text"
                    autoComplete="off"
                    value={draftRuleset}
                    onChange={(e) => setDraftRuleset(e.target.value)}
                    disabled={savingContent}
                    maxLength={64}
                    placeholder={DND5E_2024_RULESET_LABEL}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="content-house-rules">House rules</label>
                  <textarea
                    id="content-house-rules"
                    name="content-house-rules"
                    value={draftHouseRules}
                    onChange={(e) => setDraftHouseRules(e.target.value)}
                    disabled={savingContent}
                    maxLength={20000}
                    rows={6}
                    placeholder="Stable rules for this campaign (markdown or plain text)."
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="content-session-notes">Session notes</label>
                  <textarea
                    id="content-session-notes"
                    name="content-session-notes"
                    value={draftSessionNotes}
                    onChange={(e) => setDraftSessionNotes(e.target.value)}
                    disabled={savingContent}
                    maxLength={20000}
                    rows={8}
                    placeholder="Active campaign notes — update between sessions."
                  />
                </div>
                <button type="submit" disabled={savingContent}>
                  {savingContent ? 'Saving...' : 'Save game content'}
                </button>
                {contentError ? <p>{contentError}</p> : null}
                {contentInfo ? <p>{contentInfo}</p> : null}
              </form>
            </section>
          ) : null}

          {(ruleset.length > 0 || houseRules.length > 0 || sessionNotes.length > 0) ? (
            <section>
              <h3>Reference</h3>
              {ruleset.length > 0 ? (
                <p>
                  <strong>Ruleset:</strong> {ruleset}
                </p>
              ) : null}
              {houseRules.length > 0 ? (
                <div className="reference-block">
                  <h4>House rules</h4>
                  <pre className="reference-body">{houseRules}</pre>
                </div>
              ) : null}
              {sessionNotes.length > 0 ? (
                <div className="reference-block">
                  <h4>Session notes</h4>
                  <pre className="reference-body">{sessionNotes}</pre>
                </div>
              ) : null}
            </section>
          ) : null}

          {isGM ? (
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

          {role ? (
            <section>
              <h3>Members</h3>
              {membersLoading ? <p>Loading members...</p> : null}
              {!membersLoading && membersError ? <p>Could not load members: {membersError}</p> : null}
              {memberActionError ? <p>{memberActionError}</p> : null}
              {!membersLoading && !membersError && members.length === 0 ? (
                <p>No members yet.</p>
              ) : null}
              {!membersLoading && !membersError && members.length > 0 ? (
                <ul className="members-list">
                  {members.map((m) => {
                    const isSelf = m.user_id === currentUserId
                    const isMemberGM = m.game_role === 'Game Master'
                    const acting = actingUserId === m.user_id
                    const lastGM = isMemberGM && gmCount <= 1
                    return (
                      <li key={m.user_id} className="member-row">
                        <div className="member-meta">
                          <strong>{m.display_name ?? '(unknown)'}</strong>
                          {isSelf ? ' (you)' : ''} — {m.game_role}
                        </div>
                        {isGM && !isSelf ? (
                          <div className="member-actions">
                            {isMemberGM ? (
                              <button
                                type="button"
                                onClick={() => void callMemberRpc('demote_from_gm', m.user_id)}
                                disabled={acting || lastGM}
                                title={lastGM ? 'Cannot demote the last Game Master' : undefined}
                              >
                                {acting ? 'Working...' : 'Demote'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => void callMemberRpc('promote_to_gm', m.user_id)}
                                disabled={acting}
                              >
                                {acting ? 'Working...' : 'Promote to GM'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => void callMemberRpc('remove_member', m.user_id)}
                              disabled={acting || lastGM}
                              title={lastGM ? 'Cannot remove the last Game Master' : undefined}
                            >
                              Remove
                            </button>
                          </div>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              ) : null}

              <div className="leave-game-row">
                <button
                  type="button"
                  className="danger"
                  onClick={() => void handleLeaveGame()}
                  disabled={leaving || (isGM && gmCount <= 1)}
                  title={isGM && gmCount <= 1 ? 'Promote another GM before leaving' : undefined}
                >
                  {leaving ? 'Leaving...' : 'Leave game'}
                </button>
                {isGM && gmCount <= 1 ? (
                  <p className="leave-hint">
                    You are the only Game Master. Promote another member to GM before you can leave.
                  </p>
                ) : null}
              </div>
            </section>
          ) : null}
            </div>
          ) : null}

          {activeTab === 'characters' ? (
            <div className="game-tab-panel">
              {isMember ? (
                <GameTabPlaceholder
                  title="Characters"
                  phase="Phase F3"
                  summary="Build and attach D&D 5e (2024) player characters to this campaign."
                />
              ) : (
                <p className="muted">Join this game to manage characters.</p>
              )}
            </div>
          ) : null}

          {activeTab === 'session' ? (
            <div className="game-tab-panel">
              {isMember && gameId ? (
                <GameSessionPanel gameId={gameId} currentUserId={currentUserId} />
              ) : (
                <p className="muted">Join this game to use session tools.</p>
              )}
            </div>
          ) : null}

          {activeTab === 'vtt' ? (
            <div className="game-tab-panel">
              {isMember ? (
                <GameTabPlaceholder
                  title="Virtual tabletop"
                  phase="Phase F6"
                  summary="Battle maps, tokens, and fog of war for online combat."
                />
              ) : (
                <p className="muted">Join this game to open the VTT.</p>
              )}
            </div>
          ) : null}
        </>
      ) : null}
      <p className="game-detail-back">
        <Link to="/app">Back to Games</Link>
      </p>
    </div>
  )
}
