"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPursuit } from "@/app/admin/actions";
import { CoverInput } from "@/components/admin/cover-input";
import { Btn, Field, Input } from "@/components/admin/ui";

const MESSAGE: Record<string, string> = {
  "slug-taken": "这个网址片段已经被占用了，换一个。",
  upload: "追求建好了，但封面没传上去——进去之后在「基本信息」里再传一次。",
  create: "新建失败，请再试一次。",
};

export function CreatePursuitForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);

    start(async () => {
      try {
        const res = await createPursuit({}, fd);
        if (res.id) {
          const suffix = res.error === "upload" ? "?err=upload" : "";
          // 带文件上传时服务端的 redirect 会被 multipart 吞掉，改由客户端跳转
          router.push(`/admin/pursuits/${res.id}${suffix}`);
          router.refresh();
          return;
        }
        setError(res.error ?? "create");
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
      <Field label="封面图" hint="可选 · 大图会自动压小">
        <CoverInput className="w-full cursor-pointer rounded-lg border border-dashed border-[var(--line-strong)] bg-white/60 px-3 py-2 text-[11px] text-mist transition hover:border-ink/40 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-ink/5 file:px-2.5 file:py-1 file:text-[10px] file:text-ink" />
      </Field>
      <Btn type="submit" disabled={pending} className="sm:mb-0.5">
        {pending ? "创建中…" : "创建"}
      </Btn>

      {error ? (
        <p className="text-[12px] text-red-500/90 sm:col-span-4">
          {MESSAGE[error] ?? "新建失败，请再试一次。"}
        </p>
      ) : null}
    </form>
  );
}
