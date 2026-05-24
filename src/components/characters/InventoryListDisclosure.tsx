import { useId, useState, type ReactNode } from 'react'
import { DisclosureSection } from '../DisclosureSection'

type InventoryListDisclosureProps = {
  itemCount: number
  children: ReactNode
  defaultExpanded?: boolean
}

export function InventoryListDisclosure({
  itemCount,
  children,
  defaultExpanded = true,
}: InventoryListDisclosureProps) {
  const reactId = useId()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const title = itemCount === 0 ? 'Items' : `Items (${itemCount})`

  return (
    <DisclosureSection
      id={`character-inventory-list-${reactId}`}
      title={title}
      expanded={expanded}
      onToggle={() => setExpanded((open) => !open)}
      className="character-inventory-list-disclosure"
    >
      {children}
    </DisclosureSection>
  )
}
