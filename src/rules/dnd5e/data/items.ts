import itemsData from './items.json'

export type ItemRef = {
  slug: string
  name: string
  category: string | null
  cost: string | null
  weight: number | null
  weight_unit: string | null
  document: string | null
}

export const items = itemsData as ItemRef[]

const bySlug = new Map(items.map((i) => [i.slug, i]))

export function getItemBySlug(slug: string): ItemRef | undefined {
  return bySlug.get(slug)
}
