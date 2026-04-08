#!/usr/bin/env python3
"""
iOS Safari Compatibility Scan & Fix v4
"""

import os
import re

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def find_files(exts):
    results = []
    for root, dirs, files in os.walk(BASE):
        dirs[:] = [d for d in dirs if d not in ('.git', 'node_modules')]
        for f in files:
            if any(f.endswith(e) for e in exts):
                results.append(os.path.join(root, f))
    return results

html_files = find_files(['.html'])
css_files = find_files(['.css'])
js_files = find_files(['.js'])
all_style_files = html_files + css_files

print(f"Scan scope: {len(html_files)} HTML, {len(css_files)} CSS, {len(js_files)} JS")
print("=" * 60)

# ============================================================
# 1. 100vh -> 100dvh
# ============================================================
print("\n[1] 100vh -> 100dvh scan & fix")

vh_fixed_count = 0
vh_files_touched = set()

for fpath in all_style_files:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    original = content

    def add_dvh(m):
        global vh_fixed_count
        prop = m.group(1)
        end = m.end()
        rest = content[end:end+50]
        if re.match(r'\s*;\s*' + re.escape(prop) + r'\s*:\s*100dvh', rest):
            return m.group(0)
        vh_fixed_count += 1
        vh_files_touched.add(fpath)
        return m.group(0) + ';' + prop + ':100dvh'

    new_content = re.sub(
        r'((?:min-)?height)\s*:\s*100vh(?![\w])',
        add_dvh,
        content
    )
    new_content = new_content.replace(';;', ';')

    if new_content != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)

print(f"  Fixed: {vh_fixed_count} instances in {len(vh_files_touched)} files")

# ============================================================
# 2. position:sticky + overflow conflict
# ============================================================
print("\n[2] position:sticky + overflow container conflict")

sticky_issues = []
for fpath in all_style_files:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    has_sticky = bool(re.search(r'position\s*:\s*sticky', content))
    has_overflow = bool(re.search(r'overflow\s*:\s*(hidden|auto)', content))
    if has_sticky and has_overflow:
        sticky_issues.append(os.path.relpath(fpath, BASE))

print(f"  Potential conflicts: {len(sticky_issues)} files (manual review needed)")
for item in sticky_issues:
    print(f"    {item}")

# ============================================================
# 3. img onerror global handler
# ============================================================
print("\n[3] <img> missing onerror - stats & global fix")

img_total = 0
img_no_onerror = 0
for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    imgs = re.findall(r'<img\b[^>]*>', content, re.IGNORECASE)
    for img in imgs:
        img_total += 1
        if 'onerror' not in img.lower():
            img_no_onerror += 1

print(f"  Total <img> tags: {img_total}")
print(f"  Missing onerror: {img_no_onerror}")

bottomnav_path = os.path.join(BASE, 'assets', 'js', 'hl-bottomnav.js')
with open(bottomnav_path, 'r', encoding='utf-8') as f:
    bn_content = f.read()

ONERROR_SNIPPET = """
  // -- iOS img onerror global fallback --
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('img').forEach(function(img){
      if(!img.onerror) img.onerror = function(){ this.style.display='none'; };
    });
  });
"""

if 'iOS img onerror' not in bn_content:
    marker = "'use strict';"
    idx = bn_content.find(marker)
    if idx >= 0:
        pos = idx + len(marker)
        bn_content = bn_content[:pos] + ONERROR_SNIPPET + bn_content[pos:]
        with open(bottomnav_path, 'w', encoding='utf-8') as f:
            f.write(bn_content)
        print("  Injected global img onerror handler into hl-bottomnav.js")
else:
    print("  hl-bottomnav.js already has global img onerror handler")

# ============================================================
# 4. Touch target < 44px
# ============================================================
print("\n[4] Touch target < 44px check")

small_touch_count = 0
for fpath in html_files:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    elements = re.findall(r'<(?:button|a)\b[^>]*style="[^"]*"[^>]*>', content, re.IGNORECASE)
    for el in elements:
        style = re.search(r'style="([^"]*)"', el, re.IGNORECASE)
        if style:
            sv = style.group(1)
            if 'padding' in sv.lower() and 'min-height' not in sv.lower():
                small_touch_count += 1

print(f"  Inline-styled buttons/links with padding but no min-height: {small_touch_count}")
print(f"  (Manual review needed)")

# ============================================================
# 5. backdrop-filter missing -webkit prefix
# ============================================================
print("\n[5] backdrop-filter missing -webkit prefix")

bf_fixed = 0
bf_files_touched = set()

for fpath in all_style_files:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    original = content

    # Find all backdrop-filter (non-webkit) occurrences
    pattern = re.compile(r'(?<![-\w])backdrop-filter\s*:\s*([^;}\n]+)')
    matches = list(pattern.finditer(content))

    if not matches:
        continue

    # Check: does the ENTIRE file/rule context already have -webkit-backdrop-filter
    # with the same value? Look both before (200 chars) AND after (200 chars).
    for m in reversed(matches):
        value = m.group(1).strip().rstrip(';')
        start_ctx = max(0, m.start() - 200)
        end_ctx = min(len(content), m.end() + 200)
        context = content[start_ctx:m.start()] + content[m.end():end_ctx]

        # Check if -webkit-backdrop-filter with same value exists in context
        has_webkit = False
        if f'-webkit-backdrop-filter:{value}' in context:
            has_webkit = True
        if f'-webkit-backdrop-filter: {value}' in context:
            has_webkit = True
        # Also try regex for flexible spacing
        escaped_val = re.escape(value)
        if re.search(r'-webkit-backdrop-filter\s*:\s*' + escaped_val, context):
            has_webkit = True

        if has_webkit:
            continue

        # Insert -webkit- version before the standard one
        insert_text = f'-webkit-backdrop-filter:{value};'
        content = content[:m.start()] + insert_text + content[m.start():]
        bf_fixed += 1
        bf_files_touched.add(fpath)

    if content != original:
        content = content.replace(';;', ';')
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)

print(f"  Fixed: {bf_fixed} instances in {len(bf_files_touched)} files")

# ============================================================
# 6. Form elements font-size < 16px
# ============================================================
print("\n[6] Form element font-size < 16px (iOS auto-zoom risk)")

small_font_count = 0
small_font_files = set()

for fpath in all_style_files:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    matches = re.finditer(r'font-size\s*:\s*(\d+(?:\.\d+)?)\s*px', content)
    for m in matches:
        size = float(m.group(1))
        if size < 16:
            start = max(0, m.start() - 300)
            context = content[start:m.start()]
            if re.search(r'(input|select|textarea|\.form|\.input|\.search)', context, re.IGNORECASE):
                small_font_count += 1
                small_font_files.add(os.path.relpath(fpath, BASE))

print(f"  Form elements with font-size < 16px: {small_font_count}")
for item in sorted(small_font_files):
    print(f"    {item}")

# ============================================================
# 7. -webkit-overflow-scrolling: touch
# ============================================================
print("\n[7] overflow:auto/scroll missing -webkit-overflow-scrolling:touch")

scroll_missing = 0
scroll_files = []

for fpath in all_style_files:
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    has_oa = bool(re.search(r'overflow(?:-[xy])?\s*:\s*(?:auto|scroll)', content))
    has_ws = bool(re.search(r'-webkit-overflow-scrolling\s*:\s*touch', content))
    if has_oa and not has_ws:
        scroll_missing += 1
        scroll_files.append(os.path.relpath(fpath, BASE))

print(f"  Files with overflow:auto/scroll but no -webkit-overflow-scrolling: {scroll_missing}")
for item in scroll_files[:20]:
    print(f"    {item}")
if len(scroll_files) > 20:
    print(f"    ... and {len(scroll_files) - 20} more files")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
print("=== iOS Safari Compatibility Scan Report ===")
print(f"Files scanned: {len(html_files)} HTML + {len(css_files)} CSS + {len(js_files)} JS")
print()
print("AUTO-FIXED:")
print(f"  [1] 100vh -> 100dvh fallback: {vh_fixed_count} fixes in {len(vh_files_touched)} files")
print(f"  [5] backdrop-filter -webkit prefix: {bf_fixed} fixes in {len(bf_files_touched)} files")
print(f"  [3] Global img onerror handler: injected into hl-bottomnav.js")
print()
print("MANUAL REVIEW NEEDED:")
print(f"  [2] position:sticky + overflow conflict: {len(sticky_issues)} files")
print(f"  [4] Touch targets possibly < 44px: {small_touch_count} elements")
print(f"  [6] Form font-size < 16px (auto-zoom): {small_font_count} instances")
print(f"  [7] Missing -webkit-overflow-scrolling: {scroll_missing} files")
print("=" * 60)
