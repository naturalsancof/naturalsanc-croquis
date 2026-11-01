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

function ArrowUpRight() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l6-6M4.5 3H9v4.5" />
    </svg>
  );
}

export function LinkList({ links }: { links: MaterialLink[] }) {
  if (links.length === 0) {
    return (
      <p className="py-6 text-base text-[var(--text-muted)]">
        这个追求暂时还没有整理资料。攒够之后会放在这里。
      </p>
    );
  }

  return (
    <ul className="border-t-[0.5px] border-[var(--border)]">
      {links.map((link) => (
        <li key={link.id} className="border-b-[0.5px] border-[var(--border)]">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-4 py-4"
          >
            <span className="mt-0.5 w-10 shrink-0 font-display text-[11px] text-[var(--text-muted)]">
              {KIND_LABEL[link.kind] ?? "其他"}
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span className="text-[16px] text-[var(--text)] transition group-hover:underline group-hover:underline-offset-4">
                  {link.title}
                </span>
                <span className="font-display text-[11px] text-[var(--text-soft)] transition group-hover:text-[var(--text)]">
                  <ArrowUpRight />
                </span>
              </span>

              {link.title_en || link.title_ja ? (
                <span className="sub mt-0.5 block text-[11px]">
                  {[link.title_en, link.title_ja].filter(Boolean).join(" · ")}
                </span>
              ) : null}

              {link.description ? (
                <span className="mt-1.5 block text-[13px] leading-[1.7] text-[var(--text-muted)]">
                  {link.description}
                </span>
              ) : null}
            </span>

            <span className="mt-0.5 hidden shrink-0 font-display text-[11px] text-[var(--text-soft)] sm:block">
              {hostOf(link.url)}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
