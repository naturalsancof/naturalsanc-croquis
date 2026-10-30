"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/display";
import type { PortfolioItem } from "@/lib/types";

const BARS = Array.from({ length: 40 }, (_, i) => {
  const wave = Math.sin(i * 0.9) * 0.5 + Math.sin(i * 0.31) * 0.5;
  return 0.22 + Math.abs(wave) * 0.78;
});

export function AudioPlayer({ item }: { item: PortfolioItem }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(item.duration_seconds ?? 0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => setCurrent(el.currentTime);
    const onMeta = () => {
      if (Number.isFinite(el.duration)) setDuration(el.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      try {
        await el.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    }
  };

  const seek = (value: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = value;
    setCurrent(value);
  };

  const progress = duration > 0 ? Math.min(current / duration, 1) : 0;

  return (
    <div className="border border-[var(--line)] bg-white/60 p-4 sm:p-5">
      <audio ref={audioRef} src={item.media_url} preload="metadata" />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "暂停" : "播放"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:scale-105"
        >
          {playing ? (
            <svg width="10" height="12" viewBox="0 0 12 14" fill="currentColor">
              <rect x="0" y="0" width="4" height="14" rx="1" />
              <rect x="8" y="0" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 12 14" fill="currentColor">
              <path d="M0 0.8v12.4c0 0.6 0.7 1 1.2 0.6l9.6-6.2c0.5-0.3 0.5-1 0-1.3L1.2 0.2C0.7-0.1 0 0.2 0 0.8Z" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] text-ink">
            {item.title ?? "未命名音频"}
          </p>
          {item.title_en || item.title_ja ? (
            <p className="sub mt-0.5 truncate text-[9px] uppercase">
              {[item.title_en, item.title_ja].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>

        <span className="shrink-0 font-display text-[9px] tracking-[0.12em] text-mist">
          {formatDuration(current)} / {formatDuration(duration)}
        </span>
      </div>

      <div className="mt-4 flex h-6 items-end gap-[2px]" aria-hidden>
        {BARS.map((h, i) => {
          const lit = i / BARS.length <= progress;
          return (
            <span
              key={i}
              className="flex-1 rounded-sm transition-colors duration-300"
              style={{
                height: `${Math.round(h * 100)}%`,
                background: lit ? "var(--accent)" : "rgb(20 20 25 / 0.12)",
              }}
            />
          );
        })}
      </div>

      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={current}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="播放进度"
        className="range-neon mt-3 w-full cursor-pointer"
        style={{
          background: `linear-gradient(90deg, #141419 ${progress * 100}%, rgb(20 20 25 / 0.12) ${progress * 100}%)`,
        }}
      />

      {item.description ? (
        <p className="mt-3 text-[13px] leading-relaxed text-ink/60">
          {item.description}
        </p>
      ) : null}
    </div>
  );
}
