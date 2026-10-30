import { supabasePublic } from "./supabase/public";
import type {
  MaterialLink,
  Milestone,
  Note,
  PortfolioItem,
  Pursuit,
  PursuitDetail,
} from "./types";

/** 首页 / 列表页用：所有已发布的追求 */
export async function getPursuits(): Promise<Pursuit[]> {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("pursuits")
    .select("*")
    .eq("is_published", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`读取 pursuits 失败：${error.message}`);
  return (data ?? []) as Pursuit[];
}

/** 二级页用：一个追求 + 它的全部子内容 */
export async function getPursuitDetail(
  slug: string,
): Promise<PursuitDetail | null> {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("pursuits")
    .select(
      "*, milestones(*), portfolio_items(*), notes(*), materials_and_links(*)",
    )
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw new Error(`读取 pursuit「${slug}」失败：${error.message}`);
  if (!data) return null;

  const row = data as Pursuit & {
    milestones: Milestone[] | null;
    portfolio_items: PortfolioItem[] | null;
    notes: Note[] | null;
    materials_and_links: MaterialLink[] | null;
  };

  return {
    ...row,
    milestones: [...(row.milestones ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    portfolio_items: [...(row.portfolio_items ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
    notes: [...(row.notes ?? [])].sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return b.note_date.localeCompare(a.note_date);
    }),
    materials_and_links: [...(row.materials_and_links ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    ),
  };
}

/** 给 generateMetadata / 静态参数用 */
export async function getPursuitSlugs(): Promise<string[]> {
  const supabase = supabasePublic();
  const { data, error } = await supabase
    .from("pursuits")
    .select("slug")
    .eq("is_published", true);

  if (error) return [];
  return (data ?? []).map((r) => r.slug as string);
}
