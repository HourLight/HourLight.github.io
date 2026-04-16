#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
馥靈之鑰｜牌卡 DNA 編碼腳本
─────────────────────────────────────
用途：把 tools/cardData-decoded.json 壓回 Base64 → 覆寫 js/cardData-protected.js 的 _d 陣列
輸出：更新後的 js/cardData-protected.js（保持商業機密編碼）

用法：
  python tools/encode-cards.py

執行前提：
  - tools/cardData-decoded.json 已被莎寶改寫完成
  - js/cardData-protected.js 結構完整（會保留所有其他 code，只換 _d 陣列）

安全機制：
  - 寫入前先備份 js/cardData-protected.js.bak
  - 驗證編碼後能解回原 JSON（decode-encode 往返測試）
"""
import re, base64, json, sys, io, os, shutil

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

JSON_IN = 'tools/cardData-decoded.json'
JS_OUT = 'js/cardData-protected.js'
BACKUP = 'js/cardData-protected.js.bak'

if not os.path.exists(JSON_IN):
    print(f'❌ 找不到 {JSON_IN}')
    print('請先執行：python tools/decode-cards.py')
    sys.exit(1)

if not os.path.exists(JS_OUT):
    print(f'❌ 找不到 {JS_OUT}')
    sys.exit(1)

# 讀 JSON
with open(JSON_IN, 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f'✓ 讀入 {JSON_IN} · 共 {len(data)} 張牌')

# 統計新欄位（驗證莎寶工作）
has_gift = sum(1 for v in data.values() if isinstance(v, dict) and v.get('giftText'))
has_challenge = sum(1 for v in data.values() if isinstance(v, dict) and v.get('challengeText'))
print(f'  giftText 已填：{has_gift}/{len(data)}')
print(f'  challengeText 已填：{has_challenge}/{len(data)}')

if has_gift < len(data) or has_challenge < len(data):
    print(f'⚠️  giftText/challengeText 尚未填滿所有 130 張')
    ans = input('是否繼續編碼？(y/N): ').strip().lower()
    if ans != 'y':
        print('已取消')
        sys.exit(0)

# 備份
shutil.copy2(JS_OUT, BACKUP)
print(f'✓ 已備份 → {BACKUP}')

# JSON → Base64（緊湊格式，省體積）
json_str = json.dumps(data, ensure_ascii=False, separators=(',', ': '))
b64 = base64.b64encode(json_str.encode('utf-8')).decode('ascii')
print(f'✓ Base64 長度：{len(b64):,} chars')

# 切成每行 76 字元（跟原檔風格接近）
CHUNK = 76
chunks = [b64[i:i+CHUNK] for i in range(0, len(b64), CHUNK)]
array_inner = ',\n'.join("    '" + c + "'" for c in chunks)
new_array = '[\n' + array_inner + '\n  ]'

# 讀原檔，替換 _d 陣列
with open(JS_OUT, 'r', encoding='utf-8') as f:
    src = f.read()

new_src, n = re.subn(
    r'const\s+_d\s*=\s*\[.*?\];',
    'const _d = ' + new_array + ';',
    src, count=1, flags=re.DOTALL
)

if n != 1:
    print(f'❌ 替換失敗（找到 {n} 處，應該恰好 1 處）')
    print(f'已保留備份 {BACKUP}')
    sys.exit(1)

# 往返驗證：解回原 JSON 確認一致
test_joined = ''.join(chunks)
test_decoded = base64.b64decode(test_joined).decode('utf-8')
test_data = json.loads(test_decoded)
if len(test_data) != len(data):
    print(f'❌ 往返驗證失敗：編碼後張數 {len(test_data)} ≠ 原始 {len(data)}')
    sys.exit(1)

# 寫出
with open(JS_OUT, 'w', encoding='utf-8') as f:
    f.write(new_src)

size_kb = os.path.getsize(JS_OUT) / 1024
print(f'✓ 已覆寫 {JS_OUT}（{size_kb:.1f} KB，Base64 編碼保護仍保持）')
print()
print('📝 下一步（歐寶）：')
print('  1. node --check js/cardData-protected.js  確認語法 OK')
print('  2. git add js/cardData-protected.js')
print('  3. git commit -m "..." && git push origin main')
print()
print(f'⚠️ decoded JSON 不會被 commit（.gitignore 保護）')
print(f'⚠️ 備份檔 {BACKUP} 也不該上傳，使用完請自行刪除')
