import Link from "next/link";
import { redirect } from "next/navigation";
import { createPursuit } from "@/app/admin/actions";
import { AdminTopBar } from "@/components/admin/top-bar";
import { Btn, Field, Input } from "@/components/admin/ui";
import { STAGES, stageIndex } from "@/lib/display";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_studio_admin");
  if (!isAdmin) redirect("/admin/login?error=forbidden");

  const { data: pursuits } = await supabase
    .from("pursuits")
    .select("id, slug, title, title_en, stage, is_published, sort_order, cover_url")
    .order("sort_order", { ascending: true });

  return (
    <div className="pb-10">
      <AdminTopBar />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Studio — Index</p>
          <h1 className="mt-3 font-display text-3xl tracking-tight text-ink">
            你的追求
          </h1>
          <p className="sub-ja mt-2">
            全部 {pursuits?.length ?? 0} 条，点「编辑」修改。
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-2">
        {(pursuits ?? []).map((p) => {
          const stage = STAGES[stageIndex(p.stage)];
          return (
            <div
              key={p.id}
              className="group flex flex-wrap items-center gap-4 rounded-xl border border-[var(--line)] bg-white/50 px-4 py-3 transition hover:border-white/20"
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  p.is_published
                    ? "bg-lime shadow-[0_0_8px_#93a477]"
                    : "bg-mist/30"
                }`}
                title={p.is_published ? "已发布" : "草稿"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] text-ink">{p.title}</p>
                <p className="font-display text-[10px] tracking-[0.14em] text-mist/40">
                  /{p.slug}
                  {p.title_en ? ` · ${p.title_en}` : ""}
                </p>
              </div>

              <span className="chip !py-1 !text-[9px]">{stage.zh}</span>

              <Link
                href={`/pursuits/${p.slug}`}
                target="_blank"
                className="font-display text-[10px] tracking-[0.14em] text-mist/40 transition hover:text-ink"
              >
                预览 ↗
              </Link>

              <Link
                href={`/admin/pursuits/${p.id}`}
                className="rounded-lg border border-[var(--line)] px-3 py-1.5 font-display text-[10px] tracking-[0.16em] text-mist transition hover:border-cyan/50 hover:text-cyan"
              >
                编辑
              </Link>
            </div>
          );
        })}

        {pursuits?.length === 0 ? (
          <p className="py-6 text-sm text-mist/60">还没有追求，先建一个。</p>
        ) : null}
      </div>

      <section className="panel mt-8 p-5 sm:p-7">
        <h2 className="text-[15px] text-ink">新建一个追求</h2>
        <p className="mt-1 text-[12px] text-mist/50">
          先只有名字也行，建完再慢慢补。默认是草稿，写完再勾「已发布」。
        </p>

        <form
          action={createPursuit}
          className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <Field label="名字" hint="中文">
            <Input name="title" required placeholder="例如：城市声音采集" />
          </Field>
          <Field label="网址片段" hint="slug · 小写英文">
            <Input name="slug" placeholder="city-sound" />
          </Field>
          <Btn type="submit" className="sm:mb-0.5">
            创建
          </Btn>
        </form>
      </section>
    </div>
  );
}
