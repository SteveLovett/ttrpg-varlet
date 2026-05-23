import { Link } from 'react-router-dom'

export type MyGameCardGame = {
  id: string
  name: string
  description: string | null
  role: 'Game Master' | 'Player'
  ruleset: string | null
}

type MyGameCardProps = {
  game: MyGameCardGame
}

export function MyGameCard({ game }: MyGameCardProps) {
  const description = game.description?.trim() ?? ''
  const descriptionText = description.length > 0 ? description : 'No description yet.'

  return (
    <li>
      <details className="game-card">
        <summary className="game-card-summary">
          <span className="game-card-chevron" aria-hidden="true" />
          <div className="game-card-summary-main">
            <span className="game-card-title">{game.name}</span>
            <span className="game-card-meta">
              Role: {game.role}
              {game.ruleset ? ` · Ruleset: ${game.ruleset}` : ''}
            </span>
          </div>
          <Link
            to={`/app/games/${game.id}`}
            className="game-card-open"
            onClick={(e) => e.stopPropagation()}
          >
            Open game
          </Link>
        </summary>
        <div className="game-card-body">
          <p className="game-card-description">{descriptionText}</p>
        </div>
      </details>
    </li>
  )
}
