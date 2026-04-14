"""
修正 sameAs 誤分配：
- Organization schema 的 sameAs 應含 Q139305704（品牌 Wikidata），不該含 Q139305617（個人 Wikidata）
- Person schema 的 sameAs 應含 Q139305617，不該含 Q139305704
- 偵測方式：找到包住 sameAs 的 <script type="application/ld+json"> 區塊，取區塊內「最外層」@type

做三件事：
1. 移除誤分配的 URL
2. 補上正確的 URL
3. 去重保序

2026/04/14 馥寶產出 - task 8 修正版
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# 個人 URLs（只能放 Person schema）
PERSON_ONLY = {
    "https://www.wikidata.org/wiki/Q139305617",
    "https://scholar.google.com/citations?user=QESa4SsAAAAJ",
    "https://www.linkedin.com/in/%E9%80%B8%E5%90%9B-%E7%8E%8B-a45504358",
}
# 品牌 URLs（只能放 Organization schema）
ORG_ONLY = {
    "https://www.wikidata.org/wiki/Q139305704",
}
# 共用（兩邊都可）
SHARED = {
    "https://www.threads.net/@judyanee",
}

# 正確的 Person 應該要有的 URLs（全部 Person 統一模板）
PERSON_REQUIRED = [
    "https://www.wikidata.org/wiki/Q139305617",
    "https://scholar.google.com/citations?user=QESa4SsAAAAJ",
    "https://www.linkedin.com/in/%E9%80%B8%E5%90%9B-%E7%8E%8B-a45504358",
    "https://www.threads.net/@judyanee",
]
ORG_REQUIRED = [
    "https://www.wikidata.org/wiki/Q139305704",
    "https://www.threads.net/@judyanee",
]

SCRIPT_LD_RE = re.compile(
    r'<script\s+type="application/ld\+json"[^>]*>(.*?)</script>',
    re.DOTALL | re.IGNORECASE
)

SAMEAS_RE = re.compile(r'"sameAs"\s*:\s*\[([^\]]*)\]')

def detect_outer_type(json_text: str) -> str | None:
    """在 JSON-LD 文字中找最外層（第一個）@type"""
    # 第一個 @type 通常是最外層
    m = re.search(r'"@type"\s*:\s*"([^"]+)"', json_text)
    if m:
        return m.group(1)
    return None

def fix_sameAs_in_block(block_content: str, outer_type: str) -> tuple[str, int]:
    """在單一 JSON-LD 區塊內修正 sameAs"""
    changes = 0

    def replace_one(m):
        nonlocal changes
        inner = m.group(1)
        existing = re.findall(r'"(https?://[^"]+)"', inner)

        if outer_type == "Organization":
            # 移除 Person-only URLs
            filtered = [u for u in existing if u not in PERSON_ONLY]
            required = ORG_REQUIRED
        elif outer_type == "Person":
            # 移除 Org-only URLs
            filtered = [u for u in existing if u not in ORG_ONLY]
            required = PERSON_REQUIRED
        else:
            # 不明類型：不動
            return m.group(0)

        # 去重保序
        seen = set()
        result = []
        for u in filtered:
            if u not in seen:
                result.append(u)
                seen.add(u)
        # 補必要 URLs
        for u in required:
            if u not in seen:
                result.append(u)
                seen.add(u)

        if result == existing:
            return m.group(0)

        changes += 1
        new_inner = ",".join(f'"{u}"' for u in result)
        return f'"sameAs":[{new_inner}]'

    new_block = SAMEAS_RE.sub(replace_one, block_content)
    return new_block, changes

def process(file_path: Path) -> tuple[str, int]:
    try:
        content = file_path.read_text(encoding="utf-8")
    except:
        return "error", 0
    if '"sameAs"' not in content:
        return "no_sameAs", 0

    total_changes = 0
    new_content = content

    # 收集所有 JSON-LD 區塊位置
    blocks = []
    for m in SCRIPT_LD_RE.finditer(content):
        blocks.append((m.start(1), m.end(1), m.group(1)))

    # 從後往前替換
    for start, end, block_text in reversed(blocks):
        if '"sameAs"' not in block_text:
            continue
        outer_type = detect_outer_type(block_text)
        if not outer_type:
            continue
        new_block, block_changes = fix_sameAs_in_block(block_text, outer_type)
        if block_changes:
            new_content = new_content[:start] + new_block + new_content[end:]
            total_changes += block_changes

    if total_changes == 0:
        return "no_change", 0
    file_path.write_text(new_content, encoding="utf-8")
    return "fixed", total_changes

def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")

    targets = []
    for pattern in ["*.html", "blog/*.html", "sc/*.html", "sc/blog/*.html"]:
        targets.extend(ROOT.glob(pattern))

    stats = {"fixed": 0, "no_change": 0, "no_sameAs": 0, "error": 0}
    total = 0
    for fp in sorted(targets):
        status, changes = process(fp)
        stats[status] += 1
        total += changes

    print(f"總掃描：{len(targets)} 檔")
    print(f"已修正：{stats['fixed']} 檔（{total} 個 sameAs 修正）")
    print(f"無需變動：{stats['no_change']} 檔")
    print(f"無 sameAs：{stats['no_sameAs']} 檔")
    print(f"錯誤：{stats['error']} 檔")

if __name__ == "__main__":
    main()
