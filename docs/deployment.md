# Deployment — Cloudflare Pages

The Vite app is built as a static SPA and served from Cloudflare Pages.
Supabase (Postgres, Auth, Edge Functions, Storage) and Liveblocks are
managed services — Cloudflare only serves `dist/`. No runtime server is
ever deployed by us.

| Service | URL | Notes |
|---------|-----|-------|
| Production app | <https://ttrpg-varlet.pages.dev> | Cloudflare-assigned subdomain |
| Preview deploys | `https://<commit>.ttrpg-varlet.pages.dev` | Auto-generated per push |
| Supabase project | <https://vzosucjtptxpqjekwxbn.supabase.co> | Postgres + Auth + Functions |
| Liveblocks project | <https://liveblocks.io/dashboard> | One project per environment |

## Connect-time configuration (do once after the Pages project is created)

### 1. Build settings (set in the Pages create flow)

| Field | Value |
|-------|-------|
| Framework preset | Vite |
| Build command | `npm run copy:dice-assets && npm run build` |
| Build output directory | `dist` |
| Root directory | (leave blank) |
| Node version | 20 (the `package.json` `engines` field will pin it) |

Vite's Pages preset handles SPA fallback automatically — no `_redirects`
file required for react-router to work.

3D dice on the full dice tray need static assets under `public/assets/dice-threejs/`.
After `npm install`, run `npm run copy:dice-assets` once (or include it in the
build command above). Commit `public/assets/dice-threejs/` if you prefer not to
copy on every CI build.

### 2. Environment variables (Pages → Settings → Environment variables)

Add to **Production** (and to **Preview** if you want PR previews to work
against the same Supabase project):

```dotenv
VITE_SUPABASE_URL=https://vzosucjtptxpqjekwxbn.supabase.co
VITE_SUPABASE_ANON_KEY=<copy from local .env>
VITE_LIVEBLOCKS_PUBLIC_KEY=<copy from local .env, pk_dev_… or pk_prod_…>
```

These all start with `VITE_` and are baked into the JS bundle at build time —
they are **public** by design, not secrets. There is no harm in leaving the
"Encrypt" toggle off. After adding any variable, **trigger a redeploy**
(Pages → Deployments → Retry build, or push a new commit) so the build
re-reads them.

The two real secrets (`LIVEBLOCKS_SECRET_KEY`, the Supabase service-role
key) never leave Supabase — see `docs/phase-f5-liveblocks-setup.md`.

### 3. Supabase Auth → URL Configuration

Dashboard → **Authentication → URL Configuration**:

- **Site URL:** `https://ttrpg-varlet.pages.dev`
- **Additional Redirect URLs:**
  - `https://ttrpg-varlet.pages.dev/**`
  - `https://*.ttrpg-varlet.pages.dev/**` (covers all per-commit preview
    deploys)
  - `http://localhost:5173/**` (keep for local dev)

The `/**` wildcards let any in-app route (e.g. `/reset-password`) be the
landing target for an emailed link. Without them, password reset emails
will land on a "redirect not allowed" error page.

### 4. Liveblocks auth Edge Function

Already covered in `docs/phase-f5-liveblocks-setup.md`. CORS in
`supabase/functions/liveblocks-auth/index.ts` is set to `*` so the
function accepts requests from any Pages preview URL with no extra
configuration.

### 5. Supabase database migrations

The static Pages deploy does **not** run migrations. Apply schema changes
to the linked Supabase project before (or right after) shipping app code
that depends on them:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Relevant migrations for character / campaign features:

| Migration | Purpose |
|-----------|---------|
| `20260525120000_phase_f3_characters.sql` | `characters` table + RLS |
| `20260530120000_profiles_preferences.sql` | User preferences (theme, validation mode) |
| `20260531120000_game_settings.sql` | `games.settings` JSONB (campaign spellcasting / inventory policy) |

**Verify `games.settings` after push** (SQL editor or Table Editor):

```sql
select id, name, settings from public.games limit 5;
```

New column should exist; default `{}`.

**In the app (GM):** open a game → set **Spellcasting validation** to
`Block` → save → edit a character with too many attriuned items or
over-attuned or overweight inventory → save should be rejected with a clear message.

Edge functions (e.g. Liveblocks auth) are deployed separately:

```bash
supabase functions deploy liveblocks-auth
```

See `docs/phase-f5-liveblocks-setup.md` for secrets.

## Verifying a fresh deploy

After Cloudflare reports "Success":

1. Visit `https://ttrpg-varlet.pages.dev/login` — login page should
   render with no console errors. Errors mentioning
   `VITE_SUPABASE_URL` or `VITE_LIVEBLOCKS_PUBLIC_KEY` mean the env vars
   weren't set before the build ran; re-trigger the deploy.
2. Log in with an existing account; you should land on `/app`.
3. Open any game's **Session** tab in two different browsers as two
   different members. Verify the F5 checklist from
   `docs/phase-f5-liveblocks-setup.md` (presence row, live rolls,
   initiative sync, chat).
4. Forgot password → enter your email → the reset link in the email
   should open `https://ttrpg-varlet.pages.dev/reset-password?…` and
   land on the reset form, not on Supabase's "redirect not allowed"
   page.
5. **Characters / campaign settings** — create or open a character,
   confirm inventory and spellcasting editors load. If GM policy controls
   are missing, `games.settings` migration was not applied.
6. Optional data sanity (dev machine): `npm run check:data` — confirms
   bundled `spells.json` / `monsters.json` are non-empty before you
   rely on a fresh clone.

## Common gotchas

| Symptom | Fix |
|---------|-----|
| Blank page, console: `Missing VITE_SUPABASE_URL` | Env vars not set before build → set them and redeploy |
| Routes like `/app/games/<id>` 404 on direct visit | Build output directory is wrong, or framework preset is not Vite |
| Liveblocks auth 401/403 in browser DevTools | User is not a member of that game, or JWT expired — sign out + back in |
| Password reset email link → "redirect not allowed" | Add `https://ttrpg-varlet.pages.dev/**` to Supabase redirect URLs |
| New env var doesn't take effect | Pages bakes `VITE_*` at build time; you must trigger a new deploy |
| Email confirmation link wrong host | Set Supabase **Site URL** to the Pages URL (step 3) |
| Campaign validation setting does nothing | Run `supabase db push` so `games.settings` exists |
| Spell or monster lists empty in Tools | Run `npm run fetch:srd` and commit JSON, or use a build that includes fetched data |

## Adding a custom domain later

When you buy `ttrpgvarlet.com` (or similar):

1. Pages → Custom domains → Add → enter the domain → Cloudflare walks
   you through DNS.
2. Update Supabase **Site URL** to the new domain and add it to
   **Additional Redirect URLs** (keep the old `*.pages.dev` for
   previews).
3. Liveblocks needs no change (CORS is `*`).
4. Update this doc.

## Rollback

Pages → Deployments → pick a previous successful build →
**Rollback to this deployment.** Effectively instant. Supabase data is
unaffected because rollback is just static asset content.
