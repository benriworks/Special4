# DESIGN_SPEC — 日付のミカタ（Special4 デモアプリ）

- 版: v1.0
- 作成日: 2026-09-01
- 状態: confirmed（推定項目は §1 ターゲットのみ。公開デモのため作者確認なしで既定値を採用し、本書に明記）
- 推定項目: あり（§1 ターゲット [推定]）

---

## 1. 目的・ターゲット

- サービス名/画面名: 日付のミカタ（ひづけのみかた）— 有休ブースト付き 年間連休マップ
- サービス概要: 日本の「国民の祝日に関する法律」を端末内で計算し、その年の祝日・連休を一枚の地図にする。有休スライダーを動かすと、連休がどこまで伸びるかを即座に見せる。営業日計算・和暦変換の小道具を同梱。
- 画面の目的（1つ）: 開いた5秒で「今年の連休はここ、有休◯日でここまで伸びる」を理解させ、スライダーを触らせる
- 主KPI/成功条件: スライダー操作率（着地→1回以上の変更）、連休カードの共有/コピー
- ターゲット [推定]: 日本在住の会社員・フリーランス・総務担当（25〜50歳）。有休計画、納期・営業日の計算、書類の和暦記入に日常的に困っている。二次的に旅行好き、コードを見に来るエンジニア。
- ターゲットがデザインに与える制約: 職場チャットに貼っても恥ずかしくない「大人の道具」。スマホ（375px）で電車内・片手操作。祝日=赤・土曜=青 という日本のカレンダー慣習は踏襲する（学習コストゼロ）。

## 2. 情報設計（IA）

1. ヘッダー（タイトル・年切替・テーマ）— 「何年のマップか」を常に明示
2. ヒーロー：見出し（休み合計・3連休以上の回数・最長連休）＋有休スライダー＋モード切替 — 価値の一言と唯一の操作を最上部に
3. 次の連休バナー — 「自分事化」させる最短経路（今日からの距離）
4. 年間連休マップ（12か月＋リボン＋凡例）— 製品の本体。ヒーローの操作結果がここに映る
5. 連休詳細シート（リボン選択時）— 期間・必要な有休・和暦・カード共有。深掘りは必要な人だけ
6. ツール（営業日計算／和暦・年齢／休日設定）— 「同じ画面で片づく」小道具。マップの下に3タブで常時表示（折りたたみは発見性を下げるため採用しない）
7. フッター注記 — 祝日法準拠・春分秋分の予定値・オフライン動作・リポジトリ。誠実さを設計に含める

## 3. ページ構成

- 使用セクション: Header / Hero / Banner / YearMap / Sheet(ダイアログ) / Tools / Footer
- Hero構成要素: キャッチコピー「有休1日で、連休はもっと伸びる。」/ 見出し（数値ロール）「2026年の休み 120日 ／ 3連休以上 9回 ／ 最長 9日」/ 操作「有休 [0——●———10] 3日」＋モード「最長の連休をつくる｜3連休以上を増やす」/ ビジュアル=マップ自体（ヒーロー直下）/ 信頼情報=「祝日法に基づき端末内で計算・通信なし」の1行
- CTA配置箇所: リボン（マップ内）→ シート内「カードにする」「テキストをコピー」。ヘッダーに派手なCTAは置かない

## 4. レイアウト

- 基本: 1カラム（ヒーロー）＋ CSS Grid（マップ）
- コンテナ最大幅: 1200px 中央寄せ、左右パディング PC 32px / SP 16px
- グリッド: マップは Desktop(≥1024px) 4列×3行 / Tablet(640–1023px) 2列×6行 / Mobile(<640px) 1列×12行。gap 24px（SP 16px）
- セクション別レイアウト:
  - Hero: PC 2カラム（左 7fr: 見出し＋スライダー、右 5fr: 次の連休バナー）→ SP 1カラム縦積み
  - 月カード: 7列グリッド（日〜土）。セル正方形、Desktop 約38px / Mobile 約46px
  - Tools: タブ3本、コンテンツ1カラム。フォームは PC 2列 → SP 1列
- 整列: テキストは左揃え。見出し数値は tabular-nums で桁揃え

## 5. ビジュアルスタイル

- 採用: エディトリアル × ミニマル × フラット（design-catalog §1-2）
- 各スタイルの適用範囲: 全体=ミニマル（白紙・墨・広い余白・少色数）、ヒーロー見出しと連休リボン=エディトリアル（雑誌の年間カレンダー付録の「帯ラベル」）、部品=フラット（影なし、1pxの罫）
- 唯一の記憶点: **連休リボン**。3日以上の休みを、日付セルの上に横一本の帯として重ね、帯の上に連休名と日数を刻む。有休で継ぎ足された部分だけ山吹色＋細い斜線で見せる。スライダーを動かすと帯が伸び、見出しの数字が回る。この一動作が製品のすべて
- 注意点への対策: ミニマルで印象が弱くなる → 朱の帯と山吹の継ぎ足しに彩度を集中させ、他はほぼ無彩色。フラットで押せる感が弱い → ボタンは墨のベタ塗り、リボンは hover で明度変化＋カーソル

## 6. トーン&マナー

- 希望する印象: 端正 × 誠実 × 気が利く
- **避けたい印象**: 管理画面っぽい（ダッシュボードのカード群） / 装飾過多・派手 / Googleカレンダーの模倣 / 幼い（絵文字・丸文字）

## 7. カラー設計

ライト（既定）:

| 役割 | 値 | 意図 |
|---|---|---|
| Primary | #1B1F2A | 墨。見出し・主ボタン・今日マーカー。「紙とインク」の主役 |
| Secondary | #3558A2 | 藍。土曜の日付（週休=土日のとき）。日本のカレンダー慣習 |
| Accent (Holiday) | #C8102E | 朱。祝日・日曜の日付、連休リボンの地色 |
| Accent (PTO) | #F2B01E | 山吹。有休で継ぎ足した帯・スライダーのつまみ・有休セル |
| PTO Text | #9A6700 | 白地の上に有休色で文字を置くときの濃色版 |
| Background | #FBFBF9 | 紙白（クリーム寄せすぎない） |
| Surface | #FFFFFF | 月カード・シート・入力欄 |
| Text | #1B1F2A | 本文 |
| Muted Text | #5C6370 | 補足・曜日ヘッダー・注記 |
| Border | rgba(27,31,42,0.14) | 罫線 |
| Error | #B3261E | — |
| Success | #1E7B4F | — |
| Warning | #8A5A00 | — |

ダーク（`prefers-color-scheme: dark` またはトグル）:

| 役割 | 値 | 意図 |
|---|---|---|
| Primary | #ECEEF2 | 紙色の反転（主ボタンは明色地に深藍文字） |
| Secondary | #8FB3F0 | 土曜 |
| Accent (Holiday) text | #FF6B7A | 祝日の日付文字 |
| Accent (Holiday) ribbon | #D42A45 | 帯の地色（白文字） |
| Accent (PTO) | #F2B01E | 山吹（文字は墨 #1B1F2A） |
| PTO Text | #F2B01E | 深藍地の上では山吹をそのまま文字に使える |
| Background | #101826 | 深藍の紙 |
| Surface | #172033 | 月カード・シート |
| Text | #ECEEF2 | 本文 |
| Muted Text | #A3ACBA | 補足 |
| Border | rgba(236,238,242,0.14) | 罫線 |
| Error | #FF8A80 / Success #6CCB94 / Warning #F2B01E | — |

- コントラスト検証（scripts: scratchpad/contrast.mjs で算出）: Text/Background 15.88:1、Muted/Background 5.83:1、Holiday text/Background 5.68:1、Saturday/Background 6.60:1、白/朱リボン 5.88:1、墨/山吹 8.62:1、PTO Text/Background 4.70:1。ダーク: Text 15.31:1、Muted 7.76:1、Holiday text 6.47:1、白/暗朱リボン 4.98:1、山吹文字 9.32:1。すべて ≥4.5:1
- 非文字コントラスト: 山吹の帯と紙白は 1.84:1 のため、有休帯には必ず 1px の墨系ボーダー rgba(27,31,42,.4) と斜線パターンを併用し、色以外で境界と意味を伝える

## 8. タイポグラフィー

- Font Family: "Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif（@fontsource で自前配信、400/700 のみ。外部フォントCDNは使わない）
- スケール:

| 用途 | size | weight | line-height |
|---|---|---|---|
| Display（ヒーロー数値） | 56px（SP 40px） | 700 | 1.1 / tabular-nums |
| H1（サイト名） | 22px | 700 | 1.3 |
| H2（セクション） | 20px（SP 18px） | 700 | 1.4 |
| H3（月名・シート見出し） | 16px | 700 | 1.5 |
| Body | 16px | 400 | 1.8 |
| Caption（注記・凡例） | 13px | 400 | 1.6 |
| Button | 15px | 700 | 1 |
| Day number（カレンダー日付） | 13px（SP 14px） | 400 / 今日・祝日は 700 | 1 |
| Ribbon label | 12px | 700 | 1 / letter-spacing 0.02em |

- 行長: 本文は最大 40 文字（max-width 40em 相当）
- 数値は `font-variant-numeric: tabular-nums` を必須とする（ロール時にガタつかない）

## 9. コンポーネント設計

- **Primary Button**: 用途=シート内の主行動（カードにする） / 背景=Primary（墨）文字=白 / 高さ 44px padding 0 20px / radius 8px / 影なし
- **Secondary Button**: 用途=テキストをコピー・PNG保存・今日 / 枠線 1px Border、文字=Text、背景=透明 / 高さ 44px / radius 8px
- **Text Button**: 用途=年切替 ‹ › 、注記のリンク / 下線なし、hover で下線 / 最小タップ 44×44
- **Icon Button（テーマ切替）**: 44×44、枠線 1px Border、radius 8px
- **Slider（有休）**: input[type=range] 0–10 step 1 / トラック高さ 6px 色=Border、進捗部分=山吹 / つまみ 28px 円（山吹、墨1pxボーダー）、タップ領域 44px / 値ラベル「有休 3日」を右側に 700
- **Segmented control（モード・週休）**: 高さ 40px、枠線 1px Border、radius 8px、選択=墨ベタ＋白文字、非選択=透明＋Text
- **MonthCard**: Surface 背景、1px Border、radius 12px、padding 12px / 見出し「1月」「January」は左揃え / 曜日ヘッダー 13px Muted（日曜は朱、土曜は藍）
- **DayCell**: 正方形、role=gridcell、数字中央 / 祝日・日曜=朱 / 土曜（週休時）=藍 / 平日=Text / 前後月の余白は空 / 今日=墨の円ベタ塗り＋白数字 / 有休提案日=山吹の角丸背景（radius 6px）＋墨数字＋斜線 / 独自休業日=数字下に 10×2px の朱バー / 祝日=数字下に 4px ドット（朱） / 表示年が今年のとき、過去の日は opacity .55（今日・有休提案日は除く）
- **Ribbon**: grid の行に重ねる帯（高さ 18px、radius 4px）。朱ベタ＋白文字 12px 700。有休継ぎ足し部分は山吹ベタ＋墨文字＋repeating-linear-gradient の斜線（墨 12%）＋1px 墨系ボーダー。週をまたぐ帯は行ごとに分割、名前は最長セグメントのみに表示。button 要素、aria-label「9月19日から9月23日まで 5連休」
- **NextStreakBanner**: Surface、1px Border、radius 12px、padding 20px。1行目 Caption「次の連休」、2行目 H3 期間、3行目 Body「あと18日 ・ 有休なしで5連休」
- **Sheet（連休詳細）**: `<dialog>` 要素。PC=中央モーダル 480px、SP=下からのボトムシート。radius 16px、影 0 12px 32px rgba(27,31,42,.18)。閉じるボタン 44×44 右上
- **Tabs（ツール）**: role=tablist、下線 2px で選択表示（墨）、文字 15px 700。パネル padding 24px（SP 16px）
- **Form Input（date/number/select）**: 高さ 44px、1px Border、radius 8px、padding 0 12px、背景 Surface、文字 16px
- **ResultCard**: Surface、1px Border、radius 12px、padding 16px。ラベル Caption、値 H2 tabular-nums、和暦を Caption で併記、右上に「コピー」Secondary Button
- **Toast**: 画面下中央、墨背景・白文字、radius 8px、2.5秒で消える、role=status
- **UpdateToast（PWA更新通知）**: 画面下中央、Surface 背景・1px Border・影 Sheet、文言「新しいバージョンがあります。」＋「更新する」Primary(sm)・「あとで」Secondary(sm)
- **Legend**: 凡例。色チップ 12px 角丸 3px＋Caption 文字（祝日・振替休日・国民の休日 / 週休 / 有休（提案）/ 独自休業日 / 今日）
- **Badge「予定」**: 春分・秋分が官報公示前の年に付与。Caption 12px、枠線 1px Warning、文字 Warning、radius 4px、padding 0 6px
- **Header**: 高さ 64px、下罫 1px Border。左: サイト名 H1、中央: 年切替（‹ 2026 ›）、右: テーマトグル
- **Footer**: Caption、Muted、上罫 1px Border、padding 48px 0

## 10. UI状態

| 部品 | Default | Hover | Active | Focus | Disabled | Loading | Error |
|---|---|---|---|---|---|---|---|
| Primary Button | 墨/白 | 背景 #2A3040 | 背景 #0F131B、translateY(1px) | 2px outline Secondary(藍) offset 2px | opacity .45、cursor not-allowed | 文字→「作成中…」＋スピナー、二重送信不可 | — |
| Secondary Button | 透明/枠 | 背景 rgba(27,31,42,.06) | 背景 rgba(27,31,42,.10) | 同上 | opacity .45 | — | — |
| Slider | 山吹つまみ | つまみ拡大 32px | つまみ拡大＋輪 rgba(242,176,30,.25) | 輪 2px 藍 | opacity .45 | — | — |
| Segmented | 透明 | 背景 rgba(27,31,42,.06) | — | outline 藍 | — | — | — |
| Ribbon | 朱/山吹 | 明度 +6%（filter: brightness(1.06)） | — | outline 2px 藍 offset 1px | — | — | — |
| DayCell | — | 背景 rgba(27,31,42,.05) | — | outline 2px 藍（ロービング tabindex） | — | — | — |
| Form Input | 枠 Border | 枠 rgba(27,31,42,.4) | — | 枠 2px 藍 | 背景 rgba(27,31,42,.04) | — | 枠 2px Error＋直下にメッセージ（Error 色、13px、アイコン「!」付き） |
| Tab | Muted | Text | — | outline 藍 | — | — | — |

- Empty State: ツール「独自休業日」一覧が空のとき「休業日はまだありません。年末年始・お盆のプリセットから追加できます。」＋プリセットチップ2つ
- エラーメッセージ例: 「終了日は開始日より後の日付にしてください。」「令和は1年（2019年5月1日）から入力できます。」「明治は6年（1873年）以降の日付のみ変換できます。」 ← 色のみでの表現禁止
- Loading: 初期表示は同期計算（数ms）のため不要。カード生成時のみ Primary Button を Loading に
- 数値ロール: RollingNumber は 300ms ease-out。`prefers-reduced-motion: reduce` では即時切替
- リボン伸縮: width/grid-column の transition 240ms。reduced-motion では即時

## 11. 余白・角丸・影

```
spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px
section spacing: PC 64px / SP 40px
card padding: MonthCard 12px / Banner 20px / ToolPanel 24px (SP 16px)
card gap: 24px (SP 16px)
radius: MonthCard 12px / Banner 12px / Sheet 16px / Button・Input 8px / Ribbon 4px / DayCell(PTO) 6px / Badge 4px
shadow: なし（Sheet のみ 0 12px 32px rgba(27,31,42,.18)）
```

## 12. レスポンシブ設計

```
Mobile: 〜639px / Tablet: 640〜1023px / Desktop: 1024px〜 / Large: 1280px〜
```

- SPでの崩し方: ヒーロー2カラム→縦積み、マップ 4列→1列、ツールのフォーム 2列→1列、シートはボトムシート化、ヘッダーは年切替を中央に残しサイト名を短縮しない（64px 内に収める）
- タップ対象最小: 44px（DayCell は Mobile 46px、Desktop はマウス前提で 38px だがキーボード操作可）
- 禁止: 横スクロール発生 / 画像はみ出し / 帯ラベルの折返し（幅不足時はラベル非表示、aria-label で読み上げは維持）

## 13. アクセシビリティ

- 本文 ≥ 16px / コントラスト ≥ 4.5:1（§7 で数値検証済み）
- 色だけで情報を伝えない: 祝日=ドット、有休=斜線、今日=塗りつぶし円、独自休業=ドット＋凡例。エラーはメッセージ併記
- キーボード操作: マップは grid ロール＋ロービング tabindex（矢印/Home/End/PageUp/PageDown）、リボンは button、スライダーは矢印キー、Sheet は Esc で閉じフォーカス復帰
- スクリーンリーダー: ヒーローの要約文を `aria-live="polite"` で更新、スライダーに `aria-valuetext="有休3日"`
- 画像: 共有カード PNG に alt 相当のテキスト版を常に併記
- `prefers-reduced-motion` で全アニメーション即時化
- `lang="ja"`、見出し階層 h1→h2→h3 を崩さない

## 14. Design Token

§7〜11 と完全一致。実装では `src/styles/tokens.css` のみを真実源とし、他ファイルでの色・サイズ直書きを禁止する。

```css
:root {
  color-scheme: light;
  /* color */
  --color-primary: #1B1F2A;
  --color-primary-hover: #2A3040;
  --color-primary-active: #0F131B;
  --color-on-primary: #FFFFFF;
  --color-secondary: #3558A2;
  --color-holiday: #C8102E;
  --color-holiday-ribbon: #C8102E;
  --color-on-holiday: #FFFFFF;
  --color-pto: #F2B01E;
  --color-pto-text: #9A6700;
  --color-on-pto: #1B1F2A;
  --color-pto-border: rgba(27, 31, 42, 0.4);
  --color-bg: #FBFBF9;
  --color-surface: #FFFFFF;
  --color-text: #1B1F2A;
  --color-text-muted: #5C6370;
  --color-border: rgba(27, 31, 42, 0.14);
  --color-border-strong: rgba(27, 31, 42, 0.4);
  --color-hover: rgba(27, 31, 42, 0.06);
  --color-active: rgba(27, 31, 42, 0.10);
  --color-error: #B3261E;
  --color-success: #1E7B4F;
  --color-warning: #8A5A00;
  --color-focus: #3558A2;
  /* typography */
  --font-family: "Zen Kaku Gothic New", "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", system-ui, sans-serif;
  --font-size-display: 56px;
  --font-size-h1: 22px;
  --font-size-h2: 20px;
  --font-size-h3: 16px;
  --font-size-body: 16px;
  --font-size-caption: 13px;
  --font-size-button: 15px;
  --font-size-day: 13px;
  --font-size-ribbon: 12px;
  --line-height-display: 1.1;
  --line-height-heading: 1.4;
  --line-height-body: 1.8;
  --line-height-caption: 1.6;
  /* spacing / radius / shadow */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;
  --space-section: 64px;
  --radius-card: 12px;
  --radius-sheet: 16px;
  --radius-control: 8px;
  --radius-ribbon: 4px;
  --radius-pto: 6px;
  --radius-badge: 4px;
  --shadow-sheet: 0 12px 32px rgba(27, 31, 42, 0.18);
  /* sizes */
  --size-tap: 44px;
  --size-header: 64px;
  --size-ribbon: 18px;
  --size-slider-thumb: 28px;
  --container-max: 1200px;
  /* motion */
  --duration-roll: 300ms;
  --duration-ribbon: 240ms;
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --color-primary: #ECEEF2;
  --color-primary-hover: #FFFFFF;
  --color-primary-active: #D5D9E0;
  --color-on-primary: #101826;
  --color-secondary: #8FB3F0;
  --color-holiday: #FF6B7A;
  --color-holiday-ribbon: #D42A45;
  --color-on-holiday: #FFFFFF;
  --color-pto: #F2B01E;
  --color-pto-text: #F2B01E;
  --color-on-pto: #1B1F2A;
  --color-pto-border: rgba(236, 238, 242, 0.5);
  --color-bg: #101826;
  --color-surface: #172033;
  --color-text: #ECEEF2;
  --color-text-muted: #A3ACBA;
  --color-border: rgba(236, 238, 242, 0.14);
  --color-border-strong: rgba(236, 238, 242, 0.4);
  --color-hover: rgba(236, 238, 242, 0.08);
  --color-active: rgba(236, 238, 242, 0.14);
  --color-error: #FF8A80;
  --color-success: #6CCB94;
  --color-warning: #F2B01E;
  --color-focus: #8FB3F0;
  --shadow-sheet: 0 12px 32px rgba(0, 0, 0, 0.5);
}
@media (max-width: 639px) {
  :root { --font-size-display: 40px; --font-size-day: 14px; --space-section: 40px; }
}
```

---

## 完成チェックリスト

- [x] AC-01: 禁止曖昧語が本文にゼロ
- [x] AC-02: §6 に避けたい印象が4語
- [x] AC-03: §7 全役割にHEX/rgba値
- [x] AC-04: コントラスト比を数値で記載（最小 4.70:1）
- [x] AC-05: Body 16px / line-height 1.8
- [x] AC-06: Button 6状態、Form に Focus/Error
- [x] AC-07: エラーはメッセージ併記
- [x] AC-08: タップ対象 44px（Mobile DayCell 46px）
- [x] AC-09: §14 トークンが §7〜11 と一致
- [x] AC-10: [推定] は §1 ターゲットのみ。公開デモの既定値として採用し、README で作者に確認を促す
