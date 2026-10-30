# Naturalsanc Croquis

> 个人数字工作室 / 记录正在进行的追求。
> 中文为主，日文、英文以小字并置。

一个用 **Next.js (App Router) + Tailwind CSS + Supabase** 搭的作品集式站点。
每个「追求」是一张竖版海报卡：略微倾斜、悬停抬起、上方一行等宽小字。
点进去是一个二级页：进度、作品、笔记、资料。

---

## 现在有什么

- `/` 首页：大字字标 + 海报卡片墙 + 深色 About 区块
- `/pursuits` 全部追求
- `/pursuits/[slug]` 二级页：
  - 01 进展与进度（四阶段 + 里程碑勾选）
  - 02 作品（图片灯箱 / 自定义音频播放器）
  - 03 笔记（Markdown，支持表格、代码、引用）
  - 04 学习资料与链接

**视觉**：柔和的紫粉绿渐变纸面 + 颗粒、黑白海报卡、等宽小字标签；卡片 3 列（手机）/ 4 列（桌面）错位排布，
第 1 列最低、第 2 列最高、第 3 列次高。每个追求仍有自己的主色，用在进度条和小圆点上
（cyan / magenta / violet / lime / amber）。

## 技术栈

| 部分 | 选择 | 说明 |
|---|---|---|
| 框架 | Next.js 16 App Router | 服务端组件取数，ISR 30 秒 |
| 样式 | Tailwind CSS 4 | 主题变量写在 `app/globals.css` |
| 数据 | Supabase Postgres + RLS | 匿名只读，登录后可写 |
| 文件 | Supabase Storage `media` 桶 | 公开读，登录后可传 |
| 渲染 | react-markdown + remark-gfm | 笔记里的 Markdown |

## 本地跑起来

需要 Node.js 20.9+（本机已装 LTS）。

```bash
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。

### 环境变量

复制 `.env.example` 为 `.env.local`，填两个值（Project Settings → API → Legacy anon key）：

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

`.env.local` 已经在 `.gitignore` 里，不会被传到 GitHub。

## 数据库

在 Supabase Dashboard → SQL Editor 里按顺序执行：

1. `supabase/schema.sql` —— 建表、RLS、权限、Storage 桶（可重复执行）
2. `supabase/seed.sql` —— 三条演示数据（会先删同名 slug 再插入）

> 如果编辑器对超长多行 INSERT 报奇怪的解析错误，把 `seed.sql` 里的四条 INSERT 分开逐条执行即可。

表结构：

- `pursuits` 追求：`slug` / 三语标题 / 简介 / 阶段 / 进度说明 / 封面 / 主色
- `milestones` 里程碑：勾选清单
- `portfolio_items` 作品：`kind = image | audio`
- `notes` 笔记：Markdown 正文 + 日期 + 置顶
- `materials_and_links` 资料：外链卡片

所有子表通过 `pursuit_id` 关联，删除追求会级联删除。

## 目录

```
app/
  layout.tsx            全局外壳（背景、导航、页脚、元信息）
  page.tsx              首页
  pursuits/page.tsx     追求索引
  pursuits/[slug]/      二级页（本次的主角）
  admin/                站长后台（登录 + 编辑）
  not-found.tsx         404
components/             卡片、进度、作品灯箱、音频播放器、Markdown…
  admin/                后台的表单控件与五个编辑器
lib/
  queries.ts            Supabase 查询（一条嵌套查询取回整页）
  supabase/public.ts    匿名只读客户端
  supabase/server.ts    带登录态的服务端客户端（读写）
  types.ts              手写的表类型
  display.ts            阶段、日期、时长等展示辅助
proxy.ts                刷新 /admin 的登录 cookie
supabase/schema.sql     建表脚本
supabase/admin.sql      站长权限（studio_admins + RLS 收紧）
supabase/seed.sql       演示数据
public/demo/            演示图片与一段 24 秒的合成环境音
scripts/qa-viewports.cjs 响应式自检（390 / 1440 宽，检查横向溢出）
```

## 站长后台

登录地址：`/admin`（未登录会自动跳到 `/admin/login`）。

- 首页列出所有追求（含草稿），可以新建。
- 编辑页是五个页签：基本信息 / 里程碑 / 作品 / 笔记 / 资料，每个页签带数量。
- 里程碑、作品、资料都支持**拖拽排序**（左侧小圆点手柄），鼠标和手指都能拖，松手即存。
- 作品是缩略图网格，点 ✎ 在原位展开编辑面板；新增作品可以**上传文件**、**粘贴链接**，或两者都给（都填时以文件为准）。
- 笔记收在折叠行里，点开才出现 Markdown 编辑器。
- 图片、音频上传进 Supabase Storage 的 `media` 桶；外链则原样保存。
- 保存后会自动刷新公开页面（`revalidatePath`），不会把你弹回第一个页签。

### 权限是怎么收口的

- 数据库里有一张 `studio_admins` 表，只放站长自己的 uid。
- 所有写操作和 Storage 上传都要求 `public.is_studio_admin()` 为真，普通登录用户也写不了。
- Supabase 的「允许新用户注册」已经关掉，即使打开，非 `studio_admins` 的人也只能读。
- 匿名（未登录）只能看到 `is_published = true` 的内容。

### 账号

站长账号在 Supabase Dashboard → Authentication → Users 里管理。
忘记密码就在那里重置，或者用「Send invitation」重新发一封设置密码的邮件。

## 部署（GitHub Desktop → Vercel）

1. 用 GitHub Desktop 把 `naturalsanc-croquis` 文件夹添加为本地仓库，提交，Publish 到 GitHub。
2. Vercel → Add New Project → 选这个仓库 → Framework 自动识别为 Next.js。
3. 在 Environment Variables 里填 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
4. Deploy。之后每次 push，Vercel 自动重新构建。

## 还没做的

- 拖拽排序（现在靠 `sort_order` 数字，后台里手改）
- 多账号 / 协作
- 图片自动压缩、视频
- 中英日三语的正文（笔记 body 现在只存中文，标题三语）
