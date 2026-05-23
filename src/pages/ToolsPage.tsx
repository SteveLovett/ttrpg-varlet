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
          <Link to="/app/tools/dice">
            <strong>Dice tray</strong>
          </Link>{' '}
          — roll any formula, d20 with advantage/disadvantage
        </li>
        <li>
          <strong>Bestiary</strong> — Phase F4 (after running fetch:srd)
        </li>
        <li>
          <strong>Rules quick reference</strong> — conditions on dice page; full compendium in F4
        </li>
      </ul>
      <p>
        <Link to="/app">Back to Games</Link>
      </p>
    </div>
  )
}
