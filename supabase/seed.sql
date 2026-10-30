-- ============================================================
-- 8. 演示数据（第二阶段做后台时可以直接在网页上改/删）
-- ============================================================
delete from public.pursuits where slug in ('film-and-light', 'neon-interface', 'city-sound');

insert into public.pursuits
  (slug, title, title_ja, title_en, subtitle, subtitle_ja, subtitle_en,
   description, description_ja, description_en,
   stage, progress_note, progress_note_ja, progress_note_en,
   cover_url, accent, started_at, sort_order)
values
  ('film-and-light',
   '胶片与光', 'フィルムと光', 'Film & Light',
   '一台 1978 年的旁轴相机，和它对光线的执念。',
   '1978年のレンジファインダーと、光への執着。',
   'A 1978 rangefinder and its obsession with light.',
   '从二手市场淘来的机身，测光表已经不准了。于是我学会用眼睛读光，用一卷 36 张的耐心，去换一张勉强满意的照片。',
   '中古市場で手に入れたボディは、露出計がもう正確ではない。だから光を目で読むことを覚えた。',
   'A second-hand body whose meter no longer tells the truth. So I learned to read light by eye.',
   'polishing',
   '第三卷刚冲出来，正在做接触印样和选片。',
   '3本目を現像したところ。コンタクトプリントと選定中。',
   'Roll three is developed; making contact sheets and edits.',
   '/demo/cover-film.jpg', 'amber', '2025-03-01', 1),

  ('neon-interface',
   '霓虹界面实验', 'ネオン・インターフェース', 'Neon Interface Lab',
   '把网页当成一块会发光的玻璃。',
   'ウェブを、光るガラスとして扱う。',
   'Treating the web as a sheet of glass that glows.',
   '这里收集我对暗色界面、辉光和动态排版的试验：颜色要少，光要克制，动效只在必要时呼吸一下。',
   '暗いUI、グロー、動くタイポグラフィの実験を集めている。色は少なく、光は控えめに。',
   'Experiments in dark UI, glow, and kinetic type. Few colors, restrained light.',
   'building',
   '组件库做到一半，正在调缓动曲线和焦点态。',
   'コンポーネント集の途中。イージングとフォーカス状態を調整中。',
   'Halfway through the component kit; tuning easing and focus states.',
   '/demo/cover-neon.jpg', 'cyan', '2025-08-12', 2),

  ('city-sound',
   '城市声音采集', '都市の音', 'City Sound Field',
   '用一支麦克风，记录城市在凌晨四点的呼吸。',
   '一本のマイクで、午前4時の都市の呼吸を録る。',
   'One microphone, recording the city breathing at 4 a.m.',
   '地铁进站的风、便利店的门铃、楼下整夜运转的空调外机。它们拼起来，才是这座城市真正的底噪。',
   '地下鉄の風、コンビニのドアベル、一晩中回る室外機。それらを合わせたものが、この街の本当のノイズフロアだ。',
   'The wind of an arriving train, a convenience-store chime, the AC unit running all night.',
   'exploring',
   '刚攒够 20 段素材，还在决定第一张声音地图的样子。',
   '素材が20本たまったところ。最初のサウンドマップの形を思案中。',
   'Twenty clips collected; still deciding what the first sound map should look like.',
   '/demo/cover-sound.jpg', 'violet', '2026-01-20', 3);

-- 里程碑
insert into public.milestones (pursuit_id, title, title_ja, title_en, done, sort_order)
select p.id, v.title, v.title_ja, v.title_en, v.done, v.sort_order
from public.pursuits p
join (values
  ('film-and-light', '选定机身与镜头', 'ボディとレンズを選ぶ', 'Pick the body and lens', true, 1),
  ('film-and-light', '拍完第一卷', '1本目を撮り切る', 'Finish roll one', true, 2),
  ('film-and-light', '建立自己的显影流程', '自家現像の手順を固める', 'Set up my own development routine', true, 3),
  ('film-and-light', '整理首组 12 张作品', '最初の12枚をまとめる', 'Edit the first set of twelve', false, 4),
  ('neon-interface', '定下三色配色', '3色のパレットを決める', 'Lock a three-color palette', true, 1),
  ('neon-interface', '做出第一版组件库', 'コンポーネント集 v1', 'Ship the first component kit', true, 2),
  ('neon-interface', '给所有交互加焦点态', '全インタラクションにフォーカス状態', 'Add focus states everywhere', false, 3),
  ('city-sound', '买一支能揣进口袋的录音笔', 'ポケットに入るレコーダー', 'Get a recorder that fits a pocket', true, 1),
  ('city-sound', '采集 20 段夜间素材', '夜間の素材を20本', 'Collect twenty night clips', true, 2),
  ('city-sound', '画第一版声音地图', '最初のサウンドマップ', 'Draw the first sound map', false, 3)
) as v(slug, title, title_ja, title_en, done, sort_order) on p.slug = v.slug;

-- 作品
insert into public.portfolio_items
  (pursuit_id, kind, title, title_ja, title_en, description, description_ja, description_en, media_url, poster_url, duration_seconds, sort_order)
select p.id, v.kind, v.title, v.title_ja, v.title_en, v.descr, v.descr_ja, v.descr_en, v.media_url, v.poster::text, v.dur::integer, v.sort_order
from public.pursuits p
join (values
  ('film-and-light', 'image', '清晨六点的窗', '朝6時の窓', 'Window at six', 'Kodak Gold 200，过曝半档。', 'Kodak Gold 200、半段オーバー。', 'Kodak Gold 200, half a stop over.', '/demo/film-01.jpg', null::text, null::integer, 1),
  ('film-and-light', 'image', '雨后的天桥', '雨上がりの歩道橋', 'Footbridge after rain', '路灯把水洼照成了第二个月亮。', '街灯が水たまりをもう一つの月にした。', 'Streetlight turned the puddle into a second moon.', '/demo/film-02.jpg', null, null, 2),
  ('neon-interface', 'image', '控制台组件', 'コンソール・コンポーネント', 'Console component', '深色背景上的单色发光，信息密度优先。', '暗い背景に単色のグロー。情報密度優先。', 'Monochrome glow on dark; density first.', '/demo/neon-01.jpg', null, null, 1),
  ('neon-interface', 'image', '动态排版草稿', '動くタイポグラフィ', 'Kinetic type sketch', '字距随滚动变化，像呼吸。', 'スクロールで字間が変わる。呼吸のように。', 'Tracking shifts with scroll, like breathing.', '/demo/neon-02.jpg', null, null, 2),
  ('city-sound', 'audio', '凌晨四点的地铁口', '午前4時の地下鉄出入口', 'Subway entrance, 4 a.m.', '风声、卷帘门、远处的洒水车。', '風、シャッター、遠くの散水車。', 'Wind, shutters, a distant water truck.', '/demo/city-04.wav', '/demo/cover-sound.jpg', 24, 1),
  ('city-sound', 'image', '声音地图草稿', 'サウンドマップ草案', 'Sound map draft', '手绘的路线，标记了 6 个采集点。', '手描きのルート、6つの採取点。', 'A hand-drawn route with six capture points.', '/demo/sound-map.jpg', null, null, 2)
) as v(slug, kind, title, title_ja, title_en, descr, descr_ja, descr_en, media_url, poster, dur, sort_order) on p.slug = v.slug;

-- 笔记
insert into public.notes (pursuit_id, title, title_ja, title_en, content, is_pinned, note_date)
select p.id, v.title, v.title_ja, v.title_en, v.content, v.pinned, v.d::date
from public.pursuits p
join (values
  ('film-and-light', '为什么还在拍胶片', 'なぜまだフィルムなのか', 'Why still shoot film',
   E'因为**不能立刻看到**。\n\n数码相机让我一天拍三百张，然后在屏幕上划掉两百九十张。胶片只有 36 次机会，每一次按下快门之前，我都得先想清楚：光从哪来，我要的是什么。\n\n> 限制不是敌人，是构图的一部分。\n\n最近在练的是：\n\n1. 先用眼睛测光，再对一下测光表\n2. 一卷只定一个主题\n3. 冲扫之后先放三天，再看\n',
   true, '2026-09-18'),

  ('film-and-light', '显影温度记录', '現像温度の記録', 'Development temperature log',
   E'这个月把 D-76 的温度稳定到了 20.1°C。\n\n| 卷号 | 温度 | 时间 | 结果 |\n|---|---|---|---|\n| 03 | 20.1 | 9:30 | 反差偏硬 |\n| 04 | 20.0 | 9:15 | 正好 |\n\n下次试试把时间压到 9 分钟。\n',
   false, '2026-10-02'),

  ('neon-interface', '暗色界面的三条规矩', 'ダークUIの3つのルール', 'Three rules for dark UI',
   E'1. **底色不要纯黑**，`#05060a` 比 `#000` 更有空间感\n2. **霓虹只用在能点的地方**，装饰性发光会廉价\n3. 文字对比度至少 4.5:1，辉光不能代替亮度\n\n```css\n.card {\n  background: linear-gradient(180deg, #0b0f14, #070a0e);\n  border: 1px solid rgb(255 255 255 / 0.06);\n}\n```\n',
   true, '2026-09-30'),

  ('city-sound', '设备清单', '機材リスト', 'Gear list',
   E'- 录音笔：Tascam DR-05X\n- 防风毛衣：自己剪的\n- 耳机：Sony MDR-7506\n\n凌晨的风比白天低两个八度，麦克风要离领口远一点，不然全是衣服摩擦声。\n',
   false, '2026-10-11')
) as v(slug, title, title_ja, title_en, content, pinned, d) on p.slug = v.slug;

-- 资料与链接
insert into public.materials_and_links
  (pursuit_id, title, title_ja, title_en, url, kind, description, description_ja, description_en, sort_order)
select p.id, v.title, v.title_ja, v.title_en, v.url, v.kind, v.descr, v.descr_ja, v.descr_en, v.sort_order
from public.pursuits p
join (values
  ('film-and-light', 'Ansel Adams · The Negative', 'アンセル・アダムス『ネガ』', 'Ansel Adams, The Negative', 'https://www.anseladams.com/', 'book', '区域曝光法，翻来覆去地看。', 'ゾーンシステム。何度も読む。', 'The zone system, reread many times.', 1),
  ('film-and-light', 'Massive Dev Chart', 'Massive Dev Chart', 'Massive Dev Chart', 'https://www.digitaltruth.com/devchart.php', 'tool', '查显影液时间和温度的组合。', '現像液の時間と温度の組み合わせを調べる。', 'Look up developer times and temperatures.', 2),
  ('film-and-light', '日本カメラ博物館', '日本カメラ博物館', 'JCII Camera Museum', 'https://www.jcii-cameramuseum.jp/', 'other', '上次去东京时逛了一下午。', '前回の東京で半日過ごした。', 'Spent an afternoon there last time in Tokyo.', 3),

  ('neon-interface', 'Refactoring UI', 'Refactoring UI', 'Refactoring UI', 'https://www.refactoringui.com/', 'book', '把「好看」拆成可以执行的规则。', '「美しさ」を実行可能なルールに分解する。', 'Turns taste into rules you can apply.', 1),
  ('neon-interface', 'Tailwind CSS 文档', 'Tailwind CSS ドキュメント', 'Tailwind CSS Docs', 'https://tailwindcss.com/docs', 'tool', '查间距和颜色，几乎每天都开。', '余白と色を調べる。ほぼ毎日。', 'Spacing and color, open most days.', 2),
  ('neon-interface', 'Easing Functions Cheat Sheet', 'イージング早見表', 'Easing Functions Cheat Sheet', 'https://easings.net/', 'tool', '动效的呼吸节奏。', 'アニメーションの呼吸。', 'The breathing rhythm of motion.', 3),

  ('city-sound', 'The Sound of Cities', '都市の音', 'The Sound of Cities', 'https://www.bbc.co.uk/programmes/b01n9wjm', 'video', '关于城市声景的老纪录片。', '都市のサウンドスケープについての古いドキュメンタリー。', 'An old documentary on urban soundscapes.', 1),
  ('city-sound', 'Freesound', 'Freesound', 'Freesound', 'https://freesound.org/', 'tool', '找素材、也上传自己的。', '素材探しと投稿に。', 'Find field recordings, and upload my own.', 2)
) as v(slug, title, title_ja, title_en, url, kind, descr, descr_ja, descr_en, sort_order) on p.slug = v.slug;
