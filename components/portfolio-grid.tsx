"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { PortfolioItem } from "@/lib/types";
import { AudioPlayer } from "./audio-player";

function brief(text: string, max = 5) {
  const words = text.trim().split(/\s+/);
  return words.length <= max ? text : `${words.slice(0, max).join(" ")}…`;
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

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
      <p className="py-6 text-base text-[var(--text-muted)]">
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
        <div className="tile-grid">
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
              </span>
              <span className="mt-2 flex items-baseline justify-between gap-3">
                <span className="min-w-0">
                  <span className="block truncate text-[16px] text-[var(--text)]">
                    {item.title ?? "未命名"}
                  </span>
                  {item.title_en || item.title_ja ? (
                    <span className="sub mt-0.5 block truncate text-[11px]">
                      {brief(
                        [item.title_en, item.title_ja].filter(Boolean).join(" · "),
                      )}
                    </span>
                  ) : null}
                </span>
                <span className="font-display text-[11px] text-[var(--text-soft)]">
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
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--surface-inverse)] p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={active.title ?? "作品预览"}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-[8px] border-[0.5px] border-[var(--text-inverse-muted)] text-[var(--text-inverse)] transition hover:border-[var(--text-inverse)]"
            aria-label="关闭"
          >
            <CloseIcon />
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
                <p className="text-base text-[var(--text-inverse)]">{active.title}</p>
                {active.description ? (
                  <p className="mt-1 text-[13px] text-[var(--text-inverse-muted)]">
                    {active.description}
                  </p>
                ) : null}
              </div>
              <span className="font-display text-[11px] text-[var(--text-inverse-muted)]">
                {(openIndex ?? 0) + 1} / {images.length}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
