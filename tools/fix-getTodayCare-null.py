#!/usr/bin/env python3
"""
批次修復 castle-room-*.html 的 getTodayCare() null crash
-----------------------------------------------------------
昨天 Sonnet 4 截圖顯示 castle-room-mirror.html 的 getTodayCare(st) 在 st 為 null 時
會丟 Cannot read properties of null (reading 'care')。

同樣的 bug 存在於多個 castle-room-*.html（繁簡雙版），是共用的腳本複製過去的。
這支腳本批次替所有沒加 null check 的版本補上 `if(!st || !st.care) return {};`。

作者：馥寶 (Opus 4.6)
日期：2026/04/14
"""
import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 兩種模式：
# A. 多行版 — function getTodayCare(st){\n  return st.care[todayKey()] || {};\n}
# B. 單行版 — function getTodayCare(st){ return st.care[todayKey()] || {}; }

PATTERN_MULTI = re.compile(
    r'function getTodayCare\(st\)\{\s*\n(\s*)return st\.care\[todayKey\(\)\] \|\| \{\};'
)
PATTERN_SINGLE = re.compile(
    r'function getTodayCare\(st\)\{ return st\.care\[todayKey\(\)\] \|\| \{\}; \}'
)

def fix_file(path):
    try:
        with open(path, 'r', encoding='utf-8', newline='') as f:
            content = f.read()
    except Exception as e:
        return ('ERROR', str(e))

    # 已經有防呆？跳過
    if 'if(!st || !st.care) return {};' in content or 'if(!st||!st.care)' in content:
        return ('ALREADY_FIXED', None)

    original = content

    # B. 單行版
    if PATTERN_SINGLE.search(content):
        content = PATTERN_SINGLE.sub(
            'function getTodayCare(st){ if(!st||!st.care) return {}; return st.care[todayKey()] || {}; }',
            content
        )

    # A. 多行版
    m = PATTERN_MULTI.search(content)
    if m:
        indent = m.group(1)
        replacement = f'function getTodayCare(st){{\n{indent}if(!st || !st.care) return {{}};\n{indent}return st.care[todayKey()] || {{}};'
        content = PATTERN_MULTI.sub(replacement, content)

    if content == original:
        return ('NO_MATCH', None)

    try:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(content)
    except Exception as e:
        return ('ERROR', str(e))

    return ('FIXED', None)


def main():
    targets = []
    for root, dirs, files in os.walk(REPO_ROOT):
        # 跳過 backups / .git / node_modules / 資源 / 圖片 / .claude
        skip = {'backups', '.git', 'node_modules', '資源', '圖片', '.claude', '資料夾'}
        dirs[:] = [d for d in dirs if d not in skip]
        for f in files:
            if f.startswith('castle-room-') and f.endswith('.html'):
                targets.append(os.path.join(root, f))

    targets.sort()
    stats = {'FIXED': 0, 'ALREADY_FIXED': 0, 'NO_MATCH': 0, 'ERROR': 0}
    for p in targets:
        rel = os.path.relpath(p, REPO_ROOT)
        status, info = fix_file(p)
        stats[status] = stats.get(status, 0) + 1
        marker = {'FIXED': '[FIX]', 'ALREADY_FIXED': '[OK ]', 'NO_MATCH': '[-- ]', 'ERROR': '[ERR]'}[status]
        print(f'{marker} {rel}' + (f' ({info})' if info else ''))

    print()
    print('=' * 60)
    print(f'Total: {len(targets)}')
    for k, v in stats.items():
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
