"use client";

import {
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { reorderRows } from "@/app/admin/actions";

type Item = { id: string; node: ReactNode };

/**
 * 拖拽排序容器。
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
  const [over, setOver] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setOrder(items);
  }, [items]);

  const commit = (next: Item[]) => {
    setOrder(next);
    startTransition(async () => {
      await reorderRows(
        table,
        next.map((i) => i.id),
      );
    });
  };

  const drop = (targetId: string) => {
    if (!dragging || dragging === targetId) {
      setDragging(null);
      setOver(null);
      return;
    }
    const next = [...order];
    const from = next.findIndex((i) => i.id === dragging);
    const to = next.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
    setDragging(null);
    setOver(null);
  };

  return (
    <div
      className={`${grid ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "space-y-2"} ${
        pending ? "opacity-70" : ""
      } transition-opacity`}
    >
      {order.map((item) => (
        <div
          key={item.id}
          data-sortable-id={item.id}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(item.id);
          }}
          onDragLeave={() => setOver((v) => (v === item.id ? null : v))}
          onDrop={(e) => {
            e.preventDefault();
            drop(item.id);
          }}
          className={`relative rounded-xl transition ${
            dragging === item.id ? "opacity-40" : ""
          } ${over === item.id && dragging !== item.id ? "ring-1 ring-cyan/40" : ""}`}
        >
          <button
            type="button"
            draggable
            onDragStart={(e) => {
              setDragging(item.id);
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", item.id);
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            title="拖拽排序"
            aria-label="拖拽排序"
            className="absolute -left-1 top-2 z-10 cursor-grab rounded-md border border-white/10 bg-[#070a10] px-1.5 py-1 text-mist/40 transition hover:border-cyan/40 hover:text-cyan active:cursor-grabbing"
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
