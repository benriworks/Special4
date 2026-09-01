#!/usr/bin/env python3
"""
Subset Zen Kaku Gothic New (SIL OFL 1.1) to the glyphs this app actually renders.

Sources of characters:
  1. every non-ASCII character that appears in src/**/*.{ts,tsx} and index.html
  2. ASCII printable, hiragana, katakana, CJK punctuation, full/half-width forms
  3. a curated list of common kanji so user-typed labels (休業日 etc.) still render

Output: src/assets/fonts/*.woff2, glyphs.txt (the exact character list) and fonts.css.
Requires: pip install fonttools brotli   (dev machine only; the outputs are committed).
"""
from __future__ import annotations

import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
OUT = SRC / "assets" / "fonts"
PKG = ROOT / "node_modules" / "@fontsource" / "zen-kaku-gothic-new" / "files"
WEIGHTS = ["400", "700"]

RANGES = [
    (0x0020, 0x007E),  # ASCII
    (0x00A9, 0x00A9),  # ©
    (0x00D7, 0x00D7),  # ×
    (0x2010, 0x2027),  # dashes, quotes, bullets, ellipsis
    (0x2030, 0x203B),  # ‰ ′ ″ ※
    (0x2190, 0x2199),  # arrows
    (0x2200, 0x22FF),  # math (≥ ≤ etc.)
    (0x25A0, 0x25FF),  # geometric shapes
    (0x3000, 0x303F),  # CJK punctuation
    (0x3041, 0x309F),  # hiragana
    (0x30A0, 0x30FF),  # katakana
    (0x31F0, 0x31FF),  # katakana extensions
    (0xFF01, 0xFF5E),  # full-width forms
    (0xFF61, 0xFF9F),  # half-width katakana
    (0xFFE0, 0xFFE5),  # full-width symbols
]

COMMON_KANJI = (
    "日月火水木金土曜年週時分秒今昨明前後先来次末初旬上中下大小高低長短新古"
    "休暇業務勤出社帰宅在宅有給無給半日全休代振替祝祭式典行事会議研修出張旅行"
    "夏季冬季春秋盆正月年末年始定臨時特別連続週間期間開始終了予定確定仮決済"
    "創立記念設立周年営業定休閉店開店店舗本社支店工場倉庫棚卸点検清掃改装"
    "移転入社退職試験面接説明発表締切納品納期請求支払受付申込登録更新期限"
    "学校入学卒業始業終業授業試験受験合格発表体育文化祭運動会参観保育園幼稚"
    "子供家族親父母兄弟姉妹夫妻祖友人知人結婚誕生生葬法要墓参帰省実家"
    "病院通院健診検診人間予防接種歓迎送別忘新年会打合同窓忘年会花見祭花火"
    "海山川湖島温泉神社寺城公園遊園地動物植物博物美術館映画観劇音楽演奏"
    "東京大阪京都北海道沖縄名古屋福岡横浜神戸札幌仙台広島県市区町村国内外"
    "第一二三四五六七八九十百千万億回件名号番目個枚組部課係室班当番担当"
    "午前午後夜間早朝深夜終日半休全休代休振休有休欠勤遅刻早退外出直行直帰"
    "土日祝除含間計合計残数増減比率最多少平均以上以下未満超過不足可能不可"
    "電話連絡確認報告相談依頼対応準備完了実施中止延期変更追加削除保存共有"
    "表示設定選択入力検索結果一覧詳細戻進閉開画面情報注意案内利用方法説明"
    "現在過去未来将来歴史記録記憶思考考察検討判断決定実行評価改善成功失敗"
)


def collect_source_chars() -> set[str]:
    chars: set[str] = set()
    files = list(SRC.rglob("*.ts")) + list(SRC.rglob("*.tsx")) + [ROOT / "index.html"]
    for f in files:
        if "assets/fonts" in str(f):
            continue
        for ch in f.read_text(encoding="utf-8"):
            if ord(ch) > 0x7E and not ch.isspace():
                chars.add(ch)
    return chars


def main() -> int:
    chars = collect_source_chars()
    for lo, hi in RANGES:
        chars.update(chr(c) for c in range(lo, hi + 1))
    chars.update(COMMON_KANJI)
    chars.discard("﻿")
    text = "".join(sorted(chars))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "glyphs.txt").write_text(text + "\n", encoding="utf-8")
    print(f"{len(text)} characters")

    css = [
        "/* Zen Kaku Gothic New — SIL Open Font License 1.1 (https://github.com/googlefonts/zen-kakugothic).",
        "   Japanese files are subset by scripts/subset-fonts.py to the glyphs this app uses. */",
    ]
    for w in WEIGHTS:
        jp_in = PKG / f"zen-kaku-gothic-new-japanese-{w}-normal.woff2"
        jp_out = OUT / f"zen-kaku-gothic-new-jp-{w}.woff2"
        latin_in = PKG / f"zen-kaku-gothic-new-latin-{w}-normal.woff2"
        latin_out = OUT / f"zen-kaku-gothic-new-latin-{w}.woff2"
        cmd = [
            sys.executable, "-m", "fontTools.subset", str(jp_in),
            f"--text-file={OUT / 'glyphs.txt'}",
            "--flavor=woff2", "--layout-features=*", "--no-hinting", "--desubroutinize",
            f"--output-file={jp_out}",
        ]
        subprocess.run(cmd, check=True)
        latin_out.write_bytes(latin_in.read_bytes())
        print(f"{jp_out.name}: {jp_out.stat().st_size // 1024} KB, {latin_out.name}: {latin_out.stat().st_size // 1024} KB")
        # latin first so the Japanese face only supplies what latin lacks
        css.append(
            "@font-face {\n  font-family: 'Zen Kaku Gothic New';\n  font-style: normal;\n  font-display: swap;\n"
            f"  font-weight: {w};\n  src: url(./{latin_out.name}) format('woff2');\n"
            "  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;\n"
            "}"
        )
        css.append(
            "@font-face {\n  font-family: 'Zen Kaku Gothic New';\n  font-style: normal;\n  font-display: swap;\n"
            f"  font-weight: {w};\n  src: url(./{jp_out.name}) format('woff2');\n"
            "}"
        )
    (OUT / "fonts.css").write_text("\n".join(css) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
