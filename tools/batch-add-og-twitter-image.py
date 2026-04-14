"""
批次補 og:image 與 twitter:image
- 缺 og:image：用 /og-image.jpg 作為 fallback
- 缺 twitter:image：同 og:image（Twitter Card 會讀 og:image 作後備，但明示更穩）
- 缺 twitter:card：同時補上 summary_large_image
- 跳過 admin / preview / Google 驗證檔

2026/04/14 馥寶產出 - task 13 SEO 深化
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://hourlightkey.com"
DEFAULT_IMG = SITE + "/og-image.jpg"

SKIP_FILES = {
    "admin-analytics.html", "admin-dashboard.html", "admin-draw-hl.html",
    "admin-payments.html", "admin-unlock.html", "admin-akashic-reading.html",
    "admin-family-reading.html", "admin-fuling-light.html",
    "admin-nail-reading.html", "admin-pet-reading.html",
    "admin-spa-reading.html", "admin-yuan-chen-reading.html",
    "draw-admin.html", "booking-admin.html", "partner-dashboard.html",
    "platform-admin.html",
    "AIpreview.html", "Bookpreview.html", "Fulingpreview.html",
    "HourBeauty.html", "HourBeauty-basic.html",
    "googledc89d0a8c66d112d.html", "founder_v3.html",
    "404.html", "search.html", "line-richmenu-design.html",
    "payment-result.html",
}

OG_IMG_RE = re.compile(r'<meta\s+property=["\']og:image["\']', re.IGNORECASE)
TW_IMG_RE = re.compile(r'<meta\s+name=["\']twitter:image["\']', re.IGNORECASE)
TW_CARD_RE = re.compile(r'<meta\s+name=["\']twitter:card["\']', re.IGNORECASE)

# 找現有 og:title 位置來決定插入點
OG_TITLE_RE = re.compile(r'<meta\s+property=["\']og:title["\'][^>]*/?>', re.IGNORECASE)
# 若沒有 og:title，找 <meta name="description"> 位置
META_DESC_RE = re.compile(r'<meta\s+name=["\']description["\'][^>]*/?>', re.IGNORECASE)
HEAD_CLOSE_RE = re.compile(r'</head>', re.IGNORECASE)

def find_insert_position(content: str) -> int:
    """決定插入位置：og:title 後 > meta desc 後 > </head> 前"""
    m = OG_TITLE_RE.search(content)
    if m:
        # 找該 tag 結尾的換行
        pos = m.end()
        while pos < len(content) and content[pos] != '\n':
            pos += 1
        return pos + 1 if pos < len(content) else pos
    m = META_DESC_RE.search(content)
    if m:
        pos = m.end()
        while pos < len(content) and content[pos] != '\n':
            pos += 1
        return pos + 1 if pos < len(content) else pos
    m = HEAD_CLOSE_RE.search(content)
    if m:
        return m.start()
    return -1

def extract_og_image(content: str) -> str:
    """若已有 og:image，回傳其 content；否則回傳預設"""
    m = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', content, re.IGNORECASE)
    if m:
        return m.group(1)
    return DEFAULT_IMG

def process(file_path: Path) -> dict:
    if file_path.name in SKIP_FILES:
        return {"status": "skip"}
    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return {"status": "error"}

    tags_to_add = []

    has_og_img = bool(OG_IMG_RE.search(content))
    has_tw_card = bool(TW_CARD_RE.search(content))
    has_tw_img = bool(TW_IMG_RE.search(content))

    if not has_og_img:
        tags_to_add.append(f'<meta property="og:image" content="{DEFAULT_IMG}"/>')

    # 使用既有 og:image 或預設
    img_url = extract_og_image(content) if has_og_img else DEFAULT_IMG
    if not has_tw_card:
        tags_to_add.append('<meta name="twitter:card" content="summary_large_image"/>')
    if not has_tw_img:
        tags_to_add.append(f'<meta name="twitter:image" content="{img_url}"/>')

    if not tags_to_add:
        return {"status": "no_change"}

    insert_pos = find_insert_position(content)
    if insert_pos < 0:
        return {"status": "error"}

    insert_block = "\n".join(tags_to_add) + "\n"
    new_content = content[:insert_pos] + insert_block + content[insert_pos:]
    file_path.write_text(new_content, encoding="utf-8")
    return {"status": "added", "added": len(tags_to_add),
            "og": not has_og_img, "tw_card": not has_tw_card, "tw_img": not has_tw_img}

def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    targets = []
    for pattern in ["*.html", "blog/*.html", "sc/*.html", "sc/blog/*.html"]:
        targets.extend(ROOT.glob(pattern))

    stats = {"added": 0, "no_change": 0, "skip": 0, "error": 0}
    tag_stats = {"og": 0, "tw_card": 0, "tw_img": 0}
    for fp in sorted(targets):
        r = process(fp)
        stats[r["status"]] += 1
        if r["status"] == "added":
            if r.get("og"): tag_stats["og"] += 1
            if r.get("tw_card"): tag_stats["tw_card"] += 1
            if r.get("tw_img"): tag_stats["tw_img"] += 1

    print(f"總掃描：{len(targets)}")
    print(f"已補：{stats['added']} 檔")
    print(f"  - og:image +{tag_stats['og']}")
    print(f"  - twitter:card +{tag_stats['tw_card']}")
    print(f"  - twitter:image +{tag_stats['tw_img']}")
    print(f"無需變動：{stats['no_change']}")
    print(f"跳過：{stats['skip']}")
    print(f"錯誤：{stats['error']}")

if __name__ == "__main__":
    main()
