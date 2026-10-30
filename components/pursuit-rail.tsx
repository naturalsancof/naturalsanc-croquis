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

export function PursuitRail({ pursuits }: { pursuits: Pursuit[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const offset = useRef(0);
  const velocity = useRef(0); // 张 / 毫秒
  const targetRef = useRef(0);
  const mode = useRef<Mode>("idle");
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const drag = useRef({ active: false, x: 0, start: 0, moved: 0, t: 0 });

  const [size, setSize] = useState({ w: 300, h: 450 });
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Pursuit | null>(null);

  const n = pursuits.length;
  const step = size.w * 1.12;

  /* ------------------------------ 尺寸 ------------------------------ */
  useLayoutEffect(() => {
    const measure = () => {
      const rail = railRef.current;
      if (!rail) return;
      const vw = window.innerWidth;
      // 手机上卡片小一些；桌面按视口宽度换算，保证「3 张整卡 + 两张半卡」
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

  /* ------------------------------ 绘制 ------------------------------ */
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
      const scale = Math.max(0.7, 1 - dist * 0.08);
      const rotY = Math.max(-16, Math.min(16, -pos * 8));
      const opacity = Math.max(0.15, 1 - dist * 0.22);
      el.style.transform = `translate(-50%, -50%) translateX(${pos * step}px) perspective(1400px) rotateY(${rotY}deg) scale(${scale})`;
      el.style.opacity = String(opacity);
      el.style.zIndex = String(100 - Math.round(dist * 10));
      el.style.pointerEvents = dist > 2.6 ? "none" : "auto";
    });

    setActive((prev) => (prev === nearest ? prev : nearest));
  }, [n, step]);

  /* ------------------------------ 动画帧 ------------------------------ */
  const frame = useCallback(() => {
    const now = performance.now();
    const dt = Math.min(48, now - (last.current || now));
    last.current = now;

    if (mode.current === "inertia") {
      offset.current += velocity.current * dt;
      velocity.current *= Math.exp(-0.0045 * dt);
      if (Math.abs(velocity.current) < 0.00035) {
        velocity.current = 0;
        targetRef.current = Math.round(offset.current);
        mode.current = "settle";
      }
    } else if (mode.current === "settle") {
      const diff = targetRef.current - offset.current;
      offset.current += diff * 0.2;
      if (Math.abs(diff) < 0.0015) {
        offset.current = targetRef.current;
        mode.current = "idle";
      }
    }

    paint();

    if (mode.current === "idle") {
      raf.current = null;
      last.current = 0;
    } else {
      raf.current = requestAnimationFrame(frame);
    }
  }, [paint]);

  const kick = useCallback(() => {
    if (raf.current === null) {
      last.current = 0;
      raf.current = requestAnimationFrame(frame);
    }
  }, [frame]);

  useEffect(() => {
    paint();
  }, [paint, size.w]);

  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  /* ------------------------------ 拖拽 ------------------------------ */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const d = drag.current;
    d.active = true;
    d.x = e.clientX;
    d.start = offset.current;
    d.moved = 0;
    d.t = performance.now();
    velocity.current = 0;
    mode.current = "drag";
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    d.moved = Math.max(d.moved, Math.abs(dx));
    offset.current = d.start - dx / step;
    paint();

    const now = performance.now();
    const dt = Math.max(8, now - d.t);
    velocity.current = -dx / dt / step;
    d.t = now;
    d.x = e.clientX;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* 指针可能已释放 */
    }

    if (d.moved <= 6) {
      mode.current = "idle";
      if (pursuits[active]) setSelected(pursuits[active]);
      return;
    }

    // 惯性：保留速度，逐帧衰减，最后吸附
    if (Math.abs(velocity.current) > 0.00012) {
      mode.current = "inertia";
    } else {
      targetRef.current = Math.round(offset.current);
      mode.current = "settle";
    }
    kick();
  };

  /* ------------------------------ 滚轮（原生，非被动） ------------------------------ */
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 1) return;
      e.preventDefault();
      if (drag.current.active) return;
      velocity.current = 0;
      const base = mode.current === "settle" ? targetRef.current : Math.round(offset.current);
      targetRef.current = base + delta / (step * 1.6);
      mode.current = "settle";
      kick();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [step, kick]);

  /* ------------------------------ 键盘 ------------------------------ */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selected) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const base = mode.current === "settle" ? targetRef.current : Math.round(offset.current);
      targetRef.current = base + dir;
      mode.current = "settle";
      kick();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, kick]);

  if (n === 0) {
    return (
      <p className="py-24 text-center text-sm text-mist">
        还没有已发布的追求。
      </p>
    );
  }

  return (
    <>
      <div
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`relative my-auto h-[60vh] min-h-[340px] w-full cursor-grab select-none overflow-hidden active:cursor-grabbing ${
          selected ? "pointer-events-none opacity-40 blur-[2px] grayscale" : ""
        } transition-[opacity,filter] duration-500`}
        style={{ touchAction: "pan-y" }}
      >
        {pursuits.map((p, i) => {
          const accent = ACCENT_HEX[p.accent];
          const stage = STAGES[stageIndex(p.stage)];
          return (
            <button
              key={p.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              type="button"
              className="absolute left-1/2 top-1/2 block text-left"
              style={{
                width: size.w,
                height: size.h,
                willChange: "transform, opacity",
              }}
            >
              <span className="poster-cap absolute -top-5 left-0 right-0">
                <span className="truncate">
                  {nf(i + 1)} / {p.slug.replace(/-/g, "_").toUpperCase()}
                </span>
                <span className="hidden shrink-0 sm:inline">{stage.en}</span>
              </span>

              <span className="relative block h-full w-full overflow-hidden rounded-[10px] bg-[#101014] shadow-[0_40px_70px_-40px_rgba(20,20,25,0.65),0_10px_24px_-14px_rgba(20,20,25,0.35)]">
                {p.cover_url ? (
                  <Image
                    src={p.cover_url}
                    alt={p.title}
                    fill
                    sizes="320px"
                    className="object-cover"
                    draggable={false}
                    priority={i < 3}
                  />
                ) : (
                  <span className="absolute inset-0 bg-gradient-to-br from-[#2a2a33] to-[#101014]" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                <span
                  className="absolute left-3 top-3 h-1.5 w-1.5 rounded-full"
                  style={{ background: accent }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <DetailPanel pursuit={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}

/* ------------------------------ 黑色信息面板 ------------------------------ */

function DetailPanel({
  pursuit,
  onClose,
}: {
  pursuit: Pursuit;
  onClose: () => void;
}) {
  const stage = STAGES[stageIndex(pursuit.stage)];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={pursuit.title}
    >
      <div className="absolute inset-x-0 top-0 h-[7vh] bg-[#0c0c0e]" />
      <div className="absolute inset-x-0 bottom-0 h-[7vh] bg-[#0c0c0e]" />

      <div
        className="relative mt-[6vh] w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-11 left-0 flex items-center gap-2 font-display text-[10px] tracking-[0.22em] text-white/80 transition hover:text-white"
        >
          ESC ✕
        </button>

        <div className="relative">
          {pursuit.cover_url ? (
            <span className="absolute -top-16 left-1/2 block h-24 w-20 -translate-x-1/2 rotate-[-6deg] overflow-hidden rounded-md shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]">
              <Image
                src={pursuit.cover_url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </span>
          ) : null}

          <div className="max-h-[62vh] overflow-y-auto rounded-2xl bg-[#0c0c0e] p-7 text-white/70 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] sm:p-9">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-display text-[9px] tracking-[0.24em] text-white/35">
                  {pursuit.slug.replace(/-/g, "_").toUpperCase()} ·{" "}
                  {stage.en.toUpperCase()}
                </p>
                <h2 className="mt-3 text-2xl text-white">{pursuit.title}</h2>
                {pursuit.title_en ? (
                  <p className="mt-1 font-display text-[9px] tracking-[0.2em] text-white/35">
                    {pursuit.title_en.toUpperCase()}
                  </p>
                ) : null}
              </div>
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ACCENT_HEX[pursuit.accent] }}
              />
            </div>

            {pursuit.subtitle ? (
              <p className="mt-6 text-[13px] leading-relaxed text-white/60">
                {pursuit.subtitle}
              </p>
            ) : null}
            {pursuit.description ? (
              <p className="mt-4 text-[12px] leading-[1.9] text-white/45">
                {pursuit.description}
              </p>
            ) : null}

            {pursuit.progress_note ? (
              <p className="mt-5 border-l border-white/15 pl-4 font-display text-[10px] leading-relaxed tracking-[0.02em] text-white/40">
                {pursuit.progress_note}
              </p>
            ) : null}

            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
              <p className="font-display text-[9px] tracking-[0.2em] text-white/25">
                {stage.zh} · {pursuit.started_at ?? "—"}
              </p>
              <Link
                href={`/pursuits/${pursuit.slug}`}
                className="group inline-flex items-center gap-2 border border-white/20 px-4 py-2 font-display text-[9px] tracking-[0.22em] text-white/80 transition hover:border-white hover:bg-white hover:text-black"
              >
                进入这个追求
                <span className="transition group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
