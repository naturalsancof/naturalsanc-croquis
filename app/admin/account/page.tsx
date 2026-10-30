import { redirect } from "next/navigation";
import { changePassword } from "@/app/admin/actions";
import { AdminTopBar } from "@/components/admin/top-bar";
import { Btn, Field, Input } from "@/components/admin/ui";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "账号 · Studio" };
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const msg =
    error === "short"
      ? "密码至少 8 位。"
      : error === "mismatch"
        ? "两次输入不一致。"
        : error === "failed"
          ? "修改失败，稍后再试。"
          : null;

  return (
    <div className="pb-14">
      <AdminTopBar />

      <div className="max-w-xl">
        <p className="kicker">Studio — Account</p>
        <h1 className="mt-3 font-display text-2xl tracking-tight text-ink">
          账号
        </h1>
        <p className="mt-2 font-display text-[11px] tracking-[0.12em] text-mist/50">
          {user.email}
        </p>

        <div className="panel mt-6 p-5 sm:p-7">
          <h2 className="text-[15px] text-ink">改密码</h2>
          <p className="mt-1 text-[12px] text-mist/50">
            改完立刻生效，下次登录用新密码。
          </p>

          {saved === "1" ? (
            <p className="mt-4 rounded-lg border border-lime/30 bg-lime/10 px-3 py-2 text-[12px] text-lime/90">
              密码已更新
            </p>
          ) : null}
          {msg ? (
            <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-200/90">
              {msg}
            </p>
          ) : null}

          <form action={changePassword} className="mt-5 space-y-4">
            <Field label="新密码" hint="至少 8 位">
              <Input
                type="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Field label="再输一次">
              <Input
                type="password"
                name="confirm"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </Field>
            <Btn type="submit">保存新密码</Btn>
          </form>
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-mist/40">
          忘了密码也没关系：去 Supabase Dashboard → Authentication → Users，
          找到这个邮箱，可以重置。
        </p>
      </div>
    </div>
  );
}
