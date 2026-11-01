import type { Metadata } from "next";
import { PursuitCard } from "@/components/pursuit-card";
import { Reveal } from "@/components/reveal";
import { getPursuits } from "@/lib/queries";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "追求",
  description: "所有正在进行的追求：摄影、界面实验、声音采集。",
};

export default async function PursuitsPage() {
  const pursuits = await getPursuits();

  return (
    <div className="pb-6">
      <header className="border-b-[0.5px] border-[var(--border)] pb-8">
        <div className="flex items-baseline justify-between">
          <p className="label">Index — 01</p>
          <p className="label">{String(pursuits.length).padStart(2, "0")} items</p>
        </div>
        <h1 className="type-display mt-6">
          追求
        </h1>
        <p className="sub mt-3">Pursuits in progress</p>
        <p className="sub-ja mt-1">進行中の追求</p>
        <p className="mt-6 max-w-xl text-base leading-[1.7] text-[var(--text-muted)]">
          每一个追求是一件事，不是一项任务。它们有的刚开始，有的快结束了，
          但都还没到可以盖上盖子的时候。
        </p>
      </header>

      <div className="tile-grid mt-12">
        {pursuits.map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) * 80}>
            <PursuitCard pursuit={p} index={i} />
          </Reveal>
        ))}
      </div>

      {pursuits.length === 0 ? (
        <div className="panel mt-10 text-center">
          <p className="text-base text-[var(--text-muted)]">还没有已发布的追求。</p>
        </div>
      ) : null}
    </div>
  );
}
