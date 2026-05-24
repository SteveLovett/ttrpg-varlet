import { Link } from 'react-router-dom'
import { AppBreadcrumbs } from '../components/AppBreadcrumbs'
import { flattenRulesReference } from '../rules/dnd5e/data/rulesReference'

const RULE_ENTRY_COUNT = flattenRulesReference().length

/**
 * /app/tools — global tools hub (dice, compendiums, rules reference).
 */
export function ToolsPage() {
  return (
    <div className="app-panel">
      <AppBreadcrumbs items={[{ label: 'Games', to: '/app' }, { label: 'Tools' }]} />
      <h2>Tools</h2>
      <p className="muted">
        Campaign utilities live here and inside each game&apos;s Session tab. Browse SRD data, roll
        dice, and look up common rules at the table.
      </p>
      <ul className="tools-coming-list">
        <li>
          <Link to="/app/tools/dice">
            <strong>Dice tray</strong>
          </Link>{' '}
          — roll any formula, d20 with advantage/disadvantage
        </li>
        <li>
          <Link to="/app/tools/rules">
            <strong>Rules quick reference</strong>
          </Link>{' '}
          — conditions, combat actions, cover, DCs, and more ({RULE_ENTRY_COUNT} entries)
        </li>
        <li>
          <Link to="/app/tools/bestiary">
            <strong>Bestiary</strong>
          </Link>{' '}
          — browse SRD creatures (search &amp; filter)
        </li>
        <li>
          <Link to="/app/tools/equipment">
            <strong>Equipment</strong>
          </Link>{' '}
          — browse SRD weapons, armor, and gear
        </li>
        <li>
          <Link to="/app/tools/spells">
            <strong>Spells</strong>
          </Link>{' '}
          — SRD spell compendium by level, school, and search
        </li>
      </ul>
    </div>
  )
}
