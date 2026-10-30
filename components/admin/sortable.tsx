"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { reorderRows } from "@/app/admin/actions";

type Item = { id: string; node: ReactNode };

/**
 * 拖拽排序容器，用 Pointer Events 实现：鼠标、触屏、手写笔都能拖。
 * 子项由服务端渲染后作为 node 传进来，这里只负责顺序和落库。
 */
export function Sortable({
  table,
  items,
  grid = false,
}: {
  table: string;
  items: Item[];
  grid?: boolean;
}) {
  const [order, setOrder] = useState<Item[]>(items);
  const [dragging, setDragging] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dragId = useRef<string | null>(null);
  const moved = useRef(false);
  const orderRef = useRef<Item[]>(items);

  useEffect(() => {
    orderRef.current = items;
    setOrder(items);
  }, [items]);

  const apply = useCallback((next: Item[]) => {
    orderRef.current = next;
    setOrder(next);
  }, []);

  const commit = useCallback(
    (next: Item[]) => {
      startTransition(async () => {
        await reorderRows(
          table,
          next.map((i) => i.id),
        );
      });
    },
    [table],
  );

  const moveTo = useCallback(
    (fromId: string, toId: string) => {
      const prev = orderRef.current;
      const from = prev.findIndex((i) => i.id === fromId);
      const to = prev.findIndex((i) => i.id === toId);
      if (from < 0 || to < 0 || from === to) return;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      apply(next);
    },
    [apply],
  );

  const onPointerDown = (
    e: ReactPointerEvent<HTMLButtonElement>,
    id: string,
  ) => {
    if (e.button !== 0) return;
    e.preventDefault();

    dragId.current = id;
    moved.current = false;
    setDragging(id);

    const onMove = (ev: PointerEvent) => {
      if (!dragId.current) return;
      moved.current = true;
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const target = el?.closest<HTMLElement>("[data-sortable-id]");
      const targetId = target?.dataset.sortableId;
      if (targetId && targetId !== dragId.current) {
        moveTo(dragId.current, targetId);
      }
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);

      const id = dragId.current;
      dragId.current = null;
      setDragging(null);

      if (moved.current && id) commit(orderRef.current);
      moved.current = false;
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return (
    <div
      className={`${grid ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2.5"} ${
        pending ? "opacity-70" : ""
      } transition-opacity`}
    >
      {order.map((item) => (
        <div
          key={item.id}
          data-sortable-id={item.id}
          className={`relative rounded-xl transition-all duration-200 ${
            dragging === item.id
              ? "z-10 scale-[1.01] opacity-70 ring-1 ring-cyan/60"
              : ""
          }`}
        >
          <button
            type="button"
            data-drag-handle
            onPointerDown={(e) => onPointerDown(e, item.id)}
            title="拖拽排序（手指也可以按住拖）"
            aria-label="拖拽排序"
            style={{ touchAction: "none" }}
            className={`absolute -left-1.5 top-2 z-10 flex h-9 w-6 cursor-grab items-center justify-center rounded-md border border-[var(--line)] bg-[#0a0b0d]/90 text-mist/40 backdrop-blur transition hover:border-cyan/40 hover:text-cyan active:cursor-grabbing ${
              dragging === item.id ? "border-cyan/60 text-cyan" : ""
            }`}
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
              <circle cx="2" cy="2" r="1.2" />
              <circle cx="6" cy="2" r="1.2" />
              <circle cx="2" cy="7" r="1.2" />
              <circle cx="6" cy="7" r="1.2" />
              <circle cx="2" cy="12" r="1.2" />
              <circle cx="6" cy="12" r="1.2" />
            </svg>
          </button>
          {item.node}
        </div>
      ))}
    </div>
  );
}
