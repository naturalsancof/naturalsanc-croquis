import type { Accent, Stage } from "./types";

export const ACCENT_HEX: Record<Accent, string> = {
  cyan: "#22d3ee",
  magenta: "#ff4d9d",
  violet: "#a78bfa",
  lime: "#a3e635",
  amber: "#fbbf24",
};

export const STAGES: { key: Stage; zh: string; en: string; ja: string }[] = [
  { key: "exploring", zh: "探索", en: "Exploring", ja: "探索" },
  { key: "building", zh: "构建", en: "Building", ja: "構築" },
  { key: "polishing", zh: "打磨", en: "Polishing", ja: "研磨" },
  { key: "shipped", zh: "发布", en: "Shipped", ja: "公開" },
];

export function stageIndex(stage: Stage): number {
  const i = STAGES.findIndex((s) => s.key === stage);
  return i < 0 ? 0 : i;
}

export function stageLabel(stage: Stage) {
  return STAGES[stageIndex(stage)];
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return "";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
