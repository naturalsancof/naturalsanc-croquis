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

      <h1 className="type-display mt-8 max-w-3xl">
        先把事情做出来，
        <br />
        再决定它值不值得留下。
      </h1>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1fr]">
        <div>
          <p className="text-base leading-[1.7] text-[var(--text-muted)]">
            这个站不展示「成就」，只展示「过程」。每个追求都有自己的二级页：
            当前走到哪一步、攒下了什么作品、写过哪些笔记、用了哪些资料。
            它们会一直更新，也会一直被推翻。
          </p>
          <p className="mt-4 text-base leading-[1.7] text-[var(--text-muted)]">
            没有完成品，只有进行中的痕迹。做到一半的东西也可以先摆出来，
            因为卡住的地方往往比顺利的地方更值得记。
          </p>
          <p className="sub-ja mt-6 text-[12px]">
            ここには成果ではなく、過程が置かれている。
          </p>
          <p className="sub mt-2 text-[11px]">
            A studio for unfinished things.
          </p>
        </div>

        <div className="space-y-6">
          {[
            {
              k: "记录",
              en: "Record",
              d: "拍了什么、写了什么、做到哪一步。",
            },
            {
              k: "拆解",
              en: "Deconstruct",
              d: "把做法、材料、参考资料摊开。",
            },
            {
              k: "公开",
              en: "Publish",
              d: "不等到完美，先让它在外面站着。",
            },
          ].map((item) => (
            <div
              key={item.k}
              className="border-t-[0.5px] border-[var(--border)] pt-4"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-[16px] text-[var(--text)]">{item.k}</p>
                <p className="font-display text-[11px] text-[var(--text-soft)]">
                  {item.en}
                </p>
              </div>
              <p className="mt-2 text-[13px] leading-[1.7] text-[var(--text-muted)]">
                {item.d}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 rounded-[12px] bg-[var(--surface-inverse)] p-7 text-[var(--text-inverse)] sm:p-10">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="font-display text-[11px] text-[var(--text-inverse-muted)]">
              Colophon
            </p>
            <p className="mt-4 text-[18px] leading-[1.4] text-[var(--text-inverse)]">
              一个人，一台相机，
              <br />
              一堆没做完的事。
            </p>
          </div>
          <div className="text-[13px] leading-[1.7] text-[var(--text-inverse-muted)]">
            <p>
              站点由 Next.js 与 Supabase 搭建，内容在浏览器里直接编辑；
              页面上的文字以中文为主，英文与日文作为小字并置。
            </p>
            <p className="mt-3 font-display text-[11px] text-[var(--text-inverse-muted)]">
              Next.js · Supabase · Set in mono
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
