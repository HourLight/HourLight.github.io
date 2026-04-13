#!/usr/bin/env python3
import os
import sys

# 城堡JS模組載入模板
CASTLE_JS_INSERT = '''<!-- 內在城堡遊戲系統 JS 模組 -->
<script src="assets/js/hl-castle-key.js" defer></script>
<script src="assets/js/hl-castle-decor-v2.js" defer></script>
<script src="assets/js/hl-castle-material.js" defer></script>
<script src="assets/js/hl-castle-pets.js" defer></script>
<script src="assets/js/hl-castle-room-decor.js" defer></script>
<script src="assets/js/hl-castle-sync.js" defer></script>
</body>'''

# 需要修復的測驗檔案
QUIZ_FILES = [
    'quiz-bicultural-identity.html', 'quiz-boundary-type.html', 'quiz-climate-anxiety.html',
    'quiz-cognitive-distortion.html', 'quiz-communication-style.html', 'quiz-core-belief.html',
    'quiz-decision-pattern.html', 'quiz-decision-style.html', 'quiz-digital-wellness.html',
    'quiz-dopamine-style.html', 'quiz-emotional-labor.html', 'quiz-gratitude-style.html',
    'quiz-guilt-shame.html', 'quiz-inner-critic.html', 'quiz-intergenerational-trauma.html',
    'quiz-intimacy-distance.html', 'quiz-life-transition.html', 'quiz-love-pattern.html',
    'quiz-money-belief.html', 'quiz-moral-foundations.html', 'quiz-nervous-system.html',
    'quiz-neurodiversity.html', 'quiz-rejection-sensitivity.html', 'quiz-self-sabotage.html',
    'quiz-sense-coherence.html', 'quiz-stress-animal.html', 'quiz-stress-response.html',
    'quiz-time-perspective.html', 'quiz-window-tolerance.html'
]

OTHER_FILES = ['draw-admin.html', 'draw-body.html']

def fix_file(filename):
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()

        if 'hl-castle-key.js' in content:
            print(f"Skip: {filename}")
            return True

        if '</body>' not in content:
            print(f"Error: {filename}")
            return False

        content = content.replace('</body>', CASTLE_JS_INSERT)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"Fixed: {filename}")
        return True
    except Exception as e:
        print(f"Failed: {filename} - {e}")
        return False

# 修復檔案
fixed = 0
total = len(QUIZ_FILES) + len(OTHER_FILES)

for file in QUIZ_FILES + OTHER_FILES:
    if fix_file(file):
        fixed += 1

print(f"Complete: {fixed}/{total}")