-- Phase F5: per-game session chat (persistent backstop for the Liveblocks room).

create table if not exists public.game_chat_messages (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint game_chat_messages_body_length_chk check (
    char_length(trim(body)) >= 1
    and char_length(body) <= 2000
  )
);

create index if not exists game_chat_messages_game_id_created_at_idx
  on public.game_chat_messages (game_id, created_at desc);

alter table public.game_chat_messages enable row level security;

create policy game_chat_messages_select_member
  on public.game_chat_messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_members gm
      where gm.game_id = game_chat_messages.game_id
        and gm.user_id = auth.uid()
    )
  );

create policy game_chat_messages_insert_member
  on public.game_chat_messages
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.game_members gm
      where gm.game_id = game_chat_messages.game_id
        and gm.user_id = auth.uid()
    )
  );

-- Author may delete their own messages; GMs are not granted moderation in this
-- migration (friends-first scope). Revisit if abuse becomes a real concern.
create policy game_chat_messages_delete_own
  on public.game_chat_messages
  for delete
  to authenticated
  using (user_id = auth.uid());
