#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
產生 Pinterest 130 張上傳 SOP 文件
────────────────────────────────────
讀 tools/cardData-decoded.json，萃取 title + keywords，輸出到 docs/pinterest-upload-sop.md

用法：python tools/build-pinterest-sop.py
"""
import json, sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = Path(__file__).parent.parent

with open(ROOT / 'tools/cardData-decoded.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

BOARD_DEFS = [
    {
        'name': '🪷 馥靈智慧牌 · 大阿爾克那',
        'start': 'A00', 'end': 'A21',
        'desc': '神聖旅程系列·22張原型牌',
        'tags': '#馥靈之鑰 #塔羅 #大阿爾克那 #自我覺察 #神秘學',
    },
    {
        'name': '🌿 馥靈智慧牌 · 精油系列',
        'start': '001', 'end': '095',
        'desc': '單方精油覺察系列·95張',
        'tags': '#馥靈之鑰 #認知芳療 #單方精油 #嗅覺記憶 #情緒覺察',
    },
    {
        'name': '💫 馥靈智慧牌 · 複方系列',
        'start': '096', 'end': '108',
        'desc': '複方精油能量系列·13張',
        'tags': '#馥靈之鑰 #複方精油 #情緒調香 #認知芳療 #身心平衡',
    },
]


def codes_for(start, end):
    codes = []
    if start.startswith('A'):
        for i in range(int(start[1:]), int(end[1:]) + 1):
            codes.append(f'A{i:02d}')
    else:
        for i in range(int(start), int(end) + 1):
            codes.append(f'{i:03d}')
    return codes


lines = []
P = lines.append  # shorthand
P('# Pinterest 130 張圖卡上傳 SOP')
P('')
P('> 由歐寶整理｜日期 2026-04-17')
P('> Pinterest 圖卡全部 130 張已產生於 `pinterest-cards/` 目錄（.gitignore，不在 repo 裡）')
P('> 本 SOP 按 3 個 board 分組，每張 Pin 附標題 / 描述 / hashtag / 引流連結建議')
P('')
P('---')
P('')
P('## Pinterest 帳號設定（一次性）')
P('')
P('1. 使用 hourlightkey.com 官方信箱註冊 Pinterest **商業帳號**（不要個人帳號）')
P('2. Bio：「馥靈之鑰 Hour Light｜讀懂自己，活對人生。33 套命理 × 130 張原創牌卡 × AI 解讀。hourlightkey.com」')
P('3. Profile picture 用官方 Logo（LOGO-1.png）')
P('4. 首頁連結 https://hourlightkey.com')
P('5. 認證網域：Pinterest → 設定 → 申領網站 → 上傳驗證檔到 root')
P('')
P('---')
P('')
P('## Board 設定')
P('')
P('建立三個 board，名稱與封面建議：')
P('')

for b in BOARD_DEFS:
    codes = codes_for(b['start'], b['end'])
    P(f'### {b["name"]}')
    P(f'- 描述：{b["desc"]}')
    P(f'- 預設 hashtag（每張 Pin 可沿用）：`{b["tags"]}`')
    P(f'- 張數：{len(codes)}')
    P(f'- 封面圖建議：第一張（{codes[0]}.jpg）')
    P(f'- 外連：https://hourlightkey.com/draw-hl.html')
    P('')

P('---')
P('')
P('## 逐張 Pin 內容（130 張）')
P('')
P('每張 Pin 上傳時填：')
P('- **標題**：用表格裡的「牌名」')
P('- **描述**：按「建議描述」欄複製貼上（已含 hashtag）')
P('- **連結**：`https://hourlightkey.com/draw-hl.html?card={code}`（讓人點進去就能看到對應牌卡）')
P('')
P('**推薦批次流程**：一次上傳 10 張 → Pinterest 介面批次編輯描述（可複製貼上），速度約 30 分鐘 / board')
P('')

for b in BOARD_DEFS:
    P(f'### {b["name"]}')
    P('')
    P('| Code | 牌名 | 關鍵字（前 3）| 建議描述（可直接複製） |')
    P('|---|---|---|---|')
    codes = codes_for(b['start'], b['end'])
    for c in codes:
        card = cards.get(c, {})
        title = (card.get('title') or c).replace('|', '｜')
        kws_raw = card.get('keywords') or ''
        kws_list = []
        for piece in kws_raw.replace('、', ',').split(','):
            piece = piece.strip()
            if piece:
                kws_list.append(piece)
        kws_list = kws_list[:3]
        kws_joined = '、'.join(kws_list) if kws_list else '（待補）'
        desc_line = f'{title}｜{kws_joined}。馥靈之鑰 130 張原創智慧牌卡 #{c}，線上即抽即解。{b["tags"]}'
        P(f'| {c} | {title} | {kws_joined} | {desc_line} |')
    P('')

P('---')
P('')
P('## 上傳節奏建議')
P('')
P('**Week 1**（本週）：上 22 張大阿爾克那（A00-A21）→ 最容易被 Pinterest 推薦演算法抓，因為「塔羅」是永恆熱關鍵字')
P('')
P('**Week 2**：上 50 張精油牌（001-050）→ 分兩批，每天 25 張')
P('')
P('**Week 3**：上 45 張精油牌（051-095）→ 分兩批')
P('')
P('**Week 4**：上 13 張複方牌（096-108）')
P('')
P('為什麼分 4 週？Pinterest 演算法獎勵**持續貼文**，一次全丟 130 張會被判定 spam。')
P('')
P('---')
P('')
P('## Pin 發佈後 30 天追蹤')
P('')
P('Pinterest 後台 Analytics 看三個指標：')
P('')
P('1. **Impressions** 曝光：新 pin 通常 2-4 週後進入曝光週期')
P('2. **Outbound clicks** 點擊外連（進官網的次數）：這是你最在意的')
P('3. **Saves** 轉貼儲存：儲存多 = 演算法推更廣')
P('')
P('每月月底盤點前 5 名表現最好的 pin，把那些牌卡的 hashtag 組合套到下個月新 pin。')
P('')
P('---')
P('')
P('## 絕對不要做的 5 件事')
P('')
P('1. **一次全傳 130 張**：Pinterest spam 警告，演算法會降權 30 天')
P('2. **每張描述一字不差複製**：被判定為 scheduled spam，要微調關鍵字順序')
P('3. **連結全指 homepage**：Pinterest 降權；要各自指向對應的工具頁')
P('4. **用 emoji 開頭描述**：Pinterest 演算法把這當 spam signal')
P('5. **加 >10 個 hashtag**：Pinterest 建議 5-8 個，超過 10 開始降權')
P('')
P('© 2026 馥靈之鑰｜僅供王逸君使用')

content = '\n'.join(lines) + '\n'
out = ROOT / 'docs' / 'pinterest-upload-sop.md'
out.write_text(content, encoding='utf-8')
print(f'wrote {out}')
print(f'length: {len(content)} chars, {content.count(chr(10))} lines')
