import Link from "next/link";
import { signOut } from "@/app/admin/actions";

function ArrowUpRight() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l6-6M4.5 3H9v4.5" />
    </svg>
  );
}

export function AdminTopBar() {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-[0.5px] border-[var(--border)] pb-4">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="font-display text-[11px] text-[var(--text)] transition hover:text-[var(--accent)]"
        >
          Studio
        </Link>
        <span className="font-display text-[11px] text-[var(--text-soft)]">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-5 font-display text-[11px]">
        <Link href="/admin/account" className="text-[var(--text-muted)] transition hover:text-[var(--text)]">
          账号
        </Link>
        <Link href="/" className="flex items-center gap-1 text-[var(--text-muted)] transition hover:text-[var(--text)]">
          查看网站
          <ArrowUpRight />
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="cursor-pointer text-[var(--text-muted)] transition hover:text-[var(--danger)]"
          >
            退出
          </button>
        </form>
      </div>
    </div>
  );
}
