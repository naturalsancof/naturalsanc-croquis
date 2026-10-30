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
      {/* 阶段轨道 */}
      <div className="relative pt-1">
        <div className="relative h-[2px] w-full bg-white/[0.08]">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent))",
              boxShadow: "0 0 16px var(--accent)",
              opacity: 0.9,
            }}
          />
          {STAGES.map((s, i) => (
            <span
              key={s.key}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition"
              style={{
                left: `${((i + 0.5) / STAGES.length) * 100}%`,
                background: i <= idx ? "var(--accent)" : "#05060a",
                borderColor: i <= idx ? "var(--accent)" : "rgba(255,255,255,0.16)",
                boxShadow: i <= idx ? "0 0 12px var(--accent)" : "none",
              }}
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {STAGES.map((s, i) => (
            <div key={s.key} className="min-w-0">
              <p
                className="truncate text-[13px] transition"
                style={{
                  color: i <= idx ? "#e8eef7" : "rgba(139,149,167,0.55)",
                }}
              >
                {s.zh}
              </p>
              <p
                className="mt-1 truncate font-display text-[9px] tracking-[0.18em]"
                style={{
                  color:
                    i === idx
                      ? "var(--accent)"
                      : "rgba(139,149,167,0.35)",
                }}
              >
                {s.en.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 阶段说明 */}
      {pursuit.progress_note ? (
        <div className="mt-7 border-l pl-4" style={{ borderColor: "var(--accent)" }}>
          <p className="text-[15px] leading-relaxed text-paper/90">
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

      {/* 里程碑 */}
      {milestones.length > 0 ? (
        <div className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <span className="kicker">Milestones</span>
            <span className="font-display text-[10px] tracking-[0.2em] text-mist/50">
              {doneCount} / {milestones.length}
            </span>
          </div>
          <ul className="space-y-2">
            {milestones.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white/[0.02]"
              >
                <span
                  className="mt-[3px] grid h-4 w-4 shrink-0 place-items-center rounded-[4px] border text-[9px]"
                  style={{
                    borderColor: m.done ? "var(--accent)" : "rgba(255,255,255,0.18)",
                    background: m.done
                      ? "color-mix(in oklab, var(--accent) 18%, transparent)"
                      : "transparent",
                    color: m.done ? "var(--accent)" : "transparent",
                  }}
                  aria-hidden
                >
                  ✓
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm ${
                      m.done ? "text-paper/70" : "text-paper"
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
