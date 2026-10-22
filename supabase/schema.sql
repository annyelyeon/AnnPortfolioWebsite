-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

-- ===== Admins =====
-- Only users listed here can write. Everyone else can only read published content.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ===== Content tables =====
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  category     text not null default 'blog' check (category in ('blog', 'thoughts')),
  summary      text not null default '',
  content      text not null default '',          -- Markdown
  cover_url    text,
  published    boolean not null default false,
  published_at date default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.projects (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  summary      text not null default '',
  tech         text[] not null default '{}',
  content      text not null default '',          -- Markdown project report
  cover_url    text,
  tint         text not null default '#e9e4dc',   -- card color when there is no cover
  repo_url     text,
  demo_url     text,
  featured     boolean not null default true,     -- shown on the home page
  sort_order   int not null default 0,            -- lower comes first
  published    boolean not null default false,
  published_at date default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();
drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ===== Row Level Security =====
alter table public.posts enable row level security;
alter table public.projects enable row level security;

do $$
declare t text;
begin
  foreach t in array array['posts', 'projects'] loop
    execute format('drop policy if exists "read published" on public.%I', t);
    execute format('drop policy if exists "admin insert" on public.%I', t);
    execute format('drop policy if exists "admin update" on public.%I', t);
    execute format('drop policy if exists "admin delete" on public.%I', t);
    execute format('create policy "read published" on public.%I for select using (published or public.is_admin())', t);
    execute format('create policy "admin insert" on public.%I for insert with check (public.is_admin())', t);
    execute format('create policy "admin update" on public.%I for update using (public.is_admin()) with check (public.is_admin())', t);
    execute format('create policy "admin delete" on public.%I for delete using (public.is_admin())', t);
  end loop;
end $$;

-- ===== Data API access =====
-- Needed when "Automatically expose new tables" is off (Supabase's recommended setting).
-- These only open the door; the RLS policies above decide which rows each user may touch.
grant usage on schema public to anon, authenticated;
grant select on public.posts, public.projects to anon, authenticated;
grant insert, update, delete on public.posts, public.projects to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ===== Image storage =====
-- Public bucket: anyone can view images by URL, only admins can upload or delete.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "admin upload media" on storage.objects;
drop policy if exists "admin update media" on storage.objects;
drop policy if exists "admin delete media" on storage.objects;
create policy "admin upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "admin update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "admin delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ===== Make yourself admin =====
-- After creating your user (Authentication → Users → Add user), run this
-- with your email to give that account write access:
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'you@example.com';
