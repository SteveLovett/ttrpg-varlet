export type InitiativeEntry = {
  id: string
  name: string
  value: number
  isPc?: boolean
}

export function parseInitiativeJson(raw: unknown): InitiativeEntry[] {
  if (!Array.isArray(raw)) return []
  const entries: InitiativeEntry[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const o = item as Partial<InitiativeEntry>
    if (typeof o.id !== 'string' || typeof o.name !== 'string') continue
    const value = typeof o.value === 'number' ? o.value : Number.parseInt(String(o.value), 10)
    if (!Number.isFinite(value)) continue
    entries.push({
      id: o.id,
      name: o.name,
      value,
      isPc: o.isPc === true,
    })
  }
  return entries.sort((a, b) => b.value - a.value)
}

export function newInitiativeEntry(name: string, value: number, isPc = false): InitiativeEntry {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    value,
    isPc,
  }
}
