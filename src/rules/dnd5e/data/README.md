# D&D 5e (2024) reference data

Bundled files:

- `conditions.json` — SRD condition summaries (shipped)
- `dice-presets.json` — quick-roll buttons
- `monsters.json` / `spells.json` — Open5e indexes (empty until fetched)

Download full Open5e SRD indexes:

```bash
npm run fetch:srd
```

This calls `scripts/fetch-open5e-data.mjs` (Open5e **API v2**, document key `srd-2024`) and overwrites `monsters.json` and `spells.json`.

If you see `404` on `/monsters/`, pull the latest script — legacy unversioned URLs were removed upstream.
