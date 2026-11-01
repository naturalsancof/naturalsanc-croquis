"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { commitStudio, deletePursuitById } from "@/app/admin/actions";
import { Sortable } from "@/components/admin/sortable";
import { Btn, Field, Input, Select, Textarea } from "@/components/admin/ui";
import { ACCENT_HEX, STAGES } from "@/lib/display";
import type { CommitResult } from "@/lib/studio";
import {
  adoptIds,
  diffStudio,
  markSaved,
  rememberInserts,
  type StudioSnapshot,
} from "@/lib/studio-diff";
import { uploadMediaFile } from "@/lib/upload-media";
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

type Status =
  | { kind: "saved"; warning?: string }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "error"; message: string };

const fieldCls = "text-base sm:text-sm";

function tempId() {
  return `tmp_${crypto.randomUUID()}`;
}

function orderRows<T extends { id: string; sort_order: number }>(rows: T[], ids: string[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id, index) => ({ ...byId.get(id)!, sort_order: index + 1 }));
}

export function StudioEditor({
  initial,
  initialError,
}: {
  initial: StudioSnapshot;
  initialError?: string;
}) {
  const router = useRouter();
  const dataRef = useRef(initial);
  const savedRef = useRef(structuredClone(initial));
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<Status>(
    initialError === "upload"
      ? { kind: "error", message: "追求已创建，但封面没传上去。可以在下面再传一次。" }
      : { kind: "saved" },
  );
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const flushing = useRef(false);
  const again = useRef(false);
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const flush = useCallback(async function flushSaved() {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (flushing.current) {
      again.current = true;
      return;
    }

    const sent = structuredClone(dataRef.current);
    const { changes, issues, skipped } = diffStudio(savedRef.current, sent);
    if (changes.length === 0) {
      setStatus(issues[0] ? { kind: "error", message: issues[0] } : { kind: "saved" });
      return;
    }

    flushing.current = true;
    setStatus({ kind: "saving" });

    let res: CommitResult;
    try {
      res = await commitStudio(initial.pursuit.id, changes);
    } catch {
      flushing.current = false;
      setStatus({ kind: "error", message: "网络异常，没有保存。你输入的内容还在，可以重试。" });
      return;
    }

    if (res.created.length) {
      dataRef.current = adoptIds(dataRef.current, res.created);
      setData(dataRef.current);
      setOpenNote((current) => {
        const mapped = res.created.find((item) => item.key === current);
        return mapped?.id ?? current;
      });
    }

    if (!res.ok) {
      if (res.created.length) {
        savedRef.current = rememberInserts(savedRef.current, sent, res.created);
      }
      flushing.current = false;
      setStatus({ kind: "error", message: res.error ?? "没有保存成功。" });
      return;
    }

    savedRef.current = markSaved(savedRef.current, sent, skipped, res.created);
    flushing.current = false;

    if (again.current) {
      again.current = false;
      await flushRef.current();
      return;
    }

    const pending = diffStudio(savedRef.current, dataRef.current).issues[0];
    if (res.warning) setStatus({ kind: "saved", warning: res.warning });
    else if (pending) setStatus({ kind: "error", message: pending });
    else setStatus({ kind: "saved" });
  }, [initial.pursuit.id]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (status.kind === "dirty" || status.kind === "saving" || status.kind === "error") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush, status.kind]);

  function write(next: StudioSnapshot, mode: "debounce" | "now" | "local") {
    dataRef.current = next;
    setData(next);
    if (mode === "local") return;
    if (timer.current) window.clearTimeout(timer.current);
    setStatus({ kind: "dirty" });
    if (mode === "now") {
      void flush();
      return;
    }
    timer.current = window.setTimeout(() => void flush(), 700);
  }

  function patchPursuit(patch: Partial<Pursuit>, mode: "debounce" | "now" = "debounce") {
    write({ ...dataRef.current, pursuit: { ...dataRef.current.pursuit, ...patch } }, mode);
  }

  function patchRow(
    key: "milestones" | "works" | "notes" | "materials",
    id: string,
    patch: object,
    mode: "debounce" | "now" = "debounce",
  ) {
    const current = dataRef.current;
    write(
      {
        ...current,
        [key]: current[key].map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      },
      mode,
    );
  }

  async function pickFile(file: File | undefined, apply: (url: string) => void) {
    if (!file) return;
    setUploadLabel(file.type.startsWith("image/") ? "正在压缩并上传…" : "正在上传…");
    try {
      const url = await uploadMediaFile(file, initial.pursuit.id);
      apply(url);
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "上传失败。",
      });
    } finally {
      setUploadLabel(null);
    }
  }

  async function removePursuit() {
    if (!window.confirm("删除这个追求？作品、笔记、资料会一起删掉，不能撤销。")) return;
    await flush();
    if (diffStudio(savedRef.current, dataRef.current).changes.length > 0) {
      setStatus({
        kind: "error",
        message: "还有没保存的修改。先处理上面的错误，再删除。",
      });
      return;
    }
    const res = await deletePursuitById(initial.pursuit.id);
    if (!res.ok) {
      setStatus({ kind: "error", message: res.error });
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  const { pursuit } = data;

  return (
    <div className="pb-24">
      <div className="sticky top-16 z-40 -mx-5 mb-6 border-b border-[var(--line)] bg-[rgb(247_242_246_/_0.86)] px-5 py-3 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin"
            className="rounded-full px-2 py-2 text-[12px] text-mist hover:text-ink"
          >
            ← 全部
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-ink">
              {pursuit.title || "未命名追求"}
            </h1>
            <SaveStatus status={status} uploadLabel={uploadLabel} onRetry={() => void flush()} />
          </div>
          <a
            href={`/pursuits/${pursuit.slug}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-[var(--line)] px-3 py-2 text-[12px] text-mist hover:text-ink"
          >
            预览
          </a>
          <button
            type="button"
            role="switch"
            aria-checked={pursuit.is_published}
            onClick={() => patchPursuit({ is_published: !pursuit.is_published }, "now")}
            className={`rounded-full px-4 py-2 text-[12px] ${
              pursuit.is_published
                ? "bg-ink text-white"
                : "border border-[var(--line)] text-mist"
            }`}
          >
            {pursuit.is_published ? "已发布" : "草稿 · 点此发布"}
          </button>
        </div>
        <nav aria-label="编辑分区" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {[
            ["#basic", "基本"],
            ["#milestones", "里程碑"],
            ["#works", "作品"],
            ["#notes", "笔记"],
            ["#links", "资料"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 rounded-full bg-white/70 px-3 py-1.5 text-[12px] text-ink/80"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>

      <div className="space-y-10">
        <section id="basic" className="scroll-mt-36">
          <SectionTitle index="01" title="基本信息" />
          <div className="panel-solid space-y-5 p-4 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="标题" hint="中文">
                <Input
                  className={fieldCls}
                  value={pursuit.title}
                  aria-invalid={!pursuit.title.trim()}
                  onChange={(event) => patchPursuit({ title: event.target.value })}
                />
              </Field>
              <Field label="English">
                <Input
                  className={fieldCls}
                  value={pursuit.title_en ?? ""}
                  onChange={(event) => patchPursuit({ title_en: event.target.value || null })}
                />
              </Field>
              <Field label="日本語">
                <Input
                  className={fieldCls}
                  value={pursuit.title_ja ?? ""}
                  onChange={(event) => patchPursuit({ title_ja: event.target.value || null })}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="简介" hint="中文">
                <Input
                  className={fieldCls}
                  value={pursuit.subtitle ?? ""}
                  onChange={(event) => patchPursuit({ subtitle: event.target.value || null })}
                />
              </Field>
              <Field label="English">
                <Input
                  className={fieldCls}
                  value={pursuit.subtitle_en ?? ""}
                  onChange={(event) =>
                    patchPursuit({ subtitle_en: event.target.value || null })
                  }
                />
              </Field>
              <Field label="日本語">
                <Input
                  className={fieldCls}
                  value={pursuit.subtitle_ja ?? ""}
                  onChange={(event) =>
                    patchPursuit({ subtitle_ja: event.target.value || null })
                  }
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="详细说明" hint="中文">
                <Textarea
                  className={fieldCls}
                  value={pursuit.description ?? ""}
                  onChange={(event) =>
                    patchPursuit({ description: event.target.value || null })
                  }
                />
              </Field>
              <Field label="English">
                <Textarea
                  className={fieldCls}
                  value={pursuit.description_en ?? ""}
                  onChange={(event) =>
                    patchPursuit({ description_en: event.target.value || null })
                  }
                />
              </Field>
              <Field label="日本語">
                <Textarea
                  className={fieldCls}
                  value={pursuit.description_ja ?? ""}
                  onChange={(event) =>
                    patchPursuit({ description_ja: event.target.value || null })
                  }
                />
              </Field>
            </div>

            <fieldset>
              <legend className="mb-2 text-[12px] text-mist">阶段</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STAGES.map((stage) => (
                  <button
                    key={stage.key}
                    type="button"
                    aria-pressed={pursuit.stage === stage.key}
                    onClick={() => patchPursuit({ stage: stage.key as Stage }, "now")}
                    className={`rounded-2xl border px-2 py-3 text-center ${
                      pursuit.stage === stage.key
                        ? "border-cyan/50 bg-cyan/10 text-ink"
                        : "border-[var(--line)] text-mist"
                    }`}
                  >
                    <span className="block text-[13px]">{stage.zh}</span>
                    <span className="mt-0.5 block font-display text-[8px] tracking-[0.14em]">
                      {stage.en}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="阶段说明" hint="中文">
                <Textarea
                  className={fieldCls}
                  value={pursuit.progress_note ?? ""}
                  onChange={(event) =>
                    patchPursuit({ progress_note: event.target.value || null })
                  }
                />
              </Field>
              <Field label="English">
                <Textarea
                  className={fieldCls}
                  value={pursuit.progress_note_en ?? ""}
                  onChange={(event) =>
                    patchPursuit({ progress_note_en: event.target.value || null })
                  }
                />
              </Field>
              <Field label="日本語">
                <Textarea
                  className={fieldCls}
                  value={pursuit.progress_note_ja ?? ""}
                  onChange={(event) =>
                    patchPursuit({ progress_note_ja: event.target.value || null })
                  }
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="网址片段">
                <Input
                  className={fieldCls}
                  value={pursuit.slug}
                  onChange={(event) => patchPursuit({ slug: event.target.value })}
                />
              </Field>
              <Field label="开始日期">
                <Input
                  className={fieldCls}
                  type="date"
                  value={pursuit.started_at ?? ""}
                  onChange={(event) =>
                    patchPursuit({ started_at: event.target.value || null })
                  }
                />
              </Field>
              <Field label="主色">
                <div className="flex gap-2 pt-1">
                  {(Object.keys(ACCENT_HEX) as Accent[]).map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      aria-label={accent}
                      aria-pressed={pursuit.accent === accent}
                      onClick={() => patchPursuit({ accent }, "now")}
                      className="h-9 w-9 rounded-full"
                      style={{
                        background: ACCENT_HEX[accent],
                        outline:
                          pursuit.accent === accent ? "2px solid #141419" : "2px solid transparent",
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-center">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/70">
                {pursuit.cover_url ? (
                  <SafeImage src={pursuit.cover_url} alt={`${pursuit.title} 的封面`} sizes="180px" />
                ) : (
                  <div className="grid h-full place-items-center text-[12px] text-mist">
                    还没有封面
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Field label="封面地址" hint="也可以直接上传">
                  <Input
                    className={fieldCls}
                    value={pursuit.cover_url ?? ""}
                    onChange={(event) =>
                      patchPursuit({ cover_url: event.target.value || null })
                    }
                  />
                </Field>
                <Field label="上传封面" hint="大图会先在浏览器里压小，再直接传到存储">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                    disabled={!!uploadLabel}
                    className="block w-full text-[12px] text-mist"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      void pickFile(file, (url) => patchPursuit({ cover_url: url }, "now"));
                    }}
                  />
                </Field>
              </div>
            </div>
          </div>
        </section>

        <section id="milestones" className="scroll-mt-36">
          <SectionTitle
            index="02"
            title="里程碑"
            action={
              <Btn
                type="button"
                onClick={() => {
                  const id = tempId();
                  write(
                    {
                      ...dataRef.current,
                      milestones: [
                        ...dataRef.current.milestones,
                        {
                          id,
                          pursuit_id: pursuit.id,
                          title: "新的里程碑",
                          title_en: null,
                          title_ja: null,
                          done: false,
                          sort_order: dataRef.current.milestones.length + 1,
                          created_at: new Date().toISOString(),
                        },
                      ],
                    },
                    "now",
                  );
                }}
              >
                添加
              </Btn>
            }
          />
          {data.milestones.length === 0 ? (
            <Empty text="还没有里程碑。点「添加」放上第一条。" />
          ) : (
            <Sortable
              items={data.milestones.map((row) => ({
                id: row.id,
                node: (
                  <MilestoneRow
                    row={row}
                    onChange={(patch) => patchRow("milestones", row.id, patch)}
                    onDelete={() => removeRow("milestones", row.id)}
                    onMove={(dir) => moveRow("milestones", row.id, dir)}
                  />
                ),
              }))}
              onReorder={(ids, phase) =>
                write(
                  { ...dataRef.current, milestones: orderRows(dataRef.current.milestones, ids) },
                  phase === "commit" ? "now" : "local",
                )
              }
            />
          )}
        </section>

        <section id="works" className="scroll-mt-36">
          <SectionTitle index="03" title="作品" />
          {data.works.length === 0 ? (
            <Empty text="还没有作品。上传一张图、一段音频，或贴一个链接。" />
          ) : (
            <Sortable
              grid
              items={data.works.map((row) => ({
                id: row.id,
                node: (
                  <WorkCard
                    row={row}
                    busy={!!uploadLabel}
                    onChange={(patch, mode) => patchRow("works", row.id, patch, mode)}
                    onDelete={() => removeRow("works", row.id)}
                    onMove={(dir) => moveRow("works", row.id, dir)}
                    onFile={(file, slot) =>
                      void pickFile(file, (url) =>
                        patchRow(
                          "works",
                          row.id,
                          slot === "poster" ? { poster_url: url } : { media_url: url },
                          "now",
                        ),
                      )
                    }
                  />
                ),
              }))}
              onReorder={(ids, phase) =>
                write(
                  { ...dataRef.current, works: orderRows(dataRef.current.works, ids) },
                  phase === "commit" ? "now" : "local",
                )
              }
            />
          )}
          <AddWork
            disabled={!!uploadLabel}
            onCreate={(row) =>
              write(
                {
                  ...dataRef.current,
                  works: [
                    ...dataRef.current.works,
                    {
                      ...row,
                      pursuit_id: pursuit.id,
                      sort_order: dataRef.current.works.length + 1,
                    },
                  ],
                },
                "now",
              )
            }
            onFile={(file, kind) =>
              void pickFile(file, (url) => {
                const id = tempId();
                write(
                  {
                    ...dataRef.current,
                    works: [
                      ...dataRef.current.works,
                      emptyWork(id, pursuit.id, dataRef.current.works.length + 1, kind, url),
                    ],
                  },
                  "now",
                );
              })
            }
          />
        </section>

        <section id="notes" className="scroll-mt-36">
          <SectionTitle
            index="04"
            title="笔记"
            action={
              <Btn
                type="button"
                onClick={() => {
                  const id = tempId();
                  const note: Note = {
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
                  write({ ...dataRef.current, notes: [note, ...dataRef.current.notes] }, "local");
                  setOpenNote(id);
                }}
              >
                新建一篇
              </Btn>
            }
          />
          <div className="space-y-3">
            {data.notes.length === 0 ? <Empty text="还没有笔记。" /> : null}
            {data.notes.map((note) =>
              openNote === note.id ? (
                <NoteSheet
                  key={note.id}
                  note={note}
                  onChange={(patch) => patchRow("notes", note.id, patch)}
                  onClose={() => setOpenNote(null)}
                  onDelete={() => {
                    removeRow("notes", note.id);
                    setOpenNote(null);
                  }}
                />
              ) : (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setOpenNote(note.id)}
                  className="block w-full rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-4 text-left"
                >
                  <span className="block truncate text-[16px] text-ink">
                    {note.title || "无标题笔记"}
                  </span>
                  <span className="mt-1 block truncate text-[12px] text-mist">
                    {[note.title_en, note.title_ja].filter(Boolean).join(" · ") ||
                      note.content ||
                      "（空白）"}
                  </span>
                </button>
              ),
            )}
          </div>
        </section>

        <section id="links" className="scroll-mt-36">
          <SectionTitle
            index="05"
            title="资料"
            action={
              <Btn
                type="button"
                onClick={() => {
                  const row: MaterialLink = {
                    id: tempId(),
                    pursuit_id: pursuit.id,
                    title: "未命名链接",
                    title_en: null,
                    title_ja: null,
                    url: "",
                    kind: "article",
                    description: null,
                    description_en: null,
                    description_ja: null,
                    sort_order: dataRef.current.materials.length + 1,
                    created_at: new Date().toISOString(),
                  };
                  write(
                    { ...dataRef.current, materials: [...dataRef.current.materials, row] },
                    "local",
                  );
                }}
              >
                添加
              </Btn>
            }
          />
          {data.materials.length === 0 ? (
            <Empty text="还没有资料链接。" />
          ) : (
            <Sortable
              items={data.materials.map((row) => ({
                id: row.id,
                node: (
                  <MaterialRow
                    row={row}
                    onChange={(patch) => patchRow("materials", row.id, patch)}
                    onDelete={() => removeRow("materials", row.id)}
                    onMove={(dir) => moveRow("materials", row.id, dir)}
                  />
                ),
              }))}
              onReorder={(ids, phase) =>
                write(
                  {
                    ...dataRef.current,
                    materials: orderRows(dataRef.current.materials, ids),
                  },
                  phase === "commit" ? "now" : "local",
                )
              }
            />
          )}
        </section>

        <div className="border-t border-[var(--line)] pt-6">
          <button
            type="button"
            onClick={() => void removePursuit()}
            className="text-[12px] text-red-700/80 underline-offset-2 hover:underline"
          >
            删除这个追求
          </button>
        </div>
      </div>
    </div>
  );

  function removeRow(key: "milestones" | "works" | "notes" | "materials", id: string) {
    if (!window.confirm("删除这一条？不能撤销。")) return;
    write(
      { ...dataRef.current, [key]: dataRef.current[key].filter((row) => row.id !== id) },
      "now",
    );
  }

  function moveRow(
    key: "milestones" | "works" | "materials",
    id: string,
    dir: -1 | 1,
  ) {
    const rows = [...dataRef.current[key]];
    const index = rows.findIndex((row) => row.id === id);
    const next = index + dir;
    if (index < 0 || next < 0 || next >= rows.length) return;
    const [item] = rows.splice(index, 1);
    rows.splice(next, 0, item);
    write({ ...dataRef.current, [key]: orderRows(rows, rows.map((row) => row.id)) }, "now");
  }
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
      // External covers are not in the image allow-list.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />;
}

function SaveStatus({
  status,
  uploadLabel,
  onRetry,
}: {
  status: Status;
  uploadLabel: string | null;
  onRetry: () => void;
}) {
  const text =
    uploadLabel ??
    (status.kind === "saving"
      ? "保存中…"
      : status.kind === "dirty"
        ? "有未保存的修改…"
        : status.kind === "error"
          ? status.message
          : status.warning
            ? `已保存。${status.warning}`
            : "已保存");
  const tone =
    status.kind === "error" ? "text-red-700" : status.kind === "saved" && status.warning ? "text-amber-800" : "text-mist";

  return (
    <p role="status" aria-live="polite" className={`truncate text-[12px] ${tone}`}>
      {text}
      {status.kind === "error" ? (
        <button type="button" onClick={onRetry} className="ml-2 underline">
          重试
        </button>
      ) : null}
    </p>
  );
}

function SectionTitle({
  index,
  title,
  action,
}: {
  index: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-baseline gap-2 text-[15px] text-ink">
        <span className="font-display text-[10px] tracking-[0.2em] text-mist">{index}</span>
        {title}
      </h2>
      {action}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-[13px] text-mist">
      {text}
    </p>
  );
}

function MilestoneRow({
  row,
  onChange,
  onDelete,
  onMove,
}: {
  row: Milestone;
  onChange: (patch: Partial<Milestone>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/70 py-3 pl-12 pr-3">
      <div className="flex flex-wrap items-start gap-3">
        <input
          type="checkbox"
          checked={row.done}
          aria-label="已完成"
          onChange={(event) => onChange({ done: event.target.checked })}
          className="mt-2 h-5 w-5 accent-[#2e7f8a]"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            className={fieldCls}
            aria-label="里程碑标题"
            value={row.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              className={fieldCls}
              aria-label="里程碑 English"
              placeholder="English"
              value={row.title_en ?? ""}
              onChange={(event) => onChange({ title_en: event.target.value || null })}
            />
            <Input
              className={fieldCls}
              aria-label="里程碑 日本語"
              placeholder="日本語"
              value={row.title_ja ?? ""}
              onChange={(event) => onChange({ title_ja: event.target.value || null })}
            />
          </div>
        </div>
        <RowTools onDelete={onDelete} onMove={onMove} />
      </div>
    </div>
  );
}

function WorkCard({
  row,
  busy,
  onChange,
  onDelete,
  onMove,
  onFile,
}: {
  row: PortfolioItem;
  busy: boolean;
  onChange: (patch: Partial<PortfolioItem>, mode?: "debounce" | "now") => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onFile: (file: File, slot: "media" | "poster") => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-3 pl-12">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-[#101014]">
        {row.kind === "image" && row.media_url ? (
          <SafeImage src={row.media_url} alt={row.title || "作品"} sizes="320px" />
        ) : (
          <div className="grid h-full place-items-center text-2xl text-white/70" aria-hidden>
            ♫
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Select
          aria-label="作品类型"
          className={fieldCls}
          value={row.kind}
          onChange={(event) => onChange({ kind: event.target.value as MediaKind }, "now")}
        >
          <option value="image">图片</option>
          <option value="audio">音频</option>
        </Select>
        <Input
          aria-label="作品标题"
          className={fieldCls}
          placeholder="标题"
          value={row.title ?? ""}
          onChange={(event) => onChange({ title: event.target.value || null })}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            aria-label="作品 English"
            className={fieldCls}
            placeholder="English"
            value={row.title_en ?? ""}
            onChange={(event) => onChange({ title_en: event.target.value || null })}
          />
          <Input
            aria-label="作品 日本語"
            className={fieldCls}
            placeholder="日本語"
            value={row.title_ja ?? ""}
            onChange={(event) => onChange({ title_ja: event.target.value || null })}
          />
        </div>
        <Input
          aria-label="作品说明"
          className={fieldCls}
          placeholder="说明"
          value={row.description ?? ""}
          onChange={(event) => onChange({ description: event.target.value || null })}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            aria-label="说明 English"
            className={fieldCls}
            placeholder="EN"
            value={row.description_en ?? ""}
            onChange={(event) => onChange({ description_en: event.target.value || null })}
          />
          <Input
            aria-label="说明 日本語"
            className={fieldCls}
            placeholder="日"
            value={row.description_ja ?? ""}
            onChange={(event) => onChange({ description_ja: event.target.value || null })}
          />
        </div>
        <Input
          aria-label="作品地址"
          className={fieldCls}
          placeholder="https://… 或 /demo/…"
          value={row.media_url}
          onChange={(event) => onChange({ media_url: event.target.value })}
        />
        <label className="block text-[12px] text-mist">
          更换文件
          <input
            type="file"
            accept="image/*,audio/*"
            disabled={busy}
            className="mt-1 block w-full"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) onFile(file, "media");
            }}
          />
        </label>
        {row.kind === "audio" ? (
          <>
            <Input
              aria-label="海报地址"
              className={fieldCls}
              placeholder="海报地址"
              value={row.poster_url ?? ""}
              onChange={(event) => onChange({ poster_url: event.target.value || null })}
            />
            <label className="block text-[12px] text-mist">
              上传海报
              <input
                type="file"
                accept="image/*"
                disabled={busy}
                className="mt-1 block w-full"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) onFile(file, "poster");
                }}
              />
            </label>
            <Input
              aria-label="时长（秒）"
              className={fieldCls}
              type="number"
              min={0}
              placeholder="时长（秒）"
              value={row.duration_seconds ?? ""}
              onChange={(event) =>
                onChange({
                  duration_seconds: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </>
        ) : null}
        <RowTools onDelete={onDelete} onMove={onMove} />
      </div>
    </div>
  );
}

function AddWork({
  disabled,
  onCreate,
  onFile,
}: {
  disabled: boolean;
  onCreate: (row: PortfolioItem) => void;
  onFile: (file: File, kind: MediaKind) => void;
}) {
  const [kind, setKind] = useState<MediaKind>("image");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");

  return (
    <form
      className="mt-4 rounded-2xl border border-dashed border-[var(--line)] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!url.trim()) {
          setMessage("先贴一个链接，或在下面选择文件。");
          return;
        }
        onCreate(emptyWork(tempId(), "", 0, kind, url.trim(), title));
        setTitle("");
        setUrl("");
        setMessage("");
      }}
    >
      <p className="text-[13px] text-ink">添加作品</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[120px_1fr_1fr_auto] sm:items-end">
        <Field label="类型">
          <Select
            className={fieldCls}
            value={kind}
            onChange={(event) => setKind(event.target.value as MediaKind)}
          >
            <option value="image">图片</option>
            <option value="audio">音频</option>
          </Select>
        </Field>
        <Field label="标题" hint="可后补">
          <Input className={fieldCls} value={title} onChange={(event) => setTitle(event.target.value)} />
        </Field>
        <Field label="链接" hint="和文件二选一，或都填">
          <Input
            className={fieldCls}
            value={url}
            placeholder="https://…"
            onChange={(event) => setUrl(event.target.value)}
          />
        </Field>
        <Btn type="submit">用链接添加</Btn>
      </div>
      <label className="mt-3 block text-[12px] text-mist">
        或上传文件（图片会先压缩，音视频直接传到存储，不经过网页服务器）
        <input
          type="file"
          accept="image/*,audio/*"
          disabled={disabled}
          className="mt-1 block w-full"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const nextKind: MediaKind = file.type.startsWith("audio/") ? "audio" : kind;
            onFile(file, nextKind);
            setMessage("");
          }}
        />
      </label>
      {message ? <p className="mt-2 text-[12px] text-red-700">{message}</p> : null}
    </form>
  );
}

function emptyWork(
  id: string,
  pursuitId: string,
  sortOrder: number,
  kind: MediaKind,
  mediaUrl: string,
  title = "",
): PortfolioItem {
  return {
    id,
    pursuit_id: pursuitId,
    kind,
    title: title || null,
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

function NoteSheet({
  note,
  onChange,
  onClose,
  onDelete,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-3xl bg-white px-4 py-5 shadow-[0_24px_50px_-40px_rgba(20,20,25,0.45)] sm:px-8">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onClose} className="text-[12px] text-mist hover:text-ink">
          ← 收起
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-ink px-4 py-1.5 text-[12px] text-white"
        >
          完成
        </button>
      </div>
      <Input
        type="date"
        aria-label="笔记日期"
        className={`${fieldCls} mt-5 max-w-[11rem]`}
        value={note.note_date}
        onChange={(event) => onChange({ note_date: event.target.value })}
      />
      <input
        aria-label="笔记标题"
        value={note.title}
        placeholder="标题"
        onChange={(event) => onChange({ title: event.target.value })}
        className="mt-3 w-full border-0 bg-transparent text-[28px] font-semibold text-ink outline-none placeholder:text-mist/40 sm:text-[34px]"
      />
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <Input
          aria-label="笔记 English"
          className={fieldCls}
          placeholder="English"
          value={note.title_en ?? ""}
          onChange={(event) => onChange({ title_en: event.target.value || null })}
        />
        <Input
          aria-label="笔记 日本語"
          className={fieldCls}
          placeholder="日本語"
          value={note.title_ja ?? ""}
          onChange={(event) => onChange({ title_ja: event.target.value || null })}
        />
      </div>
      <Textarea
        aria-label="正文"
        className={`${fieldCls} mt-4 min-h-40`}
        placeholder="开始写……"
        value={note.content ?? ""}
        onChange={(event) => onChange({ content: event.target.value || null })}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="正文 English">
          <Textarea
            className={fieldCls}
            value={note.content_en ?? ""}
            onChange={(event) => onChange({ content_en: event.target.value || null })}
          />
        </Field>
        <Field label="正文 日本語">
          <Textarea
            className={fieldCls}
            value={note.content_ja ?? ""}
            onChange={(event) => onChange({ content_ja: event.target.value || null })}
          />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px] text-mist">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={note.is_pinned}
            onChange={(event) => onChange({ is_pinned: event.target.checked })}
          />
          置顶
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={note.is_published}
            onChange={(event) => onChange({ is_published: event.target.checked })}
          />
          公开
        </label>
        <button type="button" onClick={onDelete} className="ml-auto text-[12px] text-red-700">
          删除这篇笔记
        </button>
      </div>
    </div>
  );
}

function MaterialRow({
  row,
  onChange,
  onDelete,
  onMove,
}: {
  row: MaterialLink;
  onChange: (patch: Partial<MaterialLink>) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-[var(--line)] bg-white/70 py-3 pl-12 pr-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_120px]">
        <Input
          aria-label="资料标题"
          className={fieldCls}
          placeholder="标题"
          value={row.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <Input
          aria-label="资料 English"
          className={fieldCls}
          placeholder="English"
          value={row.title_en ?? ""}
          onChange={(event) => onChange({ title_en: event.target.value || null })}
        />
        <Input
          aria-label="资料 日本語"
          className={fieldCls}
          placeholder="日本語"
          value={row.title_ja ?? ""}
          onChange={(event) => onChange({ title_ja: event.target.value || null })}
        />
        <Select
          aria-label="资料类型"
          className={fieldCls}
          value={row.kind}
          onChange={(event) => onChange({ kind: event.target.value as MaterialKind })}
        >
          {KINDS.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </Select>
      </div>
      <Input
        aria-label="资料网址"
        className={fieldCls}
        placeholder="https://…"
        value={row.url}
        aria-invalid={!row.url.trim()}
        onChange={(event) => onChange({ url: event.target.value })}
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          aria-label="资料说明"
          className={fieldCls}
          placeholder="一句说明"
          value={row.description ?? ""}
          onChange={(event) => onChange({ description: event.target.value || null })}
        />
        <Input
          aria-label="说明 English"
          className={fieldCls}
          placeholder="EN"
          value={row.description_en ?? ""}
          onChange={(event) => onChange({ description_en: event.target.value || null })}
        />
        <Input
          aria-label="说明 日本語"
          className={fieldCls}
          placeholder="日"
          value={row.description_ja ?? ""}
          onChange={(event) => onChange({ description_ja: event.target.value || null })}
        />
      </div>
      <RowTools onDelete={onDelete} onMove={onMove} />
    </div>
  );
}

function RowTools({
  onDelete,
  onMove,
}: {
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="rounded-lg border border-[var(--line)] px-2 py-1 text-[12px]" onClick={() => onMove(-1)}>
        上移
      </button>
      <button type="button" className="rounded-lg border border-[var(--line)] px-2 py-1 text-[12px]" onClick={() => onMove(1)}>
        下移
      </button>
      <button type="button" className="rounded-lg border border-red-200 px-2 py-1 text-[12px] text-red-700" onClick={onDelete}>
        删除
      </button>
    </div>
  );
}
