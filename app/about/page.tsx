import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关于",
  description:
    "Naturalsanc Croquis 是一个记录「正在进行的追求」的个人数字工作室：不做成果陈列，只保留过程中的痕迹。",
};

export default function AboutPage() {
  return (
    <div className="pb-10">
      <p className="label">About — 关于</p>

      <h1 className="gradient-title mt-8 max-w-3xl text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[46px]">
        先把事情做出来，
        <br />
        再决定它值不值得留下。
      </h1>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-sm leading-[1.95] text-ink/70">
            这个站不展示「成就」，只展示「过程」。每个追求都有自己的二级页：
            当前走到哪一步、攒下了什么作品、写过哪些笔记、用了哪些资料。
            它们会一直更新，也会一直被推翻。
          </p>
          <p className="mt-4 text-sm leading-[1.95] text-ink/50">
            没有完成品，只有进行中的痕迹。做到一半的东西也可以先摆出来，
            因为卡住的地方往往比顺利的地方更值得记。
          </p>
          <p className="sub-ja mt-6 text-xs">
            ここには成果ではなく、過程が置かれている。
          </p>
          <p className="sub mt-2 text-[10px]">
            A STUDIO FOR UNFINISHED THINGS.
          </p>
        </div>

        <div className="space-y-6">
          {[
            {
              k: "记录",
              en: "RECORD",
              d: "拍了什么、写了什么、做到哪一步。",
            },
            {
              k: "拆解",
              en: "DECONSTRUCT",
              d: "把做法、材料、参考资料摊开。",
            },
            {
              k: "公开",
              en: "PUBLISH",
              d: "不等到完美，先让它在外面站着。",
            },
          ].map((item) => (
            <div
              key={item.k}
              className="border-t border-[var(--line)] pt-4"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm text-ink">{item.k}</p>
                <p className="font-display text-[8px] tracking-[0.22em] text-mist/60">
                  {item.en}
                </p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-mist">{item.d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-2xl bg-[#141419] p-7 text-white sm:p-10">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-display text-[9px] tracking-[0.24em] text-white/35">
              COLOPHON
            </p>
            <p className="mt-4 text-lg leading-snug text-white/85">
              一个人，一台相机，
              <br />
              一堆没做完的事。
            </p>
          </div>
          <div className="text-[12px] leading-[1.9] text-white/50">
            <p>
              站点由 Next.js 与 Supabase 搭建，内容在浏览器里直接编辑；
              页面上的文字以中文为主，英文与日文作为小字并置。
            </p>
            <p className="mt-3 font-display text-[10px] tracking-[0.16em] text-white/30">
              NEXT.JS · SUPABASE · SET IN MONO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
