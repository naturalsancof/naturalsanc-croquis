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
      <section className="flex h-[calc(100svh-9rem)] flex-col">
        {/* 顶部：空心巨字，顶出画外只露下半截 */}
        <div
          className="shrink-0"
          style={{
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
          }}
        >
          <h1
            className="gradient-title select-none whitespace-nowrap px-5 font-semibold uppercase leading-[0.9] tracking-[-0.045em] sm:px-8"
            style={{
              fontSize: "clamp(56px, 11vw, 148px)",
            }}
          >
            Croquis
          </h1>
        </div>

        <div
          className="mt-3 flex shrink-0 items-center gap-4 px-5 sm:px-8"
          style={{
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
          }}
        >
          <p className="text-[13px] text-mist">个人数字工作室</p>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <div
          className="flex min-h-0 flex-1 flex-col"
          style={{
            marginLeft: "calc(50% - 50vw)",
            marginRight: "calc(50% - 50vw)",
          }}
        >
          <PursuitRail pursuits={pursuits} />
        </div>
      </section>
    </div>
  );
}
