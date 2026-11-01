"use client";

const MAX_EDGE = 2400;
const QUALITY = 0.82;
const TARGET_BYTES = 1.5 * 1024 * 1024;

/**
 * 图片在浏览器里缩小再上传。
 * GIF 保留动画；压缩失败时退回原文件，交给直传，不再经过 Vercel 函数体。
 */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (file.type === "image/svg+xml") {
    throw new Error("不支持 SVG。请换成 JPG、PNG 或 WebP。");
  }

  const alreadySmall = file.size <= 500 * 1024;
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (alreadySmall && longest <= MAX_EDGE) {
      bitmap.close();
      return file;
    }

    const blob = await render(bitmap, MAX_EDGE, QUALITY);
    bitmap.close();
    if (!blob) return file;

    let output = blob;
    if (output.size > TARGET_BYTES) {
      const again = await createImageBitmap(output);
      const tighter = await render(again, 1920, 0.72);
      again.close();
      if (tighter && tighter.size < output.size) output = tighter;
    }

    if (output.size >= file.size) return file;

    const base = file.name.replace(/\.\w+$/, "") || "image";
    return new File([output], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

function render(bitmap: ImageBitmap, maxEdge: number, quality: number) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve<Blob | null>(null);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
}
