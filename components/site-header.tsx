import Link from "next/link";

const NAV = [
  { href: "/", label: "首页", en: "Home", ja: "ホーム" },
  { href: "/pursuits", label: "追求", en: "Pursuits", ja: "追求" },
  { href: "/about", label: "关于", en: "About", ja: "アバウト" },
];

function MarkIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 2l8 8M10 2l-8 8" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b-[0.5px] border-[var(--border)] bg-[var(--surface)]">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-5 sm:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 sm:gap-3">
          <span className="relative grid h-7 w-7 place-items-center rounded-[8px] border-[0.5px] border-[var(--border-strong)] bg-[var(--surface-muted)] text-[var(--text)]">
            <MarkIcon />
          </span>
          <span className="leading-none">
            <span className="hidden font-display text-[11px] text-[var(--text)] sm:block">
              Naturalsanc
            </span>
            <span className="block font-display text-[11px] text-[var(--text-muted)] sm:mt-1">
              Croquis
            </span>
          </span>
        </Link>

        {/* Same on mobile and desktop: Chinese + English, 44px tap target. */}
        <nav className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-4 md:absolute md:left-1/2 md:-translate-x-1/2 md:gap-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group shrink-0 whitespace-nowrap rounded-[8px] px-2.5 py-2.5 text-center transition hover:bg-[var(--surface-muted)] sm:px-2.5 sm:py-2"
            >
              <span className="block font-display text-[12px] text-[var(--text-muted)] transition group-hover:text-[var(--text)] sm:inline sm:text-[11px]">
                {item.label}
              </span>
              <span className="mt-0.5 block font-display text-[11px] text-[var(--text-soft)] transition group-hover:text-[var(--text-muted)] sm:mt-0 sm:ml-1 sm:inline sm:text-[11px]">
                {item.en}
              </span>
              <span className="mt-1 hidden text-[11px] text-[var(--text-soft)] md:block">
                {item.ja}
              </span>
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <span className="flex items-center gap-2 font-display text-[11px] text-[var(--text-muted)]">
            <span className="h-1 w-1 rounded-full bg-[var(--accent)]" aria-hidden />
            Studio / online
          </span>
        </div>
      </div>
    </header>
  );
}
