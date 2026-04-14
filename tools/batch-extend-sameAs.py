"""
批次擴充所有 Organization/Person Schema 的 sameAs[]
- 掃全站 html（含 sc/, blog/, sc/blog/）
- 對每個 JSON-LD 的 sameAs array 做擴充（不重複）
- Organization 加: WikiData 品牌 Q、Threads
- Person (王逸君) 加: WikiData 個人 Q、LinkedIn、Threads

2026/04/14 馥寶產出 - task 8 SEO 深化
"""
import re, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 要擴充的 URL
ORG_NEW_URLS = [
    "https://www.wikidata.org/wiki/Q139305704",  # 馥靈之鑰國際有限公司
    "https://www.threads.net/@judyanee",
]

PERSON_NEW_URLS = [
    "https://www.wikidata.org/wiki/Q139305617",  # 王逸君
    "https://scholar.google.com/citations?user=QESa4SsAAAAJ",  # Google Scholar
    "https://www.linkedin.com/in/%E9%80%B8%E5%90%9B-%E7%8E%8B-a45504358",
    "https://www.threads.net/@judyanee",
]

# 匹配單行 JSON-LD 裡的 sameAs array
# 容許陣列內有 http/https URL，字串用雙引號
SAMEAS_RE = re.compile(r'"sameAs"\s*:\s*\[([^\]]*)\]')

def extend_sameAs(content: str) -> tuple[str, int]:
    """擴充所有 sameAs。根據上下文判斷是 Organization 還是 Person。
    回傳 (新內容, 改動次數)"""
    changes = 0
    result = content

    # 因為有多個 sameAs 可能出現在同一檔，需要逐一處理
    # 先找所有 sameAs 位置
    positions = []
    for m in SAMEAS_RE.finditer(content):
        positions.append((m.start(), m.end(), m.group(1)))

    if not positions:
        return content, 0

    # 從後往前替換以免位置偏移
    for start, end, inner in reversed(positions):
        # 擷取現有 URLs
        existing = re.findall(r'"(https?://[^"]+)"', inner)
        existing_set = set(existing)

        # 判斷是 Organization 還是 Person schema 的 sameAs
        # 看前 500 chars 是否包含 "Person" @type 比 "Organization" 更近
        ctx = result[max(0, start - 500):start]
        # 最後一個 @type 為準
        type_matches = list(re.finditer(r'"@type"\s*:\s*"(Person|Organization)"', ctx))
        if type_matches:
            schema_type = type_matches[-1].group(1)
        else:
            schema_type = "Organization"  # 預設

        new_urls_source = PERSON_NEW_URLS if schema_type == "Person" else ORG_NEW_URLS

        # 合併（保序 + 去重）
        added = [u for u in new_urls_source if u not in existing_set]
        if not added:
            continue

        all_urls = existing + added
        new_inner = ",".join(f'"{u}"' for u in all_urls)
        new_sameAs = f'"sameAs":[{new_inner}]'
        result = result[:start] + new_sameAs + result[end:]
        changes += 1

    return result, changes

def process(file_path: Path) -> tuple[str, int]:
    try:
        content = file_path.read_text(encoding="utf-8")
    except:
        return "error", 0
    if '"sameAs"' not in content:
        return "no_sameAs", 0
    new_content, changes = extend_sameAs(content)
    if changes == 0:
        return "no_change", 0
    file_path.write_text(new_content, encoding="utf-8")
    return "updated", changes

def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    targets = []
    for pattern in ["*.html", "blog/*.html", "sc/*.html", "sc/blog/*.html"]:
        targets.extend(ROOT.glob(pattern))

    stats = {"updated": 0, "no_change": 0, "no_sameAs": 0, "error": 0}
    total_changes = 0
    for fp in sorted(targets):
        status, changes = process(fp)
        stats[status] += 1
        total_changes += changes

    print(f"總掃描：{len(targets)} 檔")
    print(f"已更新：{stats['updated']} 檔（共 {total_changes} 個 sameAs array 擴充）")
    print(f"無需變動：{stats['no_change']} 檔（已含新 URL）")
    print(f"無 sameAs：{stats['no_sameAs']} 檔")
    print(f"錯誤：{stats['error']} 檔")

if __name__ == "__main__":
    main()
