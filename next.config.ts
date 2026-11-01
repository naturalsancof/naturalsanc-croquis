import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 图片和音频由浏览器直传 Supabase Storage，不再塞进 Server Action。
  // Vercel 函数请求体上限是 4.5MB，把这里调大也绕不过去。
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
