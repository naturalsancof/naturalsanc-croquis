"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { createPursuit, signOut } from "@/app/admin/actions";

const OpenListContext = createContext<() => void>(() => {});

export function useOpenList() {
  return useContext(OpenListContext);
}

export type SidebarPursuit = {
  id: string;
  title: string;
  is_published: boolean;
};

function CrossMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  );
}

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
  const [open, setOpen] = useState(false);
  const [openPath, setOpenPath] = useState(pathname);
  const inDoc =
    pathname.startsWith("/admin/pursuits/") || pathname.startsWith("/admin/account");

  if (pathname !== openPath) {
    setOpenPath(pathname);
    setOpen(false);
  }

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
    <div className="notes-app fixed inset-x-0 bottom-0 top-14 z-[40] flex overflow-hidden text-[var(--text)]">
      <aside
        className={
          inDoc
            ? `${open ? "flex" : "hidden"} fixed inset-0 z-[80] h-dvh w-full min-h-0 flex-col overflow-hidden bg-[var(--surface)] md:static md:z-auto md:flex md:h-full md:w-60 md:shrink-0 md:border-r-[0.5px] md:border-[var(--border)]`
            : "flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r-[0.5px] border-[var(--border)] md:w-60"
        }
      >
        <div className="flex items-center justify-between px-4 pb-3 pt-6">
          <p className="type-section">手记</p>
          {inDoc ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭目录"
              className="press mr-auto ml-3 rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[12px] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)] md:hidden"
            >
              关闭
            </button>
          ) : null}
          <button
            type="button"
            onClick={create}
            disabled={pending}
            aria-label="新建追求"
            className="press grid h-8 w-8 place-items-center rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] text-[18px] leading-none text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
          >
            +
          </button>
        </div>
        <nav aria-label="追求列表" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-4">
          {pursuits.map((item) => {
            const active = pathname === `/admin/pursuits/${item.id}`;
            return (
              <Link
                key={item.id}
                href={`/admin/pursuits/${item.id}`}
                aria-current={active ? "page" : undefined}
                className={`press block truncate rounded-[8px] border-[0.5px] px-3 py-2 text-[16px] leading-snug ${
                  active
                    ? "border-[var(--border-strong)] bg-[var(--surface-muted)] text-[var(--text)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
                }`}
              >
                <span
                  className={`mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle ${
                    item.is_published ? "bg-[var(--text)]" : "bg-[var(--border-strong)]"
                  }`}
                  aria-hidden
                />
                {item.title || "未命名追求"}
              </Link>
            );
          })}
          {pursuits.length === 0 ? (
            <div className="px-3 py-8">
              <div className="mark !h-12 !w-12" aria-hidden>
                <CrossMark />
              </div>
              <p className="type-section mt-4">还没有稿纸</p>
              <p className="type-meta mt-1">点右上角的加号，写第一条。</p>
            </div>
          ) : null}
          {error ? <p className="px-3 pt-2 text-[12px] text-[var(--danger)]">{error}</p> : null}
        </nav>
        <div className="mt-auto flex shrink-0 items-center gap-4 border-t-[0.5px] border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[12px] text-[var(--text-muted)]">
          <Link href="/admin/account" className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]">
            账号
          </Link>
          <Link href="/" className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]">
            网站
          </Link>
          <form action={signOut}>
            <button type="submit" className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]">
              退出
            </button>
          </form>
        </div>
      </aside>
      <div className={`${inDoc ? "flex w-full" : "hidden md:flex"} relative z-[1] min-w-0 flex-1 flex-col`}>
        <OpenListContext.Provider value={() => setOpen(true)}>{children}</OpenListContext.Provider>
      </div>
    </div>
  );
}
