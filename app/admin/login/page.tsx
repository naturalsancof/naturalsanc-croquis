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
      <Link href="/" className="mb-10 text-[14px] text-mist">
        ←
      </Link>
      <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-ink">登录</h1>
      {error ? (
        <p className="mt-6 text-[13px] text-red-700">
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
          className="plain-write text-[17px]"
        />
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-label="密码"
          placeholder="密码"
          className="plain-write text-[17px]"
        />
        <button type="submit" className="pt-4 text-[14px] text-ink">
          进入
        </button>
      </form>
    </div>
  );
}
