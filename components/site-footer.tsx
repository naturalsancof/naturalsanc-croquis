export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="font-display text-[10px] tracking-[0.3em] text-ink/80">
            NATURALSANC CROQUIS
          </p>
          <p className="mt-2 text-xs text-mist">
            个人数字工作室 · 记录正在进行的追求
          </p>
          <p className="sub-ja mt-1">個人的なデジタルスタジオ</p>
        </div>
        <div className="flex flex-wrap items-center gap-6 font-display text-[9px] tracking-[0.22em] text-mist/70">
          <span>© {new Date().getFullYear()}</span>
          <span>NEXT.JS / SUPABASE</span>
          <span>SET IN MONO</span>
        </div>
      </div>
    </footer>
  );
}
