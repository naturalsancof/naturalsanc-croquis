import Link from "next/link";
import { signOut } from "@/app/admin/actions";

export function AdminTopBar() {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="font-display text-[11px] tracking-[0.24em] text-paper transition hover:text-cyan"
        >
          STUDIO
        </Link>
        <span className="font-display text-[9px] tracking-[0.2em] text-mist/30">
          ADMIN
        </span>
      </div>

      <div className="flex items-center gap-5 font-display text-[10px] tracking-[0.18em]">
        <Link href="/admin/account" className="text-mist/60 transition hover:text-paper">
          账号
        </Link>
        <Link href="/" className="text-mist/60 transition hover:text-paper">
          查看网站 ↗
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="cursor-pointer text-mist/40 transition hover:text-red-300"
          >
            退出
          </button>
        </form>
      </div>
    </div>
  );
}
