import { STAGES, stageIndex } from "@/lib/display";
import type { Milestone, Pursuit } from "@/lib/types";

export function ProgressPanel({
  pursuit,
  milestones,
}: {
  pursuit: Pursuit;
  milestones: Milestone[];
}) {
  const idx = stageIndex(pursuit.stage);
  const pct = ((idx + 1) / STAGES.length) * 100;
  const doneCount = milestones.filter((m) => m.done).length;

  return (
    <div>
      <div className="relative pt-1">
        <div className="relative h-[2px] w-full bg-ink/10">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: "var(--accent)",
            }}
          />
          {STAGES.map((s, i) => (
            <span
              key={s.key}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition"
              style={{
                left: `${((i + 0.5) / STAGES.length) * 100}%`,
                background: i <= idx ? "var(--accent)" : "#f4eff4",
                borderColor: i <= idx ? "var(--accent)" : "rgb(20 20 25 / 0.2)",
              }}
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {STAGES.map((s, i) => (
            <div key={s.key} className="min-w-0">
              <p
                className="truncate text-[13px]"
                style={{ color: i <= idx ? "#141419" : "rgb(20 20 25 / 0.4)" }}
              >
                {s.zh}
              </p>
              <p
                className="mt-1 truncate font-display text-[8px] tracking-[0.18em]"
                style={{
                  color: i === idx ? "var(--accent)" : "rgb(20 20 25 / 0.28)",
                }}
              >
                {s.en.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {pursuit.progress_note ? (
        <div
          className="mt-7 border-l-2 pl-4"
          style={{ borderColor: "var(--accent)" }}
        >
          <p className="text-[15px] leading-relaxed text-ink/85">
            {pursuit.progress_note}
          </p>
          {pursuit.progress_note_en ? (
            <p className="sub mt-2">{pursuit.progress_note_en}</p>
          ) : null}
          {pursuit.progress_note_ja ? (
            <p className="sub-ja mt-1">{pursuit.progress_note_ja}</p>
          ) : null}
        </div>
      ) : null}

      {milestones.length > 0 ? (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="label">Milestones</span>
            <span className="font-display text-[9px] tracking-[0.2em] text-mist">
              {doneCount} / {milestones.length}
            </span>
          </div>
          <ul>
            {milestones.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 border-b border-[var(--line)] py-2.5 last:border-0"
              >
                <span
                  className="mt-[3px] grid h-3.5 w-3.5 shrink-0 place-items-center border text-[8px]"
                  style={{
                    borderColor: m.done
                      ? "var(--accent)"
                      : "rgb(20 20 25 / 0.25)",
                    background: m.done ? "var(--accent)" : "transparent",
                    color: m.done ? "#fff" : "transparent",
                  }}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm ${
                      m.done ? "text-ink/45 line-through" : "text-ink"
                    }`}
                  >
                    {m.title}
                  </span>
                  {m.title_en || m.title_ja ? (
                    <span className="sub mt-0.5 block text-[10px]">
                      {[m.title_en, m.title_ja].filter(Boolean).join(" · ")}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
