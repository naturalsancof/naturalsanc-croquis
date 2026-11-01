"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { createPursuit, signOut } from "@/app/admin/actions";

export type SidebarPursuit = {
  id: string;
  title: string;
  is_published: boolean;
};

export function NotesShell({
  pursuits,
  children,
}: {
  pursuits: SidebarPursuit[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inDoc =
    pathname.startsWith("/admin/pursuits/") || pathname.startsWith("/admin/account");

  const create = () => {
    setError(null);
    const fd = new FormData();
    fd.set("title", "未命名追求");
    fd.set("slug", `p-${Date.now().toString(36)}`);
    start(async () => {
      const res = await createPursuit({}, fd);
      if (!res.id) {
        setError(res.error === "slug-taken" ? "网址刚被占用，再试一次。" : "没有建成。");
        return;
      }
      router.push(`/admin/pursuits/${res.id}`);
    });
  };

  return (
    <div className="notes-app fixed inset-0 z-[70] flex text-ink">
      <aside
        className={`${
          inDoc ? "hidden md:flex" : "flex"
        } w-full shrink-0 flex-col border-r border-ink/10 md:w-[248px]`}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-5">
          <p className="font-display text-[10px] tracking-[0.22em] text-mist">追求</p>
          <button
            type="button"
            onClick={create}
            disabled={pending}
            aria-label="新建追求"
            className="grid h-8 w-8 place-items-center text-[20px] leading-none text-mist hover:text-ink"
          >
            +
          </button>
        </div>
        <nav aria-label="追求列表" className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {pursuits.map((item) => {
            const active = pathname === `/admin/pursuits/${item.id}`;
            return (
              <Link
                key={item.id}
                href={`/admin/pursuits/${item.id}`}
                aria-current={active ? "page" : undefined}
                className={`mb-0.5 block truncate rounded-lg px-3 py-2 text-[15px] ${
                  active ? "bg-ink/[0.05] text-ink" : "text-ink/75 hover:bg-ink/[0.03]"
                }`}
              >
                <span
                  className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                    item.is_published ? "bg-ink/70" : "bg-ink/20"
                  }`}
                  aria-hidden
                />
                {item.title || "未命名追求"}
              </Link>
            );
          })}
          {pursuits.length === 0 ? (
            <p className="px-3 py-6 text-[13px] text-mist">还没有追求。</p>
          ) : null}
          {error ? <p className="px-3 pt-2 text-[12px] text-red-700">{error}</p> : null}
        </nav>
        <div className="flex items-center gap-4 border-t border-ink/10 px-4 py-3 text-[12px] text-mist">
          <Link href="/admin/account" className="hover:text-ink">
            账号
          </Link>
          <Link href="/" className="hover:text-ink">
            网站
          </Link>
          <form action={signOut}>
            <button type="submit" className="hover:text-ink">
              退出
            </button>
          </form>
        </div>
      </aside>
      <div className={`${inDoc ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        {children}
      </div>
    </div>
  );
}
