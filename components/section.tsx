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
    <section className="panel rise p-5 sm:p-7">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div className="flex items-baseline gap-3">
          <span className="label">{index}</span>
          <h2 className="text-[15px] text-ink">{title}</h2>
        </div>
        <span className="label">{en}</span>
      </div>
      {aside ? (
        <div className="mb-5 text-sm leading-relaxed text-ink/65">{aside}</div>
      ) : null}
      {children}
    </section>
  );
}
