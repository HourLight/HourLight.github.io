#!/usr/bin/env python3
import os

ADMIN_FILES = [
    'admin-akashic-reading.html', 'admin-analytics.html', 'admin-draw-hl.html',
    'admin-family-reading.html', 'admin-payments.html', 'admin-pet-reading.html',
    'admin-unlock.html', 'admin-yuan-chen-reading.html'
]

CASTLE_JS_INSERT = '''<!-- 內在城堡遊戲系統 JS 模組 -->
<script src="assets/js/hl-castle-key.js" defer></script>
<script src="assets/js/hl-castle-decor-v2.js" defer></script>
<script src="assets/js/hl-castle-material.js" defer></script>
<script src="assets/js/hl-castle-pets.js" defer></script>
<script src="assets/js/hl-castle-room-decor.js" defer></script>
<script src="assets/js/hl-castle-sync.js" defer></script>
</body>'''

fixed = 0
for file in ADMIN_FILES:
    try:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()

        if 'hl-castle-key.js' not in content and '</body>' in content:
            content = content.replace('</body>', CASTLE_JS_INSERT)
            with open(file, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {file}")
            fixed += 1
        else:
            print(f"Skip: {file}")
    except Exception as e:
        print(f"Error: {file} - {e}")

print(f"Admin files fixed: {fixed}/{len(ADMIN_FILES)}")