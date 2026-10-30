import Image from "next/image";
import Link from "next/link";
import {
  saveMaterial,
  saveMilestone,
  saveNote,
  saveWork,
} from "@/app/admin/actions";
import { Sortable } from "@/components/admin/sortable";
import {
  Btn,
  Field,
  Input,
  Select,
  Textarea,
  inputCls,
} from "@/components/admin/ui";
import { formatDate, hostOf } from "@/lib/display";
import type { MaterialLink, Milestone, Note, PortfolioItem } from "@/lib/types";

const fileCls =
  "w-full cursor-pointer rounded-lg border border-dashed border-white/15 bg-white/60 px-3 py-2 text-[11px] text-mist transition hover:border-cyan/40 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-white/10 file:px-2.5 file:py-1 file:text-[10px] file:text-ink";

const iconBtn =
  "grid h-8 w-8 cursor-pointer place-items-center rounded-lg border text-[12px] transition";

/* ------------------------------- 01 里程碑 ------------------------------- */

export function MilestonesEditor({
  pursuitId,
  items,
}: {
  pursuitId: string;
  items: Milestone[];
}) {
  const nodes = items.map((m) => ({
    id: m.id,
    node: (
      <form
        action={saveMilestone}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-white/50 py-2.5 pl-7 pr-3 transition hover:border-white/15"
      >
        <input type="hidden" name="id" value={m.id} />
        <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="milestones" />
        <input
          type="checkbox"
          name="done"
          defaultChecked={m.done}
          title="已完成"
          className="h-5 w-5 shrink-0 cursor-pointer accent-[#2e7f8a]"
        />
        <div className="grid min-w-[180px] flex-1 gap-0.5">
          <input
            name="title"
            defaultValue={m.title}
            className="border-b border-transparent bg-transparent text-[13px] text-ink outline-none transition hover:border-white/15 focus:border-cyan/50"
          />
          <div className="flex gap-3">
            <input
              name="title_en"
              defaultValue={m.title_en ?? ""}
              placeholder="EN"
              className="w-1/2 border-b border-transparent bg-transparent font-display text-[9px] tracking-[0.08em] text-mist/60 outline-none transition hover:border-[var(--line)] focus:border-cyan/40"
            />
            <input
              name="title_ja"
              defaultValue={m.title_ja ?? ""}
              placeholder="日本語"
              className="w-1/2 border-b border-transparent bg-transparent text-[10px] text-mist/50 outline-none transition hover:border-[var(--line)] focus:border-cyan/40"
            />
          </div>
        </div>
        <input
          type="number"
          name="sort_order"
          defaultValue={m.sort_order}
          className="w-12 rounded-md border border-[var(--line)] bg-white/60 px-1 py-1 text-center font-display text-[10px] text-mist/60 outline-none focus:border-cyan/40"
        />
        <div className="flex gap-1.5">
          <Btn
            type="submit"
            name="intent"
            value="save"
            variant="ghost"
            className="!px-2.5 !py-1.5"
          >
            存
          </Btn>
          <Btn
            type="submit"
            name="intent"
            value="delete"
            variant="danger"
            className="!px-2.5 !py-1.5"
          >
            删
          </Btn>
        </div>
      </form>
    ),
  }));

  return (
    <div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] py-8 text-center text-[12px] text-mist/45">
          还没有里程碑。下面加第一个。
        </p>
      ) : (
        <Sortable table="milestones" items={nodes} />
      )}

      <form
        action={saveMilestone}
        className="mt-4 grid gap-3 rounded-xl border border-dashed border-[var(--line)] bg-white/30 p-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="milestones" />
        <Field label="新增里程碑" hint="中文">
          <Input name="title" placeholder="例如：整理首组 12 张作品" />
        </Field>
        <Field label="English">
          <Input name="title_en" />
        </Field>
        <Field label="日本語">
          <Input name="title_ja" />
        </Field>
        <Btn type="submit" name="intent" value="save">
          添加
        </Btn>
      </form>
    </div>
  );
}

/* --------------------------------- 02 作品 -------------------------------- */

function WorkEditForm({
  pursuitId,
  item,
}: {
  pursuitId: string;
  item: PortfolioItem;
}) {
  return (
    <form
      action={saveWork}
      className="mb-5 rounded-xl border border-cyan/25 bg-cyan/[0.03] p-4 sm:p-5"
    >
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="works" />

      <div className="flex flex-wrap items-start gap-4">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-white/60">
          {item.kind === "image" ? (
            item.media_url ? (
              <Image
                src={item.media_url}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            ) : null
          ) : (
            <span className="grid h-full w-full place-items-center text-3xl text-violet">
              ♫
            </span>
          )}
        </div>

        <div className="grid min-w-[260px] flex-1 gap-3 sm:grid-cols-3">
          <Field label="类型" hint="KIND">
            <Select name="kind" defaultValue={item.kind}>
              <option value="image">图片</option>
              <option value="audio">音频</option>
            </Select>
          </Field>
          <Field label="标题" hint="中文">
            <Input name="title" defaultValue={item.title ?? ""} />
          </Field>
          <Field label="标题" hint="EN / 日">
            <div className="flex gap-2">
              <Input name="title_en" defaultValue={item.title_en ?? ""} />
              <Input name="title_ja" defaultValue={item.title_ja ?? ""} />
            </div>
          </Field>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="说明" hint="中文">
          <Input name="description" defaultValue={item.description ?? ""} />
        </Field>
        <Field label="说明" hint="EN / 日">
          <div className="flex gap-2">
            <Input
              name="description_en"
              defaultValue={item.description_en ?? ""}
            />
            <Input
              name="description_ja"
              defaultValue={item.description_ja ?? ""}
            />
          </div>
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <Field label="文件地址" hint="URL；或下面上传">
          <Input
            name="media_url"
            defaultValue={item.media_url}
            placeholder="/demo/x.jpg 或 https://…"
          />
        </Field>
        <Field label="上传文件" hint="图片或音频">
          <input
            type="file"
            name="file"
            accept="image/*,audio/*"
            className={fileCls}
          />
        </Field>
        <Field label="音频时长" hint="秒 · 可选">
          <Input
            type="number"
            name="duration_seconds"
            defaultValue={item.duration_seconds ?? ""}
          />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
        <Field label="封面/海报" hint="音频用 · 可选">
          <Input name="poster_url" defaultValue={item.poster_url ?? ""} />
        </Field>
        <Field label="上传海报" hint="可选">
          <input
            type="file"
            name="poster_file"
            accept="image/*"
            className={fileCls}
          />
        </Field>
        <Field label="排序" hint="拖拽可改">
          <Input
            type="number"
            name="sort_order"
            defaultValue={item.sort_order}
          />
        </Field>
        <div className="flex gap-2 pb-0.5">
          <Btn type="submit" name="intent" value="save">
            保存
          </Btn>
          <Btn type="submit" name="intent" value="delete" variant="danger">
            删除
          </Btn>
        </div>
      </div>
    </form>
  );
}

export function WorksEditor({
  pursuitId,
  items,
  editId,
}: {
  pursuitId: string;
  items: PortfolioItem[];
  editId?: string;
}) {
  const editing = items.find((i) => i.id === editId);

  const nodes = items.map((item, i) => ({
    id: item.id,
    node: (
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white/50 transition hover:border-white/20">
        <div className="relative aspect-[4/3] bg-white/60">
          {item.kind === "image" && item.media_url ? (
            <Image
              src={item.media_url}
              alt={item.title ?? ""}
              fill
              sizes="(max-width: 640px) 100vw, 320px"
              className="object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <span className="text-4xl text-violet/70">♫</span>
            </div>
          )}
          <span className="absolute left-9 top-2 rounded-full border border-white/15 bg-black/60 px-2 py-0.5 font-display text-[8px] tracking-[0.14em] text-white/70">
            {item.kind === "image" ? "IMAGE" : "AUDIO"}
          </span>
          <span className="absolute right-2 top-2 font-display text-[9px] text-white/40">
            {String(i + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="p-3">
          <p className="truncate text-[13px] text-ink">
            {item.title || "未命名"}
          </p>
          <p className="mt-0.5 truncate font-display text-[9px] tracking-[0.1em] text-mist/40">
            {[item.title_en, item.title_ja].filter(Boolean).join(" · ") || "—"}
          </p>

          <div className="mt-3 flex items-center gap-1.5">
            <Link
              href={`?tab=works&edit=${item.id}`}
              className={`${iconBtn} border-[var(--line)] text-mist/70 hover:border-cyan/50 hover:text-cyan`}
              title="编辑"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </Link>
            <form action={saveWork} className="contents">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="works" />
              <button
                type="submit"
                name="intent"
                value="delete"
                className={`${iconBtn} border-[var(--line)] text-mist/50 hover:border-red-500/50 hover:text-red-300`}
                title="删除"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    ),
  }));

  return (
    <div>
      {editing ? (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-[9px] tracking-[0.2em] text-cyan/70">
              EDITING · {editing.title || "未命名"}
            </p>
            <Link
              href="?tab=works"
              className="font-display text-[9px] tracking-[0.16em] text-mist/50 hover:text-ink"
            >
              收起 ✕
            </Link>
          </div>
          <WorkEditForm pursuitId={pursuitId} item={editing} />
        </>
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] py-10 text-center text-[12px] text-mist/45">
          还没有作品。从下面加第一件。
        </p>
      ) : (
        <Sortable table="portfolio_items" items={nodes} grid />
      )}

      <form
        action={saveWork}
        className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-white/30 p-4"
      >
        <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="works" />
        <p className="text-[12px] text-mist/60">
          新增作品：可以只<span className="text-ink/80">上传文件</span>、只
          <span className="text-ink/80">粘贴链接</span>，或者两个都填
          （都填时以文件为准）。
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr_auto] sm:items-end">
          <Field label="类型" hint="TYPE">
            <Select name="kind" defaultValue="image">
              <option value="image">图片</option>
              <option value="audio">音频</option>
            </Select>
          </Field>
          <Field label="标题" hint="中文，可后补">
            <Input name="title" placeholder="作品名" />
          </Field>
          <Btn type="submit" name="intent" value="save">
            添加
          </Btn>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="上传文件" hint="图片或音频">
            <input
              type="file"
              name="file"
              accept="image/*,audio/*"
              className={fileCls}
            />
          </Field>
          <Field label="作品链接" hint="URL · 可以和文件一起填">
            <Input
              name="media_url"
              placeholder="https://… 或 /demo/x.jpg"
            />
          </Field>
        </div>
      </form>
    </div>
  );
}

/* --------------------------------- 03 笔记 -------------------------------- */

export function NotesEditor({
  pursuitId,
  items,
}: {
  pursuitId: string;
  items: Note[];
}) {
  return (
    <div>
      <div className="space-y-3">
        {items.map((n) => (
          <details
            key={n.id}
            className="group rounded-xl border border-[var(--line)] bg-white/50 transition hover:border-white/15"
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5">
              <span className="font-display text-[10px] tracking-[0.12em] text-mist/45">
                {formatDate(n.note_date)}
              </span>
              {n.is_pinned ? (
                <span className="rounded-full border border-cyan/40 bg-cyan/10 px-2 py-0.5 font-display text-[8px] tracking-[0.12em] text-cyan/80">
                  PINNED
                </span>
              ) : null}
              {!n.is_published ? (
                <span className="rounded-full border border-white/15 px-2 py-0.5 font-display text-[8px] tracking-[0.12em] text-mist/50">
                  DRAFT
                </span>
              ) : null}
              <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
                {n.title}
              </span>
              <span className="font-display text-[9px] tracking-[0.14em] text-mist/40 transition group-open:text-cyan/70">
                展开编辑 ▾
              </span>
            </summary>

            <form
              action={saveNote}
              className="border-t border-white/5 px-4 py-4"
            >
              <input type="hidden" name="id" value={n.id} />
              <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="notes" />

              <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
                <Field label="标题" hint="中文">
                  <Input name="title" defaultValue={n.title} />
                </Field>
                <Field label="标题" hint="EN / 日">
                  <div className="flex gap-2">
                    <Input name="title_en" defaultValue={n.title_en ?? ""} />
                    <Input name="title_ja" defaultValue={n.title_ja ?? ""} />
                  </div>
                </Field>
                <Field label="日期">
                  <Input
                    type="date"
                    name="note_date"
                    defaultValue={n.note_date}
                  />
                </Field>
                <div className="flex gap-2 pb-0.5">
                  <Btn type="submit" name="intent" value="save">
                    保存
                  </Btn>
                  <Btn
                    type="submit"
                    name="intent"
                    value="delete"
                    variant="danger"
                  >
                    删除
                  </Btn>
                </div>
              </div>

              <div className="mt-3">
                <Field
                  label="正文"
                  hint="Markdown · 标题 / 列表 / 引用 / 表格 / 代码"
                >
                  <Textarea
                    name="content"
                    defaultValue={n.content ?? ""}
                    className="min-h-[180px] font-mono text-[12px]"
                  />
                </Field>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-5 text-[12px] text-mist">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_pinned"
                    defaultChecked={n.is_pinned}
                    className="h-4 w-4 accent-[#2e7f8a]"
                  />
                  置顶
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_published"
                    defaultChecked={n.is_published}
                    className="h-4 w-4 accent-[#2e7f8a]"
                  />
                  公开
                </label>
              </div>
            </form>
          </details>
        ))}
      </div>

      <form
        action={saveNote}
        className="mt-4 grid gap-3 rounded-xl border border-dashed border-[var(--line)] bg-white/30 p-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="notes" />
        <Field label="新增笔记" hint="标题">
          <Input name="title" placeholder="写点什么" />
        </Field>
        <Field label="正文" hint="可稍后再补">
          <Input name="content" placeholder="支持 Markdown" />
        </Field>
        <Btn type="submit" name="intent" value="save">
          添加
        </Btn>
      </form>
    </div>
  );
}

/* --------------------------------- 04 资料 -------------------------------- */

const KIND_LABEL: Record<string, string> = {
  article: "文章",
  course: "课程",
  book: "书",
  tool: "工具",
  video: "影像",
  other: "其他",
};

export function MaterialsEditor({
  pursuitId,
  items,
}: {
  pursuitId: string;
  items: MaterialLink[];
}) {
  const nodes = items.map((l) => ({
    id: l.id,
    node: (
      <form
        action={saveMaterial}
        className="grid gap-2 rounded-xl border border-[var(--line)] bg-white/50 py-2.5 pl-7 pr-3 sm:grid-cols-[28px_1.1fr_1.5fr_100px_1fr_56px_auto] sm:items-center"
      >
        <input type="hidden" name="id" value={l.id} />
        <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="links" />
        <span
          className="grid h-7 w-7 place-items-center rounded-md border border-[var(--line)] bg-white/60 font-display text-[10px] text-cyan/70"
          title={hostOf(l.url)}
        >
          {hostOf(l.url).slice(0, 1).toUpperCase()}
        </span>
        <input
          name="title"
          defaultValue={l.title}
          className="border-b border-transparent bg-transparent text-[13px] text-ink outline-none transition hover:border-white/15 focus:border-cyan/50"
        />
        <input
          name="url"
          defaultValue={l.url}
          className="truncate border-b border-transparent bg-transparent font-display text-[10px] text-mist/60 outline-none transition hover:border-[var(--line)] focus:border-cyan/40"
        />
        <select
          name="kind"
          defaultValue={l.kind}
          className="rounded-md border border-[var(--line)] bg-white/60 px-1.5 py-1 text-[11px] text-mist outline-none focus:border-cyan/40"
        >
          {Object.entries(KIND_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <input
          name="description"
          defaultValue={l.description ?? ""}
          placeholder="一句说明"
          className="border-b border-transparent bg-transparent text-[11px] text-mist/60 outline-none transition hover:border-[var(--line)] focus:border-cyan/40"
        />
        <input
          type="number"
          name="sort_order"
          defaultValue={l.sort_order}
          className="w-12 rounded-md border border-[var(--line)] bg-white/60 px-1 py-1 text-center font-display text-[10px] text-mist/60 outline-none focus:border-cyan/40"
        />
        <div className="flex gap-1.5">
          <Btn
            type="submit"
            name="intent"
            value="save"
            variant="ghost"
            className="!px-2.5 !py-1.5"
          >
            存
          </Btn>
          <Btn
            type="submit"
            name="intent"
            value="delete"
            variant="danger"
            className="!px-2.5 !py-1.5"
          >
            删
          </Btn>
        </div>
      </form>
    ),
  }));

  return (
    <div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--line)] py-8 text-center text-[12px] text-mist/45">
          还没有资料链接。
        </p>
      ) : (
        <Sortable table="materials_and_links" items={nodes} />
      )}

      <form
        action={saveMaterial}
        className="mt-4 grid gap-3 rounded-xl border border-dashed border-[var(--line)] bg-white/30 p-4 sm:grid-cols-[1.2fr_1.6fr_110px_auto] sm:items-end"
      >
        <input type="hidden" name="pursuit_id" value={pursuitId} />
              <input type="hidden" name="return_tab" value="links" />
        <Field label="新增链接" hint="标题">
          <Input name="title" placeholder="例如：Refactoring UI" />
        </Field>
        <Field label="网址" hint="必填">
          <Input name="url" placeholder="https://…" />
        </Field>
        <Field label="类型">
          <Select name="kind" defaultValue="article">
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        <Btn type="submit" name="intent" value="save">
          添加
        </Btn>
      </form>
    </div>
  );
}
