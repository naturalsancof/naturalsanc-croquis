# Naturalsanc Croquis

> 个人数字工作室 / 记录正在进行的追求。
> 中文为主，日文、英文以小字并置。

一个用 **Next.js (App Router) + Tailwind CSS + Supabase** 搭的作品集式站点。
每个「追求」是一张主题卡片，点进去是一个二级页：进度、作品、笔记、资料。

---

## 现在有什么

- `/` 首页：字标 + 最近的追求卡片 + 一段自述
- `/pursuits` 全部追求
- `/pursuits/[slug]` 二级页：
  - 01 进展与进度（四阶段 + 里程碑勾选）
  - 02 作品（图片灯箱 / 自定义音频播放器）
  - 03 笔记（Markdown，支持表格、代码、引用）
  - 04 学习资料与链接

暗色底 + 单色霓虹点缀，用 CSS 变量控制每个追求的主色（cyan / magenta / violet / lime / amber）。

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
  not-found.tsx         404
components/             卡片、进度、作品灯箱、音频播放器、Markdown…
lib/
  queries.ts            Supabase 查询（一条嵌套查询取回整页）
  supabase/public.ts    匿名只读客户端
  types.ts              手写的表类型
  display.ts            阶段、日期、时长等展示辅助
supabase/schema.sql     建表脚本
supabase/seed.sql       演示数据
public/demo/            演示图片与一段 24 秒的合成环境音
scripts/qa-viewports.cjs 响应式自检（390 / 1440 宽，检查横向溢出）
```

## 部署（GitHub Desktop → Vercel）

1. 用 GitHub Desktop 把 `naturalsanc-croquis` 文件夹添加为本地仓库，提交，Publish 到 GitHub。
2. Vercel → Add New Project → 选这个仓库 → Framework 自动识别为 Next.js。
3. 在 Environment Variables 里填 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。
4. Deploy。之后每次 push，Vercel 自动重新构建。

## 下一步（第二阶段）

- 登录（Supabase Auth，邮箱 + 密码，仅站长一个账号）
- 网页端编辑：追求 / 里程碑 / 作品 / 笔记 / 资料 的增删改
- 图片、音频直接上传到 Storage
- 保存后触发 `revalidatePath`，页面立刻更新

数据表和 RLS 已经按这个方向准备好了：`authenticated` 角色可以写，匿名只能读已发布内容。
