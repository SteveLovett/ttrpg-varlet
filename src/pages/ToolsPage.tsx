import { Link } from 'react-router-dom'

/**
 * /app/tools — global tools hub (dice tray, bestiary, etc. in later phases).
 */
export function ToolsPage() {
  return (
    <div className="app-panel">
      <h2>Tools</h2>
      <p className="muted">
        Campaign utilities live here and inside each game&apos;s Session tab. More tools arrive in
        upcoming phases.
      </p>
      <ul className="tools-coming-list">
        <li>
          <strong>Dice tray</strong> — Phase F2
        </li>
        <li>
          <strong>Bestiary</strong> — Phase F4
        </li>
        <li>
          <strong>Rules quick reference</strong> — Phase F4
        </li>
      </ul>
      <p>
        <Link to="/app">Back to Games</Link>
      </p>
    </div>
  )
}
