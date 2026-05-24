type GameCardSkeletonProps = {
  count?: number
}

export function GameCardSkeleton({ count = 3 }: GameCardSkeletonProps) {
  return (
    <ul className="game-card-list game-card-list-skeleton" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <div className="game-card-skeleton">
            <span className="skeleton skeleton-chevron" />
            <div className="game-card-skeleton-main">
              <span className="skeleton skeleton-title" />
              <span className="skeleton skeleton-meta" />
            </div>
            <span className="skeleton skeleton-button" />
          </div>
        </li>
      ))}
    </ul>
  )
}
