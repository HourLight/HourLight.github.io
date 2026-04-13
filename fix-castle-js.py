#!/usr/bin/env python3
# 馥靈之鑰城堡JS模組批次修復工具
# 為缺少城堡JS載入的檔案添加必要的JS模組

import os
import re

# 城堡JS模組載入模板
CASTLE_JS_TEMPLATE = '''<!-- 內在城堡遊戲系統 JS 模組 -->
<script src="assets/js/hl-castle-key.js" defer></script>
<script src="assets/js/hl-castle-decor-v2.js" defer></script>
<script src="assets/js/hl-castle-material.js" defer></script>
<script src="assets/js/hl-castle-pets.js" defer></script>
<script src="assets/js/hl-castle-room-decor.js" defer></script>
<script src="assets/js/hl-castle-sync.js" defer></script>'''

# 需要修復的檔案列表
QUIZ_FILES_TO_FIX = [
    'quiz-bicultural-identity.html',
    'quiz-boundary-type.html',
    'quiz-climate-anxiety.html',
    'quiz-cognitive-distortion.html',
    'quiz-communication-style.html',
    'quiz-core-belief.html',
    'quiz-decision-pattern.html',
    'quiz-decision-style.html',
    'quiz-digital-wellness.html',
    'quiz-dopamine-style.html',
    'quiz-emotional-labor.html',
    'quiz-gratitude-style.html',
    'quiz-guilt-shame.html',
    'quiz-hub.html',
    'quiz-inner-child.html',
    'quiz-inner-critic.html',
    'quiz-intergenerational-trauma.html',
    'quiz-intimacy-distance.html',
    'quiz-life-transition.html',
    'quiz-love-pattern.html',
    'quiz-money-belief.html',
    'quiz-moral-foundations.html',
    'quiz-nervous-system.html',
    'quiz-neurodiversity.html',
    'quiz-rejection-sensitivity.html',
    'quiz-self-sabotage.html',
    'quiz-sense-coherence.html',
    'quiz-stress-animal.html',
    'quiz-stress-response.html',
    'quiz-time-perspective.html',
    'quiz-window-tolerance.html'
]

DRAW_FILES_TO_FIX = [
    'draw-admin.html',
    'draw-body.html',
    'draw-hub.html'
]

MEMBER_FILES_TO_FIX = [
    'member-dashboard.html',
    'member-login.html'
]

def fix_file(filepath):
    """為單個檔案添加城堡JS載入"""
    if not os.path.exists(filepath):
        print(f"❌ 檔案不存在: {filepath}")
        return False

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # 檢查是否已經有城堡JS
        if 'hl-castle-key.js' in content:
            print(f"✅ 已存在城堡JS: {filepath}")
            return True

        # 尋找</body>前的位置插入
        if '</body>' not in content:
            print(f"❌ 找不到</body>標籤: {filepath}")
            return False

        # 在</body>前插入城堡JS
        content = content.replace('</body>', f'{CASTLE_JS_TEMPLATE}\n</body>')

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"✅ 修復完成: {filepath}")
        return True

    except Exception as e:
        print(f"❌ 修復失敗: {filepath}, 錯誤: {e}")
        return False

def main():
    print("🔧 開始批次修復城堡JS載入...")

    fixed = 0
    total = 0

    # 修復測驗檔案
    print("\n📝 修復測驗檔案...")
    for filename in QUIZ_FILES_TO_FIX:
        total += 1
        if fix_file(filename):
            fixed += 1

    # 修復抽牌檔案
    print("\n🎴 修復抽牌檔案...")
    for filename in DRAW_FILES_TO_FIX:
        total += 1
        if fix_file(filename):
            fixed += 1

    # 修復會員檔案
    print("\n👤 修復會員檔案...")
    for filename in MEMBER_FILES_TO_FIX:
        total += 1
        if fix_file(filename):
            fixed += 1

    print(f"\n🎯 批次修復完成: {fixed}/{total} 檔案成功修復")

if __name__ == "__main__":
    main()