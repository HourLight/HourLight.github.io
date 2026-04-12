"""Add logo/image to inline Organization references site-wide.

GSC complained that 商家圖片 is missing. Root cause: inline Organization schemas
inside publisher/author fields don't have logo. Google wants every Organization
reference to be resolvable to a logo image.

Fix: regex-replace inline Organization blocks that lack logo, inject it.
"""
import os, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SKIP_DIRS = {'資源', '圖片', '.git', '.claude', 'node_modules', 'backups', '_archive', '_pages'}
LOGO_URL = 'https://hourlightkey.com/logo.svg'
IMAGE_URL = 'https://hourlightkey.com/og-image.jpg'

# Pattern: capture entire inline Organization object that lacks "logo"
# We match {"@type":"Organization",...} where ... doesn't include "logo"
# To keep it simple we use a two-pass approach
PATTERN = re.compile(r'\{"@type":"Organization","name":"[^"]+","url":"[^"]*"\}')

fixed_files = []

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(root, f).replace(os.sep, '/')
        if p.startswith('./'):
            p = p[2:]
        try:
            with open(p, encoding='utf-8', errors='ignore') as fh:
                c = fh.read()
        except Exception:
            continue

        if '"Organization"' not in c:
            continue

        original = c

        # Fix 1: {"@type":"Organization","name":"X","url":"Y"} → inject logo
        def replacer1(m):
            block = m.group(0)
            if '"logo"' in block:
                return block
            # Insert logo before closing brace
            return block[:-1] + f',"logo":"{LOGO_URL}","image":"{IMAGE_URL}"' + '}'
        c = PATTERN.sub(replacer1, c)

        # Fix 2: {"@type":"Organization","name":"X"} no url, no logo
        PATTERN2 = re.compile(r'\{"@type":"Organization","name":"[^"]+"\}')
        def replacer2(m):
            block = m.group(0)
            if '"logo"' in block:
                return block
            return block[:-1] + f',"url":"https://hourlightkey.com","logo":"{LOGO_URL}","image":"{IMAGE_URL}"' + '}'
        c = PATTERN2.sub(replacer2, c)

        if c != original:
            with open(p, 'w', encoding='utf-8') as fh:
                fh.write(c)
            fixed_files.append(p)

print(f'修正 {len(fixed_files)} 個檔案')
for p in fixed_files[:20]:
    print(f'  {p}')
if len(fixed_files) > 20:
    print(f'  ...還有 {len(fixed_files) - 20} 個')
