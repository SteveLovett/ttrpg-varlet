import type { ReactNode } from 'react'

type DisclosureSectionProps = {
  id: string
  title: string
  expanded: boolean
  onToggle: () => void
  children: ReactNode
  className?: string
}

export function DisclosureSection({
  id,
  title,
  expanded,
  onToggle,
  children,
  className,
}: DisclosureSectionProps) {
  const panelId = `${id}-panel`

  return (
    <section
      className={['overview-disclosure', className].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        className="disclosure-trigger"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="disclosure-trigger-label">{title}</span>
        <span className="disclosure-chevron" aria-hidden />
      </button>
      <div id={panelId} className="disclosure-panel" hidden={!expanded}>
        {children}
      </div>
    </section>
  )
}
