import { Link } from 'react-router-dom'
import { AppBreadcrumbs } from '../components/AppBreadcrumbs'

/**
 * /app/tools — global tools hub (dice tray, bestiary, etc. in later phases).
 */
export function ToolsPage() {
  return (
    <div className="app-panel">
      <AppBreadcrumbs items={[{ label: 'Games', to: '/app' }, { label: 'Tools' }]} />
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
          <Link to="/app/tools/bestiary">
            <strong>Bestiary</strong>
          </Link>{' '}
          — browse SRD creatures (search &amp; filter)
        </li>
        <li>
          <strong>Rules quick reference</strong> — conditions on the{' '}
          <Link to="/app/tools/dice">dice tray</Link> page
        </li>
      </ul>
    </div>
  )
}
