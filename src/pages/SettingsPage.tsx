import { FONT_OVERRIDE_IDS } from '../themes/types'
import { FONT_OVERRIDES } from '../themes/fonts'
import { THEME_LIST } from '../themes/registry'
import { useThemeSettings } from '../themes/themeContext'

export function SettingsPage() {
  const {
    preferences,
    loading,
    saving,
    error,
    savedAt,
    setThemeId,
    setFontOverrideId,
  } = useThemeSettings()

  const activeTheme = preferences.themeId ?? 'default'
  const activeFont = preferences.fontOverrideId ?? 'theme'

  return (
    <div className="settings-page">
      <header className="settings-header">
        <h2>Settings</h2>
        <p className="muted">Appearance and preferences for your account.</p>
        {loading ? <p className="settings-status muted" role="status">Loading…</p> : null}
        {!loading && saving ? (
          <p className="settings-status muted" role="status">Saving…</p>
        ) : null}
        {!loading && !saving && savedAt ? (
          <p className="settings-status settings-status-ok" role="status">Saved</p>
        ) : null}
        {error ? (
          <p className="settings-status settings-status-error" role="alert">
            {error}
          </p>
        ) : null}
      </header>

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
                  disabled={loading}
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
            disabled={loading}
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

      <section className="settings-section settings-coming-soon" aria-labelledby="settings-more">
        <h3 id="settings-more" className="settings-section-title">
          More settings
        </h3>
        <p className="muted">Additional options will appear here in a future update.</p>
      </section>
    </div>
  )
}
