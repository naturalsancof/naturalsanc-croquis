import type { Metadata } from "next";
import Link from "next/link";
import { PursuitCard } from "@/components/pursuit-card";
import { getPursuits } from "@/lib/queries";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "首页",
  description:
    "Naturalsanc Croquis 是一个个人数字工作室，记录正在进行的追求：胶片摄影、界面实验与城市声音。",
};

export default async function HomePage() {
  const pursuits = await getPursuits();

  return (
    <div className="pb-4">
      {/* ---------------- HERO ---------------- */}
      <section className="relative pt-6 sm:pt-10">
        <p className="kicker rise">Personal Digital Studio — Est. 2026</p>

        <h1 className="rise mt-6 font-display text-[13vw] leading-[0.88] tracking-[-0.02em] text-paper sm:text-[76px] lg:text-[92px]">
          NATURALSANC
          <span className="glow mt-1 block text-cyan">CROQUIS</span>
        </h1>

        <div className="rise mt-8 grid grid-cols-1 gap-8 border-t border-white/5 pt-8 md:grid-cols-[1.1fr_0.9fr]">
          <p className="text-[15px] leading-[1.9] text-mist sm:text-base">
            把正在学、正在做、正在卡住的事情，画成一张张草稿。
            <br className="hidden sm:block" />
            这里没有完成品，只有进行中的痕迹。
          </p>

          <div className="space-y-2 md:pl-8">
            <p className="sub uppercase">A studio for unfinished things.</p>
            <p className="sub-ja">未完成のものを記録するスタジオ。</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">
                <span className="h-1 w-1 rounded-full bg-cyan shadow-[0_0_8px_#22d3ee]" />
                {pursuits.length} 个追求
              </span>
              <span className="chip">中文 / EN / 日本語</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="#pursuits"
            className="group inline-flex items-center gap-3 border border-white/15 bg-white/[0.02] px-5 py-3 font-display text-[11px] tracking-[0.24em] text-paper transition hover:border-cyan/50 hover:bg-cyan/[0.06]"
          >
            进入追求
            <span className="text-cyan transition group-hover:translate-x-1">
              →
            </span>
          </Link>
          <span className="font-display text-[10px] tracking-[0.22em] text-mist/40">
            SCROLL
          </span>
        </div>
      </section>

      {/* ---------------- PURSUITS ---------------- */}
      <section id="pursuits" className="scroll-mt-24 pt-20">
        <div className="mb-8 flex items-end justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-baseline gap-4">
            <span className="font-display text-[11px] tracking-[0.3em] text-cyan/80">
              01
            </span>
            <h2 className="text-xl text-paper">正在进行的追求</h2>
          </div>
          <span className="font-display text-[10px] tracking-[0.28em] text-mist/40">
            PURSUITS
          </span>
        </div>

        {pursuits.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-sm text-mist">
              还没有已发布的追求。去 Supabase 的 pursuits 表里添加第一条吧。
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pursuits.map((p, i) => (
              <PursuitCard key={p.id} pursuit={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section id="about" className="scroll-mt-24 pt-20">
        <div className="panel p-7 sm:p-10">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="kicker">02 — About</span>
              <h2 className="mt-4 text-2xl leading-snug text-paper">
                先把事情做出来，
                <br />
                再决定它值不值得留下。
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-sm leading-[1.95] text-mist">
                这个站不展示「成就」，只展示「过程」。每个追求都有自己的二级页：
                当前走到哪一步、攒下了什么作品、写过哪些笔记、用了哪些资料。
                它们会一直更新，也会一直被推翻。
              </p>
              <p className="sub-ja leading-relaxed">
                ここには成果ではなく、過程が置かれている。
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { k: "记录", en: "Record" },
                  { k: "拆解", en: "Deconstruct" },
                  { k: "公开", en: "Publish" },
                ].map((item) => (
                  <div key={item.k} className="border-l border-white/10 pl-3">
                    <p className="text-sm text-paper/90">{item.k}</p>
                    <p className="mt-1 font-display text-[9px] tracking-[0.2em] text-mist/40">
                      {item.en.toUpperCase()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
