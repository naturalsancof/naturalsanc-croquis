export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-8">
        <div>
          <p className="font-display text-[11px] tracking-[0.3em] text-mist/70">
            NATURALSANC CROQUIS
          </p>
          <p className="mt-2 text-xs text-mist/50">
            个人数字工作室 · 记录正在进行的追求
          </p>
          <p className="sub-ja mt-1">個人的なデジタルスタジオ</p>
        </div>
        <div className="flex items-center gap-6 font-display text-[10px] tracking-[0.24em] text-mist/40">
          <span>© {new Date().getFullYear()}</span>
          <span>NEXT.JS / SUPABASE</span>
          <span className="text-cyan/50">BUILT IN THE DARK</span>
        </div>
      </div>
    </footer>
  );
}
