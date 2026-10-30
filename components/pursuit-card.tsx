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
      className="group panel block transition duration-500 hover:-translate-y-1 hover:border-white/15"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {pursuit.cover_url ? (
          <Image
            src={pursuit.cover_url}
            alt={pursuit.title}
            fill
            sizes="(max-width: 768px) 100vw, 380px"
            className="object-cover opacity-75 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-95"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a10] via-[#070a10]/20 to-transparent" />

        <span className="chip chip-accent absolute left-4 top-4">
          <span
            className="h-1 w-1 rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          {stage.en}
        </span>

        <span className="absolute bottom-4 right-4 font-display text-[10px] tracking-[0.3em] text-white/40">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="text-xl text-paper transition group-hover:text-white">
          {pursuit.title}
        </h3>
        <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          {pursuit.title_en ? (
            <span className="sub uppercase">{pursuit.title_en}</span>
          ) : null}
          {pursuit.title_ja ? (
            <span className="sub-ja">{pursuit.title_ja}</span>
          ) : null}
        </p>

        {pursuit.subtitle ? (
          <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-mist/90">
            {pursuit.subtitle}
          </p>
        ) : null}

        <div className="mt-6 flex items-center gap-2">
          {STAGES.map((s, i) => (
            <span
              key={s.key}
              className={`h-[3px] flex-1 rounded-full ${
                i <= stageIndex(pursuit.stage)
                  ? ""
                  : "bg-white/[0.07]"
              }`}
              style={
                i <= stageIndex(pursuit.stage)
                  ? {
                      background: accent,
                      boxShadow: `0 0 10px ${accent}66`,
                    }
                  : undefined
              }
            />
          ))}
          <span className="ml-2 font-display text-[9px] tracking-[0.2em] text-mist/50">
            {stage.zh}
          </span>
        </div>
      </div>
    </Link>
  );
}
