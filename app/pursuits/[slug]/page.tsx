import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkList } from "@/components/link-list";
import { NoteList } from "@/components/note-list";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProgressPanel } from "@/components/progress-panel";
import { Section } from "@/components/section";
import { ACCENT_HEX, STAGES, formatDate, stageIndex } from "@/lib/display";
import { getPursuitDetail, getPursuitSlugs } from "@/lib/queries";

export const revalidate = 30;

/** 把已知的追求在构建时预渲染；新加的 slug 会走 ISR 按需生成 */
export async function generateStaticParams() {
  const slugs = await getPursuitSlugs();
  return slugs.map((slug) => ({ slug }));
}

type TabKey = "progress" | "works" | "notes" | "materials";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pursuit = await getPursuitDetail(slug);

  if (!pursuit) {
    return { title: "未找到这个追求" };
  }

  const description =
    pursuit.subtitle ??
    pursuit.description?.slice(0, 120) ??
    `${pursuit.title} · 进行中的追求`;

  return {
    title: pursuit.title,
    description,
    openGraph: {
      title: `${pursuit.title} · Naturalsanc Croquis`,
      description,
      images: pursuit.cover_url ? [{ url: pursuit.cover_url }] : undefined,
    },
  };
}

export default async function PursuitPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const pursuit = await getPursuitDetail(slug);

  if (!pursuit) notFound();

  const accent = ACCENT_HEX[pursuit.accent];
  const stage = STAGES[stageIndex(pursuit.stage)];
  const works = pursuit.portfolio_items.length;
  const notes = pursuit.notes.length;
  const materials = pursuit.materials_and_links.length;
  const milestones = pursuit.milestones.length;

  const TABS: { key: TabKey; label: string; en: string; count: number | null }[] = [
    { key: "progress", label: "进展", en: "PROGRESS", count: milestones || null },
    { key: "works", label: "作品", en: "WORKS", count: works },
    { key: "notes", label: "笔记", en: "NOTES", count: notes },
    { key: "materials", label: "资料", en: "MATERIALS", count: materials },
  ];

  const tab: TabKey = TABS.some((t) => t.key === rawTab)
    ? (rawTab as TabKey)
    : "progress";

  const facts = [
    { label: "阶段", en: "Stage", value: stage.zh },
    { label: "开始", en: "Started", value: formatDate(pursuit.started_at) },
    { label: "作品", en: "Works", value: String(works) },
    { label: "笔记", en: "Notes", value: String(notes) },
    { label: "资料", en: "Links", value: String(materials) },
    { label: "更新", en: "Updated", value: formatDate(pursuit.updated_at) },
  ];

  return (
    <article style={{ ["--accent" as string]: accent }} className="pb-6">
      {/* ---------------- HERO ---------------- */}
      <header className="rise">
        <nav className="mb-8 flex items-center gap-2 font-display text-[9px] tracking-[0.22em] text-mist">
          <Link href="/pursuits" className="transition hover:text-ink">
            追求
          </Link>
          <span className="text-mist/40">/</span>
          <span className="text-ink/70">{pursuit.slug.toUpperCase()}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div
            className="poster aspect-[3/4] w-full max-w-[330px]"
            style={{ ["--tilt" as string]: "-1.4deg" }}
          >
            {pursuit.cover_url ? (
              <Image
                src={pursuit.cover_url}
                alt={pursuit.title}
                fill
                sizes="(max-width: 1024px) 70vw, 330px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a33] to-[#101014]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 font-display text-[8px] tracking-[0.2em] text-white/50">
              {pursuit.slug.replace(/-/g, "_").toUpperCase()}
            </span>
          </div>

          <div className="pt-2">
            <span className="chip chip-accent">
              <span
                className="h-1 w-1 rounded-full"
                style={{ background: accent }}
              />
              {stage.en} · {stage.zh}
            </span>

            <h1 className="mt-5 text-[38px] font-semibold leading-[1.02] tracking-[-0.03em] text-ink sm:text-[54px]">
              {pursuit.title}
            </h1>

            {pursuit.title_en ? (
              <p className="sub mt-4 uppercase">{pursuit.title_en}</p>
            ) : null}
            {pursuit.title_ja ? (
              <p className="sub-ja mt-1 text-sm">{pursuit.title_ja}</p>
            ) : null}

            {pursuit.subtitle ? (
              <p className="mt-7 max-w-xl text-[15px] leading-[1.95] text-ink/75">
                {pursuit.subtitle}
              </p>
            ) : null}
            {pursuit.subtitle_en ? (
              <p className="sub mt-2 max-w-xl text-[11px] normal-case tracking-normal">
                {pursuit.subtitle_en}
              </p>
            ) : null}
            {pursuit.subtitle_ja ? (
              <p className="sub-ja mt-1 max-w-xl">{pursuit.subtitle_ja}</p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-2 border-t border-[var(--line)] pt-6">
              <span className="chip">开始 {formatDate(pursuit.started_at)}</span>
              <span className="chip">{works} 件作品</span>
              <span className="chip">{notes} 篇笔记</span>
              <span className="chip">{materials} 条资料</span>
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- TABS ---------------- */}
      <div className="sticky top-16 z-40 mt-10">
        <nav className="mx-auto grid w-fit grid-cols-4 gap-1 rounded-full border border-[var(--line)] bg-white/75 p-1 backdrop-blur-xl">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <Link
                key={t.key}
                href={`/pursuits/${pursuit.slug}?tab=${t.key}`}
                scroll={false}
                className={`flex w-[76px] items-center justify-center gap-1.5 rounded-full px-1 py-2 font-display text-[10px] tracking-[0.14em] uppercase transition sm:w-[126px] sm:gap-2 sm:px-2 ${
                  active
                    ? "bg-ink text-white"
                    : "text-mist hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {t.label}
                <span
                  className={`hidden text-[9px] tracking-normal sm:inline ${
                    active ? "text-white/50" : "text-mist/50"
                  }`}
                >
                  {t.en}
                </span>
                {t.count !== null && t.count > 0 ? (
                  <span
                    className={`hidden rounded-full px-1.5 py-0.5 text-[8px] sm:inline ${
                      active ? "bg-white/20 text-white" : "bg-ink/5 text-mist"
                    }`}
                  >
                    {t.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ---------------- BODY ---------------- */}
      <div
        className={`mt-10 ${
          tab === "progress"
            ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start"
            : ""
        }`}
      >
        <div className="space-y-6">
          {tab === "progress" ? (
            <Section
              index="01"
              title="进展与进度"
              en="PROGRESS"
              aside={
                pursuit.description ? (
                  <p className="max-w-2xl text-sm leading-[1.9] text-ink/65">
                    {pursuit.description}
                  </p>
                ) : undefined
              }
            >
              <ProgressPanel pursuit={pursuit} milestones={pursuit.milestones} />
            </Section>
          ) : null}

          {tab === "works" ? (
            <Section
              index="02"
              title="作品"
              en="SELECTED WORKS"
              aside={
                <p className="text-xs text-mist">
                  共 {works} 件，点开看大图。
                </p>
              }
            >
              <PortfolioGrid items={pursuit.portfolio_items} />
            </Section>
          ) : null}

          {tab === "notes" ? (
            <Section
              index="03"
              title="笔记"
              en="FIELD NOTES"
              aside={
                <p className="text-xs text-mist">
                  共 {notes} 篇，写在 Markdown 里，随页面一起更新。
                </p>
              }
            >
              <NoteList notes={pursuit.notes} />
            </Section>
          ) : null}

          {tab === "materials" ? (
            <Section
              index="04"
              title="学习资料与链接"
              en="MATERIALS"
              aside={
                <p className="text-xs text-mist">共 {materials} 条。</p>
              }
            >
              <LinkList links={pursuit.materials_and_links} />
            </Section>
          ) : null}
        </div>

        {tab === "progress" ? (
          <aside className="space-y-4 lg:sticky lg:top-32">
            <div className="border-t border-[var(--line)] pt-4">
              <p className="label">At a glance</p>
              <dl className="mt-4">
                {facts.map((f) => (
                  <div
                    key={f.en}
                    className="flex items-baseline justify-between gap-3 border-b border-[var(--line)] py-2 last:border-0"
                  >
                    <dt className="text-[11px] text-mist">
                      {f.label}
                      <span className="ml-1.5 font-display text-[8px] tracking-[0.16em] text-mist/60">
                        {f.en.toUpperCase()}
                      </span>
                    </dt>
                    <dd className="font-display text-[11px] tracking-[0.04em] text-ink">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-t border-[var(--line)] pt-4">
              <p className="label">Colophon</p>
              <p className="mt-3 text-[11px] leading-relaxed text-mist">
                页面从 Supabase 实时读取。内容会随追求推进而变，不保证稳定。
              </p>
              <p className="sub-ja mt-2 text-[10px]">
                このページは進行に合わせて更新されます。
              </p>
            </div>

            <Link
              href="/pursuits"
              className="group flex items-center justify-between border border-[var(--line)] px-4 py-3 transition hover:border-ink/40"
            >
              <span className="font-display text-[9px] tracking-[0.22em] text-mist transition group-hover:text-ink">
                ALL PURSUITS
              </span>
              <span className="text-mist transition group-hover:-translate-x-1 group-hover:text-ink">
                ←
              </span>
            </Link>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
