#!/usr/bin/env node
/**
 * Downloads Open5e SRD (2024) creatures, spells, weapons, armor, and items.
 * Uses API v2 — unversioned paths return 404.
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

const SPELL_FIELDS = [
  'name',
  'key',
  'level',
  'school',
  'casting_time',
  'range',
  'duration',
  'desc',
  'ritual',
  'concentration',
  'verbal',
  'somatic',
  'material',
  'material_specified',
  'material_cost',
  'material_consumed',
  'classes',
  'document',
].join(',')

const WEAPON_FIELDS = [
  'name',
  'key',
  'damage_dice',
  'damage_type',
  'is_simple',
  'properties',
  'document',
].join(',')

const ARMOR_FIELDS = [
  'name',
  'key',
  'category',
  'ac_display',
  'ac_base',
  'ac_add_dexmod',
  'ac_cap_dexmod',
  'document',
].join(',')

const ITEM_FIELDS = ['name', 'key', 'category', 'cost', 'weight', 'weight_unit', 'document'].join(
  ',',
)

const FIELD_MAP = {
  creatures: CREATURE_FIELDS,
  spells: SPELL_FIELDS,
  weapons: WEAPON_FIELDS,
  armor: ARMOR_FIELDS,
  items: ITEM_FIELDS,
}

async function fetchAllV2(path, documentKey, label) {
  const results = []
  const params = new URLSearchParams({
    document__key__in: documentKey,
    fields: FIELD_MAP[path] ?? 'name,key',
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

function buildClassSpellLists(spellList) {
  const lists = {}
  for (const spell of spellList) {
    const level = spell.level ?? 0
    for (const className of spell.classNames ?? []) {
      if (!lists[className]) {
        lists[className] = { cantrips: [], byLevel: {} }
      }
      if (level === 0) {
        lists[className].cantrips.push(spell.slug)
      } else {
        const key = String(level)
        if (!lists[className].byLevel[key]) lists[className].byLevel[key] = []
        lists[className].byLevel[key].push(spell.slug)
      }
    }
  }
  for (const className of Object.keys(lists)) {
    lists[className].cantrips.sort()
    for (const key of Object.keys(lists[className].byLevel)) {
      lists[className].byLevel[key].sort()
    }
  }
  return lists
}

function propertyNames(properties) {
  if (!Array.isArray(properties)) return []
  return properties
    .map((p) => nestedName(p?.property ?? p))
    .filter((name) => typeof name === 'string')
}

async function main() {
  const creatures = []
  const spells = []
  const weapons = []
  const armor = []
  const items = []

  for (const docKey of DOCUMENT_KEYS) {
    creatures.push(...(await fetchAllV2('creatures', docKey, 'creatures')))
    spells.push(...(await fetchAllV2('spells', docKey, 'spells')))
    weapons.push(...(await fetchAllV2('weapons', docKey, 'weapons')))
    armor.push(...(await fetchAllV2('armor', docKey, 'armor')))
    items.push(...(await fetchAllV2('items', docKey, 'items')))
  }

  const dedupe = (list, key) => {
    const seen = new Set()
    return list.filter((item) => {
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

  const spellList = dedupe(spells, 'key').map((s) => {
    const classNames = Array.isArray(s.classes)
      ? s.classes.map((c) => nestedName(c)).filter((name) => typeof name === 'string')
      : []
    return {
      slug: s.key,
      name: s.name,
      level: s.level ?? null,
      school: nestedName(s.school),
      casting_time: s.casting_time ?? null,
      range: typeof s.range === 'number' ? s.range : null,
      duration: s.duration ?? null,
      desc: typeof s.desc === 'string' ? s.desc : null,
      ritual: s.ritual === true,
      concentration: s.concentration === true,
      verbal: s.verbal === true,
      somatic: s.somatic === true,
      material: s.material === true,
      material_specified: s.material_specified ?? null,
      material_cost: s.material_cost ?? null,
      material_consumed: s.material_consumed === true,
      classNames,
      document: s.document?.key ?? 'srd-2024',
    }
  })

  const classSpellLists = buildClassSpellLists(spellList)

  const weaponList = dedupe(weapons, 'key').map((w) => ({
    slug: w.key,
    name: w.name,
    damage_dice: w.damage_dice ?? null,
    damage_type: nestedName(w.damage_type),
    is_simple: w.is_simple ?? false,
    properties: propertyNames(w.properties),
    document: w.document?.key ?? 'srd-2024',
  }))

  const armorList = dedupe(armor, 'key').map((a) => ({
    slug: a.key,
    name: a.name,
    category: nestedName(a.category),
    ac_display: a.ac_display ?? null,
    ac_base: a.ac_base ?? null,
    ac_add_dexmod: a.ac_add_dexmod === true,
    ac_cap_dexmod: a.ac_cap_dexmod ?? null,
    document: a.document?.key ?? 'srd-2024',
  }))

  const itemList = dedupe(items, 'key').map((i) => {
    const weightRaw = i.weight
    const weight =
      weightRaw == null || weightRaw === ''
        ? null
        : Number.parseFloat(String(weightRaw))
    return {
      slug: i.key,
      name: i.name,
      category: nestedName(i.category),
      cost: i.cost ?? null,
      weight: weight != null && Number.isFinite(weight) ? weight : null,
      weight_unit: i.weight_unit ?? null,
      document: i.document?.key ?? 'srd-2024',
    }
  })

  await writeFile(join(outDir, 'monsters.json'), JSON.stringify(monsterList, null, 0))
  await writeFile(join(outDir, 'spells.json'), JSON.stringify(spellList, null, 0))
  await writeFile(
    join(outDir, 'class-spell-lists.json'),
    JSON.stringify({ classes: classSpellLists }, null, 2),
  )
  await writeFile(join(outDir, 'weapons.json'), JSON.stringify(weaponList, null, 0))
  await writeFile(join(outDir, 'armor.json'), JSON.stringify(armorList, null, 0))
  await writeFile(join(outDir, 'items.json'), JSON.stringify(itemList, null, 0))
  console.log(
    `\nWrote ${monsterList.length} creatures, ${spellList.length} spells, ` +
      `${weaponList.length} weapons, ${armorList.length} armor, ${itemList.length} items to ${outDir}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
