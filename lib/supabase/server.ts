import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 带登录态的服务端客户端（读写用）。
 * 在 Server Component 里 setAll 会抛错，这里吞掉即可——刷新由 proxy.ts 负责。
 */
export async function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("缺少 Supabase 环境变量");
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component 中无法写 cookie，忽略
        }
      },
    },
  });
}
