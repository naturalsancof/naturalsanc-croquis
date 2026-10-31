"use client";

import { useState, type ChangeEvent } from "react";

const MAX_EDGE = 2000;
const QUALITY = 0.85;
const SKIP_BELOW = 1.4 * 1024 * 1024;

/**
 * 封面选择器。
 * 大图先在浏览器里缩到最长边 2000px 再提交——Vercel 的请求体上限是 4.5MB，
 * 手机原图动辄 5–8MB，直接传会被网关挡掉（表现为「上传失败」）。
 */
export function CoverInput({
  name = "cover_file",
  className,
}: {
  name?: string;
  className?: string;
}) {
  const [note, setNote] = useState("");

  const onChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      setNote("");
      return;
    }
    if (!file.type.startsWith("image/")) return;

    const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)}MB`;

    if (file.size <= SKIP_BELOW) {
      setNote(`${mb(file.size)}`);
      return;
    }

    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0, w, h);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", QUALITY),
      );
      bitmap.close();
      if (!blob) return;

      const out = new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
        type: "image/jpeg",
      });
      const dt = new DataTransfer();
      dt.items.add(out);
      input.files = dt.files;

      setNote(`${mb(file.size)} → ${mb(out.size)} · ${w}×${h}`);
    } catch {
      setNote(`${mb(file.size)}（浏览器没能压缩，直接上传）`);
    }
  };

  return (
    <div>
      <input
        type="file"
        name={name}
        accept="image/*"
        onChange={onChange}
        className={className}
      />
      {note ? (
        <p className="mt-1 font-display text-[9px] tracking-[0.12em] text-mist/50">
          {note}
        </p>
      ) : null}
    </div>
  );
}
