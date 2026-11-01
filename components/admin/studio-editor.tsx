"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { commitStudio, deletePursuitById } from "@/app/admin/actions";
import { NotesDoc } from "@/components/admin/notes-doc";
import type { CommitResult } from "@/lib/studio";
import {
  adoptIds,
  diffStudio,
  markSaved,
  rememberInserts,
  type StudioSnapshot,
} from "@/lib/studio-diff";
import { uploadMediaFile } from "@/lib/upload-media";
import type { Pursuit } from "@/lib/types";

export type SaveStatus =
  | { kind: "saved"; warning?: string }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "error"; message: string };

export function StudioEditor({
  initial,
  initialError,
}: {
  initial: StudioSnapshot;
  initialError?: string;
}) {
  const router = useRouter();
  const dataRef = useRef(initial);
  const savedRef = useRef(structuredClone(initial));
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<SaveStatus>(
    initialError === "upload"
      ? { kind: "error", message: "追求已创建，但封面没传上去。可以在下面再传一次。" }
      : { kind: "saved" },
  );
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [renames, setRenames] = useState<{ key: string; id: string }[]>([]);
  const timer = useRef<number | null>(null);
  const flushing = useRef(false);
  const again = useRef(false);
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const flush = useCallback(async function flushSaved() {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (flushing.current) {
      again.current = true;
      return;
    }

    const sent = structuredClone(dataRef.current);
    const { changes, issues, skipped } = diffStudio(savedRef.current, sent);
    if (changes.length === 0) {
      setStatus(issues[0] ? { kind: "error", message: issues[0] } : { kind: "saved" });
      return;
    }

    flushing.current = true;
    setStatus({ kind: "saving" });

    let res: CommitResult;
    try {
      res = await commitStudio(initial.pursuit.id, changes);
    } catch {
      flushing.current = false;
      setStatus({ kind: "error", message: "网络异常，没有保存。你输入的内容还在，可以重试。" });
      return;
    }

    if (res.created.length) {
      dataRef.current = adoptIds(dataRef.current, res.created);
      setData(dataRef.current);
      setRenames(res.created);
    }

    if (!res.ok) {
      if (res.created.length) {
        savedRef.current = rememberInserts(savedRef.current, sent, res.created);
      }
      flushing.current = false;
      setStatus({ kind: "error", message: res.error ?? "没有保存成功。" });
      return;
    }

    savedRef.current = markSaved(savedRef.current, sent, skipped, res.created);
    flushing.current = false;

    if (again.current) {
      again.current = false;
      await flushRef.current();
      return;
    }

    const pending = diffStudio(savedRef.current, dataRef.current).issues[0];
    if (res.warning) setStatus({ kind: "saved", warning: res.warning });
    else if (pending) setStatus({ kind: "error", message: pending });
    else setStatus({ kind: "saved" });
  }, [initial.pursuit.id]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (status.kind === "dirty" || status.kind === "saving" || status.kind === "error") {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [flush, status.kind]);

  function write(next: StudioSnapshot, mode: "debounce" | "now" | "local") {
    dataRef.current = next;
    setData(next);
    if (mode === "local") return;
    if (timer.current) window.clearTimeout(timer.current);
    setStatus({ kind: "dirty" });
    if (mode === "now") {
      void flush();
      return;
    }
    timer.current = window.setTimeout(() => void flush(), 700);
  }

  function patchPursuit(patch: Partial<Pursuit>, mode: "debounce" | "now" = "debounce") {
    write({ ...dataRef.current, pursuit: { ...dataRef.current.pursuit, ...patch } }, mode);
  }

  function patchRow(
    key: "milestones" | "works" | "notes" | "materials",
    id: string,
    patch: object,
    mode: "debounce" | "now" = "debounce",
  ) {
    const current = dataRef.current;
    write(
      {
        ...current,
        [key]: current[key].map((row) =>
          row.id === id ? { ...row, ...patch } : row,
        ),
      },
      mode,
    );
  }

  async function pickFile(file: File | undefined, apply: (url: string) => void) {
    if (!file) return;
    setUploadLabel(file.type.startsWith("image/") ? "正在压缩并上传…" : "正在上传…");
    try {
      const url = await uploadMediaFile(file, initial.pursuit.id);
      apply(url);
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "上传失败。",
      });
    } finally {
      setUploadLabel(null);
    }
  }

  async function removePursuit() {
    if (!window.confirm("删除这个追求？作品、笔记、资料会一起删掉，不能撤销。")) return;
    await flush();
    if (diffStudio(savedRef.current, dataRef.current).changes.length > 0) {
      setStatus({
        kind: "error",
        message: "还有没保存的修改。先处理上面的错误，再删除。",
      });
      return;
    }
    const res = await deletePursuitById(initial.pursuit.id);
    if (!res.ok) {
      setStatus({ kind: "error", message: res.error });
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <NotesDoc
      data={data}
      status={status}
      uploadLabel={uploadLabel}
      onRetry={() => void flush()}
      write={write}
      patchPursuit={patchPursuit}
      patchRow={patchRow}
      pickFile={pickFile}
      onDeletePursuit={() => void removePursuit()}
      read={() => dataRef.current}
      renames={renames}
    />
  );
}

