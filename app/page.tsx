import type { Metadata } from "next";
import { PursuitRail } from "@/components/pursuit-rail";
import { getPursuits } from "@/lib/queries";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "首页",
  description:
    "Naturalsanc Croquis 是一个个人数字工作室，记录正在进行的追求：胶片摄影、字体采集、界面考古与木工。",
};

export default async function HomePage() {
  const pursuits = await getPursuits();

  return (
    <div className="pb-6">
      {/* ---------------- RAIL ---------------- */}
      <section className="flex min-h-[calc(100svh-9rem)] flex-col justify-between pt-2">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="label">Personal Digital Studio</p>
            <p className="label mt-1 text-mist/70">
              把进行中的事情，一张一张摆出来
            </p>
          </div>
          <div className="text-right">
            <p className="label">Est. 2026</p>
            <p className="label mt-1 text-mist/70">東京 / Tokyo</p>
          </div>
        </div>

        <PursuitRail pursuits={pursuits} />

        <div className="flex items-end justify-between border-t border-[var(--line)] pt-4">
          <p className="label">Drag ←→ · Click to open</p>
          <p className="label hidden sm:block">
            {String(pursuits.length).padStart(2, "0")} Pursuits
          </p>
          <p className="label">©2026</p>
        </div>
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
