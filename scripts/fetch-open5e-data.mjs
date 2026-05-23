#!/usr/bin/env node
/**
 * Downloads Open5e SRD (2024) creatures and spells into src/rules/dnd5e/data/.
 * Uses API v2 — unversioned /monsters/ URLs return 404.
 *
 * Run: npm run fetch:srd
 */
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../src/rules/dnd5e/data')

/** Document keys for D&D 5e (2024) SRD on Open5e v2. */
const DOCUMENT_KEYS = ['srd-2024']

const CREATURE_FIELDS = [
  'name',
  'key',
  'challenge_rating_decimal',
  'type',
  'size',
  'armor_class',
  'hit_point_max',
  'speed',
  'document',
].join(',')

const SPELL_FIELDS = ['name', 'key', 'level', 'school', 'casting_time', 'range', 'document'].join(
  ',',
)

async function fetchAllV2(path, documentKey, label) {
  const results = []
  const params = new URLSearchParams({
    document__key__in: documentKey,
    fields: path.includes('creatures') ? CREATURE_FIELDS : SPELL_FIELDS,
    limit: '100',
  })
  let url = `https://api.open5e.com/v2/${path}/?${params}`

  while (url) {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`${url} → ${res.status} ${res.statusText}`)
    }
    const body = await res.json()
    results.push(...(body.results ?? []))
    url = body.next
    process.stdout.write(`  ${label} (${documentKey}): ${results.length}\r`)
  }
  return results
}

function nestedName(value) {
  if (value == null) return null
  if (typeof value === 'string') return value
  return value.name ?? value.key ?? null
}

async function main() {
  const creatures = []
  const spells = []

  for (const docKey of DOCUMENT_KEYS) {
    creatures.push(...(await fetchAllV2('creatures', docKey, 'creatures')))
    spells.push(...(await fetchAllV2('spells', docKey, 'spells')))
  }

  const dedupe = (items, key) => {
    const seen = new Set()
    return items.filter((item) => {
      const k = item[key]
      if (!k || seen.has(k)) return false
      seen.add(k)
      return true
    })
  }

  const monsterList = dedupe(creatures, 'key').map((m) => ({
    slug: m.key,
    name: m.name,
    cr: m.challenge_rating_decimal ?? null,
    type: nestedName(m.type),
    size: nestedName(m.size),
    ac: m.armor_class ?? null,
    hp: m.hit_point_max ?? null,
    speed: m.speed ?? null,
    document: m.document?.key ?? 'srd-2024',
  }))

  const spellList = dedupe(spells, 'key').map((s) => ({
    slug: s.key,
    name: s.name,
    level: s.level ?? null,
    school: nestedName(s.school),
    casting_time: s.casting_time ?? null,
    range: s.range ?? null,
    document: s.document?.key ?? 'srd-2024',
  }))

  await writeFile(join(outDir, 'monsters.json'), JSON.stringify(monsterList, null, 0))
  await writeFile(join(outDir, 'spells.json'), JSON.stringify(spellList, null, 0))
  console.log(`\nWrote ${monsterList.length} creatures and ${spellList.length} spells to ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
