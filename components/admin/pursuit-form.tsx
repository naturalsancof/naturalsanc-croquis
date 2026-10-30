import { savePursuit, deletePursuit } from "@/app/admin/actions";
import {
  AdminCard,
  Btn,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/admin/ui";
import { ACCENT_HEX, STAGES } from "@/lib/display";
import type { Pursuit } from "@/lib/types";

export function PursuitForm({ pursuit }: { pursuit: Pursuit }) {
  return (
    <AdminCard index="01" title="基本信息" hint="PURSUIT">
      <form action={savePursuit} className="space-y-5">
        <input type="hidden" name="id" value={pursuit.id} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="标题" hint="中文 · 必填">
            <Input name="title" defaultValue={pursuit.title} required />
          </Field>
          <Field label="标题" hint="EN">
            <Input name="title_en" defaultValue={pursuit.title_en ?? ""} />
          </Field>
          <Field label="标题" hint="日本語">
            <Input name="title_ja" defaultValue={pursuit.title_ja ?? ""} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="一句话简介" hint="中文">
            <Input name="subtitle" defaultValue={pursuit.subtitle ?? ""} />
          </Field>
          <Field label="简介" hint="EN">
            <Input name="subtitle_en" defaultValue={pursuit.subtitle_en ?? ""} />
          </Field>
          <Field label="简介" hint="日本語">
            <Input name="subtitle_ja" defaultValue={pursuit.subtitle_ja ?? ""} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="详细说明" hint="中文 · 显示在进度卡顶部">
            <Textarea name="description" defaultValue={pursuit.description ?? ""} />
          </Field>
          <Field label="详细说明" hint="EN">
            <Textarea
              name="description_en"
              defaultValue={pursuit.description_en ?? ""}
            />
          </Field>
          <Field label="详细说明" hint="日本語">
            <Textarea
              name="description_ja"
              defaultValue={pursuit.description_ja ?? ""}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="网址片段" hint="SLUG · 改了旧链接会失效">
            <Input name="slug" defaultValue={pursuit.slug} required />
          </Field>
          <Field label="开始日期">
            <Input
              type="date"
              name="started_at"
              defaultValue={pursuit.started_at ?? ""}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="阶段" hint="进度条亮到这一格">
            <Select name="stage" defaultValue={pursuit.stage}>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.zh} · {s.en}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="主色" hint="ACCENT">
            <Select name="accent" defaultValue={pursuit.accent}>
              {Object.keys(ACCENT_HEX).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="排序" hint="小的在前">
            <Input
              type="number"
              name="sort_order"
              defaultValue={pursuit.sort_order}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="阶段说明" hint="中文">
            <Textarea
              name="progress_note"
              defaultValue={pursuit.progress_note ?? ""}
            />
          </Field>
          <Field label="阶段说明" hint="EN">
            <Textarea
              name="progress_note_en"
              defaultValue={pursuit.progress_note_en ?? ""}
            />
          </Field>
          <Field label="阶段说明" hint="日本語">
            <Textarea
              name="progress_note_ja"
              defaultValue={pursuit.progress_note_ja ?? ""}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Field label="封面图地址" hint="URL 或下面上传">
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
              className="w-full cursor-pointer rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-mist file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-white/10 file:px-2.5 file:py-1 file:text-[10px] file:text-paper"
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-5">
          <label className="flex items-center gap-2 text-[12px] text-mist">
            <input
              type="checkbox"
              name="is_published"
              defaultChecked={pursuit.is_published}
              className="h-4 w-4 accent-[#22d3ee]"
            />
            已发布（不勾就是草稿，公开页面看不到）
          </label>

          <div className="flex items-center gap-3">
            <Btn type="submit">保存</Btn>
            <button
              type="submit"
              formAction={deletePursuit}
              className="cursor-pointer rounded-lg border border-red-500/25 px-3.5 py-2 font-display text-[10px] tracking-[0.16em] text-red-300/70 uppercase transition hover:border-red-500/60 hover:bg-red-500/10"
            >
              删除这个追求
            </button>
          </div>
        </div>
      </form>
    </AdminCard>
  );
}
