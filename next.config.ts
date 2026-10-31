import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server Action 默认只允许 1MB 请求体，封面上传/音频会直接报错。
  // 放宽到 25MB，够放一张手机照片或一段短音频。
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
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
