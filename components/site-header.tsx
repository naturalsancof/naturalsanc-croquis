import Link from "next/link";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/pursuits", label: "追求" },
  { href: "/about", label: "关于" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-[#f6f3f8]/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="press flex items-center gap-2 rounded-full px-1.5 py-1 text-ink">
          <span className="type-section">Croquis</span>
        </Link>
        <nav aria-label="站点" className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="press rounded-full px-3 py-1.5 text-[14px] tracking-[-0.01em] text-ink/70 hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
