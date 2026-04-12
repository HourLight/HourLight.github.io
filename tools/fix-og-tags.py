"""
Batch fix missing og: tags on FB-linked pages.
Adds og:title/description/image/url to any page that's missing them,
using existing <title> and <meta name="description"> as source.
"""
import re
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

OG_IMAGE = 'https://hourlightkey.com/og-image.jpg'
BASE_URL = 'https://hourlightkey.com/'

TARGETS = [
    'massage-guide.html', 'aroma-garden.html', 'reiki-guide.html',
    'skincare-science.html', 'aromatherapy-science.html',
    'kids-aromatherapy.html', 'angel-oracle.html', 'draw-hl.html',
    'poe-blocks.html', 'name-oracle.html', 'phone-oracle.html',
    'triangle-calculator.html', 'certification-guide.html',
    'yijing-oracle.html', 'blending-guide.html', 'yuan-chen-guide.html',
]


def extract_title(html):
    m = re.search(r'<title>([^<]+)</title>', html)
    return m.group(1).strip() if m else ''


def extract_desc(html):
    m = re.search(
        r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']',
        html, re.IGNORECASE)
    return m.group(1).strip() if m else ''


def fix_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    title = extract_title(html)
    desc = extract_desc(html)
    url = BASE_URL + os.path.basename(path)

    # What's missing?
    need_title = 'og:title' not in html
    need_desc = 'og:description' not in html
    need_image = 'og:image' not in html
    need_url = 'og:url' not in html
    need_type = 'og:type' not in html

    if not (need_title or need_desc or need_image or need_url):
        return False

    additions = []
    if need_url:
        additions.append(f'<meta property="og:url" content="{url}"/>')
    if need_type:
        additions.append('<meta property="og:type" content="website"/>')
    if need_title and title:
        esc = title.replace('"', '&quot;')
        additions.append(f'<meta property="og:title" content="{esc}"/>')
    if need_desc and desc:
        esc = desc.replace('"', '&quot;')
        additions.append(f'<meta property="og:description" content="{esc}"/>')
    if need_image:
        additions.append(f'<meta property="og:image" content="{OG_IMAGE}"/>')

    # Also add twitter card if missing
    if 'twitter:card' not in html:
        additions.append('<meta name="twitter:card" content="summary_large_image"/>')

    insertion = '\n'.join(additions) + '\n'

    # Insert right before </head>
    new_html = html.replace('</head>', insertion + '</head>', 1)
    if new_html == html:
        # fallback: insert after <title>
        new_html = re.sub(
            r'(</title>)', r'\1\n' + insertion.rstrip(), html, count=1)
    if new_html == html:
        return False

    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    return True


def main():
    fixed = 0
    for t in TARGETS:
        if not os.path.exists(t):
            print(f'[SKIP] {t} not found')
            continue
        if fix_file(t):
            fixed += 1
            print(f'[OK] {t}')
        else:
            print(f'[NOCHANGE] {t}')

        # also fix SC version if it exists
        sc_path = os.path.join('sc', t)
        if os.path.exists(sc_path):
            if fix_file(sc_path):
                fixed += 1
                print(f'[OK] {sc_path}')
    print(f'\ntotal fixed: {fixed}')


if __name__ == '__main__':
    main()
