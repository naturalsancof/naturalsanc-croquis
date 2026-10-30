import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-[11px] tracking-[0.4em] text-mist/50">
        404 — NOT FOUND
      </p>
      <h1 className="mt-6 font-display text-5xl tracking-tight text-paper">
        这张草稿丢了
      </h1>
      <p className="sub mt-4 uppercase">This croquis is missing</p>
      <p className="sub-ja mt-1">このクロッキーは見つかりません</p>

      <p className="mt-6 max-w-sm text-sm leading-relaxed text-mist/70">
        可能是链接写错了，也可能这个追求还没公开。回到首页看看别的。
      </p>

      <Link
        href="/"
        className="mt-8 border border-cyan/40 bg-cyan/[0.06] px-6 py-3 font-display text-[11px] tracking-[0.24em] text-cyan transition hover:border-cyan/80 hover:bg-cyan/10"
      >
        ← 回到首页
      </Link>
    </div>
  );
}
