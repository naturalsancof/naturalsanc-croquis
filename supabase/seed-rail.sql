-- 追加四张演示卡片（可重复执行）
delete from public.pursuits
where slug in ('type-hunting', 'woodwork', 'interface-archaeology', 'paper-and-ink');

insert into public.pursuits
  (slug, title, title_en, title_ja, subtitle, subtitle_en, subtitle_ja,
   description, description_en, description_ja,
   stage, progress_note, progress_note_en, progress_note_ja,
   cover_url, accent, started_at, sort_order)
values
  ('type-hunting', '字体采集', 'Type Hunt', 'タイポ収集',
   '把街上的字拍下来，按笔画分类。',
   'Photographing the type on the street, sorted by stroke.',
   '街の文字を撮って、画数で分類する。',
   '店招、货车侧面、旧楼门牌。它们不是设计出来的，是被生活磨出来的。', 
   'Shop signs, truck panels, old door plates — not designed, but worn into shape.',
   '看板、トラックの側面、古いビルの表札。デザインされたのではなく、暮らしに削られた字。',
   'building',
   '第 4 组已经整理完，正在做笔画对照表。',
   'Set four is filed; building the stroke comparison sheet.',
   '4セット目まで整理済み。画数対照表を作成中。',
   '/demo/poster-type.jpg', 'cyan', '2026-02-10', 4),

  ('woodwork', '木工手记', 'Woodwork', '木工ノート',
   '做一把能坐一辈子的椅子。',
   'Building a chair that outlives me.',
   '一生使える椅子を作る。',
   '从一块白橡木开始。刨、凿、榫卯，全部手工。第一把注定是歪的。',
   'Starting from a plank of white oak. Plane, chisel, joinery — all by hand. The first one will be crooked.',
   'ホワイトオークの一枚板から。鉋、鑿、仕口、すべて手仕事。最初の一脚はきっと歪む。',
   'exploring',
   '木料已经干够半年，图纸改了第三版。',
   'The stock has dried for six months; third revision of the drawings.',
   '材は半年乾燥済み。図面は3稿目。',
   '/demo/poster-wood.jpg', 'amber', '2026-04-02', 5),

  ('interface-archaeology', '界面考古', 'Interface Archive', 'インターフェース考古学',
   '拆解九十年代的操作界面，看它们怎么教人用电脑。',
   'Taking apart 90s interfaces to see how they taught people to compute.',
   '90年代のUIを分解し、どうやって人にコンピュータを教えたかを見る。',
   '每一道阴影、每一条虚线，都在解释「这里是按钮」。这些约定后来变成了本能。',
   'Every bevel and dotted line was an argument for "this is a button". Those conventions became instinct.',
   'ベベルも点線も「ここはボタンだ」という説明だった。その約束はやがて本能になる。',
   'polishing',
   '整理了 12 个系统的截图，正在写第一篇。',
   'Twelve systems catalogued; writing the first essay.',
   '12システムを整理。最初の論考を執筆中。',
   '/demo/poster-archive.jpg', 'magenta', '2025-11-08', 6),

  ('paper-and-ink', '纸与墨', 'Paper & Ink', '紙と墨',
   '在一间手工印刷作坊待了三个月。',
   'Three months inside a letterpress workshop.',
   '活版印刷の工房で三か月。',
   '铅字、油墨、压力。印出来的每一张都不一样，这才是它好玩的地方。',
   'Lead type, ink, pressure. No two pulls are identical — which is the point.',
   '活字、インク、圧。刷り上がりは一枚ごとに違う。そこが面白い。',
   'shipped',
   '作品集印好了，五十本，手写编号。',
   'The portfolio is printed: fifty copies, numbered by hand.',
   '作品集を印刷。50部、手書きの番号入り。',
   '/demo/poster-ink.jpg', 'lime', '2024-09-15', 7);

insert into public.milestones (pursuit_id, title, title_en, title_ja, done, sort_order)
select p.id, v.t, v.te, v.tj, v.done, v.ord
from public.pursuits p
join (values
  ('type-hunting', '拍满 300 张街拍', 'Shoot 300 street types', '街の文字を300枚', true, 1),
  ('type-hunting', '按结构分出 6 类', 'Sort into six families', '構造で6分類', true, 2),
  ('type-hunting', '做一张对照表', 'Build a comparison sheet', '対照表を作る', false, 3),
  ('woodwork', '木料干燥到位', 'Stock dried', '材を乾燥させる', true, 1),
  ('woodwork', '完成第一组榫卯', 'First joinery test', '最初の仕口', false, 2),
  ('woodwork', '做出椅子原型', 'Chair prototype', '椅子の試作', false, 3),
  ('interface-archaeology', '收集 12 个系统', 'Collect twelve systems', '12システムを収集', true, 1),
  ('interface-archaeology', '拆解 3 个交互范式', 'Deconstruct three paradigms', '3つの操作様式を分解', true, 2),
  ('interface-archaeology', '写完第一篇长文', 'Finish the first essay', '最初の論考を書き上げる', false, 3),
  ('paper-and-ink', '学会排字', 'Learn typesetting', '組版を覚える', true, 1),
  ('paper-and-ink', '印出 50 本作品集', 'Print fifty portfolios', '作品集50部を印刷', true, 2),
  ('paper-and-ink', '寄给 20 个人', 'Mail twenty copies', '20人に送る', true, 3)
) as v(slug, t, te, tj, done, ord) on p.slug = v.slug;
