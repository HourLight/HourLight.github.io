#!/usr/bin/env python3
"""把 booking-admin.html 轉成簡體 sc/booking-admin.html"""
import os
import sys
import io
import re
from opencc import OpenCC

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

cc = OpenCC('tw2sp')  # 台灣正體 → 簡體中文（含詞彙轉換：影片→视频、網路→网络）

SRC = 'booking-admin.html'
DST = os.path.join('sc', 'booking-admin.html')

with open(SRC, 'r', encoding='utf-8') as f:
    html = f.read()

# 繁簡轉換
sc_html = cc.convert(html)

# 修正靜態資源路徑（sc/ 下要 ../ 相對根目錄）
# 只改 relative paths 不改 absolute URL
# 1) href="xxx.html" → href="../xxx.html"（除了 sc/* 本身）
# 2) src="assets/..." → src="../assets/..."
# 3) src="js/..." → src="../js/..."
# 4) src="images/..." → src="../images/..."
# 5) canonical → https://hourlightkey.com/sc/booking-admin.html

def fix_path(match):
    attr, quote, val = match.group(1), match.group(2), match.group(3)
    if not val:
        return match.group(0)
    # skip absolute / protocol-relative / hash / mailto / javascript / tel / data
    if val.startswith(('http://', 'https://', '//', '#', 'mailto:', 'javascript:', 'tel:', 'data:', '../', '/')):
        return match.group(0)
    # skip query-only
    if val.startswith('?'):
        return match.group(0)
    # skip template literal
    if '${' in val or '{{' in val:
        return match.group(0)
    # prepend ../
    return f'{attr}={quote}../{val}{quote}'

# 處理 href / src / action 屬性
sc_html = re.sub(
    r'\b(href|src|action)=(["\'])((?!http)(?!//)(?!#)(?!mailto:)(?!javascript:)(?!tel:)(?!data:)(?!\.\./)(?!/)[^"\']+)\2',
    fix_path,
    sc_html
)

# canonical 改簡體 URL
sc_html = re.sub(
    r'<link\s+rel=["\']canonical["\']\s+href=["\'][^"\']+["\']',
    '<link rel="canonical" href="https://hourlightkey.com/sc/booking-admin.html"',
    sc_html,
    count=1
)

# 確保 hreflang 對稱
if 'hreflang' not in sc_html:
    hreflang_block = (
        '<link rel="alternate" hreflang="zh-Hant" href="https://hourlightkey.com/booking-admin.html"/>\n'
        '<link rel="alternate" hreflang="zh-Hans" href="https://hourlightkey.com/sc/booking-admin.html"/>\n'
        '<link rel="alternate" hreflang="x-default" href="https://hourlightkey.com/booking-admin.html"/>\n'
    )
    sc_html = sc_html.replace('</head>', hreflang_block + '</head>', 1)

# html lang 改簡體
sc_html = re.sub(r'<html[^>]*lang=["\'][^"\']+["\']', '<html lang="zh-Hans-CN"', sc_html, count=1)

# 寫出
os.makedirs(os.path.dirname(DST), exist_ok=True)
with open(DST, 'w', encoding='utf-8', newline='\n') as f:
    f.write(sc_html)

print(f"✓ Written: {DST} ({len(sc_html):,} bytes, {sc_html.count(chr(10))+1:,} lines)")
