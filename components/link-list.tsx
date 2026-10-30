import { hostOf } from "@/lib/display";
import type { MaterialKind, MaterialLink } from "@/lib/types";

const KIND_LABEL: Record<MaterialKind, string> = {
  article: "文章",
  course: "课程",
  book: "书",
  tool: "工具",
  video: "影像",
  other: "其他",
};

export function LinkList({ links }: { links: MaterialLink[] }) {
  if (links.length === 0) {
    return (
      <p className="py-6 text-sm text-mist/60">
        这个追求暂时还没有整理资料。攒够之后会放在这里。
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/5">
      {links.map((link) => (
        <li key={link.id}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 py-4 transition"
          >
            <span className="mt-0.5 w-12 shrink-0 font-display text-[9px] tracking-[0.14em] text-mist/50">
              {KIND_LABEL[link.kind] ?? "其他"}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-[15px] text-paper transition group-hover:text-white">
                  {link.title}
                </span>
                <span className="font-display text-[10px] text-mist/30 transition group-hover:text-cyan/60">
                  ↗
                </span>
              </span>

              {link.title_en || link.title_ja ? (
                <span className="sub mt-0.5 block text-[10px] uppercase">
                  {[link.title_en, link.title_ja].filter(Boolean).join(" · ")}
                </span>
              ) : null}

              {link.description ? (
                <span className="mt-1.5 block text-[13px] leading-relaxed text-mist/70">
                  {link.description}
                </span>
              ) : null}
            </span>

            <span className="mt-0.5 hidden shrink-0 font-display text-[10px] tracking-[0.08em] text-mist/35 sm:block">
              {hostOf(link.url)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
