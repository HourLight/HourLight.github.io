"""
批次補齊剩餘 Schema（第三輪）
- LocalBusiness Schema → 支撐桃園本地 SEO
- Book Schema × 3 本著作 → 強化 author 權威
- HealthApplication Schema → aroma-garden.html
- Speakable Schema → 核心品牌頁，語音搜尋 ready
- Course Schema 擴充 → 課程頁
- 圖片 alt 批次補（只補實際缺失）

2026/04/14 馥寶產出 - task 第三輪
"""
import re, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://hourlightkey.com"

HEAD_CLOSE_RE = re.compile(r'</head>', re.IGNORECASE)

# ====================================================================
# 1. LocalBusiness Schema（加到主要商業頁）
# ====================================================================
LOCAL_BUSINESS_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": f"{SITE}/#localbusiness",
    "name": "馥靈之鑰國際有限公司 Hour Light International",
    "alternateName": ["馥靈之鑰", "Hour Light"],
    "description": "馥靈之鑰 Hour Light｜整合 33 大命理系統、130 張原創智慧牌卡、101+ 項心理測驗的自我認知優化平台。創辦人王逸君 34 年美業經驗，NAHA 認證芳療師。",
    "url": SITE,
    "image": f"{SITE}/og-image.jpg",
    "logo": f"{SITE}/logo.svg",
    "telephone": "+60303284",  # 統一編號作占位，實際用 LINE 聯絡
    "email": "info@hourlightkey.com",
    "priceRange": "NT$199-NT$59,800",
    "address": {
        "@type": "PostalAddress",
        "streetAddress": "藝文一街 86-6 號 17 樓",
        "addressLocality": "桃園區",
        "addressRegion": "桃園市",
        "postalCode": "330",
        "addressCountry": "TW"
    },
    "geo": {
        "@type": "GeoCoordinates",
        "latitude": 24.9871,
        "longitude": 121.3170
    },
    "areaServed": [
        {"@type": "Country", "name": "Taiwan"},
        {"@type": "Country", "name": "Malaysia"},
        {"@type": "Country", "name": "Singapore"},
        {"@type": "Country", "name": "Hong Kong"}
    ],
    "openingHoursSpecification": [
        {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "00:00",
            "closes": "23:59",
            "description": "線上平台 24 小時開放；覺察師人工服務請透過 LINE 預約"
        }
    ],
    "sameAs": [
        "https://www.facebook.com/share/1QoZr7swk4/?mibextid=wwXIfr",
        "https://www.youtube.com/@judyanee",
        "https://www.instagram.com/judyanee",
        "https://lin.ee/RdQBFAN",
        "https://www.threads.net/@judyanee",
        "https://www.wikidata.org/wiki/Q139305704"
    ],
    "founder": {"@id": f"{SITE}/#founder"},
    "knowsAbout": ["命理", "塔羅", "八字", "紫微斗數", "人類圖", "西洋占星", "認知芳療", "覺察", "H.O.U.R.", "L.I.G.H.T."],
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "馥靈之鑰平台服務",
        "itemListElement": [
            {"@type": "Offer", "name": "免費會員", "price": "0", "priceCurrency": "TWD"},
            {"@type": "Offer", "name": "馥靈鑰友月費", "price": "399", "priceCurrency": "TWD"},
            {"@type": "Offer", "name": "馥靈大師月費", "price": "999", "priceCurrency": "TWD"},
            {"@type": "Offer", "name": "馥靈初探一對一", "price": "6800", "priceCurrency": "TWD"},
            {"@type": "Offer", "name": "深度覺醒一對一", "price": "8800", "priceCurrency": "TWD"}
        ]
    }
}

LOCAL_BUSINESS_TARGETS = [
    "services.html", "pricing.html", "price-list.html",
    "price-list-vip.html", "price-list-b2b.html",
    "founder.html", "brand.html", "about.html",
    "index.html", "consulting.html", "ai-about.html",
]

# ====================================================================
# 2. Book Schema（3 本著作）
# ====================================================================
BOOKS_SCHEMA = [
    {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": "氣味記得我走過的路",
        "author": {"@id": f"{SITE}/#founder", "@type": "Person", "name": "王逸君"},
        "publisher": "馥靈之鑰國際有限公司",
        "inLanguage": "zh-TW",
        "bookFormat": "https://schema.org/EBook",
        "description": "王逸君 34 年美業旅程與認知芳療核心概念的回顧。用香氣作為時間軸，帶讀者回到生命的每一個關鍵片段。",
        "genre": ["芳療", "自我覺察", "美業"],
        "url": "https://www.pubu.com.tw/ebook/647227",
        "sameAs": [
            "https://www.pubu.com.tw/ebook/647227",
            "https://readmoo.com/book/210449883000101"
        ]
    },
    {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": "藏在農曆生日裡的秘碼",
        "author": {"@id": f"{SITE}/#founder", "@type": "Person", "name": "王逸君"},
        "publisher": "馥靈之鑰國際有限公司",
        "inLanguage": "zh-TW",
        "bookFormat": "https://schema.org/EBook",
        "description": "馥靈秘碼系統的完整介紹。全球首創以農曆生日為基礎的生命靈數系統，揭示內在設定。",
        "genre": ["命理", "生命靈數", "自我認知"]
    },
    {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": "AI 時代美業人的逆襲指南",
        "author": {"@id": f"{SITE}/#founder", "@type": "Person", "name": "王逸君"},
        "publisher": "馥靈之鑰國際有限公司",
        "inLanguage": "zh-TW",
        "bookFormat": "https://schema.org/EBook",
        "description": "寫給美業人的 AI 工具應用與轉型指南。34 年美業資歷整理出的實戰心得。",
        "genre": ["美業", "AI 應用", "職涯發展"]
    }
]

BOOK_TARGETS = ["founder.html", "book.html", "ai-guide-beauty.html"]

# ====================================================================
# 3. HealthApplication Schema → aroma-garden
# ====================================================================
HEALTH_APP_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "HealthApplication",
    "name": "芳療共享園地",
    "url": f"{SITE}/aroma-garden.html",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web Browser",
    "description": "馥靈之鑰芳療共享園地。305 個精油配方、25 支核心精油速查、12 經絡對照表、NAHA 認證重點、安全守則速查。NAHA 認證芳療師王逸君整理。",
    "publisher": {"@id": f"{SITE}/#organization"},
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "TWD"
    },
    "featureList": [
        "305 個精油配方資料庫",
        "25 支核心精油速查表",
        "12 經絡 × 精油對照",
        "NAHA 認證重點整理",
        "精油化學 9 大官能基分類",
        "特殊族群安全速查（孕婦/兒童/寵物）",
        "25 支基底油完整比較"
    ],
    "isAccessibleForFree": True,
    "inLanguage": "zh-TW",
    "healthCondition": [
        {"@type": "MedicalCondition", "name": "情緒失衡（舒緩而非治療）"},
        {"@type": "MedicalCondition", "name": "睡眠品質不佳（輔助而非治療）"}
    ]
}

# ====================================================================
# 4. Speakable Schema → 核心品牌頁
# ====================================================================
SPEAKABLE_SCHEMA = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": f"{SITE}/#speakable",
    "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", ".lead", ".intro", ".blog-title", ".blog-body p:first-of-type"]
    }
}
SPEAKABLE_TARGETS = [
    "founder.html", "about.html", "brand.html", "research.html",
    "knowledge-hub.html", "ai-about.html", "cognitive-aroma.html",
    "coordinate-philosophy.html", "cognitive-aromatherapy-theory.html",
]

# ====================================================================
# 5. Course Schema 擴充
# ====================================================================
COURSE_TARGETS = [
    ("naha-course.html", "NAHA 國際芳療師認證課程", "王逸君 NAHA 認證芳療師親授，含 Level 1 (50 小時) 與 Level 2 (200 小時) 完整備考內容。"),
    ("beauty-course.html", "馥靈美業覺察課程", "34 年美業實戰整合覺察系統的完整課程。學會如何把覺察帶入客服、服務、銷售。"),
    ("gel-nail-course.html", "凝膠美甲完整課程", "從零到能接案的凝膠美甲課程。含材料學、指甲病理、彩繪、客戶諮詢。"),
    ("nail-course.html", "美甲師養成課程", "完整美甲職訓課程。含檢定準備、設計實作、客戶溝通、職涯規劃。"),
    ("hour-training.html", "H.O.U.R. 覺察師培訓系統", "24 堂課 + 4 份附加資源。第一天就能接案收錢的覺察師養成系統。"),
]

def build_course_schema(slug: str, name: str, desc: str) -> dict:
    return {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": name,
        "description": desc,
        "url": f"{SITE}/{slug}",
        "provider": {"@id": f"{SITE}/#organization"},
        "author": {"@id": f"{SITE}/#founder"},
        "inLanguage": "zh-TW",
        "courseCode": slug.replace(".html", "").upper(),
        "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": ["Online", "Blended"],
            "courseWorkload": "PT50H"
        },
        "educationalLevel": "Beginner to Advanced",
        "teaches": ["自我覺察", "芳療", "命理", "美業實戰"]
    }

# ====================================================================
# 共用：插入 JSON-LD 到 </head> 前
# ====================================================================
def inject_schema(file_path: Path, schema_dict: dict, marker: str) -> str:
    if not file_path.exists():
        return "missing"
    content = file_path.read_text(encoding="utf-8")
    # 檢查是否已有此標記
    if f'"@type":"{marker}"' in content.replace(" ", ""):
        return "skip"
    head_close = HEAD_CLOSE_RE.search(content)
    if not head_close:
        return "error"
    ld_tag = '<script type="application/ld+json">' + json.dumps(schema_dict, ensure_ascii=False, separators=(",", ":")) + '</script>\n'
    new_content = content[:head_close.start()] + ld_tag + content[head_close.start():]
    file_path.write_text(new_content, encoding="utf-8")
    return "added"

# ====================================================================
# 圖片 alt 批次補（只補真實缺失）
# ====================================================================
def fix_img_alts(file_path: Path) -> int:
    try:
        content = file_path.read_text(encoding="utf-8")
    except:
        return 0
    orig = content
    fixes = 0

    def repl(m):
        nonlocal fixes
        tag = m.group(0)
        # 跳過追蹤像素（data:、FB Pixel 等）
        if 'data:' in tag or 'facebook.com/tr' in tag or 'display:none' in tag:
            return tag
        # 跳過已有 alt
        if 'alt=' in tag:
            return tag
        # 從 src 推斷 alt
        src_m = re.search(r'src=["\']([^"\']+)["\']', tag)
        if src_m:
            src = src_m.group(1)
            fname = src.rsplit('/', 1)[-1].rsplit('.', 1)[0]
            alt_text = fname.replace('-', ' ').replace('_', ' ').strip()
            if not alt_text:
                alt_text = "馥靈之鑰圖示"
        else:
            alt_text = "馥靈之鑰圖示"
        fixes += 1
        # 插入 alt
        return tag[:-1] + f' alt="{alt_text}"' + tag[-1]

    new_content = re.sub(r'<img[^>]*>', repl, content)
    if fixes > 0:
        file_path.write_text(new_content, encoding="utf-8")
    return fixes

# ====================================================================
# 主程式
# ====================================================================
def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    print("=== 1. LocalBusiness Schema ===")
    for fname in LOCAL_BUSINESS_TARGETS:
        status = inject_schema(ROOT / fname, LOCAL_BUSINESS_SCHEMA, "LocalBusiness")
        print(f"  {fname}: {status}")

    print("\n=== 2. Book Schema (founder.html + book.html) ===")
    for fname in BOOK_TARGETS:
        fp = ROOT / fname
        if not fp.exists():
            print(f"  {fname}: missing")
            continue
        content = fp.read_text(encoding="utf-8")
        head_close = HEAD_CLOSE_RE.search(content)
        if not head_close:
            print(f"  {fname}: error")
            continue
        already = '"@type":"Book"' in content.replace(" ", "")
        if already:
            print(f"  {fname}: skip (已有 Book schema)")
            continue
        # 一次插入 3 本書
        blocks = []
        for book in BOOKS_SCHEMA:
            blocks.append('<script type="application/ld+json">' + json.dumps(book, ensure_ascii=False, separators=(",", ":")) + '</script>')
        new_content = content[:head_close.start()] + "\n".join(blocks) + "\n" + content[head_close.start():]
        fp.write_text(new_content, encoding="utf-8")
        print(f"  {fname}: added 3 books")

    print("\n=== 3. HealthApplication Schema → aroma-garden.html ===")
    status = inject_schema(ROOT / "aroma-garden.html", HEALTH_APP_SCHEMA, "HealthApplication")
    print(f"  aroma-garden.html: {status}")

    print("\n=== 4. Speakable Schema ===")
    for fname in SPEAKABLE_TARGETS:
        fp = ROOT / fname
        if not fp.exists():
            print(f"  {fname}: missing")
            continue
        content = fp.read_text(encoding="utf-8")
        if 'speakable' in content.lower():
            print(f"  {fname}: skip")
            continue
        head_close = HEAD_CLOSE_RE.search(content)
        if not head_close:
            print(f"  {fname}: error")
            continue
        ld = '<script type="application/ld+json">' + json.dumps(SPEAKABLE_SCHEMA, ensure_ascii=False, separators=(",", ":")) + '</script>\n'
        new_content = content[:head_close.start()] + ld + content[head_close.start():]
        fp.write_text(new_content, encoding="utf-8")
        print(f"  {fname}: added")

    print("\n=== 5. Course Schema 擴充 ===")
    for slug, name, desc in COURSE_TARGETS:
        schema = build_course_schema(slug, name, desc)
        status = inject_schema(ROOT / slug, schema, "Course")
        print(f"  {slug}: {status}")

    print("\n=== 6. 圖片 alt 批次補 ===")
    total_fixes = 0
    files_fixed = 0
    for p in sorted(ROOT.glob("*.html")):
        n = fix_img_alts(p)
        if n > 0:
            total_fixes += n
            files_fixed += 1
    for p in sorted((ROOT / "sc").glob("*.html")):
        n = fix_img_alts(p)
        if n > 0:
            total_fixes += n
            files_fixed += 1
    for p in sorted((ROOT / "blog").glob("*.html")):
        n = fix_img_alts(p)
        if n > 0:
            total_fixes += n
            files_fixed += 1
    for p in sorted((ROOT / "sc" / "blog").glob("*.html")):
        n = fix_img_alts(p)
        if n > 0:
            total_fixes += n
            files_fixed += 1
    print(f"  補上 alt {total_fixes} 個，影響 {files_fixed} 檔")

if __name__ == "__main__":
    main()
