export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl items-end justify-between px-5 py-8 sm:px-8">
        <div>
          <p className="font-display text-[18px] text-ink">Croquis</p>
          <p className="mt-1 text-[13px] leading-relaxed text-mist">
            个人数字工作室 · 记录还没画完的事
          </p>
        </div>
        <p className="font-display text-[13px] text-mist">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
