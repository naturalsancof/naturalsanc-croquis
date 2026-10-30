export type Stage = "exploring" | "building" | "polishing" | "shipped";
export type Accent = "cyan" | "magenta" | "violet" | "lime" | "amber";
export type MediaKind = "image" | "audio";
export type MaterialKind =
  | "article"
  | "course"
  | "book"
  | "tool"
  | "video"
  | "other";

export interface Pursuit {
  id: string;
  slug: string;
  title: string;
  title_ja: string | null;
  title_en: string | null;
  subtitle: string | null;
  subtitle_ja: string | null;
  subtitle_en: string | null;
  description: string | null;
  description_ja: string | null;
  description_en: string | null;
  stage: Stage;
  progress_note: string | null;
  progress_note_ja: string | null;
  progress_note_en: string | null;
  cover_url: string | null;
  accent: Accent;
  started_at: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  pursuit_id: string;
  title: string;
  title_ja: string | null;
  title_en: string | null;
  done: boolean;
  sort_order: number;
  created_at: string;
}

export interface PortfolioItem {
  id: string;
  pursuit_id: string;
  kind: MediaKind;
  title: string | null;
  title_ja: string | null;
  title_en: string | null;
  description: string | null;
  description_ja: string | null;
  description_en: string | null;
  media_url: string;
  poster_url: string | null;
  duration_seconds: number | null;
  sort_order: number;
  created_at: string;
}

export interface Note {
  id: string;
  pursuit_id: string;
  title: string;
  title_ja: string | null;
  title_en: string | null;
  content: string | null;
  content_ja: string | null;
  content_en: string | null;
  is_published: boolean;
  is_pinned: boolean;
  note_date: string;
  created_at: string;
}

export interface MaterialLink {
  id: string;
  pursuit_id: string;
  title: string;
  title_ja: string | null;
  title_en: string | null;
  url: string;
  kind: MaterialKind;
  description: string | null;
  description_ja: string | null;
  description_en: string | null;
  sort_order: number;
  created_at: string;
}

export interface PursuitDetail extends Pursuit {
  milestones: Milestone[];
  portfolio_items: PortfolioItem[];
  notes: Note[];
  materials_and_links: MaterialLink[];
}
