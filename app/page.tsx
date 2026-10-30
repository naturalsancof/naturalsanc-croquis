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

        <div style={{ marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}>
          <PursuitRail pursuits={pursuits} />
        </div>

      </section>

    </div>
  );
}
