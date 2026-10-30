-- ============================================================
-- Naturalsanc Croquis · 数据库结构
-- 在 Supabase Dashboard → SQL Editor 里整段执行即可（可重复执行）
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 通用：updated_at 自动刷新 ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1. pursuits · 追求（一个主题 = 一个二级页）
-- ============================================================
create table if not exists public.pursuits (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  title_ja         text,
  title_en         text,
  subtitle         text,
  subtitle_ja      text,
  subtitle_en      text,
  description      text,
  description_ja   text,
  description_en   text,
  stage            text not null default 'exploring'
                   check (stage in ('exploring', 'building', 'polishing', 'shipped')),
  progress_note    text,
  progress_note_ja text,
  progress_note_en text,
  cover_url        text,
  accent           text not null default 'cyan'
                   check (accent in ('cyan', 'magenta', 'violet', 'lime', 'amber')),
  started_at       date,
  sort_order       integer not null default 0,
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists trg_pursuits_touch on public.pursuits;
create trigger trg_pursuits_touch
  before update on public.pursuits
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 2. milestones · 里程碑（进度条旁边的勾选清单）
-- ============================================================
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  pursuit_id  uuid not null references public.pursuits(id) on delete cascade,
  title       text not null,
  title_ja    text,
  title_en    text,
  done        boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists milestones_pursuit_idx on public.milestones (pursuit_id, sort_order);

-- ============================================================
-- 3. portfolio_items · 作品（图片 / 音频共表，用 kind 区分）
-- ============================================================
create table if not exists public.portfolio_items (
  id               uuid primary key default gen_random_uuid(),
  pursuit_id       uuid not null references public.pursuits(id) on delete cascade,
  kind             text not null default 'image'
                   check (kind in ('image', 'audio')),
  title            text,
  title_ja         text,
  title_en         text,
  description      text,
  description_ja   text,
  description_en   text,
  media_url        text not null,
  poster_url       text,
  duration_seconds integer,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now()
);

create index if not exists portfolio_pursuit_idx on public.portfolio_items (pursuit_id, sort_order);

-- ============================================================
-- 4. notes · 笔记（Markdown）
-- ============================================================
create table if not exists public.notes (
  id           uuid primary key default gen_random_uuid(),
  pursuit_id   uuid not null references public.pursuits(id) on delete cascade,
  title        text not null,
  title_ja     text,
  title_en     text,
  content      text,
  content_ja   text,
  content_en   text,
  is_published boolean not null default true,
  is_pinned    boolean not null default false,
  note_date    date not null default current_date,
  created_at   timestamptz not null default now()
);

create index if not exists notes_pursuit_idx on public.notes (pursuit_id, note_date desc);

-- ============================================================
-- 5. materials_and_links · 学习资料与链接
-- ============================================================
create table if not exists public.materials_and_links (
  id             uuid primary key default gen_random_uuid(),
  pursuit_id     uuid not null references public.pursuits(id) on delete cascade,
  title          text not null,
  title_ja       text,
  title_en       text,
  url            text not null,
  kind           text not null default 'article'
                 check (kind in ('article', 'course', 'book', 'tool', 'video', 'other')),
  description    text,
  description_ja text,
  description_en text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists materials_pursuit_idx on public.materials_and_links (pursuit_id, sort_order);

-- ============================================================
-- 6. 行级安全（RLS）：任何人可读已发布内容，只有登录的你能写
-- ============================================================
alter table public.pursuits            enable row level security;
alter table public.milestones          enable row level security;
alter table public.portfolio_items     enable row level security;
alter table public.notes               enable row level security;
alter table public.materials_and_links enable row level security;

drop policy if exists "public read pursuits" on public.pursuits;
create policy "public read pursuits" on public.pursuits
  for select to anon, authenticated using (is_published);

drop policy if exists "public read milestones" on public.milestones;
create policy "public read milestones" on public.milestones
  for select to anon, authenticated
  using (exists (select 1 from public.pursuits p where p.id = pursuit_id and p.is_published));

drop policy if exists "public read portfolio" on public.portfolio_items;
create policy "public read portfolio" on public.portfolio_items
  for select to anon, authenticated
  using (exists (select 1 from public.pursuits p where p.id = pursuit_id and p.is_published));

drop policy if exists "public read notes" on public.notes;
create policy "public read notes" on public.notes
  for select to anon, authenticated
  using (is_published and exists (select 1 from public.pursuits p where p.id = pursuit_id and p.is_published));

drop policy if exists "public read materials" on public.materials_and_links;
create policy "public read materials" on public.materials_and_links
  for select to anon, authenticated
  using (exists (select 1 from public.pursuits p where p.id = pursuit_id and p.is_published));

drop policy if exists "owner write pursuits" on public.pursuits;
create policy "owner write pursuits" on public.pursuits
  for all to authenticated using (true) with check (true);

drop policy if exists "owner write milestones" on public.milestones;
create policy "owner write milestones" on public.milestones
  for all to authenticated using (true) with check (true);

drop policy if exists "owner write portfolio" on public.portfolio_items;
create policy "owner write portfolio" on public.portfolio_items
  for all to authenticated using (true) with check (true);

drop policy if exists "owner write notes" on public.notes;
create policy "owner write notes" on public.notes
  for all to authenticated using (true) with check (true);

drop policy if exists "owner write materials" on public.materials_and_links;
create policy "owner write materials" on public.materials_and_links
  for all to authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select on public.pursuits, public.milestones, public.portfolio_items,
  public.notes, public.materials_and_links to anon, authenticated;
grant insert, update, delete on public.pursuits, public.milestones, public.portfolio_items,
  public.notes, public.materials_and_links to authenticated;

-- ============================================================
-- 7. Storage：public 可读的 media 桶
-- ============================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');

drop policy if exists "owner write media" on storage.objects;
create policy "owner write media" on storage.objects
  for all to authenticated
  using (bucket_id = 'media') with check (bucket_id = 'media');
