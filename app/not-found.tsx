import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="label">404 — Not Found</p>
      <h1 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-ink sm:text-5xl">
        这张草稿丢了
      </h1>
      <p className="sub mt-4 uppercase">This croquis is missing</p>
      <p className="sub-ja mt-1">このクロッキーは見つかりません</p>

      <p className="mt-6 max-w-sm text-sm leading-relaxed text-ink/60">
        可能是链接写错了，也可能这个追求还没公开。回到首页看看别的。
      </p>

      <Link
        href="/"
        className="mt-8 border border-ink bg-ink px-6 py-3 font-display text-[10px] tracking-[0.22em] text-white transition hover:bg-transparent hover:text-ink"
      >
        ← 回到首页
      </Link>
    </div>
  );
}
