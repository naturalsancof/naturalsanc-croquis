import type { Metadata } from "next";
import Link from "next/link";
import { PursuitCard } from "@/components/pursuit-card";
import { Reveal } from "@/components/reveal";
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
    <div className="pb-6">
      {/* ---------------- HERO ---------------- */}
      <section className="relative pt-6 sm:pt-10">
        <div className="rise flex items-baseline justify-between gap-4">
          <p className="label">Personal Digital Studio — Est. 2026</p>
          <p className="label hidden sm:block">東京 / Tokyo</p>
        </div>

        <h1 className="rise mt-8 text-[15.5vw] font-semibold leading-[0.82] tracking-[-0.05em] text-ink sm:text-[9vw] lg:text-[118px]">
          NATURALSANC
          <br />
          CROQUIS
        </h1>

        <div className="rise mt-10 grid gap-8 border-t border-[var(--line)] pt-8 md:grid-cols-[1.1fr_0.9fr]">
          <p className="text-[15px] leading-[1.95] text-ink/75 sm:text-base">
            把正在学、正在做、正在卡住的事情，画成一张张草稿。
            <br className="hidden sm:block" />
            这里没有完成品，只有进行中的痕迹。
          </p>

          <div className="md:pl-8">
            <p className="sub uppercase">A studio for unfinished things.</p>
            <p className="sub-ja mt-1">未完成のものを記録するスタジオ。</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">
                <span className="h-1 w-1 rounded-full bg-ink/50" />
                {pursuits.length} 个追求
              </span>
              <span className="chip">中文 / EN / 日本語</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-5">
          <Link
            href="#pursuits"
            className="group inline-flex items-center gap-3 border border-ink bg-ink px-5 py-3 font-display text-[10px] tracking-[0.22em] text-white transition hover:bg-transparent hover:text-ink"
          >
            进入追求
            <span className="transition group-hover:translate-x-1">→</span>
          </Link>
          <span className="font-display text-[9px] tracking-[0.22em] text-mist/70">
            SCROLL
          </span>
        </div>
      </section>

      {/* ---------------- PURSUITS ---------------- */}
      <section id="pursuits" className="scroll-mt-24 pt-20">
        <div className="mb-10 flex items-end justify-between gap-4 border-b border-[var(--line)] pb-3">
          <div className="flex items-baseline gap-4">
            <span className="label">01</span>
            <h2 className="text-lg text-ink">正在进行的追求</h2>
          </div>
          <span className="label">
            Pursuits / {String(pursuits.length).padStart(2, "0")}
          </span>
        </div>

        {pursuits.length === 0 ? (
          <div className="panel p-10 text-center">
            <p className="text-sm text-mist">
              还没有已发布的追求。去后台添加第一条吧。
            </p>
          </div>
        ) : (
          <div className="stagger grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
            {pursuits.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 80}>
                <PursuitCard pursuit={p} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ---------------- ABOUT ---------------- */}
      <section id="about" className="scroll-mt-24 pt-24">
        <div className="overflow-hidden rounded-2xl bg-[#141419] p-7 text-white sm:p-12">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="font-display text-[10px] tracking-[0.24em] text-white/40">
                02 — ABOUT
              </span>
              <h2 className="mt-5 text-2xl leading-snug">
                先把事情做出来，
                <br />
                再决定它值不值得留下。
              </h2>
            </div>

            <div>
              <p className="text-sm leading-[1.95] text-white/65">
                这个站不展示「成就」，只展示「过程」。每个追求都有自己的二级页：
                当前走到哪一步、攒下了什么作品、写过哪些笔记、用了哪些资料。
                它们会一直更新，也会一直被推翻。
              </p>
              <p className="mt-4 text-xs text-white/35">
                ここには成果ではなく、過程が置かれている。
              </p>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
                {[
                  { k: "记录", en: "RECORD" },
                  { k: "拆解", en: "DECONSTRUCT" },
                  { k: "公开", en: "PUBLISH" },
                ].map((item) => (
                  <div key={item.k}>
                    <p className="text-sm text-white/85">{item.k}</p>
                    <p className="mt-1 font-display text-[8px] tracking-[0.2em] text-white/35">
                      {item.en}
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
