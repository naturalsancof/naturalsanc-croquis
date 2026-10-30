import Image from "next/image";
import Link from "next/link";
import { ACCENT_HEX, STAGES, stageIndex } from "@/lib/display";
import type { Pursuit } from "@/lib/types";

const TILTS = [-1.6, 1.2, -0.8, 1.8];

export function PursuitCard({
  pursuit,
  index,
}: {
  pursuit: Pursuit;
  index: number;
}) {
  const accent = ACCENT_HEX[pursuit.accent];
  const stage = STAGES[stageIndex(pursuit.stage)];
  const tilt = TILTS[index % TILTS.length];

  return (
    <Link
      href={`/pursuits/${pursuit.slug}`}
      className="group block"
      style={{ ["--accent" as string]: accent }}
    >
      <div className="poster-cap">
        <span className="truncate">
          {String(index + 1).padStart(2, "0")}
          <span className="hidden sm:inline">
            {" / "}
            {pursuit.slug.replace(/-/g, "_").toUpperCase()}
          </span>
        </span>
        <span className="hidden shrink-0 sm:inline">{stage.en}</span>
      </div>

      <div
        className="poster aspect-[3/4]"
        style={{ ["--tilt" as string]: `${tilt}deg` }}
      >
        {pursuit.cover_url ? (
          <Image
            src={pursuit.cover_url}
            alt={pursuit.title}
            fill
            sizes="(max-width: 640px) 33vw, 25vw"
            className="object-cover transition duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a33] to-[#101014]" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/0" />

        <span
          className="absolute left-2 top-2 hidden h-1.5 w-1.5 rounded-full sm:block"
          style={{ background: accent, boxShadow: `0 0 0 3px rgb(255 255 255 / 0.25)` }}
        />

        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3">
          <h3 className="text-[12px] leading-tight text-white sm:text-[15px] lg:text-[17px]">
            {pursuit.title}
          </h3>
          {pursuit.title_en ? (
            <p className="mt-1 hidden truncate font-display text-[8px] tracking-[0.16em] text-white/45 sm:block">
              {pursuit.title_en.toUpperCase()}
            </p>
          ) : null}
        </div>

        <span className="absolute right-2 top-2 font-display text-[8px] tracking-[0.2em] text-white/35">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </Link>
  );
}
