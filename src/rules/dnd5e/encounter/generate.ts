import { monsters, type MonsterRef } from '../data/monsters'
import { estimateMonsterCr } from './cr'
import { partyXpBudget, xpForCr } from './xp'

export type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'deadly'

export type GeneratedEncounter = {
  partySize: number
  partyLevel: number
  difficulty: EncounterDifficulty
  xpBudget: number
  xpUsed: number
  monsters: { monster: MonsterRef; count: number; cr: number; xpEach: number }[]
}

export type GenerateOptions = {
  partySize: number
  partyLevel: number
  difficulty: EncounterDifficulty
  environment?: string
  typeFilter?: string
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function generateEncounter(opts: GenerateOptions): GeneratedEncounter {
  const partySize = Math.max(1, Math.min(8, opts.partySize))
  const partyLevel = Math.max(1, Math.min(20, opts.partyLevel))
  const budget = partyXpBudget(partySize, partyLevel, opts.difficulty)
  const maxCr = partyLevel + 2

  let pool = monsters.filter((m) => {
    const cr = estimateMonsterCr(m)
    return cr <= maxCr && cr >= 0
  })

  if (opts.typeFilter && opts.typeFilter.length > 0) {
    const t = opts.typeFilter.toLowerCase()
    const filtered = pool.filter((m) => (m.type ?? '').toLowerCase().includes(t))
    if (filtered.length > 0) pool = filtered
  }

  pool = shuffle(pool)

  const picked: GeneratedEncounter['monsters'] = []
  let xpUsed = 0
  let guard = 0

  while (xpUsed < budget && guard < 200 && pool.length > 0) {
    guard++
    const monster = pool[Math.floor(Math.random() * pool.length)]
    const cr = estimateMonsterCr(monster)
    const xpEach = xpForCr(cr)
    if (xpEach <= 0) continue
    if (xpUsed + xpEach > budget * 1.25 && picked.length > 0) continue

    const existing = picked.find((p) => p.monster.slug === monster.slug)
    if (existing) {
      existing.count += 1
    } else {
      picked.push({ monster, count: 1, cr, xpEach })
    }
    xpUsed += xpEach
  }

  if (picked.length === 0 && pool.length > 0) {
    const monster = pool[0]
    const cr = estimateMonsterCr(monster)
    const xpEach = xpForCr(cr)
    picked.push({ monster, count: 1, cr, xpEach })
    xpUsed = xpEach
  }

  return {
    partySize,
    partyLevel,
    difficulty: opts.difficulty,
    xpBudget: budget,
    xpUsed,
    monsters: picked,
  }
}

export function formatEncounterForNotes(enc: GeneratedEncounter): string {
  const lines: string[] = [
    `--- Generated encounter (${new Date().toLocaleString()}) ---`,
    `Party: ${enc.partySize} × level ${enc.partyLevel} · ${enc.difficulty} (budget ${enc.xpBudget} XP, used ~${enc.xpUsed} XP)`,
    '',
  ]

  for (const row of enc.monsters) {
    const crLabel = row.cr < 1 ? String(row.cr) : String(row.cr)
    lines.push(
      `• ${row.count > 1 ? `${row.count}× ` : ''}${row.monster.name} (est. CR ${crLabel}) — ${row.monster.type ?? 'Unknown'}${row.monster.size ? `, ${row.monster.size}` : ''}`,
    )
  }

  lines.push('')
  return lines.join('\n')
}
