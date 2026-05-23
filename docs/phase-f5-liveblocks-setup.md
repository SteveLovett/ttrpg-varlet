# Phase F5 — Liveblocks setup

Phase F5 turns the Session tab into a live room so dice rolls, initiative
changes, and chat messages fan out to every member without polling. This
document is the operator runbook: what to create in Liveblocks, what to set in
Supabase, and how to verify the room works.

## 1. Create a Liveblocks project

1. Go to <https://liveblocks.io/signup> and create a free account.
2. From the dashboard, click **Create a new project** (a project is just the
   container for rooms and keys — you only need one for Varlet).
3. Open the project → **API keys**.
4. Copy two values:
   - **Public key** — starts with `pk_dev_` (development) or `pk_prod_`.
     Safe to ship in the browser bundle. Used as
     `VITE_LIVEBLOCKS_PUBLIC_KEY`.
   - **Secret key** — starts with `sk_dev_` / `sk_prod_`. **Never** put this
     in a `VITE_…` variable; only the Edge Function reads it.

The free Starter tier is plenty for a friends-only table (5–10 monthly
active users). Upgrade only if you start inviting strangers at scale.

## 2. Configure environment

### Local Vite app

Add to `.env` in the project root (alongside the Supabase vars):

```dotenv
VITE_LIVEBLOCKS_PUBLIC_KEY=pk_dev_xxx
```

Restart `npm run dev` after editing.

### Supabase Edge Function secret

The `liveblocks-auth` function needs the **secret** key. Set it once per
Supabase project:

```bash
supabase login                      # one-time, if you haven't already
supabase link --project-ref <ref>   # one-time per machine
supabase secrets set LIVEBLOCKS_SECRET_KEY=sk_dev_xxx
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are injected automatically when the
function runs in Supabase's hosted runtime.

For local function development you can put the secret in
`supabase/.env.local` (gitignored) and run
`supabase functions serve liveblocks-auth --env-file ./supabase/.env.local`.

## 3. Deploy the migration and the Edge Function

```bash
# Phase F5 chat table (depends on F1–F4 migrations already being applied)
supabase db push

# Deploy the auth endpoint
supabase functions deploy liveblocks-auth
```

The function URL the client expects is
`${VITE_SUPABASE_URL}/functions/v1/liveblocks-auth`.

## 4. Verify

1. Open a game's **Session** tab in two browsers (or one browser + one
   incognito window) signed in as two different members of the same game.
2. **Live presence:** the "In room" list at the top of the dice column
   should show both names.
3. **Live rolls:** roll in browser A; the result should appear in browser
   B's roll log within ~100ms, with no refresh.
4. **Live initiative:** as the GM, add an initiative entry; both browsers
   show the updated list. Refresh — the list is still there (snapshot in
   `games.initiative_json`).
5. **Live chat:** send a message in browser A; browser B receives it.
   Reload either browser; history loads from `game_chat_messages`.

If any of these fail, look at the Edge Function logs in the Supabase
dashboard (`Functions → liveblocks-auth → Logs`). The most common failures
are:

| Symptom | Likely cause |
|---------|--------------|
| 401 from the auth function | User is signed out or the JWT has expired |
| 403 from the auth function | User is not a member of that game |
| 500 with "missing LIVEBLOCKS_SECRET_KEY" | Forgot `supabase secrets set` |
| Client throws "Liveblocks auth endpoint missing" | `VITE_SUPABASE_URL` is not set |

## 5. What is NOT in Phase F5

Per the friends-first plan, the following are explicitly out of scope until
later phases:

- Maps, tokens, fog of war → **Phase F6** (VTT MVP, reuses this same room).
- @mentions, message reactions, threading.
- GM moderation tools (delete other players' chat messages).
- Voice chat (use Discord).

## 6. Cost ceiling

Liveblocks bills on monthly active users (MAU). A 4–6 person friend group
sits well inside the free Starter tier. The next paid jump is the Pro
plan, which is overkill until you start running open games. Monitor MAU on
the Liveblocks dashboard before changing tiers.
