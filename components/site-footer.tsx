export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <p className="text-[12px] text-mist">Naturalsanc Croquis</p>
        <p className="text-[12px] text-mist">© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
