"use client";

import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/display";
import type { PortfolioItem } from "@/lib/types";

const BARS = Array.from({ length: 40 }, (_, i) => {
  const wave = Math.sin(i * 0.9) * 0.5 + Math.sin(i * 0.31) * 0.5;
  return 0.22 + Math.abs(wave) * 0.78;
});

function PlayIcon() {
  return (
    <svg
      width="12"
      height="14"
      viewBox="0 0 12 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 1.6l9.5 5.4L1 12.4V1.6z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      width="12"
      height="14"
      viewBox="0 0 12 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3 1.5v11M9 1.5v11" />
    </svg>
  );
}

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
    <div className="border-y-[0.5px] border-[var(--border)] py-5">
      <audio ref={audioRef} src={item.media_url} preload="metadata" />

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "暂停" : "播放"}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface-inverse)] text-[var(--text-inverse)] transition hover:bg-[var(--text-muted)]"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base text-[var(--text)]">
            {item.title ?? "未命名音频"}
          </p>
          {item.title_en || item.title_ja ? (
            <p className="sub mt-0.5 truncate text-[11px]">
              {[item.title_en, item.title_ja].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>

        <span className="shrink-0 font-display text-[11px] text-[var(--text-muted)]">
          {formatDuration(current)} / {formatDuration(duration)}
        </span>
      </div>

      <div className="mt-4 flex h-6 items-end gap-[2px]" aria-hidden>
        {BARS.map((h, i) => {
          const lit = i / BARS.length <= progress;
          return (
            <span
              key={i}
              className="flex-1 transition-colors duration-300"
              style={{
                height: `${Math.round(h * 100)}%`,
                background: lit ? "var(--accent)" : "var(--surface-muted)",
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
        className="range-flat mt-3 w-full cursor-pointer"
      />

      {item.description ? (
        <p className="mt-3 text-[13px] leading-[1.7] text-[var(--text-muted)]">
          {item.description}
        </p>
      ) : null}
    </div>
  );
}
