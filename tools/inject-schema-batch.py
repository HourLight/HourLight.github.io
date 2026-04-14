#!/usr/bin/env python3
"""
批次補齊缺失的 JSON-LD Schema
------------------------------
逸君 4/14 SEO 行動清單 #3 / #4：Article Schema 批次補齊

掃過現況：
- 34 繁 blog 全都已有 Article schema ✅
- 44 簡 blog 全都已有 Article schema ✅
- 17/18 知識頁已有 Article schema（naha-study-guide 漏）
- 16/16 簡知識頁已有 ✅

實際要補的是核心內容頁（沒任何 schema）：
- founder.html         → Person schema
- aroma-garden.html    → Article schema
- cognitive-aroma.html → Article schema
- naha-study-guide.html→ Article schema
- brand.html           → AboutPage schema
- worldview.html       → Article schema
- esg.html             → AboutPage schema
- hour-training.html   → Course schema
- destiny-hub.html     → CollectionPage schema
- draw-hub.html        → CollectionPage schema
加上對應的 sc/ 簡體版。

作者：馥寶 (Opus 4.6)
日期：2026/04/14
"""
import os
import re
import json

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PUBLISHER = {
    "@type": "Organization",
    "name": "馥靈之鑰 Hour Light",
    "logo": {"@type": "ImageObject", "url": "https://hourlightkey.com/LOGO-1.png"}
}
AUTHOR = {
    "@type": "Person",
    "name": "王逸君",
    "jobTitle": "馥靈之鑰創辦人",
    "url": "https://hourlightkey.com/founder.html"
}
DATE_PUB = "2026-04-14"
DATE_MOD = "2026-04-14"

# 每個檔案對應的 schema 產生邏輯
def build_person_founder():
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "王逸君",
        "alternateName": ["Ruby Wang", "逸君"],
        "jobTitle": "馥靈之鑰創辦人",
        "birthDate": "1976-02-05",
        "gender": "Female",
        "nationality": "Taiwan",
        "alumniOf": {
            "@type": "CollegeOrUniversity",
            "name": "德育護理健康學院健康產業管理研究所"
        },
        "hasCredential": [
            {"@type": "EducationalOccupationalCredential", "name": "碩士"},
            {"@type": "EducationalOccupationalCredential", "name": "NAHA 認證芳療師"}
        ],
        "knowsAbout": ["塔羅", "命理", "紫微斗數", "八字", "芳療", "覺察", "自我認知", "馥靈秘碼", "130 張原創牌卡"],
        "worksFor": {
            "@type": "Organization",
            "name": "馥靈之鑰國際有限公司",
            "taxID": "60303284",
            "foundingDate": "2026-02-10",
            "url": "https://hourlightkey.com"
        },
        "description": "馥靈之鑰創辦人，34 年美業資歷（1991 年入行），碩士（德育護理健康學院健康產業管理研究所），著有《氣味記得我走過的路》《藏在農曆生日裡的秘碼》《AI 時代美業人的逆襲指南》三本書。整合古今中外 33 大命理系統、130 張原創智慧牌卡、101+ 項心理覺察測驗，打造全球首創的 AI 自我認知優化平台。",
        "url": "https://hourlightkey.com/founder.html",
        "image": "https://hourlightkey.com/og-image.jpg"
    }

def build_article(headline, description, url, keywords=None):
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": headline,
        "description": description,
        "datePublished": DATE_PUB,
        "dateModified": DATE_MOD,
        "author": AUTHOR,
        "publisher": PUBLISHER,
        "image": "https://hourlightkey.com/og-image.jpg",
        "mainEntityOfPage": f"https://hourlightkey.com/{url}",
        **({"keywords": keywords} if keywords else {})
    }

def build_about_page(name, description, url):
    return {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "name": name,
        "description": description,
        "url": f"https://hourlightkey.com/{url}",
        "mainEntity": {
            "@type": "Organization",
            "name": "馥靈之鑰 Hour Light",
            "url": "https://hourlightkey.com",
            "founder": AUTHOR,
            "foundingDate": "2026-02-10"
        },
        "publisher": PUBLISHER
    }

def build_course(name, description, url):
    return {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": name,
        "description": description,
        "url": f"https://hourlightkey.com/{url}",
        "provider": {
            "@type": "Organization",
            "name": "馥靈之鑰 Hour Light",
            "sameAs": "https://hourlightkey.com"
        },
        "educationalLevel": "專業培訓",
        "inLanguage": "zh-TW",
        "hasCourseInstance": {
            "@type": "CourseInstance",
            "courseMode": "online",
            "instructor": AUTHOR
        }
    }

def build_collection_page(name, description, url):
    return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": name,
        "description": description,
        "url": f"https://hourlightkey.com/{url}",
        "isPartOf": {
            "@type": "WebSite",
            "name": "馥靈之鑰 Hour Light",
            "url": "https://hourlightkey.com"
        },
        "publisher": PUBLISHER
    }

# 檔案 → schema 建構函數對應
TARGETS = [
    ("founder.html", "person", lambda: build_person_founder()),
    ("aroma-garden.html", "article", lambda: build_article(
        "芳療共享園地｜全台最完整的芳療知識庫｜馥靈之鑰",
        "1150+ 行芳療知識寶庫：25 支核心精油、9 大化學官能基、12 經絡精油對照、305 個配方搜尋器、18 道 NAHA 模擬考題、創辦人 34 年美業實戰筆記。",
        "aroma-garden.html",
        "芳療,精油,NAHA,IFA,CIBTAC,經絡,脈輪,配方搜尋"
    )),
    ("cognitive-aroma.html", "article", lambda: build_article(
        "認知芳療完整理論｜為什麼想到薄荷就有沁涼感｜馥靈之鑰",
        "認知芳療（Cognitive Aromatherapy）的科學機制：嗅覺記憶、大腦與氣味的關係、為什麼線上覺察也有效。附 9 篇學術引用。",
        "cognitive-aroma.html",
        "認知芳療,嗅覺記憶,神經科學,馥靈之鑰"
    )),
    ("naha-study-guide.html", "article", lambda: build_article(
        "NAHA 認證芳療師完整備考指南｜馥靈之鑰",
        "NAHA 認證等級比較、備考重點、考試題型、薪資行情、創辦人 34 年美業實戰心法。",
        "naha-study-guide.html",
        "NAHA,芳療師認證,芳療考試,備考"
    )),
    ("brand.html", "about", lambda: build_about_page(
        "馥靈之鑰品牌故事｜Hour Light",
        "馥靈之鑰品牌起源：從精油抓周到 AI 自我認知優化平台，34 年美業沉澱的品牌哲學。",
        "brand.html"
    )),
    ("worldview.html", "article", lambda: build_article(
        "馥靈之鑰世界觀｜以人為本的身心覺察生態系統｜馥靈之鑰",
        "馥靈之鑰的核心理念：哲學骨架、科學語言、占卜給方向、覺察給力量、導航給行動。",
        "worldview.html",
        "馥靈之鑰,世界觀,品牌哲學,H.O.U.R.,L.I.G.H.T."
    )),
    ("esg.html", "about", lambda: build_about_page(
        "馥靈之鑰 ESG 承諾｜永續、人本、社會影響｜Hour Light",
        "馥靈之鑰在環境、社會、治理三個面向的承諾與實踐：女性創業友善、美業人才培育、心理覺察普及。",
        "esg.html"
    )),
    ("hour-training.html", "course", lambda: build_course(
        "H.O.U.R. 覺察師速成變現系統｜24 堂課完整培訓",
        "4 週 24 堂課 + 4 份附加資源：H 身心校準 → O 智慧辨識 → U 潛能解鎖 → R 行動進化。學完第一天就能接案收錢的覺察師培訓系統。",
        "hour-training.html"
    )),
    ("destiny-hub.html", "collection", lambda: build_collection_page(
        "命盤引擎中心｜33 套命理系統一站整合｜馥靈之鑰",
        "八字、紫微斗數、西洋占星、人類圖、瑪雅曆、生命靈數、馥靈秘碼等 33 套命理系統一站整合。",
        "destiny-hub.html"
    )),
    ("draw-hub.html", "collection", lambda: build_collection_page(
        "抽牌占卜中心｜130 張原創牌卡 × 9 種牌陣｜馥靈之鑰",
        "馥靈之鑰 130 張原創智慧牌卡、9 種牌陣、免費抽牌與 AI 即時解讀、覺察師預約。",
        "draw-hub.html"
    ))
]

def inject_schema(path, schema_obj):
    try:
        with open(path, 'r', encoding='utf-8', newline='') as f:
            content = f.read()
    except Exception as e:
        return ('ERROR', str(e))

    # 已經有對應 schema？跳過
    target_type = schema_obj.get('@type')
    if f'"@type":"{target_type}"' in content or f'"@type": "{target_type}"' in content:
        return ('ALREADY_HAS', None)

    # 格式化 JSON-LD
    json_str = json.dumps(schema_obj, ensure_ascii=False, indent=2)
    script_block = f'<script type="application/ld+json">\n{json_str}\n</script>'

    # 在 </head> 前插入
    if '</head>' not in content:
        return ('NO_HEAD', None)

    use_crlf = '\r\n' in content
    insert = f'{script_block}\n</head>'
    if use_crlf:
        insert = insert.replace('\n', '\r\n')

    new_content = content.replace('</head>', insert, 1)

    try:
        with open(path, 'w', encoding='utf-8', newline='') as f:
            f.write(new_content)
    except Exception as e:
        return ('ERROR', str(e))
    return ('INJECTED', target_type)


def main():
    stats = {'INJECTED': 0, 'ALREADY_HAS': 0, 'NO_HEAD': 0, 'NOT_FOUND': 0, 'ERROR': 0}
    for fname, kind, builder in TARGETS:
        # 繁體
        path = os.path.join(REPO_ROOT, fname)
        if os.path.exists(path):
            status, info = inject_schema(path, builder())
            stats[status] = stats.get(status, 0) + 1
            marker = {'INJECTED': '[+]', 'ALREADY_HAS': '[~]', 'NO_HEAD': '[!]', 'NOT_FOUND': '[?]', 'ERROR': '[x]'}[status]
            print(f'{marker} {fname} ({kind})' + (f' -> {info}' if info else ''))
        else:
            stats['NOT_FOUND'] += 1
            print(f'[?] {fname} NOT FOUND')

        # 簡體
        sc_path = os.path.join(REPO_ROOT, 'sc', fname)
        if os.path.exists(sc_path):
            status, info = inject_schema(sc_path, builder())
            stats[status] = stats.get(status, 0) + 1
            marker = {'INJECTED': '[+]', 'ALREADY_HAS': '[~]', 'NO_HEAD': '[!]', 'NOT_FOUND': '[?]', 'ERROR': '[x]'}[status]
            print(f'{marker} sc/{fname}')

    print()
    print('=' * 60)
    for k, v in stats.items():
        print(f'  {k}: {v}')


if __name__ == '__main__':
    main()
