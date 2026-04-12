"""Scan all HTML for Product Schema missing image field."""
import os, re, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

SKIP_DIRS = {'資源', '圖片', '.git', '.claude', 'node_modules', 'backups', '_archive', '_pages'}

missing_image = []
has_image = []

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

        # Find all JSON-LD blocks and check Product schemas
        for m in re.finditer(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', c, re.DOTALL):
            block = m.group(1)
            if '"Product"' not in block:
                continue
            # Simple check: if Product schema lacks "image"
            # Look inside the Product object
            product_start = block.find('"@type":"Product"')
            if product_start == -1:
                product_start = block.find('"@type": "Product"')
            if product_start == -1:
                continue
            # Check if "image" appears anywhere in the block
            if '"image"' in block:
                if p not in has_image:
                    has_image.append(p)
            else:
                if p not in missing_image:
                    missing_image.append(p)
                break

print('=== Product Schema 缺 image 的頁面 ===')
for p in missing_image:
    print(f'  {p}')
print(f'\n共 {len(missing_image)} 頁缺 image')

print(f'\n=== Product Schema 有 image 的頁面 ({len(has_image)}) ===')
for p in has_image[:20]:
    print(f'  {p}')
