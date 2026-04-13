#!/usr/bin/env python3
import os

# 下一批重要檔案
IMPORTANT_FILES = [
    'blog-hub.html', 'courses.html', 'book.html', 'privacy.html', 'terms.html',
    'about.html', 'contact.html', 'faq.html', 'changelog.html', 'brand-vision.html',
    'brand-story.html', 'consulting.html', 'partners.html'
]

# 命理和抽牌相關
DIVINATION_FILES = [
    'astro-calculator.html', 'bazi-calculator.html', 'ziwei-calculator.html',
    'hd-calculator.html', 'maya-calculator.html', 'lifepath-calculator.html',
    'numerology-calculator.html', 'qizheng-calculator.html', 'triangle-calculator.html',
    'destiny-match.html', 'fuling-fuyu.html'
]

# 占卜工具
ORACLE_FILES = [
    'yijing-oracle.html', 'phone-oracle.html', 'name-oracle.html', 'tarot-draw.html',
    'angel-oracle.html', 'bone-casting.html', 'dream-decoder.html', 'mirror-oracle.html',
    'season-oracle.html', 'witch-power.html', 'projection-cards.html'
]

CASTLE_JS_INSERT = '''<!-- 內在城堡遊戲系統 JS 模組 -->
<script src="assets/js/hl-castle-key.js" defer></script>
<script src="assets/js/hl-castle-decor-v2.js" defer></script>
<script src="assets/js/hl-castle-material.js" defer></script>
<script src="assets/js/hl-castle-pets.js" defer></script>
<script src="assets/js/hl-castle-room-decor.js" defer></script>
<script src="assets/js/hl-castle-sync.js" defer></script>
</body>'''

def fix_file(filename, category=""):
    if not os.path.exists(filename):
        print(f"Not found: {filename}")
        return False

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()

        if 'hl-castle-key.js' in content:
            print(f"Skip {category}: {filename}")
            return True

        if '</body>' not in content:
            print(f"No body tag: {filename}")
            return False

        content = content.replace('</body>', CASTLE_JS_INSERT)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Fixed {category}: {filename}")
        return True
    except Exception as e:
        print(f"Error {category}: {filename} - {e}")
        return False

def main():
    fixed = 0
    total = 0

    # 修復重要頁面
    print("=== IMPORTANT PAGES ===")
    for file in IMPORTANT_FILES:
        total += 1
        if fix_file(file, "IMPORTANT"):
            fixed += 1

    # 修復命理工具
    print("\n=== DIVINATION TOOLS ===")
    for file in DIVINATION_FILES:
        total += 1
        if fix_file(file, "DIVINATION"):
            fixed += 1

    # 修復占卜工具
    print("\n=== ORACLE TOOLS ===")
    for file in ORACLE_FILES:
        total += 1
        if fix_file(file, "ORACLE"):
            fixed += 1

    print(f"\nBatch complete: {fixed}/{total}")

if __name__ == "__main__":
    main()