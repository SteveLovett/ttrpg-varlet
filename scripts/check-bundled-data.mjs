#!/usr/bin/env node
/**
 * Quick guard: bundled Open5e indexes should not be empty in release builds.
 * Run: node scripts/check-bundled-data.mjs
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../src/rules/dnd5e/data')

const MIN_SPELLS = 100
const MIN_MONSTERS = 50

async function loadJson(name) {
  const raw = await readFile(join(dataDir, name), 'utf8')
  return JSON.parse(raw)
}

async function main() {
  const errors = []
  const spells = await loadJson('spells.json')
  const monsters = await loadJson('monsters.json')

  if (!Array.isArray(spells) || spells.length < MIN_SPELLS) {
    errors.push(`spells.json: expected ≥${MIN_SPELLS} entries, got ${Array.isArray(spells) ? spells.length : 'invalid'}`)
  }
  if (!Array.isArray(monsters) || monsters.length < MIN_MONSTERS) {
    errors.push(
      `monsters.json: expected ≥${MIN_MONSTERS} entries, got ${Array.isArray(monsters) ? monsters.length : 'invalid'}`,
    )
  }

  if (errors.length > 0) {
    console.error('Bundled data check failed:\n')
    for (const e of errors) console.error(`  - ${e}`)
    console.error('\nRun: npm run fetch:srd')
    process.exit(1)
  }

  console.log(`OK: ${spells.length} spells, ${monsters.length} monsters`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
