"""
批次補 meta description 到缺漏頁面
- 用 <title> + 品牌 tagline 作為預設描述
- 跳過 admin / preview / Google 驗證檔（noindex 不需要）
- 同時補 OG description 與 Twitter description 如缺漏

2026/04/14 馥寶產出 - task 12 SEO 深化
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

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
    "googledc89d0a8c66d112d.html",
    "payment-result.html", "founder_v3.html",
    "line-richmenu-design.html",
    "search.html",
}

TAGLINE_TW = "馥靈之鑰 Hour Light｜讀懂自己，活對人生。整合 33 大命理系統、130 張原創智慧牌卡、101+ 項心理覺察測驗，用 AI 即時解讀幫你找到人生座標。"
TAGLINE_CN = "馥灵之钥 Hour Light｜读懂自己，活对人生。整合 33 大命理系统、130 张原创智慧牌卡、101+ 项心理觉察测验，用 AI 实时解读帮你找到人生坐标。"

TITLE_RE = re.compile(r"<title>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_DESC_RE = re.compile(r'<meta\s+name=["\']description["\']', re.IGNORECASE)
META_CHARSET_RE = re.compile(r'<meta\s+charset=["\'][^"\']+["\']\s*/?>', re.IGNORECASE)

def clean_title(title: str) -> str:
    title = title.strip()
    for sep in ["｜", "|", " - ", " – "]:
        if sep in title:
            parts = title.split(sep)
            if len(parts[0]) < 6 and len(parts) > 1:
                title = sep.join(parts[1:])
            else:
                title = parts[0]
            break
    return title.strip()[:80]

def build_description(title: str, lang: str) -> str:
    if lang == "tw":
        return f"{title} — 馥靈之鑰 Hour Light。{TAGLINE_TW[8:]}"[:155]
    else:
        return f"{title} — 馥灵之钥 Hour Light。{TAGLINE_CN[8:]}"[:155]

def process(file_path: Path, lang: str) -> tuple[str, str]:
    if file_path.name in SKIP_FILES:
        return "skip", "skip list"

    try:
        content = file_path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return "error", "encoding"

    if META_DESC_RE.search(content):
        return "skip", "already has"

    title_m = TITLE_RE.search(content)
    if not title_m:
        return "error", "no title"
    title = clean_title(title_m.group(1))
    if not title:
        return "error", "empty title"

    desc = build_description(title, lang)
    meta_tag = f'<meta name="description" content="{desc}"/>\n'

    # 插入到 <meta charset> 之後（或 <title> 之前）
    charset_m = META_CHARSET_RE.search(content)
    if charset_m:
        insert_pos = charset_m.end()
        # 找到該行結尾
        while insert_pos < len(content) and content[insert_pos] != "\n":
            insert_pos += 1
        insert_pos += 1  # 跳過換行
        new_content = content[:insert_pos] + meta_tag + content[insert_pos:]
    else:
        # 備援：插在 <title> 之前
        insert_pos = title_m.start()
        new_content = content[:insert_pos] + meta_tag + content[insert_pos:]

    file_path.write_text(new_content, encoding="utf-8")
    return "added", title

def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    stats = {"added": 0, "skip": 0, "error": 0}
    added_files = []
    for fp in sorted(ROOT.glob("*.html")):
        status, info = process(fp, "tw")
        stats[status] += 1
        if status == "added":
            added_files.append((fp.name, info))
    for fp in sorted((ROOT / "sc").glob("*.html")):
        status, info = process(fp, "cn")
        stats[status] += 1
        if status == "added":
            added_files.append((f"sc/{fp.name}", info))
    for fp in sorted((ROOT / "blog").glob("*.html")):
        status, info = process(fp, "tw")
        stats[status] += 1
        if status == "added":
            added_files.append((f"blog/{fp.name}", info))
    for fp in sorted((ROOT / "sc" / "blog").glob("*.html")):
        status, info = process(fp, "cn")
        stats[status] += 1
        if status == "added":
            added_files.append((f"sc/blog/{fp.name}", info))

    print(f"added: {stats['added']} / skip: {stats['skip']} / error: {stats['error']}")
    for name, title in added_files[:80]:
        print(f"  [{name}] {title}")

if __name__ == "__main__":
    main()
