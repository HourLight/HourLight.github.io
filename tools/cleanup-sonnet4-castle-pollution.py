#!/usr/bin/env python3
"""
Sonnet 4 災後清理腳本
---------------------
2026/04/13-14 期間，Sonnet 4 代理寫了 final-mass-fix.py 把 6 支內在城堡 JS 模組硬塞進
275 個跟城堡無關的 HTML 頁面的 </body> 前面。

這支腳本把那個注入區塊反向清除：
  - 非城堡頁面：整塊刪掉，</body> 回到原樣
  - 少數城堡相關頁面（whitelist）：把 Sonnet 4 的未版本化 src 換成正式的 ?v=20260414 版本

識別依據是 Sonnet 4 留下的簽章註解 `<!-- 內在城堡遊戲系統 JS 模組 -->`。

作者：馥寶 (Opus 4.6) 幫逸君善後
日期：2026/04/14
執行方式：python tools/cleanup-sonnet4-castle-pollution.py
"""
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Sonnet 4 注入的完整區塊（7 行 + </body>）
SONNET4_BLOCK = '''<!-- 內在城堡遊戲系統 JS 模組 -->
<script src="assets/js/hl-castle-key.js" defer></script>
<script src="assets/js/hl-castle-decor-v2.js" defer></script>
<script src="assets/js/hl-castle-material.js" defer></script>
<script src="assets/js/hl-castle-pets.js" defer></script>
<script src="assets/js/hl-castle-room-decor.js" defer></script>
<script src="assets/js/hl-castle-sync.js" defer></script>
</body>'''

# 清版本：只保留 </body>（城堡無關頁面使用）
CLEAN_REPLACEMENT = '</body>'

# 城堡相關頁面（keep castle modules, but upgrade to versioned loads）
CASTLE_WHITELIST = {
    'app.html',        # 會員中心儀表板，需要城堡狀態
    'game.html',       # RPG 框架
    'castle.html',     # 城堡總覽
    'castle-light.html',
    'castle-minigames.html',
}

# 正式版本化載入（castle-game.html 使用的格式）
CASTLE_CLEAN_LOAD = '''<!-- 內在城堡系統模組 (versioned) -->
<script src="assets/js/hl-castle-key.js?v=20260414" defer></script>
<script src="assets/js/hl-castle-decor-v2.js?v=20260414" defer></script>
<script src="assets/js/hl-castle-material.js?v=20260414" defer></script>
<script src="assets/js/hl-castle-pets.js?v=20260414" defer></script>
<script src="assets/js/hl-castle-room-decor.js?v=20260414" defer></script>
<script src="assets/js/hl-castle-sync.js?v=20260414" defer></script>
</body>'''


def clean_file(path):
    """回傳 (status, old_has_pollution)"""
    rel = os.path.relpath(path, REPO_ROOT)

    # 讀檔（支援 CRLF / LF）
    try:
        with open(path, 'r', encoding='utf-8', newline='') as f:
            content = f.read()
    except Exception as e:
        return ('ERROR', f'read failed: {e}')

    # 檢查是否有 Sonnet 4 簽章
    if '<!-- 內在城堡遊戲系統 JS 模組 -->' not in content:
        return ('SKIP_NO_POLLUTION', False)

    # 依 whitelist 決定替換方式
    filename = os.path.basename(path)
    is_whitelist = filename in CASTLE_WHITELIST

    # Sonnet 4 注入的區塊可能使用 \n 或 \r\n，兩個版本都試
    block_lf = SONNET4_BLOCK
    block_crlf = SONNET4_BLOCK.replace('\n', '\r\n')

    # 替換目標
    if is_whitelist:
        target_lf = CASTLE_CLEAN_LOAD
        target_crlf = CASTLE_CLEAN_LOAD.replace('\n', '\r\n')
    else:
        target_lf = CLEAN_REPLACEMENT
        target_crlf = CLEAN_REPLACEMENT

    new_content = content
    replaced = False
    # 先試 LF 版
    if block_lf in new_content:
        new_content = new_content.replace(block_lf, target_lf)
        replaced = True
    # 再試 CRLF 版
    if block_crlf in new_content:
        new_content = new_content.replace(block_crlf, target_crlf)
        replaced = True

    if not replaced:
        return ('ERROR', 'pollution marker found but block pattern did not match (mixed line endings?)')

    # 寫回
    try:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(new_content)
    except Exception as e:
        return ('ERROR', f'write failed: {e}')

    return ('WHITELIST_UPGRADED' if is_whitelist else 'CLEANED', True)


def main():
    html_files = [f for f in os.listdir(REPO_ROOT) if f.endswith('.html')]
    html_files.sort()

    stats = {
        'CLEANED': 0,
        'WHITELIST_UPGRADED': 0,
        'SKIP_NO_POLLUTION': 0,
        'ERROR': 0,
    }
    errors = []

    for f in html_files:
        path = os.path.join(REPO_ROOT, f)
        status, info = clean_file(path)
        stats[status] = stats.get(status, 0) + 1
        if status == 'ERROR':
            errors.append((f, info))
        elif status in ('CLEANED', 'WHITELIST_UPGRADED'):
            marker = '[UPG]' if status == 'WHITELIST_UPGRADED' else '[CLN]'
            print(f'{marker} {f}')

    print()
    print('=' * 60)
    print(f'Total HTML files scanned: {len(html_files)}')
    print(f'  Cleaned (removed pollution):    {stats["CLEANED"]}')
    print(f'  Whitelist upgraded (versioned): {stats["WHITELIST_UPGRADED"]}')
    print(f'  Skipped (no pollution):         {stats["SKIP_NO_POLLUTION"]}')
    print(f'  Errors:                         {stats["ERROR"]}')
    print('=' * 60)

    if errors:
        print('\nErrors detail:')
        for f, e in errors:
            print(f'  {f}: {e}')
        sys.exit(1)


if __name__ == '__main__':
    main()
