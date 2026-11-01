import { STAGES, stageIndex } from "@/lib/display";
import type { Milestone, Pursuit } from "@/lib/types";

function CheckIcon() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2.5 6.2l2.2 2.2 4.8-4.8" />
    </svg>
  );
}

export function ProgressPanel({
  pursuit,
  milestones,
}: {
  pursuit: Pursuit;
  milestones: Milestone[];
}) {
  const idx = stageIndex(pursuit.stage);
  // Dots sit at the midpoint of each segment; the bar lands on the current one.
  const pct = ((idx + 0.5) / STAGES.length) * 100;
  const doneCount = milestones.filter((m) => m.done).length;

  return (
    <div>
      <div className="relative pt-1">
        <div className="relative h-[0.5px] w-full bg-[var(--border)]">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--accent)]"
            style={{ width: `${pct}%` }}
          />
          {STAGES.map((s, i) => (
            <span
              key={s.key}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-[0.5px]"
              style={{
                left: `${((i + 0.5) / STAGES.length) * 100}%`,
                background:
                  i <= idx ? "var(--accent)" : "var(--surface)",
                borderColor:
                  i <= idx ? "var(--accent)" : "var(--border-strong)",
              }}
              aria-hidden
            />
          ))}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {STAGES.map((s, i) => (
            <div key={s.key} className="min-w-0">
              <p
                className="truncate text-[13px]"
                style={{
                  color: i <= idx ? "var(--text)" : "var(--text-soft)",
                }}
              >
                {s.zh}
              </p>
              <p
                className="mt-1 truncate font-display text-[11px]"
                style={{
                  color: i === idx ? "var(--accent)" : "var(--text-soft)",
                }}
              >
                {s.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {pursuit.progress_note ? (
        <div className="mt-7 border-l-[0.5px] border-[var(--accent)] pl-4">
          <p className="text-base leading-[1.7] text-[var(--text)]">
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
          <div className="mb-3 flex items-center justify-between border-b-[0.5px] border-[var(--border)] pb-2">
            <span className="label">Milestones</span>
            <span className="font-display text-[11px] text-[var(--text-muted)]">
              {doneCount} / {milestones.length}
            </span>
          </div>
          <ul>
            {milestones.map((m) => (
              <li
                key={m.id}
                className="flex items-start gap-3 border-b-[0.5px] border-[var(--border)] py-2.5 last:border-0"
              >
                <span
                  className="mt-[3px] grid h-3.5 w-3.5 shrink-0 place-items-center border-[0.5px]"
                  style={{
                    borderColor: m.done
                      ? "var(--accent)"
                      : "var(--border-strong)",
                    background: m.done ? "var(--accent)" : "var(--transparent)",
                    color: m.done ? "var(--accent-contrast)" : "var(--transparent)",
                  }}
                  aria-hidden
                >
                  <CheckIcon />
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-base ${
                      m.done ? "text-[var(--text-soft)] line-through" : "text-[var(--text)]"
                    }`}
                  >
                    {m.title}
                  </span>
                  {m.title_en || m.title_ja ? (
                    <span className="sub mt-0.5 block text-[11px]">
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
