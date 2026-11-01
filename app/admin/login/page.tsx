import Link from "next/link";
import { signIn } from "@/app/admin/actions";

export const metadata = { title: "登录 · Studio" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <Link href="/" className="mb-10 inline-flex w-fit rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-[14px] text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text)]">
        ←
      </Link>
      <h1 className="text-[22px] font-medium text-[var(--text)]">登录</h1>
      {error ? (
        <p className="mt-6 text-[13px] text-[var(--danger)]">
          {error === "forbidden" ? "这个账号没有编辑权限。" : "邮箱或密码不对。"}
        </p>
      ) : null}
      <form action={signIn} className="mt-10 space-y-4">
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          aria-label="邮箱"
          placeholder="邮箱"
          className="plain-write text-[16px]"
        />
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-label="密码"
          placeholder="密码"
          className="plain-write text-[16px]"
        />
        <button type="submit" className="mt-2 w-fit rounded-[8px] border-[0.5px] border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-2 text-[14px] text-[var(--accent)] transition hover:bg-[var(--surface-muted)]">
          进入
        </button>
      </form>
    </div>
  );
}
