"""
Batch update internal links after hub consolidation.

Rules:
- href="divination-hub.html" -> href="draw-hub.html"
- href="blog-hub.html" -> href="knowledge-hub.html"

Skip the four redirect pages themselves so they still redirect.
"""
import os
import re
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SKIP = {
    'blog-hub.html', 'divination-hub.html',
    os.path.join('sc', 'blog-hub.html'),
    os.path.join('sc', 'divination-hub.html'),
}

# Exclude directories
EXCLUDE_DIRS = {
    '.git', 'node_modules', '.claude', 'assets', 'js',
    'images', 'api', '資源', '圖片',
    'backups', 'naha-slides',
}


def should_skip_dir(name):
    return name in EXCLUDE_DIRS


def main():
    scanned = 0
    updated = 0
    changes = []

    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            rel = os.path.relpath(path, '.')
            # normalize separators for comparison
            rel_unix = rel.replace(os.sep, '/')

            if rel in SKIP or rel_unix in [p.replace(os.sep, '/') for p in SKIP]:
                continue

            scanned += 1
            with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                c = fh.read()

            orig = c
            # Update hrefs - only match bare filename (not full URLs)
            c = re.sub(r'href="divination-hub\.html', 'href="draw-hub.html', c)
            c = re.sub(r"href='divination-hub\.html", "href='draw-hub.html", c)
            c = re.sub(r'href="blog-hub\.html', 'href="knowledge-hub.html', c)
            c = re.sub(r"href='blog-hub\.html", "href='knowledge-hub.html", c)

            if c != orig:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(c)
                updated += 1
                changes.append(rel)

    print(f'Scanned: {scanned}')
    print(f'Updated: {updated}')
    if changes:
        print('\nUpdated files:')
        for c in changes[:50]:
            print(f'  {c}')
        if len(changes) > 50:
            print(f'  ... and {len(changes) - 50} more')


if __name__ == '__main__':
    main()
