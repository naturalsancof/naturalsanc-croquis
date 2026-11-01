export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-[0.5px] border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="font-display text-[11px] text-[var(--text)]">
            Naturalsanc Croquis
          </p>
          <p className="mt-2 text-[13px] text-[var(--text-muted)]">
            个人数字工作室 · 记录正在进行的追求
          </p>
          <p className="sub-ja mt-1">個人的なデジタルスタジオ</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-display text-[11px] text-[var(--text-muted)]">
          <span>© {new Date().getFullYear()}</span>
          <span>Next.js / Supabase</span>
          <span>Set in mono</span>
        </div>
      </div>
    </footer>
  );
}
