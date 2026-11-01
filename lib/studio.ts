import type {
  Accent,
  MaterialKind,
  MediaKind,
  Stage,
} from "./types";

export type ReorderTable =
  | "milestones"
  | "portfolio_items"
  | "materials_and_links";

/** 只包含本次真的改过的字段，服务端按字段合并，缺了的语言列不会被写成空。 */
export type PursuitPatch = Partial<{
  slug: string;
  title: string;
  title_en: string | null;
  title_ja: string | null;
  subtitle: string | null;
  subtitle_en: string | null;
  subtitle_ja: string | null;
  description: string | null;
  description_en: string | null;
  description_ja: string | null;
  stage: Stage;
  progress_note: string | null;
  progress_note_en: string | null;
  progress_note_ja: string | null;
  accent: Accent;
  started_at: string | null;
  sort_order: number;
  is_published: boolean;
  cover_url: string | null;
}>;

export type MilestoneInput = {
  id?: string;
  title: string;
  title_en: string | null;
  title_ja: string | null;
  done: boolean;
  sort_order: number;
};

export type WorkInput = {
  id?: string;
  kind: MediaKind;
  title: string | null;
  title_en: string | null;
  title_ja: string | null;
  description: string | null;
  description_en: string | null;
  description_ja: string | null;
  media_url: string;
  poster_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
};

export type NoteInput = {
  id?: string;
  title: string;
  title_en: string | null;
  title_ja: string | null;
  content: string | null;
  content_en: string | null;
  content_ja: string | null;
  is_published: boolean;
  is_pinned: boolean;
  note_date: string;
};

export type MaterialInput = {
  id?: string;
  title: string;
  title_en: string | null;
  title_ja: string | null;
  url: string;
  kind: MaterialKind;
  description: string | null;
  description_en: string | null;
  description_ja: string | null;
  sort_order: number;
};

export type StudioChange =
  | { op: "pursuit"; patch: PursuitPatch }
  | { op: "milestone.upsert"; key?: string; row: MilestoneInput }
  | { op: "milestone.delete"; id: string }
  | { op: "work.upsert"; key?: string; row: WorkInput }
  | { op: "work.delete"; id: string }
  | { op: "note.upsert"; key?: string; row: NoteInput }
  | { op: "note.delete"; id: string }
  | { op: "material.upsert"; key?: string; row: MaterialInput }
  | { op: "material.delete"; id: string }
  | { op: "reorder"; table: ReorderTable; ids: string[] };

export type CreatedRow = { key: string; id: string };

export type CommitResult = {
  ok: boolean;
  error?: string;
  warning?: string;
  created: CreatedRow[];
};
