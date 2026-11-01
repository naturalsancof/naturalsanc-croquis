"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { storagePathFromUrl } from "@/lib/media-path";
import type {
  CommitResult,
  CreatedRow,
  PursuitPatch,
  StudioChange,
} from "@/lib/studio";
import { assertStudioAdmin } from "@/lib/supabase/session";
import { supabaseServer } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient;

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STAGES = new Set(["exploring", "building", "polishing", "shipped"]);
const ACCENTS = new Set(["cyan", "magenta", "violet", "lime", "amber"]);
const MEDIA_KINDS = new Set(["image", "audio"]);
const MATERIAL_KINDS = new Set([
  "article",
  "course",
  "book",
  "tool",
  "video",
  "other",
]);
const REORDER_TABLES = new Set([
  "milestones",
  "portfolio_items",
  "materials_and_links",
]);
const ALLOWED_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
  "mp3",
  "wav",
  "m4a",
  "aac",
  "ogg",
  "webm",
  "flac",
]);

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function empty(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function clip(value: string | null, max: number, label: string): string | null {
  if (value && value.length > max) {
    throw new Error(`${label}太长了（最多 ${max} 字）。`);
  }
  return value;
}

function asInt(value: unknown, fallback = 0) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100000, Math.round(n)));
}

function safeUrl(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label}不能为空。`);
  if (trimmed.length > 2000) throw new Error(`${label}太长了。`);
  if (/^\s*javascript:/i.test(trimmed)) throw new Error(`${label}不合法。`);
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return trimmed;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`${label}需要是 http(s) 链接，或以 / 开头的站内路径。`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${label}不合法。`);
  }
  return trimmed;
}

function fail(error: { message: string } | null, fallback: string) {
  if (!error) return null;
  return `${fallback}：${error.message}`;
}

/* ---------------------------------- auth ---------------------------------- */

export async function signIn(fd: FormData) {
  const email = str(fd, "email");
  const password = str(fd, "password");
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function changePassword(fd: FormData) {
  const gate = await assertStudioAdmin();
  if (!gate.ok) redirect("/admin/login");

  const password = str(fd, "password");
  const confirm = str(fd, "confirm");
  if (password.length < 8) redirect("/admin/account?error=short");
  if (password !== confirm) redirect("/admin/account?error=mismatch");

  const { error } = await gate.supabase.auth.updateUser({ password });
  if (error) redirect("/admin/account?error=failed");
  redirect("/admin/account?saved=1");
}

/* --------------------------------- create --------------------------------- */

export type CreateResult = { error?: string; id?: string };

export async function createPursuit(
  _prev: CreateResult,
  fd: FormData,
): Promise<CreateResult> {
  const gate = await assertStudioAdmin();
  if (!gate.ok) return { error: "create" };
  const supabase = gate.supabase;

  const title = str(fd, "title") || "未命名追求";
  const rawSlug = str(fd, "slug") || title;
  const slug =
    rawSlug
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || `pursuit-${Date.now().toString(36)}`;

  const { data: maxRow, error: maxError } = await supabase
    .from("pursuits")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxError) return { error: "create" };

  const { data, error } = await supabase
    .from("pursuits")
    .insert({
      slug,
      title,
      stage: "exploring",
      accent: "cyan",
      sort_order: (maxRow?.sort_order ?? 0) + 1,
      is_published: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.code === "23505" ? "slug-taken" : "create" };
  }

  revalidatePath("/");
  revalidatePath("/pursuits");
  return { id: data.id };
}

/* --------------------------------- upload --------------------------------- */

export async function prepareSignedUpload(input: {
  pursuitId: string;
  filename: string;
  contentType: string;
}): Promise<{ ok: true; path: string; token: string } | { ok: false; error: string }> {
  const gate = await assertStudioAdmin();
  if (!gate.ok) return gate;

  if (!UUID.test(input.pursuitId)) {
    return { ok: false, error: "找不到这个追求。" };
  }

  const { data: pursuit, error: pursuitError } = await gate.supabase
    .from("pursuits")
    .select("id")
    .eq("id", input.pursuitId)
    .maybeSingle();
  if (pursuitError) {
    return { ok: false, error: `无法准备上传：${pursuitError.message}` };
  }
  if (!pursuit) return { ok: false, error: "找不到这个追求。" };

  const fromName = (input.filename.split(".").pop() || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const ext = ALLOWED_EXT.has(fromName) ? fromName : extFromType(input.contentType);
  if (!ext) {
    return { ok: false, error: "只支持常见的图片（JPG、PNG、WebP、GIF）或音频。" };
  }

  const path = `${input.pursuitId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await gate.supabase.storage
    .from("media")
    .createSignedUploadUrl(path);

  if (error || !data?.token) {
    return { ok: false, error: `无法准备上传：${error?.message ?? "没有拿到上传凭证"}` };
  }

  return { ok: true, path: data.path || path, token: data.token };
}

function extFromType(contentType: string) {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    case "audio/mpeg":
    case "audio/mp3":
      return "mp3";
    case "audio/wav":
    case "audio/x-wav":
      return "wav";
    case "audio/mp4":
    case "audio/aac":
      return "m4a";
    case "audio/ogg":
      return "ogg";
    case "audio/webm":
      return "webm";
    case "audio/flac":
      return "flac";
    default:
      return null;
  }
}

/* --------------------------------- commit --------------------------------- */

export async function commitStudio(
  pursuitId: string,
  changes: StudioChange[],
): Promise<CommitResult> {
  const gate = await assertStudioAdmin();
  if (!gate.ok) return { ok: false, error: gate.error, created: [] };
  if (!UUID.test(pursuitId)) {
    return { ok: false, error: "找不到这个追求。", created: [] };
  }
  if (!Array.isArray(changes) || changes.length > 80) {
    return { ok: false, error: "一次改动太多了，请分开保存。", created: [] };
  }

  const supabase = gate.supabase;
  const created: CreatedRow[] = [];
  const keyToId = new Map<string, string>();
  const warnings: string[] = [];
  let slug: string | null = null;
  let previousSlug: string | null = null;

  try {
    for (const change of changes) {
      const message = await applyChange(
        supabase,
        pursuitId,
        change,
        created,
        keyToId,
        warnings,
        (next, prev) => {
          slug = next;
          if (prev) previousSlug = prev;
        },
      );
      if (message) {
        return { ok: false, error: message, created };
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "没有保存成功。";
    return { ok: false, error: message, created };
  }

  const { data: pursuit, error: slugError } = await supabase
    .from("pursuits")
    .select("slug")
    .eq("id", pursuitId)
    .maybeSingle();
  if (slugError) {
    return {
      ok: false,
      error: `已写入，但没能刷新公开页面：${slugError.message}`,
      created,
    };
  }

  revalidatePath("/");
  revalidatePath("/pursuits");
  const currentSlug = slug ?? pursuit?.slug ?? null;
  if (currentSlug) revalidatePath(`/pursuits/${currentSlug}`);
  if (previousSlug && previousSlug !== currentSlug) {
    revalidatePath(`/pursuits/${previousSlug}`);
  }

  const warning = warnings.filter(Boolean).join(" ");
  return { ok: true, created, warning: warning || undefined };
}

async function applyChange(
  supabase: Client,
  pursuitId: string,
  change: StudioChange,
  created: CreatedRow[],
  keyToId: Map<string, string>,
  warnings: string[],
  onSlug: (next: string, previous: string | null) => void,
): Promise<string | null> {
  switch (change.op) {
    case "pursuit":
      return savePursuitPatch(supabase, pursuitId, change.patch, warnings, onSlug);
    case "milestone.upsert":
      return upsertMilestone(supabase, pursuitId, change.row, change.key, created, keyToId);
    case "milestone.delete":
      return deleteRow(supabase, "milestones", pursuitId, change.id);
    case "work.upsert":
      return upsertWork(supabase, pursuitId, change.row, change.key, created, keyToId, warnings);
    case "work.delete":
      return deleteWork(supabase, pursuitId, change.id, warnings);
    case "note.upsert":
      return upsertNote(supabase, pursuitId, change.row, change.key, created, keyToId);
    case "note.delete":
      return deleteRow(supabase, "notes", pursuitId, change.id);
    case "material.upsert":
      return upsertMaterial(supabase, pursuitId, change.row, change.key, created, keyToId);
    case "material.delete":
      return deleteRow(supabase, "materials_and_links", pursuitId, change.id);
    case "reorder":
      return reorder(supabase, pursuitId, change.table, change.ids, keyToId);
    default:
      return "有一条无法识别的修改。";
  }
}

async function savePursuitPatch(
  supabase: Client,
  pursuitId: string,
  patch: PursuitPatch,
  warnings: string[],
  onSlug: (next: string, previous: string | null) => void,
) {
  const { data: current, error: readError } = await supabase
    .from("pursuits")
    .select("slug, cover_url")
    .eq("id", pursuitId)
    .maybeSingle();
  const readMessage = fail(readError, "读取追求失败");
  if (readMessage) return readMessage;
  if (!current) return "找不到这个追求。";

  const next: Record<string, unknown> = {};
  if ("title" in patch) {
    const title = empty(patch.title);
    if (!title) return "标题不能为空。";
    next.title = clip(title, 200, "标题");
  }
  if ("slug" in patch) {
    const slug = empty(patch.slug);
    if (!slug) return "网址片段不能为空。";
    next.slug = clip(slug, 80, "网址片段");
  }
  for (const key of [
    "title_en",
    "title_ja",
    "subtitle",
    "subtitle_en",
    "subtitle_ja",
    "description",
    "description_en",
    "description_ja",
    "progress_note",
    "progress_note_en",
    "progress_note_ja",
  ] as const) {
    if (key in patch) next[key] = clip(empty(patch[key]), 20000, "文本");
  }
  if ("stage" in patch) {
    if (!STAGES.has(String(patch.stage))) return "阶段不合法。";
    next.stage = patch.stage;
  }
  if ("accent" in patch) {
    if (!ACCENTS.has(String(patch.accent))) return "主色不合法。";
    next.accent = patch.accent;
  }
  if ("started_at" in patch) {
    const started = empty(patch.started_at);
    if (started && !DATE.test(started)) return "开始日期不合法。";
    next.started_at = started;
  }
  if ("sort_order" in patch) next.sort_order = asInt(patch.sort_order);
  if ("is_published" in patch) next.is_published = patch.is_published === true;
  if ("cover_url" in patch) {
    next.cover_url = patch.cover_url ? safeUrl(String(patch.cover_url), "封面地址") : null;
  }

  if (Object.keys(next).length === 0) return null;

  const { error } = await supabase.from("pursuits").update(next).eq("id", pursuitId);
  if (error) {
    return error.code === "23505"
      ? "这个网址片段已经被占用了，换一个。"
      : `基本信息没有保存：${error.message}`;
  }

  if ("slug" in next && typeof next.slug === "string") {
    onSlug(next.slug, current.slug ?? null);
  }
  if ("cover_url" in next && current.cover_url && current.cover_url !== next.cover_url) {
    warnings.push((await releaseMedia(supabase, [current.cover_url])) ?? "");
  }
  return null;
}

async function upsertMilestone(
  supabase: Client,
  pursuitId: string,
  row: Extract<StudioChange, { op: "milestone.upsert" }>["row"],
  key: string | undefined,
  created: CreatedRow[],
  keyToId: Map<string, string>,
) {
  const title = empty(row.title);
  if (!title) return "里程碑标题不能为空。";
  const payload = {
    title: clip(title, 300, "里程碑"),
    title_en: clip(empty(row.title_en), 300, "里程碑英文"),
    title_ja: clip(empty(row.title_ja), 300, "里程碑日文"),
    done: row.done === true,
    sort_order: asInt(row.sort_order),
  };

  if (row.id) {
    if (!UUID.test(row.id)) return "里程碑 id 无效。";
    const { error } = await supabase
      .from("milestones")
      .update(payload)
      .eq("id", row.id)
      .eq("pursuit_id", pursuitId);
    return fail(error, "里程碑没有保存");
  }

  const { data, error } = await supabase
    .from("milestones")
    .insert({ ...payload, pursuit_id: pursuitId })
    .select("id")
    .single();
  if (error || !data) return `里程碑没有添加：${error?.message ?? "未知错误"}`;
  if (key) {
    created.push({ key, id: data.id });
    keyToId.set(key, data.id);
  }
  return null;
}

async function upsertWork(
  supabase: Client,
  pursuitId: string,
  row: Extract<StudioChange, { op: "work.upsert" }>["row"],
  key: string | undefined,
  created: CreatedRow[],
  keyToId: Map<string, string>,
  warnings: string[],
) {
  if (!MEDIA_KINDS.has(row.kind)) return "作品类型不合法。";
  let media: string;
  try {
    media = safeUrl(row.media_url, "作品地址");
  } catch (error) {
    return error instanceof Error ? error.message : "作品地址不合法。";
  }
  const poster = empty(row.poster_url);
  let posterUrl: string | null = null;
  if (poster) {
    try {
      posterUrl = safeUrl(poster, "海报地址");
    } catch (error) {
      return error instanceof Error ? error.message : "海报地址不合法。";
    }
  }
  const duration =
    row.duration_seconds == null ? null : asInt(row.duration_seconds);
  const payload = {
    kind: row.kind,
    title: clip(empty(row.title), 300, "作品标题"),
    title_en: clip(empty(row.title_en), 300, "作品英文标题"),
    title_ja: clip(empty(row.title_ja), 300, "作品日文标题"),
    description: clip(empty(row.description), 4000, "作品说明"),
    description_en: clip(empty(row.description_en), 4000, "作品英文说明"),
    description_ja: clip(empty(row.description_ja), 4000, "作品日文说明"),
    media_url: media,
    poster_url: posterUrl,
    duration_seconds: duration,
    sort_order: asInt(row.sort_order),
  };

  if (row.id) {
    if (!UUID.test(row.id)) return "作品 id 无效。";
    const { data: previous, error: readError } = await supabase
      .from("portfolio_items")
      .select("media_url, poster_url")
      .eq("id", row.id)
      .eq("pursuit_id", pursuitId)
      .maybeSingle();
    const readMessage = fail(readError, "读取作品失败");
    if (readMessage) return readMessage;
    if (!previous) return "找不到这件作品。";

    const { error } = await supabase
      .from("portfolio_items")
      .update(payload)
      .eq("id", row.id)
      .eq("pursuit_id", pursuitId);
    const writeMessage = fail(error, "作品没有保存");
    if (writeMessage) return writeMessage;

    const stale = [
      previous.media_url !== media ? previous.media_url : null,
      previous.poster_url !== posterUrl ? previous.poster_url : null,
    ];
    warnings.push((await releaseMedia(supabase, stale)) ?? "");
    return null;
  }

  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({ ...payload, pursuit_id: pursuitId })
    .select("id")
    .single();
  if (error || !data) return `作品没有添加：${error?.message ?? "未知错误"}`;
  if (key) {
    created.push({ key, id: data.id });
    keyToId.set(key, data.id);
  }
  return null;
}

async function deleteWork(
  supabase: Client,
  pursuitId: string,
  id: string,
  warnings: string[],
) {
  if (!UUID.test(id)) return "作品 id 无效。";
  const { data: previous, error: readError } = await supabase
    .from("portfolio_items")
    .select("media_url, poster_url")
    .eq("id", id)
    .eq("pursuit_id", pursuitId)
    .maybeSingle();
  const readMessage = fail(readError, "读取作品失败");
  if (readMessage) return readMessage;

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", id)
    .eq("pursuit_id", pursuitId);
  const deleteMessage = fail(error, "作品没有删除");
  if (deleteMessage) return deleteMessage;

  if (previous) {
    warnings.push(
      (await releaseMedia(supabase, [previous.media_url, previous.poster_url])) ?? "",
    );
  }
  return null;
}

async function upsertNote(
  supabase: Client,
  pursuitId: string,
  row: Extract<StudioChange, { op: "note.upsert" }>["row"],
  key: string | undefined,
  created: CreatedRow[],
  keyToId: Map<string, string>,
) {
  const title = empty(row.title) ?? "无标题笔记";
  const noteDate = empty(row.note_date);
  if (!noteDate || !DATE.test(noteDate)) return "笔记日期不合法。";
  const payload = {
    title: clip(title, 300, "笔记标题"),
    title_en: clip(empty(row.title_en), 300, "笔记英文标题"),
    title_ja: clip(empty(row.title_ja), 300, "笔记日文标题"),
    content: clip(empty(row.content), 100000, "笔记正文"),
    content_en: clip(empty(row.content_en), 100000, "笔记英文正文"),
    content_ja: clip(empty(row.content_ja), 100000, "笔记日文正文"),
    is_pinned: row.is_pinned === true,
    is_published: row.is_published === true,
    note_date: noteDate,
  };

  if (row.id) {
    if (!UUID.test(row.id)) return "笔记 id 无效。";
    const { error } = await supabase
      .from("notes")
      .update(payload)
      .eq("id", row.id)
      .eq("pursuit_id", pursuitId);
    return fail(error, "笔记没有保存");
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({ ...payload, pursuit_id: pursuitId })
    .select("id")
    .single();
  if (error || !data) return `笔记没有添加：${error?.message ?? "未知错误"}`;
  if (key) {
    created.push({ key, id: data.id });
    keyToId.set(key, data.id);
  }
  return null;
}

async function upsertMaterial(
  supabase: Client,
  pursuitId: string,
  row: Extract<StudioChange, { op: "material.upsert" }>["row"],
  key: string | undefined,
  created: CreatedRow[],
  keyToId: Map<string, string>,
) {
  if (!MATERIAL_KINDS.has(row.kind)) return "资料类型不合法。";
  let url: string;
  try {
    url = safeUrl(row.url, "资料网址");
  } catch (error) {
    return error instanceof Error ? error.message : "资料网址不合法。";
  }
  const payload = {
    title: clip(empty(row.title) ?? "未命名链接", 300, "资料标题"),
    title_en: clip(empty(row.title_en), 300, "资料英文标题"),
    title_ja: clip(empty(row.title_ja), 300, "资料日文标题"),
    url,
    kind: row.kind,
    description: clip(empty(row.description), 2000, "资料说明"),
    description_en: clip(empty(row.description_en), 2000, "资料英文说明"),
    description_ja: clip(empty(row.description_ja), 2000, "资料日文说明"),
    sort_order: asInt(row.sort_order),
  };

  if (row.id) {
    if (!UUID.test(row.id)) return "资料 id 无效。";
    const { error } = await supabase
      .from("materials_and_links")
      .update(payload)
      .eq("id", row.id)
      .eq("pursuit_id", pursuitId);
    return fail(error, "资料没有保存");
  }

  const { data, error } = await supabase
    .from("materials_and_links")
    .insert({ ...payload, pursuit_id: pursuitId })
    .select("id")
    .single();
  if (error || !data) return `资料没有添加：${error?.message ?? "未知错误"}`;
  if (key) {
    created.push({ key, id: data.id });
    keyToId.set(key, data.id);
  }
  return null;
}

async function deleteRow(
  supabase: Client,
  table: "milestones" | "notes" | "materials_and_links",
  pursuitId: string,
  id: string,
) {
  if (!UUID.test(id)) return "id 无效。";
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("pursuit_id", pursuitId);
  return fail(error, "没有删除成功");
}

async function reorder(
  supabase: Client,
  pursuitId: string,
  table: string,
  ids: string[],
  keyToId: Map<string, string>,
) {
  if (!REORDER_TABLES.has(table)) return "不支持排序的内容。";
  const resolved = ids.map((id) => keyToId.get(id) ?? id);
  for (const id of resolved) {
    if (!UUID.test(id)) return "排序里有还没保存好的项目，请再试一次。";
  }
  for (let index = 0; index < resolved.length; index += 1) {
    const { error } = await supabase
      .from(table)
      .update({ sort_order: index + 1 })
      .eq("id", resolved[index])
      .eq("pursuit_id", pursuitId);
    const message = fail(error, "排序没有保存");
    if (message) return message;
  }
  return null;
}

async function releaseMedia(supabase: Client, urls: (string | null | undefined)[]) {
  const unique = [...new Set(urls.filter((url): url is string => !!url))];
  const paths: string[] = [];

  for (const url of unique) {
    const path = storagePathFromUrl(url);
    if (!path) continue;
    const stillUsed = await mediaStillReferenced(supabase, url);
    if (stillUsed.error) {
      return `旧文件没有从存储里清掉：${stillUsed.error}`;
    }
    if (!stillUsed.used) paths.push(path);
  }

  if (paths.length === 0) return null;
  const { error } = await supabase.storage.from("media").remove(paths);
  if (error) return `旧文件没有从存储里清掉：${error.message}`;
  return null;
}

async function mediaStillReferenced(supabase: Client, url: string) {
  const [cover, media, poster] = await Promise.all([
    supabase.from("pursuits").select("id").eq("cover_url", url).limit(1),
    supabase.from("portfolio_items").select("id").eq("media_url", url).limit(1),
    supabase.from("portfolio_items").select("id").eq("poster_url", url).limit(1),
  ]);
  if (cover.error) return { used: true, error: cover.error.message };
  if (media.error) return { used: true, error: media.error.message };
  if (poster.error) return { used: true, error: poster.error.message };
  const used =
    (cover.data?.length ?? 0) +
      (media.data?.length ?? 0) +
      (poster.data?.length ?? 0) >
    0;
  return { used, error: null as string | null };
}

export async function deletePursuitById(
  id: string,
): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  const gate = await assertStudioAdmin();
  if (!gate.ok) return gate;
  if (!UUID.test(id)) return { ok: false, error: "找不到这个追求。" };

  const supabase = gate.supabase;
  const { data: pursuit, error: pursuitError } = await supabase
    .from("pursuits")
    .select("cover_url, slug")
    .eq("id", id)
    .maybeSingle();
  if (pursuitError) return { ok: false, error: `删除失败：${pursuitError.message}` };
  if (!pursuit) return { ok: false, error: "找不到这个追求。" };

  const { data: works, error: worksError } = await supabase
    .from("portfolio_items")
    .select("media_url, poster_url")
    .eq("pursuit_id", id);
  if (worksError) return { ok: false, error: `删除失败：${worksError.message}` };

  const { error } = await supabase.from("pursuits").delete().eq("id", id);
  if (error) return { ok: false, error: `删除失败：${error.message}` };

  const urls = [
    pursuit.cover_url,
    ...(works ?? []).flatMap((work) => [work.media_url, work.poster_url]),
  ];
  const warning = await releaseMedia(supabase, urls);

  revalidatePath("/");
  revalidatePath("/pursuits");
  revalidatePath("/admin");
  if (pursuit.slug) revalidatePath(`/pursuits/${pursuit.slug}`);

  return { ok: true, warning: warning ?? undefined };
}
