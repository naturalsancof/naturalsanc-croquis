"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Sortable } from "@/components/admin/sortable";
import { ACCENT_HEX, STAGES } from "@/lib/display";
import type { SaveStatus } from "@/components/admin/studio-editor";
import type { StudioSnapshot } from "@/lib/studio-diff";
import type {
  Accent,
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

type Write = (next: StudioSnapshot, mode: "debounce" | "now" | "local") => void;
type PatchRow = (
  key: "milestones" | "works" | "notes" | "materials",
  id: string,
  patch: object,
  mode?: "debounce" | "now",
) => void;

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
  const [locales, setLocales] = useState(false);
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
      <div className="flex items-center gap-3 px-5 pt-4 md:px-12">
        <Link href="/admin" className="text-[18px] text-mist md:hidden" aria-label="返回列表">
          ←
        </Link>
        <StatusLine status={status} uploadLabel={uploadLabel} onRetry={onRetry} />
        <div className="relative ml-auto flex items-center gap-1">
          <IconButton
            label={locales ? "收起多语言" : "多语言"}
            pressed={locales}
            onClick={() => setLocales((value) => !value)}
          >
            文
          </IconButton>
          <a
            href={`/pursuits/${pursuit.slug}`}
            target="_blank"
            rel="noreferrer"
            aria-label="预览"
            className="grid h-8 w-8 place-items-center text-[14px] text-mist hover:text-ink"
          >
            ↗
          </a>
          <IconButton
            label={pursuit.is_published ? "改为草稿" : "发布"}
            pressed={pursuit.is_published}
            onClick={() => patchPursuit({ is_published: !pursuit.is_published }, "now")}
          >
            {pursuit.is_published ? "●" : "○"}
          </IconButton>
          <IconButton label="更多" pressed={menu} onClick={() => setMenu((value) => !value)}>
            ···
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
        <article className="mx-auto w-full max-w-2xl px-6 pb-28 pt-12 md:px-2">
          {note ? (
            <NotePage
              note={note}
              locales={locales}
              onBack={() => setOpenNote(null)}
              onChange={(patch) => patchRow("notes", note.id, patch)}
              onDelete={() => dropRow("notes", note.id)}
            />
          ) : (
            <>
              <Line
                value={pursuit.title}
                label="标题"
                placeholder="标题"
                onChange={(value) => patchPursuit({ title: value })}
                className="text-[34px] font-semibold tracking-[-0.03em] text-ink sm:text-[42px]"
              />
              {locales ? (
                <LocaleLines
                  en={pursuit.title_en}
                  ja={pursuit.title_ja}
                  onEn={(value) => patchPursuit({ title_en: value || null })}
                  onJa={(value) => patchPursuit({ title_ja: value || null })}
                />
              ) : null}
              <Line
                value={pursuit.subtitle ?? ""}
                label="简介"
                placeholder="一句简介"
                onChange={(value) => patchPursuit({ subtitle: value || null })}
                className="mt-3 text-[18px] text-ink/70"
              />
              {locales ? (
                <LocaleLines
                  en={pursuit.subtitle_en}
                  ja={pursuit.subtitle_ja}
                  onEn={(value) => patchPursuit({ subtitle_en: value || null })}
                  onJa={(value) => patchPursuit({ subtitle_ja: value || null })}
                />
              ) : null}
              <Line
                multiline
                value={pursuit.description ?? ""}
                label="正文"
                placeholder="开始写"
                onChange={(value) => patchPursuit({ description: value || null })}
                className="mt-8 min-h-24 text-[17px] leading-[1.75] text-ink/85"
              />
              {locales ? (
                <>
                  <Line
                    multiline
                    value={pursuit.description_en ?? ""}
                    label="正文 English"
                    placeholder="English"
                    onChange={(value) => patchPursuit({ description_en: value || null })}
                    className="mt-4 text-[15px] leading-relaxed text-mist"
                  />
                  <Line
                    multiline
                    value={pursuit.description_ja ?? ""}
                    label="正文 日本語"
                    placeholder="日本語"
                    onChange={(value) => patchPursuit({ description_ja: value || null })}
                    className="mt-2 text-[15px] leading-relaxed text-mist"
                  />
                </>
              ) : null}
              <Line
                multiline
                value={pursuit.progress_note ?? ""}
                label="阶段说明"
                placeholder="现在走到哪一步"
                onChange={(value) => patchPursuit({ progress_note: value || null })}
                className="mt-6 text-[15px] leading-relaxed text-mist"
              />

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
                          locales={locales}
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
                          locales={locales}
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
                        className="block w-full truncate py-1.5 text-left text-[17px] text-ink hover:text-ink/60"
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
                          locales={locales}
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

function LocaleLines({
  en,
  ja,
  onEn,
  onJa,
}: {
  en: string | null;
  ja: string | null;
  onEn: (value: string) => void;
  onJa: (value: string) => void;
}) {
  return (
    <div className="mt-1 space-y-1">
      <Line
        value={en ?? ""}
        label="English"
        placeholder="English"
        onChange={onEn}
        className="text-[14px] text-mist"
      />
      <Line
        value={ja ?? ""}
        label="日本語"
        placeholder="日本語"
        onChange={onJa}
        className="text-[14px] text-mist"
      />
    </div>
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
    <section className="mt-16">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-[11px] tracking-[0.2em] text-mist">{title}</h2>
        <button type="button" aria-label={`添加${title}`} onClick={onAdd} className="text-[18px] text-mist hover:text-ink">
          +
        </button>
      </div>
      <div className="h-px bg-ink/10" />
      <div className="pt-2">{children}</div>
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
      className={`grid h-8 min-w-8 place-items-center px-1 text-[14px] ${
        pressed ? "text-ink" : "text-mist hover:text-ink"
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
  const tone = status.kind === "error" ? "text-red-700" : "text-mist";
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
      <div className="absolute right-0 top-9 z-30 w-64 border border-ink/10 bg-[#f7f5f8]/95 p-4 backdrop-blur-md">
        <p className="font-display text-[10px] tracking-[0.18em] text-mist">阶段</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {STAGES.map((stage) => (
            <button
              key={stage.key}
              type="button"
              onClick={() => onChange({ stage: stage.key as Stage }, "now")}
              className={`text-[14px] ${pursuit.stage === stage.key ? "text-ink" : "text-mist"}`}
            >
              {stage.zh}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {(Object.keys(ACCENT_HEX) as Accent[]).map((accent) => (
            <button
              key={accent}
              type="button"
              aria-label={accent}
              aria-pressed={pursuit.accent === accent}
              onClick={() => onChange({ accent }, "now")}
              className="h-3.5 w-3.5 rounded-full"
              style={{
                background: ACCENT_HEX[accent],
                boxShadow: pursuit.accent === accent ? "0 0 0 1px #141419" : "none",
              }}
            />
          ))}
        </div>
        <Line
          value={pursuit.slug}
          label="网址片段"
          placeholder="网址"
          onChange={(value) => onChange({ slug: value })}
          className="mt-4 text-[14px] text-mist"
        />
        <input
          type="date"
          aria-label="开始日期"
          value={pursuit.started_at ?? ""}
          onChange={(event) => onChange({ started_at: event.target.value || null })}
          className="plain-write mt-3 text-[14px] text-mist"
        />
        <button type="button" onClick={onCover} className="mt-4 block text-[14px] text-ink">
          {pursuit.cover_url ? "更换封面" : "添加封面"}
        </button>
        {pursuit.cover_url ? (
          <div className="relative mt-3 aspect-[4/3] w-24 overflow-hidden">
            <SafeImage src={pursuit.cover_url} alt="" sizes="96px" />
          </div>
        ) : null}
        <button type="button" onClick={onDelete} className="mt-5 block text-[13px] text-red-700">
          删除这条追求
        </button>
      </div>
    </>
  );
}

function MilestoneLine({
  row,
  locales,
  onChange,
  onDelete,
}: {
  row: Milestone;
  locales: boolean;
  onChange: (patch: Partial<Milestone>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-start gap-3 py-1.5 pl-5">
      <button
        type="button"
        aria-label={row.done ? "标为未完成" : "标为完成"}
        aria-pressed={row.done}
        onClick={() => onChange({ done: !row.done })}
        className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border ${
          row.done ? "border-ink bg-ink" : "border-ink/30"
        }`}
      />
      <div className="min-w-0 flex-1">
        <Line
          value={row.title}
          label="里程碑"
          placeholder="里程碑"
          onChange={(value) => onChange({ title: value })}
          className={`text-[17px] ${row.done ? "text-mist line-through" : "text-ink"}`}
        />
        {locales ? (
          <LocaleLines
            en={row.title_en}
            ja={row.title_ja}
            onEn={(value) => onChange({ title_en: value || null })}
            onJa={(value) => onChange({ title_ja: value || null })}
          />
        ) : null}
      </div>
      <button
        type="button"
        aria-label="删除里程碑"
        onClick={onDelete}
        className="text-[12px] text-mist opacity-0 hover:text-red-700 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        删
      </button>
    </div>
  );
}

function WorkLine({
  row,
  open,
  locales,
  onToggle,
  onChange,
  onDelete,
  onReplace,
}: {
  row: PortfolioItem;
  open: boolean;
  locales: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<PortfolioItem>, mode?: "debounce" | "now") => void;
  onDelete: () => void;
  onReplace: (slot: "media" | "poster") => void;
}) {
  return (
    <div className="group py-3 pl-5">
      <div className="flex items-start gap-4">
        <button type="button" onClick={onToggle} aria-label="展开作品" className="relative h-14 w-14 shrink-0 overflow-hidden bg-ink/[0.04]">
          {row.kind === "image" && row.media_url ? (
            <SafeImage src={row.media_url} alt="" sizes="56px" />
          ) : (
            <span className="grid h-full place-items-center text-[12px] text-mist">音</span>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <Line
            value={row.title ?? ""}
            label="作品标题"
            placeholder="作品"
            onChange={(value) => onChange({ title: value || null })}
            className="text-[17px] text-ink"
          />
          {open ? (
            <>
              <Line
                value={row.description ?? ""}
                label="作品说明"
                placeholder="说明"
                onChange={(value) => onChange({ description: value || null })}
                className="mt-1 text-[14px] text-mist"
              />
              {locales ? (
                <LocaleLines
                  en={row.title_en}
                  ja={row.title_ja}
                  onEn={(value) => onChange({ title_en: value || null })}
                  onJa={(value) => onChange({ title_ja: value || null })}
                />
              ) : null}
              {locales ? (
                <LocaleLines
                  en={row.description_en}
                  ja={row.description_ja}
                  onEn={(value) => onChange({ description_en: value || null })}
                  onJa={(value) => onChange({ description_ja: value || null })}
                />
              ) : null}
              <Line
                value={row.media_url}
                label="作品地址"
                placeholder="https://"
                onChange={(value) => onChange({ media_url: value })}
                className="mt-2 text-[13px] text-mist"
              />
              <div className="mt-2 flex gap-4 text-[13px] text-mist">
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
          className="text-[12px] text-mist opacity-0 hover:text-red-700 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          删
        </button>
      </div>
    </div>
  );
}

function MaterialLine({
  row,
  locales,
  onChange,
  onDelete,
}: {
  row: MaterialLink;
  locales: boolean;
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
    <div className="group py-2 pl-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Line
            value={row.title}
            label="资料标题"
            placeholder="资料"
            onChange={(value) => onChange({ title: value })}
            className="text-[17px] text-ink"
          />
          <Line
            value={row.url}
            label="网址"
            placeholder="https://"
            onChange={(value) => onChange({ url: value })}
            className="text-[13px] text-mist"
          />
          {locales ? (
            <>
              <LocaleLines
                en={row.title_en}
                ja={row.title_ja}
                onEn={(value) => onChange({ title_en: value || null })}
                onJa={(value) => onChange({ title_ja: value || null })}
              />
              <Line
                value={row.description ?? ""}
                label="说明"
                placeholder="一句说明"
                onChange={(value) => onChange({ description: value || null })}
                className="mt-1 text-[14px] text-mist"
              />
              <LocaleLines
                en={row.description_en}
                ja={row.description_ja}
                onEn={(value) => onChange({ description_en: value || null })}
                onJa={(value) => onChange({ description_ja: value || null })}
              />
            </>
          ) : null}
        </div>
        <button type="button" onClick={nextKind} className="text-[12px] text-mist">
          {label}
        </button>
        <button
          type="button"
          aria-label="删除资料"
          onClick={onDelete}
          className="text-[12px] text-mist opacity-0 hover:text-red-700 group-hover:opacity-100 group-focus-within:opacity-100"
        >
          删
        </button>
      </div>
    </div>
  );
}

function NotePage({
  note,
  locales,
  onBack,
  onChange,
  onDelete,
}: {
  note: Note;
  locales: boolean;
  onBack: () => void;
  onChange: (patch: Partial<Note>) => void;
  onDelete: () => void;
}) {
  return (
    <div>
      <div className="mb-8 flex items-center gap-4 text-[13px] text-mist">
        <button type="button" onClick={onBack} className="hover:text-ink">
          ←
        </button>
        <button type="button" onClick={() => onChange({ is_pinned: !note.is_pinned })}>
          {note.is_pinned ? "已置顶" : "置顶"}
        </button>
        <button type="button" onClick={() => onChange({ is_published: !note.is_published })}>
          {note.is_published ? "公开" : "草稿"}
        </button>
        <button type="button" onClick={onDelete} className="ml-auto text-red-700">
          删除
        </button>
      </div>
      <Line
        value={note.title}
        label="笔记标题"
        placeholder="标题"
        onChange={(value) => onChange({ title: value })}
        className="text-[34px] font-semibold tracking-[-0.03em] text-ink sm:text-[42px]"
      />
      {locales ? (
        <LocaleLines
          en={note.title_en}
          ja={note.title_ja}
          onEn={(value) => onChange({ title_en: value || null })}
          onJa={(value) => onChange({ title_ja: value || null })}
        />
      ) : null}
      <Line
        multiline
        value={note.content ?? ""}
        label="笔记正文"
        placeholder="开始写"
        onChange={(value) => onChange({ content: value || null })}
        className="mt-8 min-h-40 text-[17px] leading-[1.75] text-ink/85"
      />
      {locales ? (
        <>
          <Line
            multiline
            value={note.content_en ?? ""}
            label="笔记 English"
            placeholder="English"
            onChange={(value) => onChange({ content_en: value || null })}
            className="mt-4 text-[15px] leading-relaxed text-mist"
          />
          <Line
            multiline
            value={note.content_ja ?? ""}
            label="笔记 日本語"
            placeholder="日本語"
            onChange={(value) => onChange({ content_ja: value || null })}
            className="mt-2 text-[15px] leading-relaxed text-mist"
          />
        </>
      ) : null}
    </div>
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
