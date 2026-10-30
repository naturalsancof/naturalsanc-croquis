import Link from "next/link";

const NAV = [
  { href: "/", label: "首页", en: "HOME" },
  { href: "/pursuits", label: "追求", en: "PURSUITS" },
  { href: "/#about", label: "关于", en: "ABOUT" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05060a]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid h-8 w-8 place-items-center border border-cyan/40 bg-cyan/5 transition group-hover:border-cyan/80">
            <span className="h-1.5 w-1.5 bg-cyan shadow-[0_0_10px_#22d3ee]" />
            <span className="absolute -right-px -top-px h-1.5 w-1.5 border-r border-t border-cyan/80" />
            <span className="absolute -bottom-px -left-px h-1.5 w-1.5 border-b border-l border-cyan/80" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[13px] tracking-[0.22em] text-paper">
              NATURALSANC
            </span>
            <span className="mt-1 block font-display text-[9px] tracking-[0.34em] text-mist/70">
              CROQUIS
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-baseline gap-2 text-[13px] text-mist transition hover:text-paper"
            >
              <span>{item.label}</span>
              <span className="font-display text-[9px] tracking-[0.2em] text-mist/40 transition group-hover:text-cyan/70">
                {item.en}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 font-display text-[10px] tracking-[0.22em] text-mist/60 sm:flex">
            <span className="h-1 w-1 animate-pulse rounded-full bg-lime shadow-[0_0_8px_#a3e635]" />
            STUDIO / ONLINE
          </span>
        </div>
      </div>
    </header>
  );
}
