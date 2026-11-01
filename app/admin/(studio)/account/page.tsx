import Link from "next/link";
import { changePassword } from "@/app/admin/actions";
import { requireStudioAdmin } from "@/lib/supabase/session";

export const metadata = { title: "账号 · Studio" };
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const { user } = await requireStudioAdmin();

  const msg =
    error === "short"
      ? "密码至少 8 位。"
      : error === "mismatch"
        ? "两次输入不一致。"
        : error === "failed"
          ? "修改失败，稍后再试。"
          : null;

  return (
    <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-center px-8">
      <Link href="/admin" className="mb-10 inline-flex w-fit rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[14px] text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)] md:hidden">
        ←
      </Link>
      <h1 className="text-[22px] font-medium text-[var(--text)]">账号</h1>
      <p className="mt-2 text-[14px] text-[var(--text-muted)]">{user.email}</p>
      {saved === "1" ? <p className="mt-6 text-[13px] text-[var(--text-muted)]">密码已更新</p> : null}
      {msg ? <p className="mt-6 text-[13px] text-[var(--danger)]">{msg}</p> : null}
      <form action={changePassword} className="mt-10 space-y-4">
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-label="新密码"
          placeholder="新密码"
          className="plain-write text-[16px]"
        />
        <input
          type="password"
          name="confirm"
          required
          minLength={8}
          autoComplete="new-password"
          aria-label="再输一次"
          placeholder="再输一次"
          className="plain-write text-[16px]"
        />
        <button type="submit" className="mt-2 w-fit rounded-[8px] border-[0.5px] border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-[14px] text-[var(--accent)] transition hover:bg-[var(--surface-muted)]">
          保存
        </button>
      </form>
    </div>
  );
}
