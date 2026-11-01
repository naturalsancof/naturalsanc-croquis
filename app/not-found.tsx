import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="label">404 — Not found</p>
      <h1 className="mt-6 text-[22px] font-medium text-[var(--text)]">
        这张草稿丢了
      </h1>
      <p className="sub mt-4">This croquis is missing</p>
      <p className="sub-ja mt-1">このクロッキーは見つかりません</p>

      <p className="mt-6 max-w-sm text-base leading-[1.7] text-[var(--text-muted)]">
        可能是链接写错了，也可能这个追求还没公开。回到首页看看别的。
      </p>

      <Link
        href="/"
        className="mt-8 rounded-[8px] border-[0.5px] border-[var(--text)] bg-[var(--surface-inverse)] px-6 py-3 font-display text-[11px] text-[var(--text-inverse)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
      >
        ← 回到首页
      </Link>
    </div>
  );
}
