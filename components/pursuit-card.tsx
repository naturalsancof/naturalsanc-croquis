import Image from "next/image";
import Link from "next/link";
import { ACCENT_HEX, STAGES, stageIndex } from "@/lib/display";
import type { Pursuit } from "@/lib/types";

export function PursuitCard({
  pursuit,
  index,
}: {
  pursuit: Pursuit;
  index: number;
}) {
  const accent = ACCENT_HEX[pursuit.accent];
  const stage = STAGES[stageIndex(pursuit.stage)];

  return (
    <Link
      href={`/pursuits/${pursuit.slug}`}
      style={{ ["--accent" as string]: accent }}
      className="group panel block transition-all duration-500 ease-out hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_28px_70px_-32px_var(--accent)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {pursuit.cover_url ? (
          <Image
            src={pursuit.cover_url}
            alt={pursuit.title}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-75 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-95"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-[#0a0b0d]/20 to-transparent" />

        {/* 手机上卡片只有一百来像素宽，标签换成一个小圆点 */}
        <span
          className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full sm:hidden"
          style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
        />
        <span className="absolute left-3 top-3 hidden sm:block">
          <span className="chip chip-accent">
            <span
              className="h-1 w-1 rounded-full"
              style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            />
            {stage.en}
          </span>
        </span>

        <span className="absolute bottom-2 right-2 font-display text-[9px] tracking-[0.24em] text-white/40">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="p-2.5 sm:p-4 lg:p-5">
        <h3 className="text-[12px] leading-snug text-paper transition group-hover:text-white sm:text-base lg:text-lg">
          {pursuit.title}
        </h3>

        <p className="mt-1 hidden flex-wrap items-baseline gap-x-2 sm:flex">
          {pursuit.title_en ? (
            <span className="sub uppercase">{pursuit.title_en}</span>
          ) : null}
          {pursuit.title_ja ? (
            <span className="sub-ja">{pursuit.title_ja}</span>
          ) : null}
        </p>

        {pursuit.subtitle ? (
          <p className="mt-2.5 hidden line-clamp-2 text-sm leading-relaxed text-mist/90 sm:block">
            {pursuit.subtitle}
          </p>
        ) : null}

        <div className="mt-2.5 flex items-center gap-1 sm:mt-5 sm:gap-2">
          {STAGES.map((s, i) => (
            <span
              key={s.key}
              className={`h-[3px] flex-1 rounded-full ${
                i <= stageIndex(pursuit.stage) ? "" : "bg-white/[0.07]"
              }`}
              style={
                i <= stageIndex(pursuit.stage)
                  ? { background: accent, boxShadow: `0 0 10px ${accent}66` }
                  : undefined
              }
            />
          ))}
          <span className="ml-1 hidden font-display text-[9px] tracking-[0.2em] text-mist/50 sm:ml-2 sm:inline">
            {stage.zh}
          </span>
        </div>
      </div>
    </Link>
  );
}
