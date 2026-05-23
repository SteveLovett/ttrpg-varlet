/**
 * Phase F5 — Liveblocks room auth.
 *
 * Client posts `{ room: "game:<gameId>" }` with its Supabase JWT in the
 * Authorization header. We verify the JWT, confirm membership in that game,
 * and mint a Liveblocks access token scoped to the room.
 *
 * Deploy:
 *   supabase secrets set LIVEBLOCKS_SECRET_KEY=sk_...
 *   supabase functions deploy liveblocks-auth
 *
 * Local:
 *   supabase functions serve liveblocks-auth --env-file ./supabase/.env.local
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { Liveblocks } from "npm:@liveblocks/node@3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const LIVEBLOCKS_SECRET_KEY = Deno.env.get("LIVEBLOCKS_SECRET_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in function env.");
}
if (!LIVEBLOCKS_SECRET_KEY) {
  console.error(
    "Missing LIVEBLOCKS_SECRET_KEY. Set it with: supabase secrets set LIVEBLOCKS_SECRET_KEY=sk_...",
  );
}

const liveblocks = new Liveblocks({ secret: LIVEBLOCKS_SECRET_KEY });

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const ROOM_PATTERN = /^game:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed." });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json(401, { error: "Missing Supabase bearer token." });
  }

  let payload: { room?: unknown } = {};
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }
  const room = typeof payload.room === "string" ? payload.room : "";
  const match = room.match(ROOM_PATTERN);
  if (!match) {
    return json(400, {
      error: "Room must be of the form 'game:<uuid>'.",
    });
  }
  const gameId = match[1];

  // Supabase client scoped to the caller's JWT so RLS applies to our checks.
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return json(401, { error: "Invalid or expired Supabase session." });
  }

  const { data: membership, error: membershipError } = await supabase
    .from("game_members")
    .select("user_id, game_role")
    .eq("game_id", gameId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) {
    return json(500, { error: membershipError.message });
  }
  if (!membership) {
    return json(403, { error: "Not a member of this game." });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: profile?.display_name ?? user.email ?? "Player",
      role: membership.game_role,
    },
  });
  session.allow(room, session.FULL_ACCESS);

  try {
    const { status, body } = await session.authorize();
    return new Response(body, {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authorization failed.";
    return json(500, { error: message });
  }
});
