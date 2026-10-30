import Link from "next/link";

const NAV = [
  { href: "/", label: "首页", en: "HOME", ja: "ホーム" },
  { href: "/pursuits", label: "追求", en: "PURSUITS", ja: "追求" },
  { href: "/about", label: "关于", en: "ABOUT", ja: "アバウト" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-white/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid h-7 w-7 place-items-center border border-[var(--line-strong)] bg-white/60">
            <span className="font-display text-[11px] leading-none text-ink">✕</span>
          </span>
          <span className="leading-none">
            <span className="block font-display text-[11px] tracking-[0.22em] text-ink">
              NATURALSANC
            </span>
            <span className="mt-1 block font-display text-[8px] tracking-[0.34em] text-mist">
              CROQUIS
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-4 md:gap-8">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="group shrink-0 whitespace-nowrap rounded-md px-3 py-2.5 text-center transition hover:bg-white/50 sm:px-2.5 sm:py-2">
              <span className="block font-display text-[10px] tracking-[0.12em] text-ink/70 transition group-hover:text-ink sm:tracking-[0.18em]">
                {item.label}
                <span className="hidden sm:inline"> {item.en}</span>
              </span>
              <span className="mt-1 hidden text-[9px] text-mist/60 md:block">
                {item.ja}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-display text-[9px] tracking-[0.2em] text-mist/70 sm:flex">
            <span className="h-1 w-1 rounded-full bg-ink/40" />
            STUDIO / ONLINE
          </span>
        </div>
      </div>
    </header>
  );
}
