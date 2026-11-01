import { formatDate } from "@/lib/display";
import type { Note } from "@/lib/types";
import { Markdown } from "./markdown";

function PinIcon() {
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
      <path d="M6 1.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3L1.7 4.6l3-.4L6 1.5z" />
    </svg>
  );
}

export function NoteList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <p className="py-6 text-base text-[var(--text-muted)]">
        还没有笔记。等这个追求有新进展时，我会写下来。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <article
          key={note.id}
          className="border-l-[0.5px] border-[var(--border-strong)] pl-5 transition hover:border-[var(--text-soft)]"
        >
          <header className="mb-2 flex flex-wrap items-center gap-3">
            <time className="font-display text-[11px] text-[var(--text-muted)]">
              {formatDate(note.note_date)}
            </time>
            {note.is_pinned ? (
              <span className="flex items-center gap-1 font-display text-[11px] text-[var(--text)]">
                <PinIcon />
                Pinned
              </span>
            ) : null}
          </header>

          <h3 className="text-[16px] font-medium text-[var(--text)]">{note.title}</h3>
          {note.title_en || note.title_ja ? (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              {note.title_en ? (
                <span className="sub text-[11px]">{note.title_en}</span>
              ) : null}
              {note.title_ja ? (
                <span className="sub-ja text-[11px]">{note.title_ja}</span>
              ) : null}
            </p>
          ) : null}

          {note.content ? (
            <div className="mt-3">
              <Markdown>{note.content}</Markdown>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
