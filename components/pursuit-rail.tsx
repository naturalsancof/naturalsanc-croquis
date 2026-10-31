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
  const drag = useRef({ active: false, x: 0, x0: 0, start: 0, moved: 0, t: 0 });
  const samples = useRef<{ t: number; x: number }[]>([]);

  const [size, setSize] = useState({ w: 300, h: 450 });
  const activeRef = useRef(0);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
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
      const scale = Math.max(0.78, 1 - dist * 0.06);
      const rotY = Math.max(-14, Math.min(14, -pos * 8));
      const opacity = Math.max(0.5, 1 - dist * 0.13);

      // 越靠边越像隔着一层玻璃
      const far = Math.max(0, dist - 1);
      const blur = Math.min(6.5, far * 3.6);
      const filterStr =
        blur < 0.25
          ? "none"
          : `blur(${blur.toFixed(1)}px) saturate(${(1 - far * 0.18).toFixed(2)})`;
      if (el.style.filter !== filterStr) el.style.filter = filterStr;
      el.style.setProperty("--glass", String(Math.min(0.9, far * 0.85)));
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
    if (markRef.current) {
      markRef.current.style.transform = `rotate(${(-8 + cur * 18).toFixed(2)}deg)`;
    }
    if (progressRef.current && n > 1) {
      const p = ((cur % n) + n) % n;
      progressRef.current.style.width = `${((p + 0.5) / n) * 100}%`;
    }
  }, [n, step, pursuits]);

  /* ------------------------------ 动画帧 ------------------------------ */
  const frameRef = useRef<() => void>(() => {});

  const frame = useCallback(() => {
    const now = performance.now();
    const dt = Math.min(48, now - (last.current || now));
    last.current = now;

    if (mode.current === "inertia") {
      // 指数衰减，跟帧率无关
      offset.current += velocity.current * dt;
      velocity.current *= Math.exp(-0.0022 * dt);
      if (Math.abs(velocity.current) < 0.00016) {
        velocity.current = 0;
        targetRef.current = Math.round(offset.current);
        mode.current = "settle";
      }
    } else if (mode.current === "settle") {
      // 阻尼插值：alpha 由 dt 算出，60Hz / 120Hz 手感一致
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

  // 把每帧函数存进 ref，rAF 才能递归调用它（直接自引用会触发 TDZ 检查）
  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  const kick = useCallback(() => {
    if (raf.current === null) {
      last.current = 0;
      raf.current = requestAnimationFrame(() => frameRef.current());
    }
  }, []);

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
    d.x0 = e.clientX;
    d.start = offset.current;
    d.moved = 0;
    d.t = performance.now();
    velocity.current = 0;
    samples.current = [{ t: performance.now(), x: e.clientX }];
    mode.current = "drag";
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x0;
    d.moved = Math.max(d.moved, Math.abs(dx));
    offset.current = d.start - dx / step;
    paint();

    const now = performance.now();
    d.t = now;
    d.x = e.clientX;

    const list = samples.current;
    list.push({ t: now, x: e.clientX });
    while (list.length > 2 && now - list[0].t > 140) list.shift();
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
      if (pursuits[activeRef.current]) setSelected(pursuits[activeRef.current]);
      return;
    }

    // 用最后 ~140ms 的位移估速度；松手前停住超过 80ms 就不算甩动
    const list = samples.current;
    const now = performance.now();
    const lastP = list[list.length - 1];
    const first = list.find((s) => now - s.t <= 140) ?? list[0];
    const dtSample = lastP.t - first.t;
    const dxSample = lastP.x - first.x;
    const fresh = now - lastP.t < 80;
    velocity.current = fresh && dtSample > 8 ? -dxSample / dtSample / step : 0;
    // 封顶，避免一下飞出去好几张
    const MAX = 0.0075;
    velocity.current = Math.max(-MAX, Math.min(MAX, velocity.current));
    samples.current = [];

    if (Math.abs(velocity.current) > 0.00008) {
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
      targetRef.current = Math.max(base - 3, Math.min(base + 3, base + delta / (step * 1.15)));
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
        className={`relative flex-1 min-h-[260px] w-full cursor-grab select-none overflow-hidden active:cursor-grabbing ${
          selected ? "pointer-events-none opacity-40 blur-[2px] grayscale" : ""
        } transition-[opacity,filter] duration-500`}
        style={{ touchAction: "none", overscrollBehaviorX: "contain" }}
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
              className="absolute left-1/2 top-1/2 block text-left"
              style={{
                width: size.w,
                height: size.h,
                willChange: "transform, opacity",
              }}
            >
              <span className="absolute -top-[18px] left-0 right-0 truncate font-display text-[8px] uppercase tracking-[0.2em] text-mist">
                {nf(i + 1)} / {p.slug.replace(/-/g, "_").toUpperCase()}
              </span>

              <span className="relative block h-full w-full overflow-hidden rounded-[6px] bg-[#101014] shadow-[0_36px_70px_-44px_rgba(20,20,25,0.5),0_10px_26px_-18px_rgba(20,20,25,0.28)]">
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
                <span className="glass-veil" />
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

      <div className="relative z-10 -mt-3 flex justify-center">
        <div
          ref={markRef}
          className="grid h-[52px] w-[52px] place-items-center rounded-[4px] border border-white/60 bg-white/55 shadow-[0_14px_30px_-18px_rgba(20,20,25,0.55)] backdrop-blur-sm"
        >
          <span className="font-display text-[17px] leading-none text-ink/45">✕</span>
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
            className="font-display text-[9px] uppercase tracking-[0.24em] text-mist"
          >
            {pursuits[0]?.title ?? ""}
          </p>
          <p className="label">©2026</p>
        </div>
        </div>
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
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  // 挂载后下一帧再切到 open，过渡才有起点（否则一上来就是终态，没有动画）
  useEffect(() => {
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 260);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // close 依赖 closing，重挂一次无副作用
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  const shown = open && !closing;
  const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center px-4 ${
        shown ? "opacity-100" : "opacity-0"
      } motion-reduce:transition-none`}
      style={{
        background: "rgb(10 10 12 / 0.55)",
        backdropFilter: "blur(4px)",
        transition: `opacity 260ms ${ease}`,
      }}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={pursuit.title}
    >
      {/* 上下黑边：从画面外滑进来 */}
      <div
        className="absolute inset-x-0 top-0 h-[7vh] bg-[#0c0c0e] motion-reduce:transition-none"
        style={{
          transform: shown ? "translateY(0)" : "translateY(-100%)",
          transition: `transform 460ms ${ease}`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[7vh] bg-[#0c0c0e] motion-reduce:transition-none"
        style={{
          transform: shown ? "translateY(0)" : "translateY(100%)",
          transition: `transform 460ms ${ease}`,
        }}
      />

      <div
        className="relative mt-[6vh] w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          className="absolute -top-11 left-0 flex items-center gap-2 font-display text-[10px] tracking-[0.22em] text-white/80 transition hover:text-white"
          style={{
            opacity: shown ? 1 : 0,
            transform: shown ? "translateY(0)" : "translateY(6px)",
            transition: `opacity 240ms ${ease} 120ms, transform 240ms ${ease} 120ms`,
          }}
        >
          ESC ✕
        </button>

        <div className="relative">
          {pursuit.cover_url ? (
            <span
              className="absolute -top-16 left-1/2 block h-24 w-20 overflow-hidden rounded-md shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]"
              style={{
                transform: shown
                  ? "translateX(-50%) rotate(-6deg) scale(1)"
                  : "translateX(-50%) rotate(-14deg) scale(0.86)",
                transition: `transform 420ms ${ease} 60ms`,
              }}
            >
              <Image
                src={pursuit.cover_url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </span>
          ) : null}

          <div
            className="max-h-[62vh] overflow-y-auto rounded-2xl bg-[#0c0c0e] p-7 text-white/70 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] sm:p-9"
            style={{
              opacity: shown ? 1 : 0,
              transform: shown
                ? "translateY(0) scale(1)"
                : "translateY(18px) scale(0.975)",
              transition: `opacity 260ms ${ease}, transform 380ms ${ease}`,
            }}
          >
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