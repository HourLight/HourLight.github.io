#!/usr/bin/env python3
import os
import glob

CASTLE_JS_INSERT = '''<!-- 內在城堡遊戲系統 JS 模組 -->
<script src="assets/js/hl-castle-key.js" defer></script>
<script src="assets/js/hl-castle-decor-v2.js" defer></script>
<script src="assets/js/hl-castle-material.js" defer></script>
<script src="assets/js/hl-castle-pets.js" defer></script>
<script src="assets/js/hl-castle-room-decor.js" defer></script>
<script src="assets/js/hl-castle-sync.js" defer></script>
</body>'''

# 排除檔案列表
EXCLUDE_PATTERNS = [
    '404.html', 'admin-fuling-light.html', 'course-*.html',
    'booking*.html', 'platform-admin*.html'
]

def should_exclude(filename):
    for pattern in EXCLUDE_PATTERNS:
        if '*' in pattern:
            import fnmatch
            if fnmatch.fnmatch(filename, pattern):
                return True
        else:
            if filename == pattern:
                return True
    return False

def fix_file(filename):
    if should_exclude(filename):
        return False, "EXCLUDED"

    if not os.path.exists(filename):
        return False, "NOT_FOUND"

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()

        if 'hl-castle-key.js' in content:
            return False, "ALREADY_HAS"

        if '</body>' not in content:
            return False, "NO_BODY_TAG"

        content = content.replace('</body>', CASTLE_JS_INSERT)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)

        return True, "FIXED"
    except Exception as e:
        return False, f"ERROR: {e}"

def main():
    # 獲取所有HTML檔案
    html_files = glob.glob("*.html")

    fixed_count = 0
    skipped_count = 0
    error_count = 0

    categories = {}

    print(f"Processing {len(html_files)} HTML files...")

    for filename in sorted(html_files):
        success, reason = fix_file(filename)

        # 分類統計
        prefix = filename.split('-')[0] if '-' in filename else filename.split('.')[0][:10]
        if prefix not in categories:
            categories[prefix] = {'fixed': 0, 'skipped': 0}

        if success:
            fixed_count += 1
            categories[prefix]['fixed'] += 1
            print(f"OK {filename}")
        else:
            if reason in ["ALREADY_HAS", "EXCLUDED"]:
                skipped_count += 1
                categories[prefix]['skipped'] += 1
                print(f"SKIP {filename} - {reason}")
            else:
                error_count += 1
                print(f"ERROR {filename} - {reason}")

    print(f"\nFINAL SUMMARY:")
    print(f"Fixed: {fixed_count}")
    print(f"Skipped: {skipped_count}")
    print(f"Errors: {error_count}")
    print(f"Total processed: {len(html_files)}")

    print(f"\nBY CATEGORY:")
    for category, stats in categories.items():
        if stats['fixed'] > 0:
            print(f"{category}: {stats['fixed']} fixed, {stats['skipped']} skipped")

if __name__ == "__main__":
    main()