"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { PortfolioItem } from "@/lib/types";
import { AudioPlayer } from "./audio-player";

export function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const images = items.filter((i) => i.kind === "image");
  const audio = items.filter((i) => i.kind === "audio");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight")
        setOpenIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft")
        setOpenIndex((i) =>
          i === null ? i : (i - 1 + images.length) % images.length,
        );
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, images.length]);

  if (items.length === 0) {
    return (
      <p className="py-6 text-sm text-mist">
        还没有作品。等有了第一张图或第一段声音，会出现在这里。
      </p>
    );
  }

  const active =
    openIndex === null || openIndex >= images.length
      ? null
      : images[openIndex];

  return (
    <div className="space-y-6">
      {images.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {images.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group block text-left"
            >
              <span className="tile relative block aspect-[4/3]">
                <Image
                  src={item.media_url}
                  alt={item.title ?? "作品图片"}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
              </span>
              <span className="mt-2 flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[12px] text-ink">
                    {item.title ?? "未命名"}
                  </span>
                  {item.title_en || item.title_ja ? (
                    <span className="sub mt-0.5 block truncate text-[9px] uppercase">
                      {[item.title_en, item.title_ja]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  ) : null}
                </span>
                <span className="font-display text-[9px] text-mist/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {audio.map((item) => (
        <AudioPlayer key={item.id} item={item} />
      ))}

      {active ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#141419]/95 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={active.title ?? "作品预览"}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white/70 transition hover:border-white/60 hover:text-white"
            aria-label="关闭"
          >
            ✕
          </button>

          <div
            className="relative w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[68vh] w-full">
              <Image
                src={active.media_url}
                alt={active.title ?? "作品图片"}
                fill
                sizes="90vw"
                className="object-contain"
                priority
              />
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-4">
              <div>
                <p className="text-sm text-white">{active.title}</p>
                {active.description ? (
                  <p className="mt-1 text-xs text-white/60">
                    {active.description}
                  </p>
                ) : null}
              </div>
              <span className="font-display text-[9px] tracking-[0.2em] text-white/40">
                {(openIndex ?? 0) + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
