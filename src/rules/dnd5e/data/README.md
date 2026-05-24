# D&D 5e (2024) reference data

This folder is the **in-app rules compendium** (not loaded from the PDFs in `docs/`).
Those PDFs are reference-only for developers.

## Bundled in git (edit by hand or run fetch)

| File | Source | When to update |
|------|--------|----------------|
| `conditions.json` | Hand-written SRD summaries | Rarely |
| `dice-presets.json` | Hand-written quick rolls | When adding dice UI |
| `character-options.json` | Species + classes (no subclasses) | New classes/species |
| `class-spell-lists.json` | SRD class spell lists | Spell list errata |
| `spellcasting-rules.json` | Multiclass/caster tables (`version` field) | Rule changes |
| `starting-equipment.json` | Class starting kits | New kits |
| `pack-contents.json` | Explorer’s / dungeoneer’s / priest’s / scholar’s packs | Missing catalog slugs |
| `items.json`, `weapons.json`, `armor.json` | Open5e via `fetch:srd` | After Open5e updates |
| `spells.json`, `monsters.json` | Open5e via `fetch:srd` | After Open5e updates |

## Download / refresh from Open5e

```bash
npm run fetch:srd
```

Runs `scripts/fetch-open5e-data.mjs` against Open5e **API v2** (`document=srd-2024`).
Overwrites `monsters.json`, `spells.json`, `weapons.json`, `armor.json`, and `items.json`.

If you see `404` on `/monsters/`, update the fetch script — legacy unversioned URLs were removed upstream.

**CI:** The repo expects these JSON files to be committed after a fetch. There is no automatic fetch in the Cloudflare build.

## Sanity check (optional)

```bash
node scripts/check-bundled-data.mjs
```

Exits non-zero if spell/monster indexes are empty or tiny (forgot to fetch before release).

## App behavior that uses this data

- **Tools → Equipment / Spells** — browse catalogs; add to characters.
- **Character sheet** — inventory, spellcasting, starting equipment (primary class).
- **Validation** — spell lists and slot tables from `spellcasting-rules.json` + class lists.

Character sheets are stored in Supabase (`characters.sheet_json`), not in this folder.
