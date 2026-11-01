import type { CommitResult, PursuitPatch, StudioChange } from "./studio";
import type {
  MaterialLink,
  Milestone,
  Note,
  PortfolioItem,
  Pursuit,
} from "./types";

export type StudioSnapshot = {
  pursuit: Pursuit;
  milestones: Milestone[];
  works: PortfolioItem[];
  notes: Note[];
  materials: MaterialLink[];
};

const PURSUIT_KEYS = [
  "slug",
  "title",
  "title_en",
  "title_ja",
  "subtitle",
  "subtitle_en",
  "subtitle_ja",
  "description",
  "description_en",
  "description_ja",
  "stage",
  "progress_note",
  "progress_note_en",
  "progress_note_ja",
  "accent",
  "started_at",
  "sort_order",
  "is_published",
  "cover_url",
] as const satisfies readonly (keyof Pursuit)[];

export function isTempId(id: string) {
  return id.startsWith("tmp_");
}

function same(a: unknown, b: unknown) {
  return (a ?? null) === (b ?? null);
}

function unique(items: string[]) {
  return [...new Set(items)];
}

function acceptableUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /^\s*javascript:/i.test(trimmed)) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export type DiffResult = {
  changes: StudioChange[];
  issues: string[];
  skipped: string[];
};

export function diffStudio(saved: StudioSnapshot, current: StudioSnapshot): DiffResult {
  const changes: StudioChange[] = [];
  const issues: string[] = [];
  const skipped: string[] = [];

  const patch: PursuitPatch = {};
  for (const key of PURSUIT_KEYS) {
    if (same(saved.pursuit[key], current.pursuit[key])) continue;
    if (key === "title" && !current.pursuit.title.trim()) {
      issues.push("标题不能为空，这一处先留着，其他修改仍会保存。");
      continue;
    }
    if (key === "slug" && !current.pursuit.slug.trim()) {
      issues.push("网址片段不能为空。");
      continue;
    }
    if (
      key === "cover_url" &&
      current.pursuit.cover_url &&
      !acceptableUrl(current.pursuit.cover_url)
    ) {
      issues.push("封面地址还不是有效链接，改完后会自动保存。");
      continue;
    }
    (patch as Record<string, unknown>)[key] = current.pursuit[key];
  }
  if (Object.keys(patch).length > 0) {
    changes.push({ op: "pursuit", patch });
  }

  diffMilestones(saved.milestones, current.milestones, changes, issues, skipped);
  diffWorks(saved.works, current.works, changes, issues, skipped);
  diffNotes(saved.notes, current.notes, changes, issues, skipped);
  diffMaterials(saved.materials, current.materials, changes, issues, skipped);

  return { changes, issues: unique(issues), skipped };
}

function diffMilestones(
  saved: Milestone[],
  current: Milestone[],
  changes: StudioChange[],
  issues: string[],
  skipped: string[],
) {
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const currentIds = new Set(current.map((row) => row.id));

  for (const row of saved) {
    if (!currentIds.has(row.id)) {
      changes.push({ op: "milestone.delete", id: row.id });
    }
  }

  current.forEach((row, index) => {
    if (!row.title.trim()) {
      issues.push("有一条里程碑标题是空的，补上之后会自动保存。");
      skipped.push(row.id);
      return;
    }
    const prev = savedById.get(row.id);
    const changed =
      !prev ||
      prev.title !== row.title ||
      !same(prev.title_en, row.title_en) ||
      !same(prev.title_ja, row.title_ja) ||
      prev.done !== row.done;
    if (changed) {
      changes.push({
        op: "milestone.upsert",
        key: isTempId(row.id) ? row.id : undefined,
        row: {
          id: isTempId(row.id) ? undefined : row.id,
          title: row.title,
          title_en: row.title_en,
          title_ja: row.title_ja,
          done: row.done,
          sort_order: index + 1,
        },
      });
    }
  });

  pushReorder("milestones", saved, current, skipped, changes);
}

function diffWorks(
  saved: PortfolioItem[],
  current: PortfolioItem[],
  changes: StudioChange[],
  issues: string[],
  skipped: string[],
) {
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const currentIds = new Set(current.map((row) => row.id));

  for (const row of saved) {
    if (!currentIds.has(row.id)) {
      changes.push({ op: "work.delete", id: row.id });
    }
  }

  current.forEach((row, index) => {
    if (!row.media_url.trim() || !acceptableUrl(row.media_url)) {
      issues.push("有一件作品还没有有效的文件或链接，补上之后会自动保存。");
      skipped.push(row.id);
      return;
    }
    if (row.poster_url && !acceptableUrl(row.poster_url)) {
      issues.push("有一张海报地址还不完整，改完后会自动保存。");
      skipped.push(row.id);
      return;
    }
    const prev = savedById.get(row.id);
    const changed =
      !prev ||
      prev.kind !== row.kind ||
      !same(prev.title, row.title) ||
      !same(prev.title_en, row.title_en) ||
      !same(prev.title_ja, row.title_ja) ||
      !same(prev.description, row.description) ||
      !same(prev.description_en, row.description_en) ||
      !same(prev.description_ja, row.description_ja) ||
      prev.media_url !== row.media_url ||
      !same(prev.poster_url, row.poster_url) ||
      !same(prev.duration_seconds, row.duration_seconds);
    if (changed) {
      changes.push({
        op: "work.upsert",
        key: isTempId(row.id) ? row.id : undefined,
        row: {
          id: isTempId(row.id) ? undefined : row.id,
          kind: row.kind,
          title: row.title,
          title_en: row.title_en,
          title_ja: row.title_ja,
          description: row.description,
          description_en: row.description_en,
          description_ja: row.description_ja,
          media_url: row.media_url,
          poster_url: row.poster_url,
          duration_seconds: row.duration_seconds,
          sort_order: index + 1,
        },
      });
    }
  });

  pushReorder("portfolio_items", saved, current, skipped, changes);
}

function diffNotes(
  saved: Note[],
  current: Note[],
  changes: StudioChange[],
  issues: string[],
  skipped: string[],
) {
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const currentIds = new Set(current.map((row) => row.id));

  for (const row of saved) {
    if (!currentIds.has(row.id)) {
      changes.push({ op: "note.delete", id: row.id });
    }
  }

  for (const row of current) {
    const empty =
      !row.title.trim() &&
      !row.content?.trim() &&
      !row.content_en?.trim() &&
      !row.content_ja?.trim();
    if (empty) {
      issues.push("有一篇笔记标题和正文都是空的，写一点之后会自动保存。");
      skipped.push(row.id);
      continue;
    }
    const prev = savedById.get(row.id);
    const changed =
      !prev ||
      prev.title !== row.title ||
      !same(prev.title_en, row.title_en) ||
      !same(prev.title_ja, row.title_ja) ||
      !same(prev.content, row.content) ||
      !same(prev.content_en, row.content_en) ||
      !same(prev.content_ja, row.content_ja) ||
      prev.is_pinned !== row.is_pinned ||
      prev.is_published !== row.is_published ||
      prev.note_date !== row.note_date;
    if (changed) {
      changes.push({
        op: "note.upsert",
        key: isTempId(row.id) ? row.id : undefined,
        row: {
          id: isTempId(row.id) ? undefined : row.id,
          title: row.title.trim() || "无标题笔记",
          title_en: row.title_en,
          title_ja: row.title_ja,
          content: row.content,
          content_en: row.content_en,
          content_ja: row.content_ja,
          is_pinned: row.is_pinned,
          is_published: row.is_published,
          note_date: row.note_date,
        },
      });
    }
  }
}

function diffMaterials(
  saved: MaterialLink[],
  current: MaterialLink[],
  changes: StudioChange[],
  issues: string[],
  skipped: string[],
) {
  const savedById = new Map(saved.map((row) => [row.id, row]));
  const currentIds = new Set(current.map((row) => row.id));

  for (const row of saved) {
    if (!currentIds.has(row.id)) {
      changes.push({ op: "material.delete", id: row.id });
    }
  }

  current.forEach((row, index) => {
    if (!row.url.trim() || !acceptableUrl(row.url)) {
      issues.push("有一条资料的网址还不完整，填好之后会自动保存。");
      skipped.push(row.id);
      return;
    }
    const prev = savedById.get(row.id);
    const changed =
      !prev ||
      prev.title !== row.title ||
      !same(prev.title_en, row.title_en) ||
      !same(prev.title_ja, row.title_ja) ||
      prev.url !== row.url ||
      prev.kind !== row.kind ||
      !same(prev.description, row.description) ||
      !same(prev.description_en, row.description_en) ||
      !same(prev.description_ja, row.description_ja);
    if (changed) {
      changes.push({
        op: "material.upsert",
        key: isTempId(row.id) ? row.id : undefined,
        row: {
          id: isTempId(row.id) ? undefined : row.id,
          title: row.title.trim() || "未命名链接",
          title_en: row.title_en,
          title_ja: row.title_ja,
          url: row.url,
          kind: row.kind,
          description: row.description,
          description_en: row.description_en,
          description_ja: row.description_ja,
          sort_order: index + 1,
        },
      });
    }
  });

  pushReorder("materials_and_links", saved, current, skipped, changes);
}

function pushReorder(
  table: "milestones" | "portfolio_items" | "materials_and_links",
  saved: { id: string }[],
  current: { id: string }[],
  skipped: string[],
  changes: StudioChange[],
) {
  const skip = new Set(skipped);
  const next = current.map((row) => row.id).filter((id) => !skip.has(id));
  const prev = saved.map((row) => row.id);
  if (next.length === 0) return;
  if (next.join("|") === prev.join("|")) return;
  changes.push({ op: "reorder", table, ids: next });
}

/** 把已经成功写入的部分记下来。校验没过的行继续留在本地，不会被当成已保存。 */
export function markSaved(
  before: StudioSnapshot,
  sent: StudioSnapshot,
  skipped: string[],
  created: CommitResult["created"],
): StudioSnapshot {
  const skip = new Set(skipped);
  const map = new Map(created.map((item) => [item.key, item.id]));

  const list = <T extends { id: string }>(savedRows: T[], sentRows: T[]): T[] => {
    const savedById = new Map(savedRows.map((row) => [row.id, row]));
    const out: T[] = [];
    for (const row of sentRows) {
      if (skip.has(row.id)) {
        const prev = savedById.get(row.id);
        if (prev) out.push(prev);
        continue;
      }
      const id = map.get(row.id) ?? row.id;
      out.push({ ...row, id });
    }
    return out;
  };

  const pursuitPatch = sent.pursuit;
  const pursuitSaved = diffPursuitKeys(before.pursuit, pursuitPatch).length > 0;

  return {
    pursuit: pursuitSaved
      ? mergePursuit(before.pursuit, pursuitPatch)
      : before.pursuit,
    milestones: list(before.milestones, sent.milestones),
    works: list(before.works, sent.works),
    notes: list(before.notes, sent.notes),
    materials: list(before.materials, sent.materials),
  };
}

function diffPursuitKeys(saved: Pursuit, current: Pursuit) {
  return PURSUIT_KEYS.filter((key) => {
    if (same(saved[key], current[key])) return false;
    if (key === "title" && !current.title.trim()) return false;
    if (key === "slug" && !current.slug.trim()) return false;
    if (key === "cover_url" && current.cover_url && !acceptableUrl(current.cover_url)) {
      return false;
    }
    return true;
  });
}

function mergePursuit(saved: Pursuit, current: Pursuit): Pursuit {
  const next = { ...saved };
  for (const key of diffPursuitKeys(saved, current)) {
    (next as Record<string, unknown>)[key] = current[key];
  }
  return next;
}

/** 批次后半段失败时，把已经插入成功的新行记入已保存快照，避免重试时再插一条。 */
export function rememberInserts(
  saved: StudioSnapshot,
  sent: StudioSnapshot,
  created: CommitResult["created"],
): StudioSnapshot {
  if (created.length === 0) return saved;
  const map = new Map(created.map((item) => [item.key, item.id]));
  const pull = <T extends { id: string }>(savedRows: T[], sentRows: T[]) => {
    const extras = sentRows
      .filter((row) => map.has(row.id))
      .map((row) => ({ ...row, id: map.get(row.id)! }));
    const extraIds = new Set(extras.map((row) => row.id));
    return [...savedRows.filter((row) => !extraIds.has(row.id)), ...extras];
  };

  return {
    ...saved,
    milestones: pull(saved.milestones, sent.milestones),
    works: pull(saved.works, sent.works),
    notes: pull(saved.notes, sent.notes),
    materials: pull(saved.materials, sent.materials),
  };
}

export function adoptIds(snapshot: StudioSnapshot, created: CommitResult["created"]) {
  if (created.length === 0) return snapshot;
  const map = new Map(created.map((item) => [item.key, item.id]));
  const mapRows = <T extends { id: string }>(rows: T[]) =>
    rows.map((row) => (map.has(row.id) ? { ...row, id: map.get(row.id)! } : row));

  return {
    ...snapshot,
    milestones: mapRows(snapshot.milestones),
    works: mapRows(snapshot.works),
    notes: mapRows(snapshot.notes),
    materials: mapRows(snapshot.materials),
  };
}
