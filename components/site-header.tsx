import Link from "next/link";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/pursuits", label: "追求" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-[#f7f5f8]/75 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="font-display text-[11px] tracking-[0.22em] text-ink">
          CROQUIS
        </Link>
        <nav aria-label="站点" className="flex items-center gap-5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[14px] text-ink/70 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
