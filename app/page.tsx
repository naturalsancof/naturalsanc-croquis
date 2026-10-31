import type { Metadata } from "next";
import { PursuitRail } from "@/components/pursuit-rail";
import { getPursuits } from "@/lib/queries";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "首页",
  description:
    "Naturalsanc Croquis 是一个个人数字工作室，记录正在进行的追求：插画、摄影、字体与行旅。",
};

export default async function HomePage() {
  const pursuits = await getPursuits();

  return (
    <div className="pb-6">
      <section className="flex h-[calc(100svh-9rem)] flex-col justify-between pt-2">
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

        <div
          className="relative"
          style={{
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
          }}
        >
          {/* 竖排题签：给轨道留出左侧 112px，卡片仍然从右边出界 */}
          <div className="pointer-events-none absolute left-6 top-1/2 z-20 hidden -translate-y-1/2 select-none items-start gap-4 lg:flex">
            <p
              className="font-display text-ink/80"
              style={{
                writingMode: "vertical-rl",
                fontSize: 40,
                letterSpacing: "0.3em",
                lineHeight: 1,
              }}
            >
              CROQUIS
            </p>
            <p
              className="mt-2 text-[11px] text-mist"
              style={{
                writingMode: "vertical-rl",
                letterSpacing: "0.18em",
              }}
            >
              素描 · 草稿 · 進行中
            </p>
          </div>

          <div className="lg:pl-28">
            <PursuitRail pursuits={pursuits} />
          </div>
        </div>
      </section>
    </div>
  );
}
