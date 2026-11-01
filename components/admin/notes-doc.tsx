"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useOpenList } from "@/components/admin/notes-shell";
import { Sortable } from "@/components/admin/sortable";
import { STAGES } from "@/lib/display";
import type { SaveStatus } from "@/components/admin/studio-editor";
import type { StudioSnapshot } from "@/lib/studio-diff";
import type {
  MaterialKind,
  MaterialLink,
  MediaKind,
  Milestone,
  Note,
  PortfolioItem,
  Pursuit,
  Stage,
} from "@/lib/types";

const KINDS: { value: MaterialKind; label: string }[] = [
  { value: "article", label: "文章" },
  { value: "course", label: "课程" },
  { value: "book", label: "书" },
  { value: "tool", label: "工具" },
  { value: "video", label: "影像" },
  { value: "other", label: "其他" },
];

type Lang = "zh" | "en" | "ja";

const LANGS: { id: Lang; label: string }[] = [
  { id: "zh", label: "中" },
  { id: "en", label: "En" },
  { id: "ja", label: "日" },
];

function langName(lang: Lang) {
  return lang === "zh" ? "中文" : lang === "en" ? "English" : "日本語";
}

type Write = (next: StudioSnapshot, mode: "debounce" | "now" | "local") => void;
type PatchRow = (
  key: "milestones" | "works" | "notes" | "materials",
  id: string,
  patch: object,
  mode?: "debounce" | "now",
) => void;

function localized(lang: Lang, zh: string, en: string | null, ja: string | null) {
  if (lang === "en") return en ?? "";
  if (lang === "ja") return ja ?? "";
  return zh;
}

function pursuitLangPatch(
  lang: Lang,
  base: "title" | "subtitle" | "description" | "progress_note",
  value: string,
): Partial<Pursuit> {
  const stored = lang === "zh" && base === "title" ? value : value.trim() ? value : null;
  if (lang === "zh") return { [base]: stored };
  if (lang === "en") return { [`${base}_en`]: stored };
  return { [`${base}_ja`]: stored };
}

function langPatch(
  lang: Lang,
  base: "title" | "description" | "content",
  value: string,
  nullable = false,
) {
  const stored = !nullable && lang === "zh" && base === "title" ? value : value.trim() ? value : null;
  if (lang === "zh") return { [base]: stored };
  return { [lang === "en" ? `${base}_en` : `${base}_ja`]: stored };
}

function tempId() {
  return `tmp_${crypto.randomUUID()}`;
}

function orderRows<T extends { id: string; sort_order: number }>(rows: T[], ids: string[]) {
  const map = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id, index) => ({ ...map.get(id)!, sort_order: index + 1 }));
}

export function NotesDoc({
  data,
  status,
  uploadLabel,
  onRetry,
  write,
  patchPursuit,
  patchRow,
  pickFile,
  onDeletePursuit,
  read,
  renames,
}: {
  data: StudioSnapshot;
  status: SaveStatus;
  uploadLabel: string | null;
  onRetry: () => void;
  write: Write;
  read: () => StudioSnapshot;
  patchPursuit: (patch: Partial<Pursuit>, mode?: "debounce" | "now") => void;
  patchRow: PatchRow;
  pickFile: (file: File | undefined, apply: (url: string) => void) => Promise<void>;
  onDeletePursuit: () => void;
  renames: { key: string; id: string }[];
}) {
  const { pursuit } = data;
  const [lang, setLang] = useState<Lang>("zh");
  const openList = useOpenList();
  const [menu, setMenu] = useState(false);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [openWork, setOpenWork] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileJob = useRef<((file: File) => void) | null>(null);
  const resolveId = (id: string | null) =>
    (id && renames.find((item) => item.key === id)?.id) || id;
  const activeNote = resolveId(openNote);
  const activeWork = resolveId(openWork);

  const note = data.notes.find((item) => item.id === activeNote) ?? null;

  const chooseFile = (accept: string, job: (file: File) => void) => {
    fileJob.current = job;
    const input = fileRef.current;
    if (!input) return;
    input.accept = accept;
    input.value = "";
    input.click();
  };

  const dropRow = (key: "milestones" | "works" | "notes" | "materials", id: string) => {
    if (!window.confirm("删除这一条？不能撤销。")) return;
    const current = read();
    write(
      { ...current, [key]: current[key].filter((row) => row.id !== id) },
      "now",
    );
    if (key === "notes" && (openNote === id || activeNote === id)) setOpenNote(null);
    if (key === "works" && (openWork === id || activeWork === id)) setOpenWork(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 px-3 pt-3 md:px-8">
        <button
          type="button"
          onClick={openList}
          aria-label="打开目录"
          className="press grid h-8 w-8 place-items-center rounded-[8px] text-[var(--text)] md:hidden"
        >
          <HairlineIcon name="menu" />
        </button>
        <StatusLine status={status} uploadLabel={uploadLabel} onRetry={onRetry} />
        <div className="relative ml-auto flex shrink-0 items-center gap-0.5">
          <div className="mr-1 flex items-center" role="group" aria-label="语言">
            {LANGS.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={lang === item.id}
                onClick={() => setLang(item.id)}
                className={`press rounded-[8px] px-2 py-1 text-[13px] ${
                  lang === item.id ? "text-[var(--text)]" : "text-[var(--text-muted)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <a
            href={`/pursuits/${pursuit.slug}`}
            target="_blank"
            rel="noreferrer"
            aria-label="预览"
            className="press grid h-8 w-8 place-items-center rounded-[8px] text-[var(--text)]"
          >
            <HairlineIcon name="preview" />
          </a>
          <IconButton
            label={pursuit.is_published ? "改为草稿" : "发布"}
            pressed={pursuit.is_published}
            onClick={() => patchPursuit({ is_published: !pursuit.is_published }, "now")}
          >
            <HairlineIcon name={pursuit.is_published ? "published" : "draft"} />
          </IconButton>
          <IconButton label="更多" pressed={menu} onClick={() => setMenu((value) => !value)}>
            <HairlineIcon name="more" />
          </IconButton>
          {menu ? (
            <MoreMenu
              pursuit={pursuit}
              onChange={patchPursuit}
              onClose={() => setMenu(false)}
              onCover={() =>
                chooseFile("image/jpeg,image/png,image/webp,image/gif,image/avif", (file) =>
                  void pickFile(file, (url) => patchPursuit({ cover_url: url }, "now")),
                )
              }
              onDelete={onDeletePursuit}
            />
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <article className="sheet">
          {note ? (
            <NotePage
              note={note}
              lang={lang}
              onBack={() => setOpenNote(null)}
              onChange={(patch) => patchRow("notes", note.id, patch)}
              onDelete={() => dropRow("notes", note.id)}
            />
          ) : (
            <>
              <section className="frame">
                <div className="frame-head">
                  <h2 className="type-section">简介</h2>
                  <p className="type-meta">{langName(lang)}</p>
                </div>
                <Line
                  value={localized(lang, pursuit.title, pursuit.title_en, pursuit.title_ja)}
                  label={`标题 ${langName(lang)}`}
                  placeholder="标题"
                  onChange={(value) => patchPursuit(pursuitLangPatch(lang, "title", value))}
                  className="type-display text-[var(--text)]"
                />
                <Line
                  multiline
                  value={localized(lang, pursuit.subtitle ?? "", pursuit.subtitle_en, pursuit.subtitle_ja)}
                  label={`简介 ${langName(lang)}`}
                  placeholder="简介，回车换行"
                  onChange={(value) => patchPursuit(pursuitLangPatch(lang, "subtitle", value))}
                  className="type-body mt-3 text-[var(--text-muted)]"
                />
                <Line
                  multiline
                  value={localized(lang, pursuit.description ?? "", pursuit.description_en, pursuit.description_ja)}
                  label={`正文 ${langName(lang)}`}
                  placeholder="正文，回车换行"
                  onChange={(value) => patchPursuit(pursuitLangPatch(lang, "description", value))}
                  className="type-body mt-3 text-[var(--text-muted)]"
                />
                <Line
                  multiline
                  value={localized(lang, pursuit.progress_note ?? "", pursuit.progress_note_en, pursuit.progress_note_ja)}
                  label={`阶段说明 ${langName(lang)}`}
                  placeholder="现在走到哪一步"
                  onChange={(value) => patchPursuit(pursuitLangPatch(lang, "progress_note", value))}
                  className="type-meta mt-3"
                />
              </section>

              <Block
                title="里程碑"
                onAdd={() => {
                  const current = read();
                  const id = tempId();
                  write(
                    {
                      ...current,
                      milestones: [
                        ...current.milestones,
                        {
                          id,
                          pursuit_id: pursuit.id,
                          title: "",
                          title_en: null,
                          title_ja: null,
                          done: false,
                          sort_order: current.milestones.length + 1,
                          created_at: new Date().toISOString(),
                        },
                      ],
                    },
                    "local",
                  );
                }}
              >
                {data.milestones.length === 0 ? null : (
                  <Sortable
                    items={data.milestones.map((row) => ({
                      id: row.id,
                      node: (
                        <MilestoneLine
                          row={row}
                          lang={lang}
                          onChange={(patch) => patchRow("milestones", row.id, patch)}
                          onDelete={() => dropRow("milestones", row.id)}
                        />
                      ),
                    }))}
                    onReorder={(ids, phase) => {
                      const current = read();
                      write(
                        { ...current, milestones: orderRows(current.milestones, ids) },
                        phase === "commit" ? "now" : "local",
                      );
                    }}
                  />
                )}
              </Block>

              <Block
                title="作品"
                onAdd={() =>
                  chooseFile("image/*,audio/*", (file) => {
                    const kind: MediaKind = file.type.startsWith("audio/") ? "audio" : "image";
                    void pickFile(file, (url) => {
                      const current = read();
                      const id = tempId();
                      write(
                        {
                          ...current,
                          works: [
                            ...current.works,
                            emptyWork(id, pursuit.id, current.works.length + 1, kind, url, file.name),
                          ],
                        },
                        "now",
                      );
                      setOpenWork(id);
                    });
                  })
                }
              >
                {data.works.length === 0 ? null : (
                  <Sortable
                    items={data.works.map((row) => ({
                      id: row.id,
                      node: (
                        <WorkLine
                          row={row}
                          open={activeWork === row.id}
                          lang={lang}
                          onToggle={() => setOpenWork(openWork === row.id ? null : row.id)}
                          onChange={(patch, mode) => patchRow("works", row.id, patch, mode)}
                          onDelete={() => dropRow("works", row.id)}
                          onReplace={(slot) =>
                            chooseFile(slot === "poster" ? "image/*" : "image/*,audio/*", (file) =>
                              void pickFile(file, (url) =>
                                patchRow(
                                  "works",
                                  row.id,
                                  slot === "poster" ? { poster_url: url } : { media_url: url },
                                  "now",
                                ),
                              ),
                            )
                          }
                        />
                      ),
                    }))}
                    onReorder={(ids, phase) => {
                      const current = read();
                      write(
                        { ...current, works: orderRows(current.works, ids) },
                        phase === "commit" ? "now" : "local",
                      );
                    }}
                  />
                )}
              </Block>

              <Block
                title="笔记"
                onAdd={() => {
                  const current = read();
                  const id = tempId();
                  const created: Note = {
                    id,
                    pursuit_id: pursuit.id,
                    title: "",
                    title_en: null,
                    title_ja: null,
                    content: "",
                    content_en: null,
                    content_ja: null,
                    is_published: true,
                    is_pinned: false,
                    note_date: new Date().toISOString().slice(0, 10),
                    created_at: new Date().toISOString(),
                  };
                  write({ ...current, notes: [created, ...current.notes] }, "local");
                  setOpenNote(id);
                }}
              >
                <ul>
                  {data.notes.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => setOpenNote(item.id)}
                        className="block w-full truncate py-1.5 text-left text-[17px] text-[var(--text)] hover:text-[var(--text-muted)]"
                      >
                        {item.title || "无标题笔记"}
                      </button>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block
                title="资料"
                onAdd={() => {
                  const current = read();
                  const row: MaterialLink = {
                    id: tempId(),
                    pursuit_id: pursuit.id,
                    title: "",
                    title_en: null,
                    title_ja: null,
                    url: "",
                    kind: "article",
                    description: null,
                    description_en: null,
                    description_ja: null,
                    sort_order: current.materials.length + 1,
                    created_at: new Date().toISOString(),
                  };
                  write({ ...current, materials: [...current.materials, row] }, "local");
                }}
              >
                {data.materials.length === 0 ? null : (
                  <Sortable
                    items={data.materials.map((row) => ({
                      id: row.id,
                      node: (
                        <MaterialLine
                          row={row}
                          lang={lang}
                          onChange={(patch) => patchRow("materials", row.id, patch)}
                          onDelete={() => dropRow("materials", row.id)}
                        />
                      ),
                    }))}
                    onReorder={(ids, phase) => {
                      const current = read();
                      write(
                        { ...current, materials: orderRows(current.materials, ids) },
                        phase === "commit" ? "now" : "local",
                      );
                    }}
                  />
                )}
              </Block>
            </>
          )}
        </article>
      </div>

      <input
        ref={fileRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          const job = fileJob.current;
          fileJob.current = null;
          if (file && job) job(file);
        }}
      />
    </div>
  );
}

function Line({
  value,
  onChange,
  label,
  placeholder,
  className = "",
  multiline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  if (multiline) {
    return (
      <textarea
        ref={ref}
        value={value}
        aria-label={label}
        placeholder={placeholder}
        rows={1}
        onChange={(event) => onChange(event.target.value)}
        className={`plain-write ${className}`}
      />
    );
  }

  return (
    <input
      value={value}
      aria-label={label}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className={`plain-write ${className}`}
    />
  );
}

function HairlineIcon({ name }: { name: "menu" | "preview" | "published" | "draft" | "more" }) {
  const props = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "menu") {
    return (
      <svg {...props}>
        <path d="M4 7h16M4 12h16M4 17h10" />
      </svg>
    );
  }
  if (name === "preview") {
    return (
      <svg {...props}>
        <path d="M14 5h5v5" />
        <path d="M19 5l-7 7" />
        <path d="M17 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" />
      </svg>
    );
  }
  if (name === "published") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="7" />
        <path d="M8.5 12.4l2.2 2.2 4.8-5" />
      </svg>
    );
  }
  if (name === "draft") {
    return (
      <svg {...props}>
        <circle cx="12" cy="12" r="7" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 2v8M2 6h8" />
    </svg>
  );
}

function Block({
  title,
  onAdd,
  children,
}: {
  title: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="frame">
      <div className="frame-head">
        <h2 className="type-section">{title}</h2>
        <button type="button" aria-label={`添加${title}`} onClick={onAdd} className="press grid h-7 w-7 place-items-center rounded-[8px] text-[var(--text-muted)]">
          <PlusIcon />
        </button>
      </div>
      <div>{children}</div>
    </section>
  );
}

function IconButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
        className={`press grid h-8 min-w-8 place-items-center rounded-[8px] px-1 text-[14px] ${
        pressed ? "bg-[var(--surface-muted)] text-[var(--text)]" : "text-[var(--text-muted)]"
      }`}
    >
      {children}
    </button>
  );
}

function StatusLine({
  status,
  uploadLabel,
  onRetry,
}: {
  status: SaveStatus;
  uploadLabel: string | null;
  onRetry: () => void;
}) {
  const text =
    uploadLabel ??
    (status.kind === "saving"
      ? "保存中"
      : status.kind === "dirty"
        ? "未保存"
        : status.kind === "error"
          ? status.message
          : status.warning
            ? status.warning
            : "已保存");
  const tone = status.kind === "error" ? "text-[var(--danger)]" : "text-[var(--text-muted)]";
  return (
    <p role="status" aria-live="polite" className={`min-w-0 truncate text-[12px] ${tone}`}>
      {text}
      {status.kind === "error" ? (
        <button type="button" onClick={onRetry} className="ml-2 underline">
          重试
        </button>
      ) : null}
    </p>
  );
}

function MoreMenu({
  pursuit,
  onChange,
  onClose,
  onCover,
  onDelete,
}: {
  pursuit: Pursuit;
  onChange: (patch: Partial<Pursuit>, mode?: "debounce" | "now") => void;
  onClose: () => void;
  onCover: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <button type="button" aria-label="关闭菜单" className="fixed inset-0 z-20 cursor-default" onClick={onClose} />
      <div className="absolute right-0 top-9 z-30 w-64 rounded-[12px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="font-display text-[11px] text-[var(--text-muted)]">阶段</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {STAGES.map((stage) => (
            <button
              key={stage.key}
              type="button"
              onClick={() => onChange({ stage: stage.key as Stage }, "now")}
              className={`text-[14px] ${pursuit.stage === stage.key ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}
            >
              {stage.zh}
            </button>
          ))}
        </div>
        <Line
          value={pursuit.slug}
          label="网址片段"
          placeholder="网址"
          onChange={(value) => onChange({ slug: value })}
          className="mt-4 text-[14px] text-[var(--text-muted)]"
        />
        <input
          type="date"
          aria-label="开始日期"
          value={pursuit.started_at ?? ""}
          onChange={(event) => onChange({ started_at: event.target.value || null })}
          className="plain-write mt-3 text-[14px] text-[var(--text-muted)]"
        />
        <button type="button" onClick={onCover} className="mt-4 block text-[14px] text-[var(--text)]">
          {pursuit.cover_url ? "更换封面" : "添加封面"}
        </button>
        {pursuit.cover_url ? (
          <div className="relative mt-3 aspect-[4/3] w-24 overflow-hidden">
            <SafeImage src={pursuit.cover_url} alt="" sizes="96px" />
          </div>
        ) : null}
        <button type="button" onClick={onDelete} className="mt-5 block text-[13px] text-[var(--danger)]">
          删除这条追求
        </button>
      </div>
    </>
  );
}

function MilestoneLine({
  row,
  lang,
  onChange,
  onDelete,
}: {
  row: Milestone;
  lang: Lang;
  onChange: (patch: Partial<Milestone>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-start gap-3 py-1.5 pl-4">
      <button
        type="button"
        aria-label={row.done ? "标为未完成" : "标为完成"}
        aria-pressed={row.done}
        onClick={() => onChange({ done: !row.done })}
        className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-[8px] border-[0.5px] ${
          row.done ? "border-[var(--text)] bg-[var(--text)]" : "border-[var(--border-strong)]"
        }`}
      />
      <div className="min-w-0 flex-1">
        <Line
          value={localized(lang, row.title, row.title_en, row.title_ja)}
          label={`里程碑 ${langName(lang)}`}
          placeholder="里程碑"
          onChange={(value) => onChange(langPatch(lang, "title", value))}
          className={`type-body ${row.done ? "text-[var(--text-muted)] line-through" : "text-[var(--text)]"}`}
        />
      </div>
      <button
        type="button"
        aria-label="删除里程碑"
        onClick={onDelete}
        className="text-[12px] text-[var(--text-muted)] opacity-0 hover:text-[var(--danger)] group-hover:opacity-100 group-focus-within:opacity-100"
      >
        删
      </button>
    </div>
  );
}

function WorkLine({
  row,
  open,
  lang,
  onToggle,
  onChange,
  onDelete,
  onReplace,
}: {
  row: PortfolioItem;
  open: boolean;
  lang: Lang;
  onToggle: () => void;
  onChange: (patch: Partial<PortfolioItem>, mode?: "debounce" | "now") => void;
  onDelete: () => void;
  onReplace: (slot: "media" | "poster") => void;
}) {
  return (
    <div className="group py-3 pl-4">
      <div className="flex items-start gap-4">
        <button type="button" onClick={onToggle} aria-label="展开作品" className="relative h-14 w-14 shrink-0 overflow-hidden bg-[var(--surface-muted)]">
          {row.kind === "image" && row.media_url ? (
            <SafeImage src={row.media_url} alt="" sizes="56px" />
          ) : (
            <span className="grid h-full place-items-center text-[12px] text-[var(--text-muted)]">音</span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <Line
            value={localized(lang, row.title ?? "", row.title_en, row.title_ja)}
            label={`作品标题 ${langName(lang)}`}
            placeholder="作品"
            onChange={(value) => onChange(langPatch(lang, "title", value, true))}
            className="type-body text-[var(--text)]"
          />
          {open ? (
            <>
              <Line
                multiline
                value={localized(lang, row.description ?? "", row.description_en, row.description_ja)}
                label={`作品说明 ${langName(lang)}`}
                placeholder="说明，回车换行"
                onChange={(value) => onChange(langPatch(lang, "description", value, true))}
                className="type-meta mt-1"
              />
              <Line
                value={row.media_url}
                label="作品地址"
                placeholder="https://"
                onChange={(value) => onChange({ media_url: value })}
                className="mt-2 text-[13px] text-[var(--text-muted)]"
              />
              <div className="mt-2 flex gap-4 text-[13px] text-[var(--text-muted)]">
                <button type="button" onClick={() => onChange({ kind: row.kind === "image" ? "audio" : "image" }, "now")}>
                  {row.kind === "image" ? "图片" : "音频"}
                </button>
                <button type="button" onClick={() => onReplace("media")}>
                  换文件
                </button>
                {row.kind === "audio" ? (
                  <button type="button" onClick={() => onReplace("poster")}>
                    海报
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="删除作品"
          onClick={onDelete}
          className="text-[12px] text-[var(--text-muted)] opacity-0 hover:text-[var(--danger)] group-hover:opacity-100 group-focus-within:opacity-100"
        >
          删
        </button>
      </div>
    </div>
  );
}

function MaterialLine({
  row,
  lang,
  onChange,
  onDelete,
}: {
  row: MaterialLink;
  lang: Lang;
  onChange: (patch: Partial<MaterialLink>) => void;
  onDelete: () => void;
}) {
  const nextKind = () => {
    const values = KINDS.map((item) => item.value);
    const index = values.indexOf(row.kind);
    onChange({ kind: values[(index + 1) % values.length] });
  };
  const label = KINDS.find((item) => item.value === row.kind)?.label ?? "其他";

  return (
    <div className="group py-2 pl-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Line
            value={localized(lang, row.title, row.title_en, row.title_ja)}
            label={`资料标题 ${langName(lang)}`}
            placeholder="资料"
            onChange={(value) => onChange(langPatch(lang, "title", value))}
            className="type-body text-[var(--text)]"
          />
          <Line
            value={row.url}
            label="网址"
            placeholder="https://"
            onChange={(value) => onChange({ url: value })}
            className="type-meta"
          />
          <Line
            multiline
            value={localized(lang, row.description ?? "", row.description_en, row.description_ja)}
            label={`说明 ${langName(lang)}`}
            placeholder="说明，回车换行"
            onChange={(value) => onChange(langPatch(lang, "description", value, true))}
            className="type-meta mt-1"
          />
        </div>
        <button type="button" onClick={nextKind} className="text-[12px] text-[var(--text-muted)]">
          {label}
        </button>
        <button
          type="button"
          aria-label="删除资料"
          onClick={onDelete}
          className="text-[12px] text-[var(--text-muted)] opacity-0 hover:text-[var(--danger)] group-hover:opacity-100 group-focus-within:opacity-100"
        >
          删
        </button>
      </div>
    </div>
  );
}

function NotePage({
  note,
  lang,
  onBack,
  onChange,
  onDelete,
}: {
  note: Note;
  lang: Lang;
  onBack: () => void;
  onChange: (patch: Partial<Note>) => void;
  onDelete: () => void;
}) {
  return (
    <section className="frame">
      <div className="frame-head text-[13px] text-[var(--text-muted)]">
        <button type="button" onClick={onBack} className="hover:text-[var(--text)]">
          ←
        </button>
        <button type="button" onClick={() => onChange({ is_pinned: !note.is_pinned })}>
          {note.is_pinned ? "已置顶" : "置顶"}
        </button>
        <button type="button" onClick={() => onChange({ is_published: !note.is_published })}>
          {note.is_published ? "公开" : "草稿"}
        </button>
        <button type="button" onClick={onDelete} className="ml-auto text-[var(--danger)]">
          删除
        </button>
      </div>
      <p className="type-meta mb-3">{langName(lang)}</p>
      <Line
        value={localized(lang, note.title, note.title_en, note.title_ja)}
        label={`笔记标题 ${langName(lang)}`}
        placeholder="标题"
        onChange={(value) => onChange(langPatch(lang, "title", value))}
        className="type-display text-[var(--text)]"
      />
      <Line
        multiline
        value={localized(lang, note.content ?? "", note.content_en, note.content_ja)}
        label={`笔记正文 ${langName(lang)}`}
        placeholder="开始写，回车换行"
        onChange={(value) => onChange(langPatch(lang, "content", value, true))}
        className="type-body mt-3 text-[var(--text-muted)]"
      />
    </section>
  );
}

function emptyWork(
  id: string,
  pursuitId: string,
  sortOrder: number,
  kind: MediaKind,
  mediaUrl: string,
  title: string,
): PortfolioItem {
  const clean = title.replace(/\.\w+$/, "");
  return {
    id,
    pursuit_id: pursuitId,
    kind,
    title: clean || null,
    title_en: null,
    title_ja: null,
    description: null,
    description_en: null,
    description_ja: null,
    media_url: mediaUrl,
    poster_url: null,
    duration_seconds: null,
    sort_order: sortOrder,
    created_at: new Date().toISOString(),
  };
}

function SafeImage({ src, alt, sizes }: { src: string; alt: string; sizes: string }) {
  let optimized = src.startsWith("/");
  if (!optimized) {
    try {
      optimized = new URL(src).hostname.endsWith(".supabase.co");
    } catch {
      optimized = false;
    }
  }
  if (!optimized) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    );
  }
  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />;
}
