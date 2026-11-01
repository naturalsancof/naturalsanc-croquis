"use client";

import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

type Item = { id: string; node: ReactNode };

/**
 * 受控的拖拽排序。顺序由父组件保存，松手时再提交。
 * 拖拽手柄单独接收手势，输入框仍可正常点选和滚动。
 */
export function Sortable({
  items,
  grid = false,
  onReorder,
}: {
  items: Item[];
  grid?: boolean;
  onReorder: (ids: string[], phase: "move" | "commit") => void;
}) {
  const itemsRef = useRef(items);
  const moved = useRef(false);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const moveTo = (fromId: string, toId: string, phase: "move" | "commit") => {
    const order = itemsRef.current.map((item) => item.id);
    const from = order.indexOf(fromId);
    const to = order.indexOf(toId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...order];
    const [id] = next.splice(from, 1);
    next.splice(to, 0, id);
    onReorder(next, phase);
  };

  const onPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    id: string,
  ) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragId.current = id;
    moved.current = false;

    const onMove = (ev: PointerEvent) => {
      if (!dragId.current) return;
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const target = el?.closest<HTMLElement>("[data-sortable-id]");
      const targetId = target?.dataset.sortableId;
      if (!targetId || targetId === dragId.current) return;
      moved.current = true;
      moveTo(dragId.current, targetId, "move");
    };

    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const current = dragId.current;
      dragId.current = null;
      if (moved.current && current) {
        onReorder(
          itemsRef.current.map((item) => item.id),
          "commit",
        );
      }
      moved.current = false;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return (
    <div className={grid ? "grid gap-8 sm:grid-cols-2" : ""}>
      {items.map((item) => (
        <div key={item.id} data-sortable-id={item.id} className="relative">
          <button
            type="button"
            aria-label="拖拽排序"
            title="按住拖动排序"
            onPointerDown={(event) => onPointerDown(event, item.id)}
            style={{ touchAction: "none" }}
            className="absolute -left-1 top-2 z-10 grid h-8 w-5 cursor-grab place-items-center text-ink/20 hover:text-ink/60"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor" aria-hidden>
              <circle cx="2" cy="2" r="1.15" />
              <circle cx="6" cy="2" r="1.15" />
              <circle cx="2" cy="7" r="1.15" />
              <circle cx="6" cy="7" r="1.15" />
              <circle cx="2" cy="12" r="1.15" />
              <circle cx="6" cy="12" r="1.15" />
            </svg>
          </button>
          {item.node}
        </div>
      ))}
    </div>
  );
}
