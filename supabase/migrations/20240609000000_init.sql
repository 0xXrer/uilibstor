-- uilib schema

create extension if not exists "pgcrypto";

-- ─── Enums ───────────────────────────────────────────────────────────────────

create type public.library_status as enum ('pending', 'approved', 'rejected');
create type public.library_kind as enum ('luau', 'imgui', 'modern');

-- ─── Profiles ────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  avatar_url text,
  accent text not null default 'oklch(0.72 0.15 250)',
  is_moderator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Libraries ───────────────────────────────────────────────────────────────

create table public.libraries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  author text not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null,
  kind public.library_kind not null,
  accent text not null,
  source_url text not null,
  description text not null default '',
  cover_url text,
  status public.library_status not null default 'pending',
  likes_count integer not null default 0,
  views_count integer not null default 0,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index libraries_status_idx on public.libraries (status);
create index libraries_slug_idx on public.libraries (slug);
create index libraries_author_id_idx on public.libraries (author_id);

-- ─── Screenshots ─────────────────────────────────────────────────────────────

create table public.library_screenshots (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references public.libraries (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index library_screenshots_library_id_idx on public.library_screenshots (library_id);

-- ─── Likes ───────────────────────────────────────────────────────────────────

create table public.library_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  library_id uuid not null references public.libraries (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, library_id)
);

-- ─── Helpers ─────────────────────────────────────────────────────────────────

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_moderator from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger libraries_updated_at
  before update on public.libraries
  for each row execute function public.handle_updated_at();

-- Auto-create profile on Discord sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb;
  uname text;
  avatar text;
begin
  meta := new.raw_user_meta_data;
  uname := coalesce(
    meta ->> 'full_name',
    meta ->> 'name',
    meta ->> 'preferred_username',
    meta ->> 'user_name',
    split_part(new.email, '@', 1),
    'user'
  );
  avatar := coalesce(meta ->> 'avatar_url', meta ->> 'picture');

  insert into public.profiles (id, username, avatar_url)
  values (new.id, uname, avatar)
  on conflict (id) do update
    set username = excluded.username,
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep likes_count in sync
create or replace function public.handle_library_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.libraries
    set likes_count = likes_count + 1
    where id = new.library_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.libraries
    set likes_count = greatest(likes_count - 1, 0)
    where id = old.library_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger library_likes_count
  after insert or delete on public.library_likes
  for each row execute function public.handle_library_like();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.libraries enable row level security;
alter table public.library_screenshots enable row level security;
alter table public.library_likes enable row level security;

-- profiles
create policy "profiles are public"
  on public.profiles for select using (true);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- libraries
create policy "approved libraries are public"
  on public.libraries for select
  using (status = 'approved' or author_id = auth.uid() or public.is_moderator());

create policy "authenticated users submit libraries"
  on public.libraries for insert
  with check (auth.uid() = author_id and status = 'pending');

create policy "moderators review libraries"
  on public.libraries for update
  using (public.is_moderator());

-- screenshots
create policy "screenshots follow library access"
  on public.library_screenshots for select
  using (
    exists (
      select 1 from public.libraries l
      where l.id = library_id
        and (l.status = 'approved' or l.author_id = auth.uid() or public.is_moderator())
    )
  );

create policy "authors add screenshots"
  on public.library_screenshots for insert
  with check (
    exists (
      select 1 from public.libraries l
      where l.id = library_id and l.author_id = auth.uid()
    )
  );

-- likes
create policy "likes are public"
  on public.library_likes for select using (true);

create policy "users like approved libraries"
  on public.library_likes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.libraries l
      where l.id = library_id and l.status = 'approved'
    )
  );

create policy "users unlike"
  on public.library_likes for delete
  using (auth.uid() = user_id);

-- ─── Storage ─────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'screenshots',
  'screenshots',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "screenshots are public"
  on storage.objects for select
  using (bucket_id = 'screenshots');

create policy "authenticated upload screenshots"
  on storage.objects for insert
  with check (
    bucket_id = 'screenshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "users delete own screenshots"
  on storage.objects for delete
  using (
    bucket_id = 'screenshots'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
