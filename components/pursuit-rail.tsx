"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { ACCENT_HEX, STAGES, stageIndex } from "@/lib/display";
import type { Pursuit } from "@/lib/types";

const nf = (n: number) => String(n).padStart(2, "0");

function wrap(pos: number, n: number) {
  let p = ((pos % n) + n) % n;
  if (p > n / 2) p -= n;
  return p;
}

type Mode = "idle" | "drag" | "inertia" | "settle";

type Drag = {
  tracking: boolean;
  armed: boolean;
  x0: number;
  y0: number;
  start: number;
  moved: number;
  cardIndex: number | null;
};

export function PursuitRail({ pursuits }: { pursuits: Pursuit[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const offset = useRef(0);
  const velocity = useRef(0);
  const targetRef = useRef(0);
  const mode = useRef<Mode>("idle");
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const drag = useRef<Drag>({
    tracking: false,
    armed: false,
    x0: 0,
    y0: 0,
    start: 0,
    moved: 0,
    cardIndex: null,
  });
  const samples = useRef<{ t: number; x: number }[]>([]);
  const reduceMotion = useRef(false);
  const suppressClick = useRef(false);

  const [size, setSize] = useState({ w: 300, h: 450 });
  const activeRef = useRef(0);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Pursuit | null>(null);

  const n = pursuits.length;
  const step = size.w * 1.12;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      reduceMotion.current = media.matches;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      if (!rail) return;
      const vw = window.innerWidth;
      const byWidth = vw < 640 ? vw * 0.78 : vw * 0.318;
      const h = Math.max(240, Math.min(rail.clientHeight * 0.8, 470, byWidth));
      setSize({ w: Math.round((h * 2) / 3), h: Math.round(h) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (railRef.current) ro.observe(railRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const paint = useCallback(() => {
    if (!n) return;
    const cur = offset.current;
    let nearest = 0;
    let nearestDist = Infinity;

    cardRefs.current.forEach((el, i) => {
      if (!el) return;
      const pos = wrap(i - cur, n);
      const dist = Math.abs(pos);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
      const scale = Math.max(0.86, 1 - dist * 0.04);
      const rotY = reduceMotion.current ? 0 : Math.max(-8, Math.min(8, -pos * 4));
      const opacity = Math.max(0.62, 1 - dist * 0.1);
      const far = Math.max(0, dist - 1);
      const blur = reduceMotion.current ? 0 : Math.min(2.5, far * 1.4);
      const filterStr = blur < 0.25 ? "none" : `blur(${blur.toFixed(1)}px)`;
      if (el.style.filter !== filterStr) el.style.filter = filterStr;
      el.style.setProperty("--glass", String(Math.min(0.55, far * 0.4)));
      el.style.transform = `translate3d(calc(-50% + ${pos * step}px), -50%, 0) perspective(1400px) rotateY(${rotY}deg) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(100 - Math.round(dist * 10));
      el.style.pointerEvents = dist > 2.6 ? "none" : "auto";
    });

    if (activeRef.current !== nearest) {
      activeRef.current = nearest;
      if (labelRef.current) {
        labelRef.current.textContent = pursuits[nearest]?.title ?? "";
      }
    }
    if (progressRef.current && n > 1) {
      const p = ((cur % n) + n) % n;
      progressRef.current.style.width = `${((p + 0.5) / n) * 100}%`;
    }
  }, [n, step, pursuits]);

  const frameRef = useRef<() => void>(() => {});

  const frame = useCallback(() => {
    const now = performance.now();
    const dt = Math.min(48, now - (last.current || now));
    last.current = now;

    if (reduceMotion.current) {
      offset.current = targetRef.current;
      velocity.current = 0;
      mode.current = "idle";
    } else if (mode.current === "inertia") {
      offset.current += velocity.current * dt;
      velocity.current *= Math.exp(-0.0022 * dt);
      if (Math.abs(velocity.current) < 0.00016) {
        velocity.current = 0;
        targetRef.current = Math.round(offset.current);
        mode.current = "settle";
      }
    } else if (mode.current === "settle") {
      const diff = targetRef.current - offset.current;
      const alpha = 1 - Math.exp(-0.0085 * dt);
      offset.current += diff * alpha;
      if (Math.abs(diff) < 0.0012) {
        offset.current = targetRef.current;
        mode.current = "idle";
      }
    }

    paint();

    if (mode.current === "idle") {
      raf.current = null;
      last.current = 0;
    } else {
      raf.current = requestAnimationFrame(() => frameRef.current());
    }
  }, [paint]);

  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  const kick = useCallback(() => {
    if (reduceMotion.current) {
      offset.current = targetRef.current;
      mode.current = "idle";
      paint();
      return;
    }
    if (raf.current === null) {
      last.current = 0;
      raf.current = requestAnimationFrame(() => frameRef.current());
    }
  }, [paint]);

  const goTo = useCallback(
    (target: number) => {
      velocity.current = 0;
      targetRef.current = target;
      mode.current = "settle";
      kick();
    },
    [kick],
  );

  useEffect(() => {
    paint();
  }, [paint, size.w]);

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    // 上一次拖拽如果没有产生 click，别把这次点击吃掉。
    suppressClick.current = false;
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-card-index]");
    const d = drag.current;
    d.tracking = true;
    d.armed = false;
    d.x0 = e.clientX;
    d.y0 = e.clientY;
    d.start = offset.current;
    d.moved = 0;
    d.cardIndex = card ? Number(card.dataset.cardIndex) : null;
    velocity.current = 0;
    samples.current = [{ t: performance.now(), x: e.clientX }];
    mode.current = "drag";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.tracking) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;

    if (!d.armed) {
      if (Math.hypot(dx, dy) < 8) return;
      // 纵向滑动交给页面滚动，不把整页锁在轨道上。
      if (Math.abs(dy) > Math.abs(dx)) {
        d.tracking = false;
        mode.current = "idle";
        suppressClick.current = true;
        return;
      }
      d.armed = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* 指针可能已经松开 */
      }
    }

    d.moved = Math.max(d.moved, Math.abs(dx));
    offset.current = d.start - dx / step;
    paint();

    const now = performance.now();
    const list = samples.current;
    list.push({ t: now, x: e.clientX });
    while (list.length > 2 && now - list[0].t > 140) list.shift();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.tracking) return;
    const wasClick = !d.armed;
    const cardIndex = d.cardIndex;
    d.tracking = false;
    d.armed = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* 指针可能已释放 */
    }

    if (wasClick) {
      mode.current = "idle";
      if (cardIndex != null && pursuits[cardIndex]) setSelected(pursuits[cardIndex]);
      return;
    }
    suppressClick.current = true;

    const list = samples.current;
    const now = performance.now();
    const lastP = list[list.length - 1];
    const first = list.find((s) => now - s.t <= 140) ?? list[0];
    const dtSample = lastP && first ? lastP.t - first.t : 0;
    const dxSample = lastP && first ? lastP.x - first.x : 0;
    const fresh = lastP ? now - lastP.t < 80 : false;
    velocity.current = fresh && dtSample > 8 ? -dxSample / dtSample / step : 0;
    const MAX = 0.0075;
    velocity.current = Math.max(-MAX, Math.min(MAX, velocity.current));
    samples.current = [];

    if (reduceMotion.current || Math.abs(velocity.current) <= 0.00008) {
      goTo(Math.round(offset.current));
      return;
    }
    mode.current = "inertia";
    kick();
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    drag.current.tracking = false;
    drag.current.armed = false;
    mode.current = "idle";
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* 浏览器接管了这次手势 */
    }
  };

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const horizontal = e.shiftKey || absX > absY;
      if (!horizontal) return;
      const delta = absX > absY ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 1) return;
      e.preventDefault();
      if (drag.current.tracking) return;
      const base = mode.current === "settle" ? targetRef.current : Math.round(offset.current);
      goTo(Math.max(base - 3, Math.min(base + 3, base + delta / (step * 1.15))));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [step, goTo]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (selected) return;
    if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
      e.preventDefault();
      const current = pursuits[activeRef.current];
      if (current) setSelected(current);
      return;
    }
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const base = mode.current === "settle" ? targetRef.current : Math.round(offset.current);
    goTo(base + dir);
  };

  if (n === 0) {
    return (
      <p className="py-24 text-center text-sm text-mist">还没有已发布的追求。</p>
    );
  }

  return (
    <>
      <div
        ref={railRef}
        role="region"
        aria-roledescription="轮播"
        aria-label="正在进行的追求。左右方向键切换，点卡片打开对应的那一条。"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
        className={`relative min-h-[260px] w-full flex-1 cursor-grab select-none overflow-hidden focus-visible:outline-[#3c4ec4] active:cursor-grabbing ${
          selected ? "pointer-events-none opacity-40 blur-[1px]" : ""
        } transition-[opacity,filter] duration-500 motion-reduce:transition-none`}
        style={{ touchAction: "pan-y", overscrollBehaviorX: "contain" }}
      >
        {pursuits.map((p, i) => {
          const accent = ACCENT_HEX[p.accent];
          return (
            <button
              key={p.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              type="button"
              data-card-index={i}
              aria-label={p.title}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                setSelected(p);
              }}
              className="absolute left-1/2 top-1/2 block rounded-[28px] text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3c4ec4]"
              style={{
                width: size.w,
                height: size.h,
                willChange: "transform, opacity",
              }}
            >
              <span className="absolute -top-[18px] left-0 right-0 truncate font-display text-[8px] uppercase tracking-[0.2em] text-mist">
                {nf(i + 1)} / {p.slug.replace(/-/g, "_").toUpperCase()}
              </span>

              <span className="relative block h-full w-full overflow-hidden rounded-[28px] bg-[#101014] shadow-[0_28px_60px_-40px_rgba(40,30,80,0.45)]">
                {p.cover_url ? (
                  <Image
                    src={p.cover_url}
                    alt=""
                    fill
                    sizes="320px"
                    className="object-cover"
                    draggable={false}
                    priority={i < 3}
                  />
                ) : (
                  <span className="absolute inset-0 bg-gradient-to-br from-[#2a2a33] to-[#101014]" />
                )}
                <span className="glass-veil" aria-hidden />
                <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                <span
                  className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                />
                <span className="sr-only">{p.title}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative z-10 -mt-2 flex justify-center" aria-hidden>
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/60 shadow-[0_14px_30px_-18px_rgba(70,60,140,0.45)] backdrop-blur-sm">
          <span className="font-display text-[16px] leading-none text-ink/45">✕</span>
        </div>
      </div>

      <div className="mt-3 w-full">
        <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
          <div className="mx-auto mb-3 h-px w-40 bg-ink/12">
            <div ref={progressRef} className="h-px bg-ink/60" style={{ width: "0%" }} />
          </div>
          <div className="flex items-end justify-between border-t border-[var(--line)] pt-3">
            <p className="label flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink/45" />
              CROQUIS / {nf(pursuits.length)}
            </p>
            <p
              ref={labelRef}
              aria-live="polite"
              className="font-display text-[9px] uppercase tracking-[0.24em] text-mist"
            >
              {pursuits[0]?.title ?? ""}
            </p>
            <p className="label">©{new Date().getFullYear()}</p>
          </div>
        </div>
      </div>

      {selected ? (
        <DetailPanel pursuit={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

function DetailPanel({
  pursuit,
  onClose,
}: {
  pursuit: Pursuit;
  onClose: () => void;
}) {
  const stage = STAGES[stageIndex(pursuit.stage)];
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<() => void>(() => {});
  const closingRef = useRef(false);

  useEffect(() => {
    closeRef.current = () => {
      if (closingRef.current) return;
      closingRef.current = true;
      setClosing(true);
      window.setTimeout(onClose, 220);
    };
  }, [onClose]);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const root = panelRef.current;
    const previously = document.activeElement as HTMLElement | null;
    root?.querySelector<HTMLElement>("[data-close]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const items = [
        ...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      ];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previously?.focus();
    };
  }, []);

  const shown = open && !closing;

  return (
    <div
      ref={panelRef}
      className={`fixed inset-0 z-[90] flex items-center justify-center px-4 ${
        shown ? "opacity-100" : "opacity-0"
      } motion-reduce:transition-none`}
      style={{
        background: "rgb(244 240 250 / 0.46)",
        backdropFilter: "blur(10px)",
        transition: "opacity 220ms ease",
      }}
      onClick={() => closeRef.current()}
      role="dialog"
      aria-modal="true"
      aria-label={pursuit.title}
    >
      <div
        className="relative w-full max-w-2xl rounded-[28px] border border-white/70 bg-white/75 p-6 text-ink shadow-[0_30px_80px_-36px_rgba(70,60,140,0.45)] backdrop-blur-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: shown ? "translateY(0)" : "translateY(10px)",
          transition: "transform 220ms ease",
        }}
      >
        <button
          type="button"
          data-close
          onClick={() => closeRef.current()}
          className="mb-4 rounded-full px-2 py-1 font-display text-[10px] tracking-[0.18em] text-mist hover:text-ink"
        >
          关闭 ESC
        </button>

        <div className="flex items-start gap-4">
          {pursuit.cover_url ? (
            <span className="relative hidden h-24 w-20 shrink-0 overflow-hidden rounded-2xl sm:block">
              <Image
                src={pursuit.cover_url}
                alt={`${pursuit.title} 的封面`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="font-display text-[9px] tracking-[0.2em] text-mist">
              {pursuit.slug.replace(/-/g, "_").toUpperCase()} · {stage.zh}
            </p>
            <h2 className="mt-2 text-2xl text-ink">{pursuit.title}</h2>
            {pursuit.title_en ? (
              <p className="mt-1 font-display text-[10px] tracking-[0.16em] text-mist">
                {pursuit.title_en}
              </p>
            ) : null}
          </div>
        </div>

        {pursuit.subtitle ? (
          <p className="mt-5 text-[14px] leading-relaxed text-ink/80">{pursuit.subtitle}</p>
        ) : null}
        {pursuit.description ? (
          <p className="mt-3 text-[13px] leading-[1.8] text-ink/70">{pursuit.description}</p>
        ) : null}
        {pursuit.progress_note ? (
          <p className="mt-4 border-l-2 border-[#5b4eb8]/40 pl-4 text-[13px] leading-relaxed text-ink/75">
            {pursuit.progress_note}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
          <p className="text-[12px] text-mist">
            {stage.zh} · {pursuit.started_at ?? "未填开始日期"}
          </p>
          <Link
            href={`/pursuits/${pursuit.slug}`}
            className="inline-flex items-center rounded-full bg-ink px-4 py-2 text-[12px] text-white hover:bg-ink/85"
          >
            进入这个追求
          </Link>
        </div>
      </div>
    </div>
  );
}
