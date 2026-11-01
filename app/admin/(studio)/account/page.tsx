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
      <Link href="/admin" className="mb-10 text-[14px] text-mist md:hidden">
        ←
      </Link>
      <h1 className="text-[34px] font-semibold tracking-[-0.03em] text-ink">账号</h1>
      <p className="mt-2 text-[14px] text-mist">{user.email}</p>
      {saved === "1" ? <p className="mt-6 text-[13px] text-mist">密码已更新</p> : null}
      {msg ? <p className="mt-6 text-[13px] text-red-700">{msg}</p> : null}
      <form action={changePassword} className="mt-10 space-y-4">
        <input
          type="password"
          name="password"
          required
          minLength={8}
          autoComplete="new-password"
          aria-label="新密码"
          placeholder="新密码"
          className="plain-write text-[17px]"
        />
        <input
          type="password"
          name="confirm"
          required
          minLength={8}
          autoComplete="new-password"
          aria-label="再输一次"
          placeholder="再输一次"
          className="plain-write text-[17px]"
        />
        <button type="submit" className="pt-4 text-[14px] text-ink">
          保存
        </button>
      </form>
    </div>
  );
}
