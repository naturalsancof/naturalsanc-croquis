"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { commitStudio, createPursuit } from "@/app/admin/actions";
import { Btn, Field, Input } from "@/components/admin/ui";
import { uploadMediaFile } from "@/lib/upload-media";

const MESSAGE: Record<string, string> = {
  "slug-taken": "这个网址片段已经被占用了，换一个。",
  upload: "追求建好了，但封面没传上去——进去之后可以再传一次。",
  create: "新建失败，请再试一次。",
};

export function CreatePursuitForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    fd.delete("cover_file");
    setError(null);
    const cover = file;

    start(async () => {
      try {
        const res = await createPursuit({}, fd);
        if (!res.id) {
          setError(res.error ?? "create");
          return;
        }

        let uploadFailed = false;
        if (cover && cover.size > 0) {
          try {
            const url = await uploadMediaFile(cover, res.id);
            const saved = await commitStudio(res.id, [
              { op: "pursuit", patch: { cover_url: url } },
            ]);
            uploadFailed = !saved.ok;
          } catch {
            uploadFailed = true;
          }
        }

        router.push(`/admin/pursuits/${res.id}${uploadFailed ? "?err=upload" : ""}`);
      } catch {
        setError("create");
      }
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end"
    >
      <Field label="名字" hint="中文">
        <Input name="title" required placeholder="例如：城市声音采集" />
      </Field>
      <Field label="网址片段" hint="slug · 小写英文">
        <Input name="slug" placeholder="city-sound" />
      </Field>
      <Field label="封面图" hint="可选 · 大图会先压小再直传">
        <input
          type="file"
          name="cover_file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="w-full cursor-pointer rounded-lg border border-dashed border-[var(--line-strong)] bg-white/60 px-3 py-2 text-[11px] text-mist file:mr-3 file:rounded file:border-0 file:bg-ink/5 file:px-2.5 file:py-1 file:text-[10px] file:text-ink"
        />
      </Field>
      <Btn type="submit" disabled={pending} className="sm:mb-0.5">
        {pending ? "创建中…" : "创建"}
      </Btn>

      {error ? (
        <p className="text-[12px] text-red-700 sm:col-span-4">
          {MESSAGE[error] ?? "新建失败，请再试一次。"}
        </p>
      ) : null}
    </form>
  );
}
