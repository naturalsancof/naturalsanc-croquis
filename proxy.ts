import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * 刷新 /admin 的登录 cookie。
 *
 * 访问令牌还剩两分钟以上时，不再请求 /auth/v1/user。
 * 这里只决定要不要刷新 cookie，不拿 cookie 里的过期时间做权限判断。
 * 页面和写入仍然会调用 getUser()，并向 Supabase Auth 校验 JWT。
 */
export async function proxy(request: NextRequest) {
  const exp = readAccessExpiry(request);
  if (exp === "missing") return NextResponse.next({ request });

  const now = Math.floor(Date.now() / 1000);
  if (typeof exp === "number" && exp - now > 120) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};

function readAccessExpiry(request: NextRequest): number | "missing" | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "missing";

  let ref = "";
  try {
    ref = new URL(supabaseUrl).hostname.split(".")[0] ?? "";
  } catch {
    return null;
  }
  if (!ref) return null;

  const key = `sb-${ref}-auth-token`;
  let raw = request.cookies.get(key)?.value ?? "";
  if (!raw) {
    const parts: string[] = [];
    for (let i = 0; i < 8; i += 1) {
      const chunk = request.cookies.get(`${key}.${i}`)?.value;
      if (!chunk) break;
      parts.push(chunk);
    }
    raw = parts.join("");
  }
  if (!raw) return "missing";

  try {
    let json = raw;
    if (raw.startsWith("base64-")) {
      json = decodeBase64Url(raw.slice("base64-".length));
    }
    const session = JSON.parse(json) as {
      expires_at?: number;
      access_token?: string;
    };
    if (typeof session.expires_at === "number") return session.expires_at;
    if (!session.access_token) return null;
    const payload = session.access_token.split(".")[1];
    if (!payload) return null;
    const body = JSON.parse(decodeBase64Url(payload)) as { exp?: number };
    return typeof body.exp === "number" ? body.exp : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value: string) {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
