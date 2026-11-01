export default function Loading() {
  return (
    <div className="pb-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">正在加载</span>
      <div className="skeleton h-10 w-48" />
      <div className="mt-10 h-px bg-ink/10" />
      <div className="mt-8 grid grid-cols-3 gap-6">
        <div className="skeleton h-56" />
        <div className="skeleton h-56" />
        <div className="skeleton hidden h-56 sm:block" />
      </div>
    </div>
  );
}
