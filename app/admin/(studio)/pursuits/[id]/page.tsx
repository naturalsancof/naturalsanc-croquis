import { notFound } from "next/navigation";
import { StudioEditor } from "@/components/admin/studio-editor";
import type { StudioSnapshot } from "@/lib/studio-diff";
import type {
  MaterialLink,
  Milestone,
  Note,
  PortfolioItem,
  Pursuit,
} from "@/lib/types";
import { requireStudioAdmin } from "@/lib/supabase/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return { title: `编辑 ${id.slice(0, 8)} · Studio` };
}

export default async function EditPursuitPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string }>;
}) {
  const { id } = await params;
  const { err } = await searchParams;
  const { supabase } = await requireStudioAdmin();

  const [pursuitRes, milestones, works, notes, materials] = await Promise.all([
    supabase.from("pursuits").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("milestones")
      .select("*")
      .eq("pursuit_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("portfolio_items")
      .select("*")
      .eq("pursuit_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("notes")
      .select("*")
      .eq("pursuit_id", id)
      .order("note_date", { ascending: false }),
    supabase
      .from("materials_and_links")
      .select("*")
      .eq("pursuit_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (pursuitRes.error) throw new Error(`读取追求失败：${pursuitRes.error.message}`);
  if (milestones.error) throw new Error(`读取里程碑失败：${milestones.error.message}`);
  if (works.error) throw new Error(`读取作品失败：${works.error.message}`);
  if (notes.error) throw new Error(`读取笔记失败：${notes.error.message}`);
  if (materials.error) throw new Error(`读取资料失败：${materials.error.message}`);
  if (!pursuitRes.data) notFound();

  const noteRows = [...((notes.data ?? []) as Note[])].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return b.note_date.localeCompare(a.note_date);
  });

  const initial: StudioSnapshot = {
    pursuit: pursuitRes.data as Pursuit,
    milestones: (milestones.data ?? []) as Milestone[],
    works: (works.data ?? []) as PortfolioItem[],
    notes: noteRows,
    materials: (materials.data ?? []) as MaterialLink[],
  };

  return <StudioEditor initial={initial} initialError={err} />;
}
