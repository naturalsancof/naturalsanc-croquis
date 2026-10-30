import type { ReactNode } from "react";

export function Section({
  index,
  title,
  en,
  children,
  aside,
}: {
  index: string;
  title: string;
  en: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="panel rise p-6 sm:p-8">
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-4">
          <span
            className="font-display text-[11px] tracking-[0.3em]"
            style={{ color: "var(--accent)" }}
          >
            {index}
          </span>
          <h2 className="text-lg text-paper">{title}</h2>
        </div>
        <span className="font-display text-[10px] tracking-[0.28em] text-mist/40">
          {en}
        </span>
      </div>
      {aside ? <div className="mb-6">{aside}</div> : null}
      {children}
    </section>
  );
}
