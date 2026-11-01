"use client";

import { compressImageFile } from "@/lib/compress-image";
import { prepareSignedUpload } from "@/app/admin/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

const MAX_AUDIO = 50 * 1024 * 1024;

/**
 * 图片先压缩，再由浏览器持签名地址直接写入 Supabase Storage。
 * 文件不经过 Vercel 函数，因此不受 4.5MB 请求体限制。
 */
export async function uploadMediaFile(file: File, pursuitId: string): Promise<string> {
  if (!file.size) throw new Error("这个文件是空的。");

  const image = file.type.startsWith("image/");
  const audio = file.type.startsWith("audio/");
  if (!image && !audio) {
    throw new Error("只支持图片或音频。");
  }
  if (audio && file.size > MAX_AUDIO) {
    throw new Error("音频超过 50MB，请先剪短或压小再传。");
  }

  const prepared = image ? await compressImageFile(file) : file;
  const signed = await prepareSignedUpload({
    pursuitId,
    filename: prepared.name,
    contentType: prepared.type || (audio ? "audio/mpeg" : "image/jpeg"),
  });
  if (!signed.ok) throw new Error(signed.error);

  const supabase = supabaseBrowser();
  const { error } = await supabase.storage
    .from("media")
    .uploadToSignedUrl(signed.path, signed.token, prepared, {
      contentType: prepared.type || "application/octet-stream",
      upsert: false,
    });

  if (error) throw new Error(`上传失败：${error.message}`);

  const { data } = supabase.storage.from("media").getPublicUrl(signed.path);
  return data.publicUrl;
}
