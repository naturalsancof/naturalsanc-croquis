import { formatDate } from "@/lib/display";
import type { Note } from "@/lib/types";
import { Markdown } from "./markdown";

export function NoteList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <p className="py-6 text-sm text-mist/60">
        还没有笔记。等这个追求有新进展时，我会写下来。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <article
          key={note.id}
          className="panel-flat px-5 py-5 transition hover:border-white/15"
        >
          <header className="mb-3 flex flex-wrap items-center gap-3">
            <time className="font-display text-[10px] tracking-[0.22em] text-mist/50">
              {formatDate(note.note_date)}
            </time>
            {note.is_pinned ? (
              <span className="chip chip-accent !px-2 !py-0.5 !text-[9px]">
                PINNED
              </span>
            ) : null}
          </header>

          <h3 className="text-[17px] text-paper">{note.title}</h3>
          {note.title_en || note.title_ja ? (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
              {note.title_en ? (
                <span className="sub uppercase text-[10px]">{note.title_en}</span>
              ) : null}
              {note.title_ja ? (
                <span className="sub-ja text-[10px]">{note.title_ja}</span>
              ) : null}
            </p>
          ) : null}

          {note.content ? (
            <div className="mt-4">
              <Markdown>{note.content}</Markdown>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
