-- ============================================================
-- 站长权限：只有 studio_admins 里的账号能写内容
-- 在 schema.sql 之后执行；可重复执行
-- ============================================================

create table if not exists public.studio_admins (
  uid        uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.studio_admins enable row level security;
revoke all on public.studio_admins from anon, authenticated;

-- 站长账号（naturalsanc@gmail.com）
insert into public.studio_admins (uid)
values ('08ff76a3-1132-4533-bf93-aea848dc2a4a')
on conflict (uid) do nothing;

-- 判断当前登录用户是不是站长
create or replace function public.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.studio_admins where uid = auth.uid());
$$;

grant execute on function public.is_studio_admin() to anon, authenticated;

-- ---------- 读：站长能看草稿 ----------
drop policy if exists "studio read pursuits" on public.pursuits;
create policy "studio read pursuits" on public.pursuits
  for select to authenticated using (public.is_studio_admin());

drop policy if exists "studio read milestones" on public.milestones;
create policy "studio read milestones" on public.milestones
  for select to authenticated using (public.is_studio_admin());

drop policy if exists "studio read portfolio" on public.portfolio_items;
create policy "studio read portfolio" on public.portfolio_items
  for select to authenticated using (public.is_studio_admin());

drop policy if exists "studio read notes" on public.notes;
create policy "studio read notes" on public.notes
  for select to authenticated using (public.is_studio_admin());

drop policy if exists "studio read materials" on public.materials_and_links;
create policy "studio read materials" on public.materials_and_links
  for select to authenticated using (public.is_studio_admin());

-- ---------- 写：只有站长 ----------
drop policy if exists "owner write pursuits" on public.pursuits;
drop policy if exists "studio write pursuits" on public.pursuits;
create policy "studio write pursuits" on public.pursuits
  for all to authenticated
  using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "owner write milestones" on public.milestones;
drop policy if exists "studio write milestones" on public.milestones;
create policy "studio write milestones" on public.milestones
  for all to authenticated
  using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "owner write portfolio" on public.portfolio_items;
drop policy if exists "studio write portfolio" on public.portfolio_items;
create policy "studio write portfolio" on public.portfolio_items
  for all to authenticated
  using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "owner write notes" on public.notes;
drop policy if exists "studio write notes" on public.notes;
create policy "studio write notes" on public.notes
  for all to authenticated
  using (public.is_studio_admin()) with check (public.is_studio_admin());

drop policy if exists "owner write materials" on public.materials_and_links;
drop policy if exists "studio write materials" on public.materials_and_links;
create policy "studio write materials" on public.materials_and_links
  for all to authenticated
  using (public.is_studio_admin()) with check (public.is_studio_admin());

-- ---------- Storage：只有站长能传 ----------
drop policy if exists "owner write media" on storage.objects;
drop policy if exists "studio write media" on storage.objects;
create policy "studio write media" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.is_studio_admin())
  with check (bucket_id = 'media' and public.is_studio_admin());
