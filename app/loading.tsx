export default function Loading() {
  return (
    <div className="pb-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">正在加载</span>
      <div className="skeleton h-20 w-[min(100%,42rem)] rounded-[28px]" />
      <div className="skeleton mt-4 h-3 w-40 rounded-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="skeleton h-64 rounded-[28px] sm:h-80" />
        <div className="skeleton h-72 rounded-[28px] sm:mt-6 sm:h-[22rem]" />
        <div className="skeleton hidden h-64 rounded-[28px] sm:block sm:h-80" />
      </div>
    </div>
  );
}
