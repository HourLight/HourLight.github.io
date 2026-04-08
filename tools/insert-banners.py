#!/usr/bin/env python3
"""
Batch insert page banner images into matching HTML files.
Each .webp in images/page-banners-web/ maps to a same-named .html file.
Uses 5 different banner styles based on page type.
"""

import os
import re
import glob

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANNER_DIR = os.path.join(BASE_DIR, "images", "page-banners-web")

# Pages to skip
SKIP_PAGES = {
    "castle-game.html",
    "pet-reading.html",
    "index.html",
    "admin-dashboard.html",
    "admin-payments.html",
    "admin-unlock.html",
    "member-login.html",
    "404.html",
}


def get_page_type(name):
    """Determine page type from filename for style selection."""
    if name.startswith("quiz-"):
        return "quiz"
    if name.startswith("draw-") or name.endswith("-oracle") or name in (
        "angel-oracle", "tarot-draw", "projection-cards", "poe-blocks",
        "witch-power", "past-life", "moon-calendar",
    ):
        return "draw"
    if name.endswith("-calculator") or name.startswith("destiny-") or name in (
        "fuling-mima", "mima", "compatibility", "fuling-fuyu",
        "rainbow-calculator", "rainbow-number", "digital-energy-analyzer",
        "helo-lishu", "triangle-calculator",
    ):
        return "calculator"
    if name.startswith("castle-") or name.startswith("game") or name in (
        "castle", "app",
    ):
        return "castle"
    if name.startswith("brand") or name.startswith("service") or name in (
        "consulting", "partners", "pricing", "price-list", "courses",
        "enterprise", "esg", "saas", "monetization", "startup-plan",
        "founder", "philosophy", "hourlight-philosophy", "hourlight-core",
        "nail-course", "beauty-course", "naha-course", "gel-nail-course",
        "hour-training", "nail-mentor", "nail-classroom", "nail-energy",
        "book", "podcast", "youtube", "about",
    ):
        return "service"
    # Default
    return "service"


def make_banner_tag(name):
    """Generate banner HTML based on page type."""
    src = f"images/page-banners-web/{name}.webp"
    ptype = get_page_type(name)

    if ptype == "quiz":
        # Rounded pill shape with soft shadow
        return (
            f'<img src="{src}" alt="" class="page-banner" '
            f'style="width:92%;max-width:600px;max-height:200px;object-fit:cover;'
            f'border-radius:999px;margin:0 auto 24px;display:block;'
            f'box-shadow:0 8px 32px rgba(0,0,0,.15)" '
            f'loading="lazy" onerror="this.style.display=\'none\'">'
        )
    elif ptype == "draw":
        # Circle crop with glow
        return (
            f'<img src="{src}" alt="" class="page-banner" '
            f'style="width:200px;height:200px;object-fit:cover;border-radius:50%;'
            f'margin:0 auto 24px;display:block;'
            f'box-shadow:0 0 40px rgba(248,223,165,.2);'
            f'border:2px solid rgba(248,223,165,.15)" '
            f'loading="lazy" onerror="this.style.display=\'none\'">'
        )
    elif ptype == "calculator":
        # Wide banner with gradient fade at bottom
        return (
            f'<div class="page-banner" style="position:relative;margin-bottom:24px;'
            f'border-radius:20px;overflow:hidden;max-height:200px">'
            f'<img src="{src}" alt="" '
            f'style="width:100%;object-fit:cover;display:block" '
            f'loading="lazy" onerror="this.parentElement.style.display=\'none\'">'
            f'<div style="position:absolute;bottom:0;left:0;right:0;height:60%;'
            f'background:linear-gradient(transparent,var(--bg,#06040e))"></div></div>'
        )
    elif ptype == "castle":
        # Diamond/rotated shape
        return (
            f'<div class="page-banner" style="width:180px;height:180px;margin:0 auto 24px;'
            f'overflow:hidden;transform:rotate(45deg);border-radius:20px;'
            f'box-shadow:0 8px 24px rgba(0,0,0,.2)">'
            f'<img src="{src}" alt="" '
            f'style="width:260px;height:260px;object-fit:cover;'
            f'transform:rotate(-45deg) scale(1.4);margin:-40px 0 0 -40px" '
            f'loading="lazy" onerror="this.parentElement.style.display=\'none\'">'
            f'</div>'
        )
    else:
        # Service/Brand pages - Asymmetric rounded corners
        return (
            f'<img src="{src}" alt="" class="page-banner" '
            f'style="width:100%;max-height:220px;object-fit:cover;'
            f'border-radius:0 0 32px 32px;margin-bottom:24px;display:block" '
            f'loading="lazy" onerror="this.style.display=\'none\'">'
        )


def find_insertion_point(html):
    """
    Find the best insertion point in the HTML.
    Returns (index, description, mode) where index is the position to insert.
    """
    patterns = [
        (r'<div\s+class="quiz-wrap"[^>]*>', "quiz-wrap", "after"),
        (r'<main\s+class="engine-wrap"[^>]*>', "engine-wrap", "after"),
        (r'<main\s+class="[^"]*"[^>]*>', "main with class", "after"),
        (r'<section\s+class="[^"]*hero[^"]*"[^>]*>', "hero section", "before"),
        (r'<div\s+class="page-wrap"[^>]*>', "page-wrap", "after"),
        (r'<div\s+class="wrap"[^>]*>', "wrap", "after"),
        (r'<section\s+class="[^"]*hl-v2-glass[^"]*"[^>]*>', "hl-v2-glass", "before"),
        (r'<main[^>]*>', "main", "after"),
    ]

    for pattern, desc, mode in patterns:
        m = re.search(pattern, html)
        if m:
            if mode == "before":
                return m.start(), desc, "before"
            else:
                return m.end(), desc, "after"

    m = re.search(r'<body[^>]*>', html)
    if m:
        return m.end(), "body", "after"

    return None, None, None


def already_has_banner(html):
    return 'class="page-banner"' in html or 'page-banners-web' in html


def process():
    webp_files = glob.glob(os.path.join(BANNER_DIR, "*.webp"))
    banners = {}
    for f in webp_files:
        name = os.path.splitext(os.path.basename(f))[0]
        banners[name] = f

    print(f"Found {len(banners)} banner images")

    modified = 0
    skipped_no_html = []
    skipped_already = []
    skipped_excluded = []
    skipped_no_insert = []
    success_list = []
    type_counts = {"quiz": 0, "draw": 0, "calculator": 0, "castle": 0, "service": 0}

    for name in sorted(banners.keys()):
        html_file = os.path.join(BASE_DIR, f"{name}.html")

        if not os.path.exists(html_file):
            skipped_no_html.append(name)
            continue

        if f"{name}.html" in SKIP_PAGES:
            skipped_excluded.append(name)
            continue

        with open(html_file, "r", encoding="utf-8") as f:
            html = f.read()

        if already_has_banner(html):
            skipped_already.append(name)
            continue

        pos, desc, mode = find_insertion_point(html)
        if pos is None:
            skipped_no_insert.append(name)
            continue

        ptype = get_page_type(name)
        type_counts[ptype] += 1
        banner_tag = "\n" + make_banner_tag(name) + "\n"

        new_html = html[:pos] + banner_tag + html[pos:]

        with open(html_file, "w", encoding="utf-8") as f:
            f.write(new_html)

        modified += 1
        success_list.append(f"  {name}.html [{ptype}] (inserted {mode} {desc})")

    print(f"\n=== Results ===")
    print(f"Modified: {modified}")
    print(f"Skipped (no matching HTML): {len(skipped_no_html)}")
    print(f"Skipped (already has banner): {len(skipped_already)}")
    print(f"Skipped (excluded): {len(skipped_excluded)}")
    print(f"Skipped (no insertion point): {len(skipped_no_insert)}")

    print(f"\nStyle distribution:")
    for ptype, count in type_counts.items():
        print(f"  {ptype}: {count}")

    if skipped_no_html:
        print(f"\nNo matching HTML: {', '.join(skipped_no_html)}")
    if skipped_already:
        print(f"\nAlready has banner: {', '.join(skipped_already)}")
    if skipped_excluded:
        print(f"\nExcluded: {', '.join(skipped_excluded)}")
    if skipped_no_insert:
        print(f"\nNo insertion point found: {', '.join(skipped_no_insert)}")

    print(f"\nSuccessfully modified files:")
    for s in success_list:
        print(s)


if __name__ == "__main__":
    process()
