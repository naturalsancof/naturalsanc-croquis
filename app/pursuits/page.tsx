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
      <header className="border-b border-white/5 pb-8">
        <p className="kicker">Index — 01</p>
        <h1 className="mt-5 font-display text-4xl tracking-tight text-paper sm:text-5xl">
          追求
        </h1>
        <p className="sub mt-3 uppercase">Pursuits in progress</p>
        <p className="sub-ja mt-1">進行中の追求</p>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-mist/80">
          每一个追求是一件事，不是一项任务。它们有的刚开始，有的快结束了，
          但都还没到可以盖上盖子的时候。
        </p>
      </header>

      <div className="stagger mt-10 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {pursuits.map((p, i) => (
          <Reveal key={p.id} delay={(i % 3) * 90}>
            <PursuitCard pursuit={p} index={i} />
          </Reveal>
        ))}
      </div>

      {pursuits.length === 0 ? (
        <div className="panel mt-10 p-10 text-center">
          <p className="text-sm text-mist">还没有已发布的追求。</p>
        </div>
      ) : null}
    </div>
  );
}
