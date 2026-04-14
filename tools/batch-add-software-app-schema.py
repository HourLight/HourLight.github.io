"""
批次補 SoftwareApplication Schema 到核心工具頁
- 目標：~20 個工具頁 × 繁簡雙版
- AI 搜尋工具時（「免費塔羅抽牌」「線上八字計算」）被引用的關鍵
- 插入位置：</head> 前

2026/04/14 馥寶產出 - task 9 SEO 深化
"""
import re, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://hourlightkey.com"

# 工具頁清單：(檔名, 應用名稱, 類別, 描述)
TOOLS = [
    # 命理計算器
    ("destiny-engine.html", "33 合 1 命盤引擎", "UtilitiesApplication",
     "全球首創，輸入生日即可一次計算 33 套命理系統，包含八字、紫微斗數、西洋占星、人類圖、生命靈數、馥靈秘碼等。"),
    ("destiny-match.html", "33 套合盤分析", "UtilitiesApplication",
     "兩人關係的 33 維度交叉比對，整合八字合婚、紫微合盤、占星合盤、人類圖關係等系統。"),
    ("fuling-mima.html", "馥靈秘碼計算器", "UtilitiesApplication",
     "全球獨創，以農曆生日為基礎的生命靈數系統，揭示內在設定。"),
    ("bazi-calculator.html", "免費八字排盤", "UtilitiesApplication",
     "免費線上八字排盤工具，含十神、大運、流年分析。"),
    ("ziwei-calculator.html", "免費紫微斗數排盤", "UtilitiesApplication",
     "免費線上紫微斗數命盤計算，12 宮位完整星曜配置。"),
    ("astro-calculator.html", "免費西洋占星命盤", "UtilitiesApplication",
     "免費線上占星命盤計算，10 星座 12 宮位相位分析。"),
    ("hd-calculator.html", "免費人類圖計算", "UtilitiesApplication",
     "免費線上人類圖計算，九大能量中心、通道、閘門完整分析。"),
    ("lifepath-calculator.html", "免費生命靈數計算", "UtilitiesApplication",
     "免費生命靈數計算器，含主命數、命運數、靈魂數完整分析。"),
    ("numerology-calculator.html", "免費數字命理計算", "UtilitiesApplication",
     "免費數字命理工具，含畢達哥拉斯數字系統完整分析。"),
    ("maya-calculator.html", "免費瑪雅曆計算", "UtilitiesApplication",
     "免費瑪雅曆生日計算，含 20 圖騰 13 調性完整解析。"),
    ("qizheng-calculator.html", "免費七政四餘排盤", "UtilitiesApplication",
     "免費七政四餘排盤工具，含中式占星傳統星曜配置。"),
    ("triangle-calculator.html", "免費馥靈三角秘碼", "UtilitiesApplication",
     "以身分證計算的三角生命密碼，揭示外在使命。"),
    ("rainbow-calculator.html", "免費彩虹數字計算", "UtilitiesApplication",
     "免費彩虹數字靈數計算器，1-9 數字能量色彩分析。"),
    # 抽牌占卜
    ("draw-hl.html", "馥靈智慧牌卡 130 張", "LifestyleApplication",
     "130 張原創智慧牌卡抽牌系統，9 種牌陣 × 45 種解讀方式，每張牌含完整 DNA（命理/精油/經絡/情緒）。"),
    ("draw-hub.html", "馥靈抽牌中心", "LifestyleApplication",
     "馥靈之鑰所有抽牌工具入口，含 130 張牌卡、塔羅、天使卡、易經、骨牌、夢境、鏡像等。"),
    ("tarot-draw.html", "免費塔羅牌抽牌", "LifestyleApplication",
     "免費塔羅牌抽牌工具，支援 1/3/7/10 張多種牌陣。"),
    ("yijing-oracle.html", "免費易經卜卦", "LifestyleApplication",
     "免費易經六爻卜卦工具，64 卦完整卦辭解讀。"),
    ("angel-oracle.html", "免費天使卡抽牌", "LifestyleApplication",
     "免費天使卡抽牌工具，含 78 張天使訊息完整解讀。"),
    # 心理測驗
    ("quiz-hub.html", "馥靈心理測驗 101+ 項", "LifestyleApplication",
     "101+ 項心理覺察測驗總覽，含 MBTI、九型人格、依附型態、愛之語、Big Five 等，與馥靈獨家深潛覺察測驗。"),
    ("quiz-mbti.html", "免費 MBTI 人格測驗", "LifestyleApplication",
     "免費 MBTI 16 型人格測驗，含 64 型變體擴展（A/C × O/H 組合）。"),
]

# 簡體版對應（名稱與描述簡化，部分檔名不同）
TOOLS_CN = [
    ("destiny-engine.html", "33 合 1 命盘引擎", "UtilitiesApplication",
     "全球首创，输入生日即可一次计算 33 套命理系统，包含八字、紫微斗数、西洋占星、人类图、生命灵数、馥灵秘码等。"),
    ("destiny-match.html", "33 套合盘分析", "UtilitiesApplication",
     "两人关系的 33 维度交叉比对，整合八字合婚、紫微合盘、占星合盘、人类图关系等系统。"),
    ("fuling-mima.html", "馥灵秘码计算器", "UtilitiesApplication",
     "全球独创，以农历生日为基础的生命灵数系统，揭示内在设定。"),
    ("bazi-calculator.html", "免费八字排盘", "UtilitiesApplication",
     "免费线上八字排盘工具，含十神、大运、流年分析。"),
    ("hd-calculator.html", "免费人类图计算", "UtilitiesApplication",
     "免费线上人类图计算，九大能量中心、通道、闸门完整分析。"),
    ("lifepath-calculator.html", "免费生命灵数计算", "UtilitiesApplication",
     "免费生命灵数计算器，含主命数、命运数、灵魂数完整分析。"),
    ("draw-hl.html", "馥灵智慧牌卡 130 张", "LifestyleApplication",
     "130 张原创智慧牌卡抽牌系统，9 种牌阵 × 45 种解读方式。"),
    ("quiz-hub.html", "馥灵心理测验 101+ 项", "LifestyleApplication",
     "101+ 项心理觉察测验总览，含 MBTI、九型人格、依附型态、爱之语、Big Five 等。"),
    ("quiz-mbti.html", "免费 MBTI 人格测验", "LifestyleApplication",
     "免费 MBTI 16 型人格测验，含 64 型变体扩展。"),
]

HEAD_CLOSE_RE = re.compile(r"</head>", re.IGNORECASE)
HAS_SOFTWARE_APP_RE = re.compile(r'"@type"\s*:\s*"SoftwareApplication"')

def make_schema(url: str, name: str, category: str, description: str, lang: str) -> str:
    data = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": name,
        "url": url,
        "applicationCategory": category,
        "applicationSubCategory": "Self-Awareness Platform" if lang == "tw" else "自我认知平台",
        "operatingSystem": "Web Browser (Chrome, Safari, Firefox, Edge)",
        "browserRequirements": "Requires JavaScript. HTML5. Modern browser.",
        "description": description,
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "TWD",
            "availability": "https://schema.org/InStock"
        },
        "inLanguage": "zh-TW" if lang == "tw" else "zh-CN",
        "publisher": {"@id": SITE + "/#organization"},
        "isAccessibleForFree": True,
        "featureList": [
            "免費使用" if lang == "tw" else "免费使用",
            "無需下載" if lang == "tw" else "无需下载",
            "跨平台（Web）",
            "中文介面" if lang == "tw" else "中文界面",
        ],
    }
    return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + '</script>'

def process(file_path: Path, name: str, category: str, description: str, lang: str):
    if not file_path.exists():
        return "missing"
    content = file_path.read_text(encoding="utf-8")
    if HAS_SOFTWARE_APP_RE.search(content):
        return "skip"
    head_close = HEAD_CLOSE_RE.search(content)
    if not head_close:
        return "error"
    rel = file_path.relative_to(ROOT).as_posix()
    url = SITE + "/" + rel
    schema = make_schema(url, name, category, description, lang)
    new_content = content[:head_close.start()] + schema + "\n" + content[head_close.start():]
    file_path.write_text(new_content, encoding="utf-8")
    return "added"

def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    stats = {"added": 0, "skip": 0, "error": 0, "missing": 0}
    # 繁體
    print("=== 繁體版 ===")
    for fname, name, category, desc in TOOLS:
        fp = ROOT / fname
        status = process(fp, name, category, desc, "tw")
        stats[status] += 1
        print(f"  {fname}: {status}")
    # 簡體
    print("=== 簡體版 ===")
    for fname, name, category, desc in TOOLS_CN:
        fp = ROOT / "sc" / fname
        status = process(fp, name, category, desc, "cn")
        stats[status] += 1
        print(f"  sc/{fname}: {status}")

    print(f"\n總計：added={stats['added']} skip={stats['skip']} error={stats['error']} missing={stats['missing']}")

if __name__ == "__main__":
    main()
