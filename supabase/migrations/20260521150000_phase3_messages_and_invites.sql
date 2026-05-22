-- Phase 3: Mailbox (messages) + game invitations.
-- Tables, RLS, and helper RPCs.

-- =========================================================================
-- 1) messages
-- =========================================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null default '',
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default (now() at time zone 'utc')
);

create index if not exists messages_to_user_id_created_at_idx
  on public.messages (to_user_id, created_at desc);

create index if not exists messages_from_user_id_created_at_idx
  on public.messages (from_user_id, created_at desc);

alter table public.messages enable row level security;

drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant
  on public.messages
  for select
  to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

drop policy if exists messages_insert_sender on public.messages;
create policy messages_insert_sender
  on public.messages
  for insert
  to authenticated
  with check (from_user_id = auth.uid());

-- Recipients can mark their own messages read (update read_at only via RPC below).
drop policy if exists messages_update_recipient on public.messages;
create policy messages_update_recipient
  on public.messages
  for update
  to authenticated
  using (to_user_id = auth.uid())
  with check (to_user_id = auth.uid());

-- =========================================================================
-- 2) game_invites
-- =========================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invite_status') then
    create type public.invite_status as enum ('pending', 'accepted', 'declined');
  end if;
end
$$;

create table if not exists public.game_invites (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  from_user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status public.invite_status not null default 'pending',
  created_at timestamptz not null default (now() at time zone 'utc'),
  decided_at timestamptz
);

-- Prevent more than one pending invite per (game, recipient)
create unique index if not exists game_invites_unique_pending
  on public.game_invites (game_id, to_user_id)
  where status = 'pending';

create index if not exists game_invites_to_user_id_created_at_idx
  on public.game_invites (to_user_id, created_at desc);

create index if not exists game_invites_game_id_created_at_idx
  on public.game_invites (game_id, created_at desc);

alter table public.game_invites enable row level security;

-- Sender or recipient can read an invite.
drop policy if exists game_invites_select_participant on public.game_invites;
create policy game_invites_select_participant
  on public.game_invites
  for select
  to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid());

-- Insert/accept/decline go through SECURITY DEFINER RPCs below to enforce
-- composite checks (GM-only sender, transactional accept) cleanly.
-- We do not grant direct INSERT/UPDATE policies for game_invites.

-- =========================================================================
-- 3) RPC: send_game_invite
-- =========================================================================

create or replace function public.send_game_invite(
  p_game_id uuid,
  p_to_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_is_gm boolean;
  v_target_exists boolean;
  v_already_member boolean;
  v_invite_id uuid;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if p_to_user_id = v_caller then
    raise exception 'You cannot invite yourself';
  end if;

  select exists (
    select 1
    from public.game_members gm
    where gm.game_id = p_game_id
      and gm.user_id = v_caller
      and gm.game_role = 'Game Master'::public.game_role
  )
  into v_is_gm;

  if not v_is_gm then
    raise exception 'Only a Game Master can invite users to this game';
  end if;

  select exists (select 1 from public.profiles p where p.id = p_to_user_id)
    into v_target_exists;

  if not v_target_exists then
    raise exception 'Target user does not exist';
  end if;

  select exists (
    select 1
    from public.game_members gm
    where gm.game_id = p_game_id
      and gm.user_id = p_to_user_id
  )
  into v_already_member;

  if v_already_member then
    raise exception 'User is already a member of this game';
  end if;

  insert into public.game_invites (game_id, from_user_id, to_user_id, status)
  values (p_game_id, v_caller, p_to_user_id, 'pending')
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

revoke all on function public.send_game_invite(uuid, uuid) from public;
grant execute on function public.send_game_invite(uuid, uuid) to authenticated;

-- =========================================================================
-- 4) RPC: respond_to_invite (accept or decline)
-- =========================================================================

create or replace function public.respond_to_invite(
  p_invite_id uuid,
  p_accept boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_invite record;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select id, game_id, to_user_id, status
  from public.game_invites
  where id = p_invite_id
  into v_invite;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.to_user_id <> v_caller then
    raise exception 'You can only respond to invites sent to you';
  end if;

  if v_invite.status <> 'pending' then
    raise exception 'Invite is no longer pending';
  end if;

  if p_accept then
    -- Add as Player (if not already a member).
    insert into public.game_members (game_id, user_id, game_role)
    values (v_invite.game_id, v_caller, 'Player'::public.game_role)
    on conflict (game_id, user_id) do nothing;

    update public.game_invites
    set status = 'accepted', decided_at = now()
    where id = p_invite_id;
  else
    update public.game_invites
    set status = 'declined', decided_at = now()
    where id = p_invite_id;
  end if;
end;
$$;

revoke all on function public.respond_to_invite(uuid, boolean) from public;
grant execute on function public.respond_to_invite(uuid, boolean) to authenticated;

-- =========================================================================
-- 5) RPC: mark_message_read
-- =========================================================================

create or replace function public.mark_message_read(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  update public.messages
  set read_at = coalesce(read_at, now())
  where id = p_message_id
    and to_user_id = v_caller;
end;
$$;

revoke all on function public.mark_message_read(uuid) from public;
grant execute on function public.mark_message_read(uuid) to authenticated;

-- =========================================================================
-- 6) RPC: find_user_by_email (for invite-sending UX, returns minimal data)
-- =========================================================================
-- Note: auth.users is restricted, so we look up profiles whose linked
--       auth.users.email matches. We expose only id + display_name.

create or replace function public.find_user_by_email(p_email text)
returns table (id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  return query
  select p.id, p.display_name
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(p_email)
  limit 1;
end;
$$;

revoke all on function public.find_user_by_email(text) from public;
grant execute on function public.find_user_by_email(text) to authenticated;
