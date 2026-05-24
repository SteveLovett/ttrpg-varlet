import { AppBreadcrumbs } from '../components/AppBreadcrumbs'
import { FONT_OVERRIDE_IDS } from '../themes/types'
import { FONT_OVERRIDES } from '../themes/fonts'
import { THEME_LIST } from '../themes/registry'
import { UserSpellcastingValidationField } from '../components/settings/SpellcastingValidationFields'
import { DEFAULT_SPELLCASTING_VALIDATION_MODE } from '../settings/validation'
import { useThemeSettings } from '../themes/themeContext'
import { useDisplayNameProfile } from '../hooks/displayNameProfileContext'

export function SettingsPage() {
  const {
    preferences,
    loading: themeLoading,
    saving,
    error: themeError,
    savedAt,
    setThemeId,
    setFontOverrideId,
    setSpellcastingValidation,
  } = useThemeSettings()

  const {
    email,
    displayName,
    displayNameDraft,
    setDisplayNameDraft,
    loading: profileLoading,
    saving: savingDisplayName,
    error: displayNameError,
    info: displayNameInfo,
    saveDisplayName,
  } = useDisplayNameProfile()

  const activeTheme = preferences.themeId ?? 'default'
  const activeFont = preferences.fontOverrideId ?? 'theme'

  return (
    <div className="settings-page">
      <AppBreadcrumbs items={[{ label: 'Games', to: '/app' }, { label: 'Settings' }]} />
      <header className="settings-header">
        <h2>Settings</h2>
        <p className="muted">Account, appearance, and preferences.</p>
        {themeLoading ? <p className="settings-status muted" role="status">Loading…</p> : null}
        {!themeLoading && saving ? (
          <p className="settings-status muted" role="status">Saving…</p>
        ) : null}
        {!themeLoading && !saving && savedAt ? (
          <p className="settings-status settings-status-ok" role="status">Saved</p>
        ) : null}
        {themeError ? (
          <p className="settings-status settings-status-error" role="alert">
            {themeError}
          </p>
        ) : null}
      </header>

      <section className="settings-section" aria-labelledby="settings-profile">
        <h3 id="settings-profile" className="settings-section-title">
          Profile
        </h3>
        <p className="muted settings-lede">
          Your display name is shown in chat, rolls, and game member lists.
        </p>
        {email ? (
          <p className="settings-email muted">
            Signed in as <strong>{email}</strong>
          </p>
        ) : null}
        <form onSubmit={saveDisplayName} className="create-game-form settings-profile-form">
          <div className="form-row">
            <label htmlFor="settings-display-name">Display name</label>
            <input
              id="settings-display-name"
              name="display-name"
              type="text"
              autoComplete="nickname"
              value={displayNameDraft}
              onChange={(e) => setDisplayNameDraft(e.target.value)}
              disabled={savingDisplayName || profileLoading}
              minLength={1}
              required
            />
          </div>
          <button type="submit" disabled={savingDisplayName || profileLoading}>
            {savingDisplayName ? 'Saving…' : 'Save display name'}
          </button>
          {displayNameError ? (
            <p className="settings-status-error" role="alert">
              {displayNameError}
            </p>
          ) : null}
          {displayNameInfo ? (
            <p className="settings-status-ok" role="status">
              {displayNameInfo}
            </p>
          ) : null}
        </form>
        {displayName && email && displayName !== email ? (
          <p className="muted settings-profile-hint">
            Currently shown to others as <strong>{displayName}</strong>.
          </p>
        ) : null}
      </section>

      <section className="settings-section" aria-labelledby="settings-appearance">
        <h3 id="settings-appearance" className="settings-section-title">
          Appearance
        </h3>
        <p className="muted settings-lede">Choose a color theme for the app.</p>
        <ul className="theme-grid" role="list">
          {THEME_LIST.map((theme) => {
            const selected = theme.id === activeTheme
            return (
              <li key={theme.id}>
                <button
                  type="button"
                  className={`theme-card${selected ? ' is-selected' : ''}`}
                  aria-pressed={selected}
                  disabled={themeLoading}
                  onClick={() => setThemeId(theme.id)}
                >
                  <span className="theme-card-swatch" aria-hidden>
                    <span style={{ background: theme.swatch[0] }} />
                    <span style={{ background: theme.swatch[1] }} />
                    <span style={{ background: theme.swatch[2] }} />
                  </span>
                  <span className="theme-card-name">{theme.name}</span>
                  <span className="theme-card-desc muted">{theme.description}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="settings-section" aria-labelledby="settings-font">
        <h3 id="settings-font" className="settings-section-title">
          Font
        </h3>
        <p className="muted settings-lede">
          Override the theme&apos;s fonts globally. Theme default uses each preset&apos;s
          paired typefaces.
        </p>
        <div className="form-row settings-font-row">
          <label htmlFor="settings-font-select">Font family</label>
          <select
            id="settings-font-select"
            value={activeFont}
            disabled={themeLoading}
            onChange={(e) => setFontOverrideId(e.target.value as typeof activeFont)}
          >
            {FONT_OVERRIDE_IDS.map((id) => (
              <option key={id} value={id}>
                {FONT_OVERRIDES[id].name}
              </option>
            ))}
          </select>
        </div>
        <p className="settings-font-sample" aria-live="polite">
          <span className="settings-font-sample-label">Preview: </span>
          The quick brown fox jumps over the lazy dog. Roll for initiative.
        </p>
      </section>

      <section className="settings-section" aria-labelledby="settings-characters">
        <h3 id="settings-characters" className="settings-section-title">
          Characters
        </h3>
        <p className="muted settings-lede">
          How strictly spellcasting is validated when you save a character sheet.
        </p>
        <UserSpellcastingValidationField
          id="settings-spellcasting-validation"
          value={preferences.spellcastingValidation ?? DEFAULT_SPELLCASTING_VALIDATION_MODE}
          disabled={themeLoading}
          onChange={setSpellcastingValidation}
        />
      </section>
    </div>
  )
}
