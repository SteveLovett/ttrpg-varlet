import type { MonsterRef } from '../data/monsters'

/** Estimated CR when Open5e export omits challenge rating. */
export function estimateMonsterCr(monster: MonsterRef): number {
  if (monster.cr != null && Number.isFinite(monster.cr)) {
    return monster.cr
  }

  const name = monster.name.toLowerCase()

  if (name.includes('tarrasque')) return 30
  if (name.includes('ancient')) return 20
  if (name.includes('adult')) return 13
  if (name.includes('young')) return 7
  if (name.includes('wyrmling')) return 2
  if (name.includes('swarm')) return 2
  if (name.includes('vampire') && !name.includes('spawn') && !name.includes('familiar')) return 13
  if (name.includes('lich')) return 21
  if (name.includes('archmage') || name.includes('mage') && name.includes('arch')) return 12

  const weakKeywords = ['goblin', 'kobold', 'rat', 'bat', 'frog', 'crab', 'hawk', 'owl', 'cat', 'dog']
  if (weakKeywords.some((k) => name.includes(k))) return 0.25

  const midKeywords = ['ogre', 'troll', 'owlbear', 'manticore', 'bulette', 'ettin']
  if (midKeywords.some((k) => name.includes(k))) return 5

  const size = (monster.size ?? '').toLowerCase()
  if (size === 'tiny') return 0.125
  if (size === 'small') return 0.25
  if (size === 'large') return 2
  if (size === 'huge') return 8
  if (size === 'gargantuan') return 15

  return 1
}
