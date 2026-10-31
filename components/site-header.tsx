import Link from "next/link";

const NAV = [
  { href: "/", label: "首页", en: "HOME", ja: "ホーム" },
  { href: "/pursuits", label: "追求", en: "PURSUITS", ja: "追求" },
  { href: "/about", label: "关于", en: "ABOUT", ja: "アバウト" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-5 sm:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 sm:gap-3">
          <span className="relative grid h-7 w-7 place-items-center border border-[var(--line-strong)] bg-white/60">
            <span className="font-display text-[11px] leading-none text-ink">✕</span>
          </span>
          <span className="leading-none">
            <span className="hidden font-display text-[11px] tracking-[0.22em] text-ink sm:block">
              NATURALSANC
            </span>
            <span className="block font-display text-[8px] tracking-[0.34em] text-mist sm:mt-1">
              CROQUIS
            </span>
          </span>
        </Link>

        {/* 手机上跟桌面同一套：中文 + 英文、44px 高可点区域 */}
        <nav className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-4 md:absolute md:left-1/2 md:-translate-x-1/2 md:gap-8">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group shrink-0 whitespace-nowrap rounded-md px-2.5 py-2.5 text-center transition hover:bg-white/60 sm:px-2.5 sm:py-2"
            >
              <span className="block font-display text-[12px] tracking-[0.06em] text-ink/75 transition group-hover:text-ink sm:inline sm:text-[10px] sm:tracking-[0.2em] sm:text-mist">
                {item.label}
              </span>
              <span className="mt-0.5 block font-display text-[7px] tracking-[0.2em] text-mist/60 transition group-hover:text-mist sm:mt-0 sm:ml-1 sm:inline sm:text-[10px] sm:tracking-[0.2em] sm:text-mist">
                {item.en}
              </span>
              <span className="mt-1 hidden text-[9px] text-mist/60 md:block">
                {item.ja}
              </span>
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <span className="flex items-center gap-2 font-display text-[9px] tracking-[0.2em] text-mist/70">
            <span className="h-1 w-1 rounded-full bg-ink/40" />
            STUDIO / ONLINE
          </span>
        </div>
      </div>
    </header>
  );
}
