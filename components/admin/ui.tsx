import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-paper outline-none transition placeholder:text-mist/30 focus:border-cyan/50 focus:ring-1 focus:ring-cyan/30";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[12px] text-mist/80">{label}</span>
        {hint ? (
          <span className="font-display text-[9px] tracking-[0.12em] text-mist/35">
            {hint}
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${inputCls} min-h-[80px] leading-relaxed ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${inputCls} ${props.className ?? ""}`}>
      {props.children}
    </select>
  );
}

export function Btn({
  children,
  variant = "primary",
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles =
    variant === "primary"
      ? "border-cyan/50 bg-cyan/10 text-cyan hover:bg-cyan/20"
      : variant === "danger"
        ? "border-red-500/30 text-red-300/80 hover:border-red-500/60 hover:bg-red-500/10"
        : "border-white/10 text-mist hover:border-white/25 hover:text-paper";

  return (
    <button
      {...rest}
      className={`cursor-pointer rounded-lg border px-3.5 py-2 font-display text-[10px] tracking-[0.16em] uppercase transition ${styles} ${rest.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function AdminCard({
  index,
  title,
  hint,
  children,
}: {
  index: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel p-5 sm:p-7">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[10px] tracking-[0.28em] text-cyan/70">
            {index}
          </span>
          <h2 className="text-[15px] text-paper">{title}</h2>
        </div>
        {hint ? (
          <span className="font-display text-[9px] tracking-[0.2em] text-mist/35">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SavedBanner({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-lime/30 bg-lime/10 px-3 py-2 text-[12px] text-lime/90">
      <span className="h-1.5 w-1.5 rounded-full bg-lime shadow-[0_0_8px_#a3e635]" />
      已保存
    </div>
  );
}
