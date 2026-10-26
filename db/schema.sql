-- DJANVUƐ PostgreSQL baseline schema.
-- Intended for Supabase PostgreSQL so auth.users and auth.uid() are available.
-- Review against the live database before applying to any existing environment.
begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username is null or username ~ '^[A-Za-z0-9_]{3,30}$')
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null default '',
  visibility text not null default 'public' check (visibility in ('public','followers','private')),
  media_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_body_or_media check (length(trim(body)) > 0 or media_key is not null),
  constraint posts_body_length check (char_length(body) <= 5000)
);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_author_created_idx on public.posts(author_id, created_at desc);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint follows_no_self check (follower_id <> followed_id)
);
create index if not exists follows_followed_idx on public.follows(followed_id);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_created_idx on public.comments(post_id, created_at);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
create index if not exists conversation_members_user_idx on public.conversation_members(user_id, joined_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 10000),
  created_at timestamptz not null default now(),
  edited_at timestamptz
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in ('follow','like','comment','message','system')),
  entity_id uuid,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);

-- Store only opaque object keys, never public R2 credentials or raw credentials in rows.
create table if not exists public.cloud_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  object_key text not null unique,
  original_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  visibility text not null default 'private' check (visibility in ('private','public')),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint cloud_files_owner_key check (object_key like user_id::text || '/%')
);
create index if not exists cloud_files_owner_created_idx on public.cloud_files(user_id, created_at desc) where deleted_at is null;

-- Keep profile creation in sync with Supabase Auth; do not copy auth secrets.
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.cloud_files enable row level security;

-- Public profiles are discoverable; each user controls their own edits.
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated on public.profiles for select to authenticated using (true);
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = (select auth.uid()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Public posts are readable by authenticated users. Non-public posts are limited to author/followers.
drop policy if exists posts_select_visible on public.posts;
create policy posts_select_visible on public.posts for select to authenticated using (
  visibility = 'public'
  or author_id = (select auth.uid())
  or (visibility = 'followers' and exists (
    select 1 from public.follows f where f.follower_id = (select auth.uid()) and f.followed_id = posts.author_id
  ))
);
drop policy if exists posts_insert_self on public.posts;
create policy posts_insert_self on public.posts for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists posts_update_self on public.posts;
create policy posts_update_self on public.posts for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists posts_delete_self on public.posts;
create policy posts_delete_self on public.posts for delete to authenticated using (author_id = (select auth.uid()));

drop policy if exists follows_read_authenticated on public.follows;
create policy follows_read_authenticated on public.follows for select to authenticated using (true);
drop policy if exists follows_insert_self on public.follows;
create policy follows_insert_self on public.follows for insert to authenticated with check (follower_id = (select auth.uid()));
drop policy if exists follows_delete_self on public.follows;
create policy follows_delete_self on public.follows for delete to authenticated using (follower_id = (select auth.uid()));

drop policy if exists likes_read_authenticated on public.post_likes;
create policy likes_read_authenticated on public.post_likes for select to authenticated using (true);
drop policy if exists likes_insert_self on public.post_likes;
create policy likes_insert_self on public.post_likes for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists likes_delete_self on public.post_likes;
create policy likes_delete_self on public.post_likes for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists comments_read_authenticated on public.comments;
create policy comments_read_authenticated on public.comments for select to authenticated using (exists (select 1 from public.posts p where p.id = post_id));
drop policy if exists comments_insert_self on public.comments;
create policy comments_insert_self on public.comments for insert to authenticated with check (author_id = (select auth.uid()));
drop policy if exists comments_update_self on public.comments;
create policy comments_update_self on public.comments for update to authenticated using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
drop policy if exists comments_delete_self on public.comments;
create policy comments_delete_self on public.comments for delete to authenticated using (author_id = (select auth.uid()));

-- SECURITY DEFINER helpers avoid recursive RLS evaluation on conversation_members.
create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $
  select exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = target_conversation_id and cm.user_id = (select auth.uid())
  );
$;
create or replace function public.is_conversation_creator(target_conversation_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $
  select exists (
    select 1 from public.conversations c
    where c.id = target_conversation_id and c.created_by = (select auth.uid())
  );
$;
revoke all on function public.is_conversation_member(uuid) from public;
revoke all on function public.is_conversation_creator(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;
grant execute on function public.is_conversation_creator(uuid) to authenticated;

-- A member can see only conversations they belong to.
drop policy if exists conversations_select_member on public.conversations;
create policy conversations_select_member on public.conversations for select to authenticated using (public.is_conversation_member(id));
drop policy if exists conversations_insert_creator on public.conversations;
create policy conversations_insert_creator on public.conversations for insert to authenticated with check (created_by = (select auth.uid()));
drop policy if exists members_select_same_conversation on public.conversation_members;
create policy members_select_same_conversation on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists members_insert_self on public.conversation_members;
create policy members_insert_self on public.conversation_members for insert to authenticated with check (user_id = (select auth.uid()) or public.is_conversation_creator(conversation_id));
drop policy if exists members_update_self on public.conversation_members;
create policy members_update_self on public.conversation_members for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists messages_select_member on public.messages;
create policy messages_select_member on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
drop policy if exists messages_insert_member on public.messages;
create policy messages_insert_member on public.messages for insert to authenticated with check (sender_id = (select auth.uid()) and public.is_conversation_member(conversation_id));
drop policy if exists messages_update_sender on public.messages;
create policy messages_update_sender on public.messages for update to authenticated using (sender_id = (select auth.uid())) with check (sender_id = (select auth.uid()));
drop policy if exists messages_delete_sender on public.messages;
create policy messages_delete_sender on public.messages for delete to authenticated using (sender_id = (select auth.uid()));

drop policy if exists notifications_select_recipient on public.notifications;
create policy notifications_select_recipient on public.notifications for select to authenticated using (recipient_id = (select auth.uid()));
drop policy if exists notifications_update_recipient on public.notifications;
create policy notifications_update_recipient on public.notifications for update to authenticated using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));

drop policy if exists cloud_files_select_owner on public.cloud_files;
create policy cloud_files_select_owner on public.cloud_files for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists cloud_files_insert_owner on public.cloud_files;
create policy cloud_files_insert_owner on public.cloud_files for insert to authenticated with check (user_id = (select auth.uid()) and object_key like (select auth.uid())::text || '/%');
drop policy if exists cloud_files_update_owner on public.cloud_files;
create policy cloud_files_update_owner on public.cloud_files for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and object_key like (select auth.uid())::text || '/%');
drop policy if exists cloud_files_delete_owner on public.cloud_files;
create policy cloud_files_delete_owner on public.cloud_files for delete to authenticated using (user_id = (select auth.uid()));

commit;
