"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/* ---------------------------------- utils --------------------------------- */

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function nullable(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

function num(fd: FormData, key: string, fallback = 0): number {
  const n = Number(str(fd, key));
  return Number.isFinite(n) ? n : fallback;
}

function bool(fd: FormData, key: string): boolean {
  return str(fd, key) === "on" || str(fd, key) === "true";
}

async function guard() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_studio_admin");
  if (!isAdmin) redirect("/admin/login?error=forbidden");

  return supabase;
}

function backTo(pursuitId: string, fd: FormData) {
  const tab = str(fd, "return_tab");
  return `/admin/pursuits/${pursuitId}?${tab ? `tab=${tab}&` : ""}saved=1`;
}

function refreshPublic(slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/pursuits");
  if (slug) revalidatePath(`/pursuits/${slug}`);
}

async function slugOf(supabase: Awaited<ReturnType<typeof guard>>, pursuitId: string) {
  const { data } = await supabase
    .from("pursuits")
    .select("slug")
    .eq("id", pursuitId)
    .maybeSingle();
  return data?.slug ?? null;
}

async function upload(
  supabase: Awaited<ReturnType<typeof guard>>,
  file: FormDataEntryValue | null,
  pursuitId: string,
) {
  // 注意：不能用 `instanceof File` 判断——Server Action 里传过来的可能是另一个 realm 的 File
  if (!file || typeof file === "string") return null;

  const f = file as File;
  if (!f.size) return null;

  const ext = (f.name.split(".").pop() || "bin").toLowerCase();
  const path = `${pursuitId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}.${ext}`;

  // 先读成字节再上传：直接把 File 的 stream 交给 undici 偶尔会报
  // "The destination stream errored while writing data"
  const bytes = new Uint8Array(await f.arrayBuffer());

  const { error } = await supabase.storage.from("media").upload(path, bytes, {
    contentType: f.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(`上传失败：${error.message}`);

  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl as string;
}

/* --------------------------------- reorder -------------------------------- */

const REORDERABLE = [
  "milestones",
  "portfolio_items",
  "notes",
  "materials_and_links",
] as const;

export async function reorderRows(table: string, ids: string[]) {
  if (!REORDERABLE.includes(table as (typeof REORDERABLE)[number])) {
    throw new Error("不支持排序的表");
  }
  const supabase = await guard();
  if (ids.length === 0) return { ok: true };

  await Promise.all(
    ids.map((id, i) =>
      supabase
        .from(table)
        .update({ sort_order: i + 1 })
        .eq("id", id),
    ),
  );

  const { data } = await supabase
    .from(table)
    .select("pursuit_id")
    .eq("id", ids[0])
    .maybeSingle();

  if (data?.pursuit_id) {
    const slug = await slugOf(supabase, data.pursuit_id);
    refreshPublic(slug);
    revalidatePath(`/admin/pursuits/${data.pursuit_id}`);
  }

  return { ok: true };
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
  const supabase = await guard();
  const password = str(fd, "password");
  const confirm = str(fd, "confirm");

  if (password.length < 8) redirect("/admin/account?error=short");
  if (password !== confirm) redirect("/admin/account?error=mismatch");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/admin/account?error=failed");

  redirect("/admin/account?saved=1");
}

/* -------------------------------- pursuits -------------------------------- */

export async function createPursuit(fd: FormData) {
  const supabase = await guard();

  const title = str(fd, "title") || "未命名追求";
  const rawSlug = str(fd, "slug") || title;
  const slug = rawSlug
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || `pursuit-${Date.now().toString(36)}`;

  const { data: maxRow } = await supabase
    .from("pursuits")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

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

  if (error) throw new Error(`新建失败：${error.message}`);

  refreshPublic();
  redirect(`/admin/pursuits/${data.id}`);
}

export async function savePursuit(fd: FormData) {
  const supabase = await guard();
  const id = str(fd, "id");
  if (!id) throw new Error("缺少 id");

  const patch = {
    slug: str(fd, "slug"),
    title: str(fd, "title"),
    title_en: nullable(fd, "title_en"),
    title_ja: nullable(fd, "title_ja"),
    subtitle: nullable(fd, "subtitle"),
    subtitle_en: nullable(fd, "subtitle_en"),
    subtitle_ja: nullable(fd, "subtitle_ja"),
    description: nullable(fd, "description"),
    description_en: nullable(fd, "description_en"),
    description_ja: nullable(fd, "description_ja"),
    stage: str(fd, "stage") || "exploring",
    progress_note: nullable(fd, "progress_note"),
    progress_note_en: nullable(fd, "progress_note_en"),
    progress_note_ja: nullable(fd, "progress_note_ja"),
    accent: str(fd, "accent") || "cyan",
    started_at: nullable(fd, "started_at"),
    sort_order: num(fd, "sort_order"),
    is_published: bool(fd, "is_published"),
    cover_url: nullable(fd, "cover_url"),
  };

  const uploaded = await upload(supabase, fd.get("cover_file"), id);
  if (uploaded) patch.cover_url = uploaded;

  const { error } = await supabase.from("pursuits").update(patch).eq("id", id);
  if (error) throw new Error(`保存失败：${error.message}`);

  refreshPublic(patch.slug);

  // 带文件上传时不要 redirect：multipart 的响应流正在写入，
  // 重定向会触发 "The destination stream errored while writing data"。
  if (uploaded) {
    revalidatePath(`/admin/pursuits/${id}`);
    return;
  }

  redirect(backTo(id, fd));
}

export async function deletePursuit(fd: FormData) {
  const supabase = await guard();
  const id = str(fd, "id");
  const { error } = await supabase.from("pursuits").delete().eq("id", id);
  if (error) throw new Error(`删除失败：${error.message}`);
  refreshPublic();
  redirect("/admin");
}

/* ------------------------------- milestones ------------------------------- */

export async function saveMilestone(fd: FormData) {
  const supabase = await guard();
  const pursuitId = str(fd, "pursuit_id");
  const id = str(fd, "id");
  const intent = str(fd, "intent") || "save";

  if (intent === "delete" && id) {
    await supabase.from("milestones").delete().eq("id", id);
  } else if (intent === "toggle" && id) {
    const done = str(fd, "done") === "on";
    await supabase.from("milestones").update({ done: !done }).eq("id", id);
  } else if (id) {
    await supabase
      .from("milestones")
      .update({
        title: str(fd, "title"),
        title_en: nullable(fd, "title_en"),
        title_ja: nullable(fd, "title_ja"),
        done: bool(fd, "done"),
        sort_order: num(fd, "sort_order"),
      })
      .eq("id", id);
  } else {
    const { data: maxRow } = await supabase
      .from("milestones")
      .select("sort_order")
      .eq("pursuit_id", pursuitId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from("milestones").insert({
      pursuit_id: pursuitId,
      title: str(fd, "title") || "新的里程碑",
      title_en: nullable(fd, "title_en"),
      title_ja: nullable(fd, "title_ja"),
      done: bool(fd, "done"),
      sort_order: (maxRow?.sort_order ?? 0) + 1,
    });
  }

  refreshPublic(await slugOf(supabase, pursuitId));
  redirect(backTo(pursuitId, fd));
}

/* -------------------------------- portfolio ------------------------------- */

export async function saveWork(fd: FormData) {
  const supabase = await guard();
  const pursuitId = str(fd, "pursuit_id");
  const id = str(fd, "id");
  const intent = str(fd, "intent") || "save";
  let uploaded: string | null = null;
  let poster: string | null = null;

  if (intent === "delete" && id) {
    await supabase.from("portfolio_items").delete().eq("id", id);
  } else {
    uploaded = await upload(supabase, fd.get("file"), pursuitId);
    poster = await upload(supabase, fd.get("poster_file"), pursuitId);

    const patch: Record<string, unknown> = {
      pursuit_id: pursuitId,
      kind: str(fd, "kind") || "image",
      title: nullable(fd, "title"),
      title_en: nullable(fd, "title_en"),
      title_ja: nullable(fd, "title_ja"),
      description: nullable(fd, "description"),
      description_en: nullable(fd, "description_en"),
      description_ja: nullable(fd, "description_ja"),
      media_url: str(fd, "media_url") || uploaded || "",
      poster_url: nullable(fd, "poster_url") || poster,
      duration_seconds: str(fd, "duration_seconds")
        ? num(fd, "duration_seconds")
        : null,
      sort_order: num(fd, "sort_order"),
    };

    if (uploaded) patch.media_url = uploaded;
    if (!patch.media_url) throw new Error("作品必须有文件或地址");

    if (id) {
      await supabase.from("portfolio_items").update(patch).eq("id", id);
    } else {
      const { data: maxRow } = await supabase
        .from("portfolio_items")
        .select("sort_order")
        .eq("pursuit_id", pursuitId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      patch.sort_order = (maxRow?.sort_order ?? 0) + 1;
      await supabase.from("portfolio_items").insert(patch);
    }
  }

  refreshPublic(await slugOf(supabase, pursuitId));

  if (uploaded || poster) {
    revalidatePath(`/admin/pursuits/${pursuitId}`);
    return;
  }

  redirect(backTo(pursuitId, fd));
}

/* ---------------------------------- notes --------------------------------- */

export async function saveNote(fd: FormData) {
  const supabase = await guard();
  const pursuitId = str(fd, "pursuit_id");
  const id = str(fd, "id");
  const intent = str(fd, "intent") || "save";

  if (intent === "delete" && id) {
    await supabase.from("notes").delete().eq("id", id);
  } else {
    const patch: Record<string, unknown> = {
      pursuit_id: pursuitId,
      title: str(fd, "title") || "无标题笔记",
      title_en: nullable(fd, "title_en"),
      title_ja: nullable(fd, "title_ja"),
      content: nullable(fd, "content"),
      content_en: nullable(fd, "content_en"),
      content_ja: nullable(fd, "content_ja"),
      is_pinned: bool(fd, "is_pinned"),
      is_published: bool(fd, "is_published"),
      note_date: str(fd, "note_date") || new Date().toISOString().slice(0, 10),
    };

    if (id) {
      await supabase.from("notes").update(patch).eq("id", id);
    } else {
      await supabase.from("notes").insert(patch);
    }
  }

  refreshPublic(await slugOf(supabase, pursuitId));
  redirect(backTo(pursuitId, fd));
}

/* -------------------------------- materials ------------------------------- */

export async function saveMaterial(fd: FormData) {
  const supabase = await guard();
  const pursuitId = str(fd, "pursuit_id");
  const id = str(fd, "id");
  const intent = str(fd, "intent") || "save";

  if (intent === "delete" && id) {
    await supabase.from("materials_and_links").delete().eq("id", id);
  } else {
    const patch: Record<string, unknown> = {
      pursuit_id: pursuitId,
      title: str(fd, "title") || "未命名链接",
      title_en: nullable(fd, "title_en"),
      title_ja: nullable(fd, "title_ja"),
      url: str(fd, "url"),
      kind: str(fd, "kind") || "article",
      description: nullable(fd, "description"),
      description_en: nullable(fd, "description_en"),
      description_ja: nullable(fd, "description_ja"),
      sort_order: num(fd, "sort_order"),
    };

    if (!patch.url) throw new Error("链接必须有 URL");

    if (id) {
      await supabase.from("materials_and_links").update(patch).eq("id", id);
    } else {
      const { data: maxRow } = await supabase
        .from("materials_and_links")
        .select("sort_order")
        .eq("pursuit_id", pursuitId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();

      patch.sort_order = (maxRow?.sort_order ?? 0) + 1;
      await supabase.from("materials_and_links").insert(patch);
    }
  }

  refreshPublic(await slugOf(supabase, pursuitId));
  redirect(backTo(pursuitId, fd));
}
