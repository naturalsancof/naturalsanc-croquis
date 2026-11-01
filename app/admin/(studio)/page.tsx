import Link from "next/link";
import { CreatePursuitForm } from "@/components/admin/create-pursuit-form";
import { ErrorBanner } from "@/components/admin/ui";
import { STAGES, stageIndex } from "@/lib/display";
import { requireStudioAdmin } from "@/lib/supabase/session";

export const metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  const { supabase } = await requireStudioAdmin();

  const { data: pursuits, error } = await supabase
    .from("pursuits")
    .select("id, slug, title, title_en, stage, is_published, sort_order, cover_url")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`读取追求失败：${error.message}`);

  return (
    <div className="pb-10">
      <ErrorBanner code={err} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Studio — Index</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">
            你的追求
          </h1>
          <p className="sub-ja mt-2">
            全部 {pursuits?.length ?? 0} 条。点进去就是一整页编辑，不用再来回跳。
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        {(pursuits ?? []).map((p) => {
          const stage = STAGES[stageIndex(p.stage)];
          return (
            <div
              key={p.id}
              className="group flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--line)] bg-white/50 px-4 py-3 transition hover:border-white/20"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  p.is_published ? "bg-lime" : "bg-mist/30"
                }`}
                title={p.is_published ? "已发布" : "草稿"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] text-ink">{p.title}</p>
                <p className="font-display text-[10px] tracking-[0.14em] text-mist/70">
                  /{p.slug}
                  {p.title_en ? ` · ${p.title_en}` : ""}
                </p>
              </div>

              <span className="chip !py-1 !text-[9px]">{stage.zh}</span>

              <Link
                href={`/pursuits/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className="font-display text-[10px] tracking-[0.14em] text-mist/70 transition hover:text-ink"
              >
                预览 ↗
              </Link>

              <Link
                href={`/admin/pursuits/${p.id}`}
                className="rounded-full border border-[var(--line)] px-3 py-1.5 font-display text-[10px] tracking-[0.16em] text-mist transition hover:border-cyan/50 hover:text-cyan"
              >
                编辑
              </Link>
            </div>
          );
        })}

        {pursuits?.length === 0 ? (
          <p className="py-6 text-sm text-mist/70">还没有追求，先建一个。</p>
        ) : null}
      </div>

      <section className="panel-solid mt-8 p-5 sm:p-7">
        <h2 className="text-[15px] text-ink">新建一个追求</h2>
        <p className="mt-1 text-[12px] text-mist/70">
          填个名字就进去。里程碑、作品、笔记和资料都在同一页，写完在顶栏发布。
        </p>
        <CreatePursuitForm />
      </section>
    </div>
  );
}
