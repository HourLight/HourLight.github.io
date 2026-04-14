#!/usr/bin/env python3
"""
補回 26 個「站內工具會呼叫 hlCastle/hlMaterial」頁面的城堡模組
---------------------------------------------------------------
Sonnet 4 之前用 final-mass-fix.py 盲目塞 6 支模組到 194 頁，其中大部分（269 頁）
根本不需要 — cleanup-sonnet4-castle-pollution.py 已經清掉。

但有 **26 個頁面**真的會呼叫 `hlMaterial.drop('knowledge')` / `hlCastle.*` 等等
（站內工具 ↔ 城堡整合：讀知識→領材料、做測驗→加點數、抽牌→解鎖房間）
這些頁面需要載入城堡模組才能運作。

這支腳本把這 26 頁在 `</body>` 前面插入正式的版本化模組載入區塊。

作者：馥寶 (Opus 4.6)
日期：2026/04/14
"""
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 這 26 個頁面會呼叫城堡全域（由 grep window.hlCastle|window.hlMaterial 等得出）
# 注意：castle-* / app.html / game.html 不在此列（它們已有自己的載入）
INTEGRATION_PAGES = [
    # 知識學苑（15 頁）— 讀知識 → hlMaterial.drop('knowledge')
    'aromatherapy-science.html',
    'blending-guide.html',
    'chakra-guide.html',
    'cognitive-aromatherapy-theory.html',
    'coordinate-philosophy.html',
    'crystal-guide.html',
    'five-elements-guide.html',
    'hour-methodology.html',
    'kids-aromatherapy.html',
    'massage-guide.html',
    'meridian-guide.html',
    'naha-study-guide.html',
    'nail-energy-guide.html',
    'reiki-guide.html',
    'skincare-science.html',
    # 抽牌（1 頁）— draw-hl.html 有城堡整合
    'draw-hl.html',
    # 心理測驗（10 頁）— 做測驗 → 領材料 / 加點數
    'quiz-brain.html',
    'quiz-burnout.html',
    'quiz-dream.html',
    'quiz-flower.html',
    'quiz-pdp.html',
    'quiz-perfectionism.html',
    'quiz-procrastinate.html',
    'quiz-pseudo-extrovert.html',
    'quiz-selfesteem.html',
    'quiz-social-anxiety.html',
]

# 5 支核心模組，版本化載入（跟 castle-game.html 尾段格式一致）
# hl-castle-room-decor.js 不載入 — 那是 castle-room-*.html 自動偵測房間用的
CASTLE_MODULES_BLOCK = '''<!-- 內在城堡整合模組（用於領材料、加點數）-->
<script src="assets/js/hl-castle-key.js?v=20260414" defer></script>
<script src="assets/js/hl-castle-material.js?v=20260414" defer></script>
<script src="assets/js/hl-castle-pets.js?v=20260414" defer></script>
<script src="assets/js/hl-castle-sync.js?v=20260414" defer></script>
</body>'''


def inject(path):
    try:
        with open(path, 'r', encoding='utf-8', newline='') as f:
            content = f.read()
    except Exception as e:
        return ('ERROR', str(e))

    # 已經有模組載入？跳過
    if 'hl-castle-key.js' in content:
        return ('ALREADY_HAS', None)

    # 找 </body>（可能是 </body> 或 \r\n</body> 之類）
    if '</body>' not in content:
        return ('NO_BODY', None)

    # 決定換行符
    use_crlf = '\r\n' in content
    block = CASTLE_MODULES_BLOCK
    if use_crlf:
        block = block.replace('\n', '\r\n')

    new_content = content.replace('</body>', block, 1)

    try:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(new_content)
    except Exception as e:
        return ('ERROR', str(e))
    return ('INJECTED', None)


def main():
    stats = {'INJECTED': 0, 'ALREADY_HAS': 0, 'NO_BODY': 0, 'NOT_FOUND': 0, 'ERROR': 0}
    for fname in INTEGRATION_PAGES:
        path = os.path.join(REPO_ROOT, fname)
        if not os.path.exists(path):
            print(f'[404] {fname}')
            stats['NOT_FOUND'] += 1
            continue
        status, info = inject(path)
        stats[status] = stats.get(status, 0) + 1
        marker = {'INJECTED': '[ADD]', 'ALREADY_HAS': '[OK ]', 'NO_BODY': '[BAD]',
                  'NOT_FOUND': '[404]', 'ERROR': '[ERR]'}[status]
        print(f'{marker} {fname}' + (f' ({info})' if info else ''))
    print()
    print('=' * 60)
    print(f'Total: {len(INTEGRATION_PAGES)}')
    for k, v in stats.items():
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
