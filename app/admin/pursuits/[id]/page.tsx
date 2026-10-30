import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  MaterialsEditor,
  MilestonesEditor,
  NotesEditor,
  WorksEditor,
} from "@/components/admin/editors";
import { PursuitForm } from "@/components/admin/pursuit-form";
import { AdminTopBar } from "@/components/admin/top-bar";
import { SavedBanner } from "@/components/admin/ui";
import type {
  MaterialLink,
  Milestone,
  Note,
  PortfolioItem,
  Pursuit,
} from "@/lib/types";
import { supabaseServer } from "@/lib/supabase/server";

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
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_studio_admin");
  if (!isAdmin) redirect("/admin/login?error=forbidden");

  const { data: pursuitRow } = await supabase
    .from("pursuits")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!pursuitRow) notFound();
  const pursuit = pursuitRow as Pursuit;

  const [milestones, works, notes, materials] = await Promise.all([
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

  return (
    <div className="pb-12">
      <AdminTopBar />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="font-display text-[10px] tracking-[0.2em] text-mist/40 transition hover:text-paper"
          >
            ← 全部追求
          </Link>
          <h1 className="mt-3 font-display text-2xl tracking-tight text-paper">
            {pursuit.title}
          </h1>
          <p className="mt-1 font-display text-[10px] tracking-[0.14em] text-mist/40">
            /{pursuit.slug} ·{" "}
            {pursuit.is_published ? "已发布" : "草稿（公开页面看不到）"}
          </p>
        </div>

        <Link
          href={`/pursuits/${pursuit.slug}`}
          target="_blank"
          className="rounded-lg border border-white/10 px-3.5 py-2 font-display text-[10px] tracking-[0.16em] text-mist transition hover:border-white/30 hover:text-paper"
        >
          预览公开页面 ↗
        </Link>
      </div>

      <SavedBanner show={saved === "1"} />

      <div className="space-y-5">
        <PursuitForm pursuit={pursuit} />

        <MilestonesEditor
          pursuitId={pursuit.id}
          items={(milestones.data ?? []) as Milestone[]}
        />

        <WorksEditor
          pursuitId={pursuit.id}
          items={(works.data ?? []) as PortfolioItem[]}
        />

        <NotesEditor
          pursuitId={pursuit.id}
          items={(notes.data ?? []) as Note[]}
        />

        <MaterialsEditor
          pursuitId={pursuit.id}
          items={(materials.data ?? []) as MaterialLink[]}
        />
      </div>
    </div>
  );
}
