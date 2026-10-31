"use client";

import type { ReactNode } from "react";

/**
 * 删除类按钮：提交前先问一句。
 * 表单仍然走 Server Action，这里只是拦住误点。
 */
export function ConfirmSubmit({
  children,
  message,
  className,
  name,
  value,
  title,
  ariaLabel,
  formAction,
}: {
  children: ReactNode;
  message: string;
  className?: string;
  name?: string;
  value?: string;
  title?: string;
  ariaLabel?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      title={title}
      aria-label={ariaLabel}
      formAction={formAction}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
