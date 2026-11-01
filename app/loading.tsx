export default function Loading() {
  return (
    <div className="pb-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">正在加载</span>
      <div className="skeleton h-10 w-48" />
      <div className="mt-10 h-[0.5px] bg-[var(--border)]" />
      <div className="tile-grid mt-8">
        <div className="skeleton h-56" />
        <div className="skeleton h-56" />
        <div className="skeleton hidden h-56 sm:block" />
      </div>
    </div>
  );
}
