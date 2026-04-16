#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
馥靈之鑰｜牌卡 DNA 解碼腳本
─────────────────────────────────────
用途：把 js/cardData-protected.js 的 Base64 陣列解回 JSON，給莎寶改寫
輸出：tools/cardData-decoded.json（商業機密，已在 .gitignore）

用法：
  python tools/decode-cards.py

執行後：
  - 讀 js/cardData-protected.js 的 _d 陣列
  - concat → base64 decode → UTF-8 → JSON
  - 印出統計（130 張？每張欄位？）
  - 寫出 tools/cardData-decoded.json（pretty-printed）
"""
import re, base64, json, sys, io, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SRC = 'js/cardData-protected.js'
OUT = 'tools/cardData-decoded.json'

if not os.path.exists(SRC):
    print(f'❌ 找不到 {SRC}')
    sys.exit(1)

with open(SRC, 'r', encoding='utf-8') as f:
    src = f.read()

# 擷取 const _d = [ '...', '...', ... ];
m = re.search(r'const\s+_d\s*=\s*\[(.*?)\];', src, re.DOTALL)
if not m:
    print('❌ 找不到 const _d 陣列')
    sys.exit(1)

parts = re.findall(r"'([^']+)'", m.group(1))
print(f'✓ 取得 _d 陣列 {len(parts)} 行')

joined = ''.join(parts)
try:
    decoded_bytes = base64.b64decode(joined)
    decoded_str = decoded_bytes.decode('utf-8')
except Exception as e:
    print(f'❌ Base64 decode 失敗：{e}')
    sys.exit(1)

try:
    data = json.loads(decoded_str)
except Exception as e:
    print(f'❌ JSON parse 失敗：{e}')
    sys.exit(1)

# 統計
print(f'✓ 解碼成功 · 共 {len(data)} 張牌')
sample_key = list(data.keys())[0]
sample = data[sample_key]
print(f'✓ 樣本：{sample_key} → {sample.get("title","(無 title)")}')
print(f'✓ 每張欄位數：{len(sample)}')
print(f'  欄位列表：{", ".join(list(sample.keys())[:10])} ...（共 {len(sample)} 個）')

# 檢查是否已有 giftText / challengeText
has_gift = sum(1 for v in data.values() if isinstance(v, dict) and 'giftText' in v)
has_challenge = sum(1 for v in data.values() if isinstance(v, dict) and 'challengeText' in v)
print(f'  已有 giftText：{has_gift}/{len(data)}')
print(f'  已有 challengeText：{has_challenge}/{len(data)}')

# 寫出
os.makedirs('tools', exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

size_kb = os.path.getsize(OUT) / 1024
print(f'✓ 已寫出 {OUT}（{size_kb:.1f} KB）')
print()
print('📝 下一步（莎寶）：')
print('  1. 編輯 tools/cardData-decoded.json')
print('  2. 為每張牌加 giftText（正位 1000+ 字）+ challengeText（逆位 1000+ 字）')
print('  3. 完成後通知歐寶執行 tools/encode-cards.py 壓回 Base64')
print()
print('⚠️ cardData-decoded.json 是商業機密，已 .gitignore 排除，絕對不可上傳 GitHub')
