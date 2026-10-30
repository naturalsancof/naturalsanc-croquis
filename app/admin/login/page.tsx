import Link from "next/link";
import { signIn } from "@/app/admin/actions";
import { Btn, Field, Input } from "@/components/admin/ui";

export const metadata = { title: "登录 · Studio" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center py-10">
      <Link
        href="/"
        className="mb-8 font-display text-[10px] tracking-[0.28em] text-mist/50 transition hover:text-ink"
      >
        ← 回到网站
      </Link>

      <div className="panel-solid p-7 sm:p-9">
        <p className="kicker">Studio — Private</p>
        <h1 className="mt-4 font-display text-2xl tracking-tight text-ink">
          站长登录
        </h1>
        <p className="sub-ja mt-2">ここからサイトを編集します。</p>

        {error ? (
          <p className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200/90">
            {error === "forbidden"
              ? "这个账号没有编辑权限。"
              : "邮箱或密码不对。"}
          </p>
        ) : null}

        <form action={signIn} className="mt-6 space-y-4">
          <Field label="邮箱" hint="EMAIL">
            <Input
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="you@example.com"
            />
          </Field>

          <Field label="密码" hint="PASSWORD">
            <Input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>

          <Btn type="submit" className="!w-full !py-2.5">
            进入
          </Btn>
        </form>

        <p className="mt-6 text-[11px] leading-relaxed text-mist/40">
          只有站长账号能编辑。公开页面不需要登录。
        </p>
      </div>
    </div>
  );
}
