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
    <section className="panel rise">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3 border-b-[0.5px] border-[var(--border)] pb-3">
        <div className="flex items-baseline gap-3">
          <span className="label">{index}</span>
          <h2 className="text-[18px] font-medium text-[var(--text)]">{title}</h2>
        </div>
        <span className="label">{en}</span>
      </div>
      {aside ? (
        <div className="mb-5 text-base leading-[1.7] text-[var(--text-muted)]">{aside}</div>
      ) : null}
      {children}
    </section>
  );
}
