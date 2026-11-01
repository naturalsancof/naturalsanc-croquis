import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export const inputCls =
  "w-full rounded-[8px] border-[0.5px] border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[14px] text-[var(--text)] outline-none transition placeholder:text-[var(--text-soft)] focus:border-[var(--accent)]";

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
        <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
        {hint ? (
          <span className="font-display text-[11px] text-[var(--text-soft)]">
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
      className={`${inputCls} min-h-[80px] leading-[1.7] ${props.className ?? ""}`}
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
      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--surface-muted)]"
      : variant === "danger"
        ? "border-[var(--danger)] bg-[var(--danger-surface)] text-[var(--danger)] hover:bg-[var(--surface-muted)]"
        : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]";

  return (
    <button
      {...rest}
      className={`cursor-pointer rounded-[8px] border-[0.5px] px-3.5 py-2 font-display text-[11px] transition ${styles} ${rest.className ?? ""}`}
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
    <section className="panel-solid">
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[11px] text-[var(--accent)]">
            {index}
          </span>
          <h2 className="text-[18px] font-medium text-[var(--text)]">{title}</h2>
        </div>
        {hint ? (
          <span className="font-display text-[11px] text-[var(--text-soft)]">
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
    <div className="mb-4 flex items-center gap-2 rounded-[8px] border-[0.5px] border-[var(--success)] bg-[var(--success-surface)] px-3 py-2 text-[12px] text-[var(--success)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" aria-hidden />
      已保存
    </div>
  );
}

const ERROR_TEXT: Record<string, string> = {
  "work-media": "这件作品还没有图片或链接：上传一个文件，或者填一个地址。",
  "link-url": "资料链接需要填网址。",
  "note-empty": "笔记标题和正文不能都空着。",
  upload: "文件没传上去：确认图片或音频格式，或者先只填链接。",
  create: "新建失败，请再试一次。",
  "slug-taken": "这个网址片段已经被占用了，换一个。",
};

export function ErrorBanner({ code }: { code?: string }) {
  if (!code) return null;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-[8px] border-[0.5px] border-[var(--danger)] bg-[var(--danger-surface)] px-3 py-2 text-[12px] text-[var(--danger)]">
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--danger)]"
        aria-hidden
      />
      {ERROR_TEXT[code] ?? "没有保存成功，请再试一次。"}
    </div>
  );
}
