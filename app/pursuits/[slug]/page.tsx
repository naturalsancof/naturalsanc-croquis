import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LinkList } from "@/components/link-list";
import { NoteList } from "@/components/note-list";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ProgressPanel } from "@/components/progress-panel";
import { Section } from "@/components/section";
import { STAGES, formatDate, stageIndex } from "@/lib/display";
import { getPursuitDetail } from "@/lib/queries";

/**
 * 这一页读 searchParams（四个页签），属于动态渲染。
 * 如果同时开 generateStaticParams + revalidate，线上会走「静态预渲染」路径，
 * 读 searchParams 时抛 DYNAMIC_SERVER_USAGE（表现为整页 500，日志里就是这个 digest）。
 * 所以这里明确声明动态，去掉构建期预渲染。
 */
export const dynamic = "force-dynamic";

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

  const stage = STAGES[stageIndex(pursuit.stage)];
  const works = pursuit.portfolio_items.length;
  const notes = pursuit.notes.length;
  const materials = pursuit.materials_and_links.length;
  const milestones = pursuit.milestones.length;

  const TABS: { key: TabKey; label: string; en: string; count: number | null }[] = [
    { key: "progress", label: "进展", en: "Progress", count: milestones || null },
    { key: "works", label: "作品", en: "Works", count: works },
    { key: "notes", label: "笔记", en: "Notes", count: notes },
    { key: "materials", label: "资料", en: "Materials", count: materials },
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
    <article className="pb-6">
      {/* ---------------- HERO ---------------- */}
      <header className="rise">
        <nav className="mb-8 flex items-center gap-2 font-display text-[11px] text-[var(--text-muted)]">
          <Link href="/pursuits" className="transition hover:text-[var(--text)]">
            追求
          </Link>
          <span className="text-[var(--text-soft)]">/</span>
          <span className="text-[var(--text)]">{pursuit.slug}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-start lg:gap-12">
          <div className="poster aspect-[3/4] w-full max-w-[330px]">
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
              <div className="absolute inset-0 bg-[var(--surface-muted)]" />
            )}
            <span className="absolute bottom-3 left-3 bg-[var(--media-scrim)] px-2 py-1 font-display text-[11px] text-[var(--on-image)]">
              {pursuit.slug.replace(/-/g, "_")}
            </span>
          </div>

          <div className="pt-2">
            <span className="chip chip-accent">
              <span className="h-1 w-1 rounded-full bg-[var(--accent)]" aria-hidden />
              {stage.en} · {stage.zh}
            </span>

            <h1 className="mt-5 text-[22px] font-medium leading-[1.3] text-[var(--text)]">
              {pursuit.title}
            </h1>

            {pursuit.title_en ? (
              <p className="sub mt-4">{pursuit.title_en}</p>
            ) : null}
            {pursuit.title_ja ? (
              <p className="sub-ja mt-1 text-[13px]">{pursuit.title_ja}</p>
            ) : null}

            {pursuit.subtitle ? (
              <p className="mt-7 max-w-xl whitespace-pre-wrap text-base leading-[1.7] text-[var(--text-muted)]">
                {pursuit.subtitle}
              </p>
            ) : null}
            {pursuit.subtitle_en ? (
              <p className="sub mt-2 max-w-xl text-[12px]">
                {pursuit.subtitle_en}
              </p>
            ) : null}
            {pursuit.subtitle_ja ? (
              <p className="sub-ja mt-1 max-w-xl">{pursuit.subtitle_ja}</p>
            ) : null}

            <div className="mt-8 flex flex-wrap gap-2 border-t-[0.5px] border-[var(--border)] pt-6">
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
        <nav className="mx-auto grid w-fit grid-cols-4 gap-1 rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] p-1">
          {TABS.map((t) => {
            const active = t.key === tab;
            return (
              <Link
                key={t.key}
                href={`/pursuits/${pursuit.slug}?tab=${t.key}`}
                scroll={false}
                className={`flex w-[76px] items-center justify-center gap-1.5 rounded-[8px] border-[0.5px] px-1 py-2 font-display text-[11px] transition sm:w-[126px] sm:gap-2 sm:px-2 ${
                  active
                    ? "border-[var(--surface-inverse)] bg-[var(--surface-inverse)] text-[var(--text-inverse)] hover:bg-[var(--text-muted)]"
                    : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                }`}
              >
                {t.label}
                <span
                  className={`hidden text-[11px] sm:inline ${
                    active ? "text-[var(--text-inverse-muted)]" : "text-[var(--text-soft)]"
                  }`}
                >
                  {t.en}
                </span>
                {t.count !== null && t.count > 0 ? (
                  <span
                    className={`hidden rounded-[8px] px-1.5 py-0.5 text-[11px] sm:inline ${
                      active
                        ? "bg-[var(--surface)] text-[var(--text)]"
                        : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
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
              en="Progress"
              aside={
                pursuit.description ? (
                  <p className="max-w-2xl whitespace-pre-wrap text-base leading-[1.7] text-[var(--text-muted)]">
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
              en="Selected works"
              aside={
                <p className="text-[13px] text-[var(--text-muted)]">
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
              en="Field notes"
              aside={
                <p className="text-[13px] text-[var(--text-muted)]">
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
              en="Materials"
              aside={
                <p className="text-[13px] text-[var(--text-muted)]">共 {materials} 条。</p>
              }
            >
              <LinkList links={pursuit.materials_and_links} />
            </Section>
          ) : null}
        </div>

        {tab === "progress" ? (
          <aside className="space-y-4 lg:sticky lg:top-32">
            <div className="border-t-[0.5px] border-[var(--border)] pt-4">
              <p className="label">At a glance</p>
              <dl className="mt-4">
                {facts.map((f) => (
                  <div
                    key={f.en}
                    className="flex items-baseline justify-between gap-3 border-b-[0.5px] border-[var(--border)] py-2 last:border-0"
                  >
                    <dt className="text-[11px] text-[var(--text-muted)]">
                      {f.label}
                      <span className="ml-1.5 font-display text-[11px] text-[var(--text-soft)]">
                        {f.en}
                      </span>
                    </dt>
                    <dd className="font-display text-[11px] text-[var(--text)]">
                      {f.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-t-[0.5px] border-[var(--border)] pt-4">
              <p className="label">Colophon</p>
              <p className="mt-3 text-[11px] leading-[1.7] text-[var(--text-muted)]">
                页面从 Supabase 实时读取。内容会随追求推进而变，不保证稳定。
              </p>
              <p className="sub-ja mt-2 text-[11px]">
                このページは進行に合わせて更新されます。
              </p>
            </div>

            <Link
              href="/pursuits"
              className="group flex items-center justify-between rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
            >
              <span className="font-display text-[11px] text-[var(--text-muted)] transition group-hover:text-[var(--text)]">
                All pursuits
              </span>
              <span className="text-[var(--text-muted)] transition group-hover:text-[var(--text)]" aria-hidden>
                ←
              </span>
            </Link>
          </aside>
        ) : null}
      </div>
    </article>
  );
}
