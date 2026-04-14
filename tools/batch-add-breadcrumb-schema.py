"""
批次補齊 BreadcrumbList Schema
- 掃 root / blog / sc / sc/blog / castle rooms
- 跳過已有 BreadcrumbList 的檔案
- 根據路徑規則決定麵包屑層級
- 插入 JSON-LD 到 </head> 之前

2026/04/14 馥寶產出 - task 6 SEO 深化
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://hourlightkey.com"

# 分類規則：(判斷函式, 中間層名稱, 中間層 URL, 層語言)
# 語言: 'tw' 繁體 / 'cn' 簡體
CATEGORIES_TW = [
    (lambda p: p.name.startswith("quiz-") and p.name != "quiz-hub.html",
     "心理測驗", "/quiz-hub.html"),
    (lambda p: p.name.startswith("draw-") and p.name != "draw-hub.html",
     "抽牌系統", "/draw-hub.html"),
    (lambda p: p.name.startswith("castle-room-"),
     "內在城堡", "/castle-game.html"),
    (lambda p: p.name.startswith("castle-") and p.name != "castle-game.html",
     "內在城堡", "/castle-game.html"),
    (lambda p: p.name.startswith("magic-") and p.name != "magic-lab.html",
     "微魔法實驗室", "/magic-lab.html"),
    (lambda p: p.name.endswith("-calculator.html"),
     "命理計算", "/destiny-hub.html"),
    (lambda p: p.name.endswith("-guide.html"),
     "知識學苑", "/knowledge-hub.html"),
    (lambda p: p.name.startswith("fuling-code-"),
     "馥靈秘碼系列", "/fuling-mima.html"),
    (lambda p: p.name.startswith("ai-guide-") or p.name.startswith("ai-tutorial-") or p.name.startswith("ai-templates-"),
     "AI 認識我們", "/ai-about.html"),
    (lambda p: p.name.startswith("price-list"),
     "服務總覽", "/services.html"),
]
CATEGORIES_CN = [
    (lambda p: p.name.startswith("quiz-") and p.name != "quiz-hub.html",
     "心理测验", "/sc/quiz-hub.html"),
    (lambda p: p.name.startswith("draw-") and p.name != "draw-hub.html",
     "抽牌系统", "/sc/draw-hub.html"),
    (lambda p: p.name.startswith("castle-"),
     "内在城堡", "/sc/castle-game.html"),
    (lambda p: p.name.startswith("magic-"),
     "微魔法实验室", "/sc/magic-lab.html"),
    (lambda p: p.name.endswith("-calculator.html"),
     "命理计算", "/sc/destiny-hub.html"),
    (lambda p: p.name.endswith("-guide.html"),
     "知识学苑", "/sc/knowledge-hub.html"),
    (lambda p: p.name.startswith("ai-guide-") or p.name.startswith("ai-tutorial-") or p.name.startswith("ai-templates-"),
     "AI 认识我们", "/sc/ai-about.html"),
]

SKIP_FILES = {
    "admin-dashboard.html", "admin-payments.html", "admin-unlock.html",
    "admin-akashic-reading.html", "admin-analytics.html", "admin-draw-hl.html",
    "admin-family-reading.html", "admin-fuling-light.html",
    "admin-nail-reading.html", "admin-pet-reading.html",
    "admin-spa-reading.html", "admin-yuan-chen-reading.html",
    "tarot-widget.html", "404.html", "search.html",
    "googledc89d0a8c66d112d.html",
    "AIpreview.html", "Bookpreview.html", "Fulingpreview.html",
    "HourBeauty.html", "HourBeauty-basic.html",
    "payment-result.html",
}

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
HEAD_CLOSE_RE = re.compile(r"</head>", re.IGNORECASE)
HAS_BREADCRUMB_RE = re.compile(r'"@type"\s*:\s*"BreadcrumbList"')

def clean_title(title: str) -> str:
    """移除品牌後綴，取主標題"""
    title = title.strip()
    # 移除常見品牌後綴
    for sep in ["｜", "|", " - ", " – "]:
        if sep in title:
            parts = title.split(sep)
            # 如果第一段短於整體一半，可能本身就是品牌名 (e.g. "馥靈之鑰｜xxx")
            if len(parts[0]) < 6 and len(parts) > 1:
                title = sep.join(parts[1:])
            else:
                title = parts[0]
            break
    return title.strip()[:100]

def make_breadcrumb(path_str: str, title: str, category: tuple | None, lang: str) -> str:
    """產生 BreadcrumbList JSON-LD (單行)"""
    home_name = "首頁" if lang == "tw" else "首页"
    home_url = SITE + "/" if lang == "tw" else SITE + "/sc/"
    items = [
        {"@type": "ListItem", "position": 1, "name": home_name, "item": home_url}
    ]
    if category:
        name, url = category
        items.append({
            "@type": "ListItem", "position": 2,
            "name": name, "item": SITE + url
        })
    items.append({
        "@type": "ListItem", "position": len(items) + 1,
        "name": title, "item": SITE + path_str
    })

    import json
    data = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": items
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + '</script>'

def determine_category(file_path: Path, lang: str):
    """根據路徑/檔名判斷分類"""
    # blog 特判
    if file_path.parent.name == "blog":
        if lang == "tw":
            return ("部落格", "/blog-hub.html")
        else:
            return ("博客", "/sc/blog-hub.html")

    rules = CATEGORIES_TW if lang == "tw" else CATEGORIES_CN
    for test_fn, name, url in rules:
        if test_fn(file_path):
            return (name, url)
    return None

def process_file(file_path: Path) -> tuple[str, str]:
    """處理單檔。回傳 (狀態, 訊息)"""
    if file_path.name in SKIP_FILES:
        return ("skip", "skip list")

    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return ("error", "encoding")

    if HAS_BREADCRUMB_RE.search(content):
        return ("skip", "已有")

    title_match = TITLE_RE.search(content)
    if not title_match:
        return ("error", "no title")
    title = clean_title(title_match.group(1))
    if not title:
        return ("error", "empty title")

    head_close = HEAD_CLOSE_RE.search(content)
    if not head_close:
        return ("error", "no </head>")

    # 判斷語言與 URL path
    rel = file_path.relative_to(ROOT).as_posix()
    if rel.startswith("sc/"):
        lang = "cn"
    else:
        lang = "tw"
    path_str = "/" + rel

    category = determine_category(file_path, lang)
    breadcrumb_ld = make_breadcrumb(path_str, title, category, lang)

    # 插入到 </head> 之前
    new_content = content[:head_close.start()] + breadcrumb_ld + "\n" + content[head_close.start():]
    file_path.write_text(new_content, encoding="utf-8")
    return ("added", category[0] if category else "root")

def main():
    targets = []
    # 掃描目標：root + blog + sc + sc/blog
    for pattern in ["*.html", "blog/*.html", "sc/*.html", "sc/blog/*.html"]:
        targets.extend(ROOT.glob(pattern))

    stats = {"added": 0, "skip": 0, "error": 0}
    by_category = {}
    errors = []
    skipped_existing = 0

    for fp in sorted(targets):
        status, info = process_file(fp)
        stats[status] += 1
        if status == "added":
            by_category[info] = by_category.get(info, 0) + 1
        elif status == "skip" and info == "已有":
            skipped_existing += 1
        elif status == "error":
            errors.append(f"{fp.name}: {info}")

    print(f"總掃描：{len(targets)} 檔")
    print(f"新增：{stats['added']} 檔")
    print(f"跳過（已有 Breadcrumb）：{skipped_existing} 檔")
    print(f"跳過（skip list）：{stats['skip'] - skipped_existing} 檔")
    print(f"錯誤：{stats['error']} 檔")
    print("\n分類分布：")
    for cat, n in sorted(by_category.items(), key=lambda x: -x[1]):
        print(f"  {cat}: {n}")
    if errors:
        print(f"\n錯誤清單（前 20 筆）：")
        for e in errors[:20]:
            print(f"  {e}")

if __name__ == "__main__":
    main()
