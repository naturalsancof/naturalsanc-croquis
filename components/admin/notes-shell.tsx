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
    <div className="notes-app fixed inset-0 z-[70] flex h-dvh overflow-hidden text-ink">
      <aside
        className={`${
          inDoc ? "hidden md:flex" : "flex"
        } h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-ink/10 md:w-[248px]`}
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-6">
          <p className="font-display text-[20px] tracking-[-0.03em] text-ink">手记</p>
          <button
            type="button"
            onClick={create}
            disabled={pending}
            aria-label="新建追求"
            className="press grid h-8 w-8 place-items-center rounded-full text-[20px] leading-none text-ink/70"
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
                className={`press mb-0.5 block truncate rounded-lg px-3 py-2 text-[15px] leading-snug ${
                  active ? "bg-white/80 text-ink shadow-[inset_2px_0_0_#6d63ae]" : "text-ink/75"
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
            <div className="px-3 py-8">
              <div className="mark !h-12 !w-12 !shadow-none" aria-hidden>
                <span className="!text-[16px]">✕</span>
              </div>
              <p className="mt-4 font-display text-[18px] text-ink">还没有稿纸</p>
              <p className="mt-1 text-[13px] leading-relaxed text-mist">点右上角的加号，写第一条。</p>
            </div>
          ) : null}
          {error ? <p className="px-3 pt-2 text-[12px] text-red-700">{error}</p> : null}
        </nav>
        <div className="mt-auto flex shrink-0 items-center gap-4 border-t border-ink/10 bg-[#f6f3f8] px-4 py-3 text-[12px] text-mist">
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
