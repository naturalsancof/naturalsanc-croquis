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
import { ErrorBanner, SavedBanner } from "@/components/admin/ui";
import type {
  MaterialLink,
  Milestone,
  Note,
  PortfolioItem,
  Pursuit,
} from "@/lib/types";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "basic", label: "基本信息", en: "BASIC" },
  { key: "milestones", label: "里程碑", en: "MILESTONES" },
  { key: "works", label: "作品", en: "WORKS" },
  { key: "notes", label: "笔记", en: "NOTES" },
  { key: "links", label: "资料", en: "LINKS" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
  searchParams: Promise<{ saved?: string; tab?: string; edit?: string; err?: string }>;
}) {
  const { id } = await params;
  const { saved, tab: rawTab, edit, err } = await searchParams;

  const tab: TabKey = TABS.some((t) => t.key === rawTab)
    ? (rawTab as TabKey)
    : "basic";

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

  const counts: Record<TabKey, number | null> = {
    basic: null,
    milestones: milestones.data?.length ?? 0,
    works: works.data?.length ?? 0,
    notes: notes.data?.length ?? 0,
    links: materials.data?.length ?? 0,
  };

  return (
    <div className="pb-12">
      <AdminTopBar />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="font-display text-[10px] tracking-[0.2em] text-mist/40 transition hover:text-ink"
          >
            ← 全部追求
          </Link>
          <h1 className="mt-3 font-display text-2xl tracking-tight text-ink">
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
          className="rounded-lg border border-[var(--line)] px-3.5 py-2 font-display text-[10px] tracking-[0.16em] text-mist transition hover:border-white/30 hover:text-ink"
        >
          预览公开页面 ↗
        </Link>
      </div>

      <SavedBanner show={saved === "1"} />
      <ErrorBanner code={err} />

      {/* 分页签 */}
      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--line)] pb-px">
        {TABS.map((t) => {
          const active = t.key === tab;
          const n = counts[t.key];
          return (
            <Link
              key={t.key}
              href={`/admin/pursuits/${id}?tab=${t.key}`}
              scroll={false}
              className={`relative flex shrink-0 items-center gap-2 px-4 py-3 text-[13px] transition ${
                active
                  ? "text-ink"
                  : "text-mist/50 hover:text-ink/80"
              }`}
            >
              {t.label}
              {n !== null ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 font-display text-[9px] ${
                    active
                      ? "bg-cyan/15 text-cyan"
                      : "bg-white/5 text-mist/50"
                  }`}
                >
                  {n}
                </span>
              ) : null}
              {active ? (
                <span className="absolute inset-x-3 -bottom-px h-px bg-cyan shadow-[0_0_10px_#6e9ba2]" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {tab === "basic" ? <PursuitForm pursuit={pursuit} /> : null}

      {tab === "milestones" ? (
        <MilestonesEditor
          pursuitId={pursuit.id}
          items={(milestones.data ?? []) as Milestone[]}
        />
      ) : null}

      {tab === "works" ? (
        <WorksEditor
          pursuitId={pursuit.id}
          items={(works.data ?? []) as PortfolioItem[]}
          editId={edit}
        />
      ) : null}

      {tab === "notes" ? (
        <NotesEditor
          pursuitId={pursuit.id}
          items={(notes.data ?? []) as Note[]}
          editId={edit}
        />
      ) : null}

      {tab === "links" ? (
        <MaterialsEditor
          pursuitId={pursuit.id}
          items={(materials.data ?? []) as MaterialLink[]}
        />
      ) : null}
    </div>
  );
}
