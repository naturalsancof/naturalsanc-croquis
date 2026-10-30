import Image from "next/image";
import { deletePursuit, savePursuit } from "@/app/admin/actions";
import { Btn, Field, Input, Textarea } from "@/components/admin/ui";
import { ACCENT_HEX, STAGES, stageIndex } from "@/lib/display";
import type { Pursuit } from "@/lib/types";

function CoverPreview({ pursuit }: { pursuit: Pursuit }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/40">
      {pursuit.cover_url ? (
        <Image
          src={pursuit.cover_url}
          alt=""
          fill
          sizes="300px"
          className="object-cover"
        />
      ) : (
        <div className="grid h-full place-items-center text-[11px] text-mist/30">
          还没有封面
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-[15px] text-white/95">{pursuit.title}</p>
        {pursuit.title_en ? (
          <p className="font-display text-[9px] tracking-[0.18em] text-white/45">
            {pursuit.title_en.toUpperCase()}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PursuitForm({ pursuit }: { pursuit: Pursuit }) {
  const idx = stageIndex(pursuit.stage);
  const accent = ACCENT_HEX[pursuit.accent];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start">
      <form action={savePursuit} className="panel space-y-6 p-5 sm:p-7">
        <input type="hidden" name="id" value={pursuit.id} />

        <fieldset className="space-y-4">
          <legend className="mb-1 font-display text-[10px] tracking-[0.22em] text-mist/40">
            标题 / TITLE
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="中文" hint="必填">
              <Input name="title" defaultValue={pursuit.title} required />
            </Field>
            <Field label="English" hint="小字显示">
              <Input name="title_en" defaultValue={pursuit.title_en ?? ""} />
            </Field>
            <Field label="日本語" hint="小字显示">
              <Input name="title_ja" defaultValue={pursuit.title_ja ?? ""} />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 font-display text-[10px] tracking-[0.22em] text-mist/40">
            简介 / SUBTITLE
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="中文">
              <Input name="subtitle" defaultValue={pursuit.subtitle ?? ""} />
            </Field>
            <Field label="English">
              <Input name="subtitle_en" defaultValue={pursuit.subtitle_en ?? ""} />
            </Field>
            <Field label="日本語">
              <Input name="subtitle_ja" defaultValue={pursuit.subtitle_ja ?? ""} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="详细说明" hint="中文 · 进度卡顶部">
              <Textarea
                name="description"
                defaultValue={pursuit.description ?? ""}
              />
            </Field>
            <Field label="English">
              <Textarea
                name="description_en"
                defaultValue={pursuit.description_en ?? ""}
              />
            </Field>
            <Field label="日本語">
              <Textarea
                name="description_ja"
                defaultValue={pursuit.description_ja ?? ""}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 font-display text-[10px] tracking-[0.22em] text-mist/40">
            阶段 / STAGE
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STAGES.map((s) => (
              <label key={s.key} className="cursor-pointer">
                <input
                  type="radio"
                  name="stage"
                  value={s.key}
                  defaultChecked={pursuit.stage === s.key}
                  className="peer sr-only"
                />
                <span className="block rounded-lg border border-white/10 px-2 py-2.5 text-center transition peer-checked:border-cyan/60 peer-checked:bg-cyan/10 peer-checked:text-cyan hover:border-white/25">
                  <span className="block text-[13px]">{s.zh}</span>
                  <span className="mt-0.5 block font-display text-[8px] tracking-[0.16em] text-mist/45">
                    {s.en.toUpperCase()}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="阶段说明" hint="中文">
              <Textarea
                name="progress_note"
                defaultValue={pursuit.progress_note ?? ""}
              />
            </Field>
            <Field label="English">
              <Textarea
                name="progress_note_en"
                defaultValue={pursuit.progress_note_en ?? ""}
              />
            </Field>
            <Field label="日本語">
              <Textarea
                name="progress_note_ja"
                defaultValue={pursuit.progress_note_ja ?? ""}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 font-display text-[10px] tracking-[0.22em] text-mist/40">
            网址与外观 / LOOK
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="网址片段" hint="SLUG">
              <Input name="slug" defaultValue={pursuit.slug} required />
            </Field>
            <Field label="开始日期">
              <Input
                type="date"
                name="started_at"
                defaultValue={pursuit.started_at ?? ""}
              />
            </Field>
            <Field label="排序" hint="小的在前">
              <Input
                type="number"
                name="sort_order"
                defaultValue={pursuit.sort_order}
              />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-[12px] text-mist/80">
              主色 <span className="font-display text-[9px] text-mist/35">ACCENT</span>
            </p>
            <div className="flex gap-3">
              {(Object.keys(ACCENT_HEX) as (keyof typeof ACCENT_HEX)[]).map(
                (key) => (
                  <label
                    key={key}
                    className="cursor-pointer"
                    title={key}
                  >
                    <input
                      type="radio"
                      name="accent"
                      value={key}
                      defaultChecked={pursuit.accent === key}
                      className="peer sr-only"
                    />
                    <span
                      className="block h-8 w-8 rounded-full border-2 border-transparent ring-1 ring-white/10 transition peer-checked:border-white peer-checked:ring-white/40"
                      style={{ background: ACCENT_HEX[key] }}
                    />
                  </label>
                ),
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <Field label="封面地址" hint="URL 或下面上传">
              <Input
                name="cover_url"
                defaultValue={pursuit.cover_url ?? ""}
                placeholder="/demo/cover-film.jpg 或 https://…"
              />
            </Field>
            <Field label="上传封面" hint="选文件会覆盖地址">
              <input
                type="file"
                name="cover_file"
                accept="image/*"
                className="w-full cursor-pointer rounded-lg border border-dashed border-white/15 bg-black/30 px-3 py-2 text-[11px] text-mist transition hover:border-cyan/40 file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-white/10 file:px-2.5 file:py-1 file:text-[10px] file:text-paper"
              />
            </Field>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-5">
          <label className="flex items-center gap-2 text-[12px] text-mist">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={pursuit.is_published}
              className="h-4 w-4 accent-[#22d3ee]"
            />
            已发布（不勾就是草稿）
          </label>

          <div className="flex items-center gap-3">
            <Btn type="submit">保存</Btn>
            <button
              type="submit"
              formAction={deletePursuit}
              className="cursor-pointer rounded-lg border border-red-500/25 px-3.5 py-2 font-display text-[10px] tracking-[0.16em] text-red-300/70 uppercase transition hover:border-red-500/60 hover:bg-red-500/10"
            >
              删除
            </button>
          </div>
        </div>
      </form>

      {/* 右侧实时预览（已保存的状态） */}
      <aside className="space-y-3 lg:sticky lg:top-24">
        <p className="font-display text-[9px] tracking-[0.24em] text-mist/35">
          PREVIEW · 已保存的样子
        </p>
        <CoverPreview pursuit={pursuit} />

        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <span className="chip !py-1 !text-[9px]">
              {pursuit.is_published ? "已发布" : "草稿"}
            </span>
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
            />
          </div>

          <div className="mt-4 flex gap-1.5">
            {STAGES.map((s, i) => (
              <span
                key={s.key}
                className="h-[3px] flex-1 rounded-full"
                style={{
                  background: i <= idx ? accent : "rgba(255,255,255,0.08)",
                  boxShadow: i <= idx ? `0 0 8px ${accent}66` : "none",
                }}
              />
            ))}
          </div>
          <p className="mt-2 font-display text-[9px] tracking-[0.14em] text-mist/50">
            {STAGES[idx].zh} · {pursuit.progress_note ? "有阶段说明" : "没有阶段说明"}
          </p>
        </div>

        <a
          href={`/pursuits/${pursuit.slug}`}
          target="_blank"
          className="block rounded-xl border border-white/8 px-4 py-3 text-center font-display text-[10px] tracking-[0.18em] text-mist/60 transition hover:border-white/25 hover:text-paper"
        >
          打开公开页面 ↗
        </a>
      </aside>
    </div>
  );
}
