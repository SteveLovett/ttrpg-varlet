import { Link } from 'react-router-dom'

export type BreadcrumbItem = {
  label: string
  to?: string
}

type AppBreadcrumbsProps = {
  items: BreadcrumbItem[]
}

export function AppBreadcrumbs({ items }: AppBreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav className="app-breadcrumbs" aria-label="Breadcrumb">
      <ol className="app-breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="app-breadcrumbs-item">
              {item.to && !isLast ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
