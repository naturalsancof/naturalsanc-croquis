export const metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

function CrossMark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 4l12 12M16 4L4 16" />
    </svg>
  );
}

export default function AdminHome() {
  return (
    <div className="grid h-full place-items-center px-10">
      <div className="max-w-sm text-center">
        <div className="mark mx-auto" aria-hidden>
          <CrossMark />
        </div>
        <h1 className="mt-6 text-[22px] font-medium leading-[1.3] text-[var(--text)]">
          从一条空白开始
        </h1>
        <p className="mt-2 text-base leading-[1.7] text-[var(--text-muted)]">
          左边选一条追求，或点「+」新开一张稿纸。
        </p>
      </div>
    </div>
  );
}
