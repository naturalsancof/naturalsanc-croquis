import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseServer } from "./server";

/**
 * 同一次服务端请求里，登录态和站长判断只打一次网络。
 * layout、页面、以及这次请求里的 Server Action 共用这份结果。
 * 授权仍然走 getUser()（向 Supabase Auth 校验 JWT），不用可伪造的本地 session。
 */
export const getSupabase = cache(async () => supabaseServer());

export const getStudioContext = cache(async () => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;

  if (!user) {
    return { supabase, user: null, isAdmin: false as const };
  }

  const { data: isAdmin, error: adminError } = await supabase.rpc(
    "is_studio_admin",
  );

  if (adminError || isAdmin !== true) {
    return { supabase, user, isAdmin: false as const };
  }

  return { supabase, user, isAdmin: true as const };
});

/** 页面和 layout 用：没登录或不是站长就送去登录页。 */
export async function requireStudioAdmin() {
  const ctx = await getStudioContext();
  if (!ctx.user) redirect("/admin/login");
  if (!ctx.isAdmin) redirect("/admin/login?error=forbidden");
  return ctx;
}

/** Server Action 用：失败时返回文案，不要 redirect，避免把编辑器里还没保存的输入清掉。 */
export async function assertStudioAdmin() {
  const ctx = await getStudioContext();
  if (!ctx.user || !ctx.isAdmin) {
    return {
      ok: false as const,
      error: "登录已过期，或这个账号没有编辑权限。请重新登录。",
    };
  }
  return { ok: true as const, supabase: ctx.supabase, user: ctx.user };
}
