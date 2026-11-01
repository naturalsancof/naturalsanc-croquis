import Image from "next/image";
import Link from "next/link";
import { STAGES, stageIndex } from "@/lib/display";
import type { Pursuit } from "@/lib/types";

function brief(text: string, max = 5) {
  const words = text.trim().split(/\s+/);
  return words.length <= max ? text : `${words.slice(0, max).join(" ")}…`;
}

export function PursuitCard({
  pursuit,
  index,
}: {
  pursuit: Pursuit;
  index: number;
}) {
  const stage = STAGES[stageIndex(pursuit.stage)];

  return (
    <Link href={`/pursuits/${pursuit.slug}`} className="group block">
      <div className="poster-cap">
        <span className="truncate">
          {String(index + 1).padStart(2, "0")}
          <span className="hidden sm:inline">
            {" / "}
            {pursuit.slug.replace(/-/g, "_")}
          </span>
        </span>
        <span className="hidden shrink-0 sm:inline">{stage.en}</span>
      </div>

      <div className="poster aspect-[3/4]">
        {pursuit.cover_url ? (
          <Image
            src={pursuit.cover_url}
            alt={pursuit.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--surface-muted)]" />
        )}

        <span
          className="absolute left-2 top-2 hidden h-1.5 w-1.5 rounded-full bg-[var(--accent)] sm:block"
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 bg-[var(--media-scrim)] p-2 sm:p-3">
          <h3 className="text-[16px] font-medium leading-[1.3] text-[var(--on-image)]">
            {pursuit.title}
          </h3>
          {pursuit.title_en ? (
            <p className="mt-1 hidden truncate font-display text-[11px] text-[var(--on-image-soft)] sm:block">
              {brief(pursuit.title_en)}
            </p>
          ) : null}
        </div>

        <span className="absolute right-2 top-2 bg-[var(--media-scrim)] px-1.5 py-0.5 font-display text-[11px] text-[var(--on-image-soft)]">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
    </Link>
  );
}
