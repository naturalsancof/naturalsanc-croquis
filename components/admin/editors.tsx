import Image from "next/image";
import {
  saveMaterial,
  saveMilestone,
  saveNote,
  saveWork,
} from "@/app/admin/actions";
import {
  AdminCard,
  Btn,
  Field,
  Input,
  Select,
  Textarea,
  inputCls,
} from "@/components/admin/ui";
import { formatDate } from "@/lib/display";
import type { MaterialLink, Milestone, Note, PortfolioItem } from "@/lib/types";

const fileCls =
  "w-full cursor-pointer rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] text-mist file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-white/10 file:px-2.5 file:py-1 file:text-[10px] file:text-paper";

/* ------------------------------- milestones ------------------------------- */

export function MilestonesEditor({
  pursuitId,
  items,
}: {
  pursuitId: string;
  items: Milestone[];
}) {
  return (
    <AdminCard index="02" title="里程碑" hint="MILESTONES">
      <div className="space-y-2">
        {items.map((m) => (
          <form
            key={m.id}
            action={saveMilestone}
            className="grid grid-cols-1 gap-2 rounded-lg border border-white/8 bg-white/[0.015] p-3 sm:grid-cols-[auto_minmax(0,1fr)_130px_130px_60px_auto] sm:items-center"
          >
            <input type="hidden" name="id" value={m.id} />
            <input type="hidden" name="pursuit_id" value={pursuitId} />
            <input
              type="checkbox"
              name="done"
              defaultChecked={m.done}
              className="h-4 w-4 accent-[#22d3ee]"
              title="已完成"
            />
            <input name="title" defaultValue={m.title} className={inputCls} />
            <input
              name="title_en"
              defaultValue={m.title_en ?? ""}
              placeholder="EN"
              className={inputCls}
            />
            <input
              name="title_ja"
              defaultValue={m.title_ja ?? ""}
              placeholder="日本語"
              className={inputCls}
            />
            <input
              type="number"
              name="sort_order"
              defaultValue={m.sort_order}
              className={inputCls}
            />
            <div className="flex gap-2">
              <Btn type="submit" name="intent" value="save" variant="ghost">
                存
              </Btn>
              <Btn type="submit" name="intent" value="delete" variant="danger">
                删
              </Btn>
            </div>
          </form>
        ))}
        {items.length === 0 ? (
          <p className="text-[12px] text-mist/50">还没有里程碑。</p>
        ) : null}
      </div>

      <form
        action={saveMilestone}
        className="mt-4 grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="pursuit_id" value={pursuitId} />
        <Field label="新增里程碑" hint="中文">
          <Input name="title" placeholder="例如：整理首组 12 张作品" />
        </Field>
        <Field label="EN" hint="可选">
          <Input name="title_en" />
        </Field>
        <Field label="日本語" hint="可选">
          <Input name="title_ja" />
        </Field>
        <Btn type="submit" name="intent" value="save">
          添加
        </Btn>
      </form>
    </AdminCard>
  );
}

/* -------------------------------- portfolio ------------------------------- */

export function WorksEditor({
  pursuitId,
  items,
}: {
  pursuitId: string;
  items: PortfolioItem[];
}) {
  return (
    <AdminCard index="03" title="作品" hint="WORKS">
      <div className="space-y-4">
        {items.map((item) => (
          <form
            key={item.id}
            action={saveWork}
            className="rounded-xl border border-white/8 bg-white/[0.015] p-4"
          >
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="pursuit_id" value={pursuitId} />

            <div className="flex flex-wrap items-start gap-4">
              <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                {item.kind === "image" ? (
                  item.media_url ? (
                    <Image
                      src={item.media_url}
                      alt=""
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : null
                ) : (
                  <span className="grid h-full w-full place-items-center text-2xl text-violet">
                    ♫
                  </span>
                )}
              </div>

              <div className="grid min-w-[240px] flex-1 gap-3 sm:grid-cols-3">
                <Field label="类型" hint="KIND">
                  <Select name="kind" defaultValue={item.kind}>
                    <option value="image">图片</option>
                    <option value="audio">音频</option>
                  </Select>
                </Field>
                <Field label="标题" hint="中文">
                  <Input name="title" defaultValue={item.title ?? ""} />
                </Field>
                <Field label="标题" hint="EN / 日">
                  <div className="flex gap-2">
                    <Input name="title_en" defaultValue={item.title_en ?? ""} />
                    <Input name="title_ja" defaultValue={item.title_ja ?? ""} />
                  </div>
                </Field>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="说明" hint="中文">
                <Input
                  name="description"
                  defaultValue={item.description ?? ""}
                />
              </Field>
              <Field label="说明" hint="EN / 日">
                <div className="flex gap-2">
                  <Input
                    name="description_en"
                    defaultValue={item.description_en ?? ""}
                  />
                  <Input
                    name="description_ja"
                    defaultValue={item.description_ja ?? ""}
                  />
                </div>
              </Field>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
              <Field label="文件地址" hint="URL；或下面上传">
                <Input
                  name="media_url"
                  defaultValue={item.media_url}
                  placeholder="/demo/x.jpg 或 https://…"
                />
              </Field>
              <Field label="上传文件" hint="图片或音频">
                <input
                  type="file"
                  name="file"
                  accept="image/*,audio/*"
                  className={fileCls}
                />
              </Field>
              <Field label="音频时长" hint="秒 · 可选">
                <Input
                  type="number"
                  name="duration_seconds"
                  defaultValue={item.duration_seconds ?? ""}
                />
              </Field>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
              <Field label="封面/海报" hint="音频用 · 可选">
                <Input name="poster_url" defaultValue={item.poster_url ?? ""} />
              </Field>
              <Field label="上传海报" hint="可选">
                <input
                  type="file"
                  name="poster_file"
                  accept="image/*"
                  className={fileCls}
                />
              </Field>
              <Field label="排序" hint="小的在前">
                <Input
                  type="number"
                  name="sort_order"
                  defaultValue={item.sort_order}
                />
              </Field>
              <div className="flex gap-2 pb-0.5">
                <Btn type="submit" name="intent" value="save">
                  保存
                </Btn>
                <Btn type="submit" name="intent" value="delete" variant="danger">
                  删除
                </Btn>
              </div>
            </div>
          </form>
        ))}
      </div>

      <form
        action={saveWork}
        className="mt-5 grid gap-3 border-t border-white/5 pt-5 sm:grid-cols-[110px_1fr_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="pursuit_id" value={pursuitId} />
        <Field label="新增作品" hint="TYPE">
          <Select name="kind" defaultValue="image">
            <option value="image">图片</option>
            <option value="audio">音频</option>
          </Select>
        </Field>
        <Field label="标题" hint="中文">
          <Input name="title" placeholder="作品名" />
        </Field>
        <Field label="上传文件" hint="必填">
          <input
            type="file"
            name="file"
            accept="image/*,audio/*"
            className={fileCls}
          />
        </Field>
        <Btn type="submit" name="intent" value="save">
          添加
        </Btn>
      </form>
    </AdminCard>
  );
}

/* ---------------------------------- notes --------------------------------- */

export function NotesEditor({
  pursuitId,
  items,
}: {
  pursuitId: string;
  items: Note[];
}) {
  return (
    <AdminCard index="04" title="笔记" hint="NOTES · MARKDOWN">
      <div className="space-y-4">
        {items.map((n) => (
          <form
            key={n.id}
            action={saveNote}
            className="rounded-xl border border-white/8 bg-white/[0.015] p-4"
          >
            <input type="hidden" name="id" value={n.id} />
            <input type="hidden" name="pursuit_id" value={pursuitId} />

            <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
              <Field label="标题" hint="中文">
                <Input name="title" defaultValue={n.title} />
              </Field>
              <Field label="标题" hint="EN / 日">
                <div className="flex gap-2">
                  <Input name="title_en" defaultValue={n.title_en ?? ""} />
                  <Input name="title_ja" defaultValue={n.title_ja ?? ""} />
                </div>
              </Field>
              <Field label="日期">
                <Input type="date" name="note_date" defaultValue={n.note_date} />
              </Field>
              <div className="flex gap-2 pb-0.5">
                <Btn type="submit" name="intent" value="save">
                  保存
                </Btn>
                <Btn type="submit" name="intent" value="delete" variant="danger">
                  删除
                </Btn>
              </div>
            </div>

            <div className="mt-3">
              <Field label="正文" hint="Markdown · 支持标题/列表/引用/表格/代码">
                <Textarea
                  name="content"
                  defaultValue={n.content ?? ""}
                  className="min-h-[160px] font-mono text-[12px]"
                />
              </Field>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-5 text-[12px] text-mist">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_pinned"
                  defaultChecked={n.is_pinned}
                  className="h-4 w-4 accent-[#22d3ee]"
                />
                置顶
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked={n.is_published}
                  className="h-4 w-4 accent-[#22d3ee]"
                />
                公开
              </label>
              <span className="font-display text-[10px] text-mist/30">
                创建于 {formatDate(n.created_at)}
              </span>
            </div>
          </form>
        ))}
      </div>

      <form
        action={saveNote}
        className="mt-5 grid gap-3 border-t border-white/5 pt-5 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
      >
        <input type="hidden" name="pursuit_id" value={pursuitId} />
        <Field label="新增笔记" hint="标题">
          <Input name="title" placeholder="写点什么" />
        </Field>
        <Field label="正文" hint="可稍后再补">
          <Input name="content" placeholder="支持 Markdown" />
        </Field>
        <Btn type="submit" name="intent" value="save">
          添加
        </Btn>
      </form>
    </AdminCard>
  );
}

/* -------------------------------- materials ------------------------------- */

export function MaterialsEditor({
  pursuitId,
  items,
}: {
  pursuitId: string;
  items: MaterialLink[];
}) {
  return (
    <AdminCard index="05" title="学习资料与链接" hint="MATERIALS">
      <div className="space-y-2">
        {items.map((l) => (
          <form
            key={l.id}
            action={saveMaterial}
            className="grid gap-2 rounded-lg border border-white/8 bg-white/[0.015] p-3 sm:grid-cols-[1.2fr_1.6fr_110px_1.4fr_64px_auto] sm:items-center"
          >
            <input type="hidden" name="id" value={l.id} />
            <input type="hidden" name="pursuit_id" value={pursuitId} />
            <Input name="title" defaultValue={l.title} placeholder="标题" />
            <Input name="url" defaultValue={l.url} placeholder="https://…" />
            <Select name="kind" defaultValue={l.kind}>
              <option value="article">文章</option>
              <option value="course">课程</option>
              <option value="book">书</option>
              <option value="tool">工具</option>
              <option value="video">影像</option>
              <option value="other">其他</option>
            </Select>
            <Input
              name="description"
              defaultValue={l.description ?? ""}
              placeholder="一句说明"
            />
            <Input
              type="number"
              name="sort_order"
              defaultValue={l.sort_order}
            />
            <div className="flex gap-2">
              <Btn type="submit" name="intent" value="save" variant="ghost">
                存
              </Btn>
              <Btn type="submit" name="intent" value="delete" variant="danger">
                删
              </Btn>
            </div>
          </form>
        ))}
      </div>

      <form
        action={saveMaterial}
        className="mt-4 grid gap-2 border-t border-white/5 pt-4 sm:grid-cols-[1.2fr_1.6fr_110px_auto] sm:items-end"
      >
        <input type="hidden" name="pursuit_id" value={pursuitId} />
        <Field label="新增链接" hint="标题">
          <Input name="title" placeholder="例如：Refactoring UI" />
        </Field>
        <Field label="网址" hint="必填">
          <Input name="url" placeholder="https://…" />
        </Field>
        <Field label="类型">
          <Select name="kind" defaultValue="article">
            <option value="article">文章</option>
            <option value="course">课程</option>
            <option value="book">书</option>
            <option value="tool">工具</option>
            <option value="video">影像</option>
            <option value="other">其他</option>
          </Select>
        </Field>
        <Btn type="submit" name="intent" value="save">
          添加
        </Btn>
      </form>
    </AdminCard>
  );
}
