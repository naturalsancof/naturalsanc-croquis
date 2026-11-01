export const metadata = { title: "Studio" };
export const dynamic = "force-dynamic";

export default function AdminHome() {
  return (
    <div className="grid h-full place-items-center px-10">
      <div className="max-w-sm text-center">
        <div className="mark mx-auto" aria-hidden>
          <span>✕</span>
        </div>
        <h1 className="mt-6 font-display text-[32px] leading-tight tracking-[-0.03em] text-ink">
          从一条空白开始
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-mist">
          左边选一条追求，或点「+」新开一张稿纸。
        </p>
      </div>
    </div>
  );
}
