"""
Generate deepened master system document for external AI tools.

Merges:
- 資源/馥靈之鑰/2026新紀元/02_牌卡系統/04-11深化資料/馥靈之鑰主系統完整版_v91.md
  (source v91 MD with rich text for 130 cards)
- js/cardData-protected.js (Base64-encoded 33-dimensional DNA for 130 cards)

Output:
- 資源/馥靈之鑰/2026新紀元/02_牌卡系統/04-11深化資料/馥靈之鑰_深化版主系統_v92.md
  (single file, ~1.2-1.5 MB, ready to paste into Claude Projects / Gemini Gems / Perplexity Spaces)

This file is business confidential, stored in gitignored 資源/ folder.
"""
import re
import os
import sys
import io
import base64
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SRC_MD = '資源/馥靈之鑰/2026新紀元/02_牌卡系統/04-11深化資料/馥靈之鑰主系統完整版_v91.md'
DNA_JS = 'js/cardData-protected.js'
OUTPUT = '資源/馥靈之鑰/2026新紀元/02_牌卡系統/04-11深化資料/馥靈之鑰_深化版主系統_v92.md'


def load_dna():
    with open(DNA_JS, 'r', encoding='utf-8') as f:
        js = f.read()
    m = re.search(r'const _d = \[(.*?)\];', js, re.DOTALL)
    if not m:
        raise RuntimeError('Cannot locate _d array in cardData-protected.js')
    chunks = re.findall(r"'([^']+)'", m.group(1))
    b64 = ''.join(chunks)
    decoded = base64.b64decode(b64).decode('utf-8')
    return json.loads(decoded)


def read_md():
    with open(SRC_MD, 'r', encoding='utf-8') as f:
        return f.read()


def split_cards(md_text):
    """Split the MD into head (everything before A00) + 130 card sections."""
    # find all anchors
    pattern = r'<a id="(A\d+|\d{3}|B\d+)"></a>'
    matches = list(re.finditer(pattern, md_text))
    if not matches:
        raise RuntimeError('No card anchors found in source MD')

    head = md_text[:matches[0].start()]
    cards = []
    for i, m in enumerate(matches):
        cid = m.group(1)
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(md_text)
        body = md_text[start:end]
        cards.append((cid, body))
    return head, cards


def format_dna_block(cid, dna_entry):
    """Produce a fenced '33 維度速查' block for a single card."""
    if not dna_entry:
        return f'*（無 DNA 資料 — 牌卡 ID：{cid}）*\n'

    keys_order = [
        ('title', '牌名'),
        ('titleFull', '完整牌名'),
        ('coreQuote', '核心頻率語'),
        ('keywords', '關鍵字'),
        ('覺察', '覺察提醒'),
        ('行動指引', '行動指引'),
        ('energy', '能量屬性'),
        ('element', '五行'),
        ('tarot', '塔羅對應'),
        ('minorArcana', '小秘儀'),
        ('iching', '易經'),
        ('hexagramNum', '卦號'),
        ('numerology', '生命靈數'),
        ('astroChakraElement', '星象 × 脈輪 × 元素'),
        ('ziwei', '紫微主星'),
        ('oils', '對應精油'),
        ('roleVoice', '精油角色語'),
        ('qimen', '奇門遁甲'),
        ('crystal', '對應水晶'),
        ('frequency', '頻率調頻'),
        ('archetype', '原型/人格'),
        ('shadow', '陰影面'),
        ('remedy', '修復方向'),
        ('modules', '應用模組'),
        ('poker', '撲克牌命理'),
        ('celticTree', '凱爾特樹曆'),
        ('mayan', '瑪雅曆'),
        ('vedic', '吠陀占星'),
        ('kabbalah', '卡巴拉生命樹'),
        ('chakra', '脈輪對應'),
        ('meridian', '經絡與時辰'),
        ('fiveElementRelation', '五行生剋牌組'),
        ('cognitiveAroma', '認知芳療引導'),
    ]

    lines = ['```', f'牌卡 ID：{cid}']
    for key, label in keys_order:
        val = dna_entry.get(key)
        if val is None or val == '':
            continue
        if isinstance(val, list):
            val = '、'.join(str(x) for x in val)
        # collapse internal newlines for the quick-reference block
        val_str = str(val).replace('\n', ' ').strip()
        lines.append(f'{label}：{val_str}')
    lines.append('```')
    return '\n'.join(lines) + '\n'


def main():
    print('loading DNA...')
    dna = load_dna()
    print(f'  decoded {len(dna)} cards with dimensions.')

    print('reading source MD...')
    md = read_md()
    head, cards = split_cards(md)
    print(f'  parsed head ({len(head):,} chars) + {len(cards)} card sections.')

    # Stats: how many cards have each dimension
    dim_counts = {}
    for k in ['poker', 'celticTree', 'mayan', 'vedic', 'kabbalah', 'chakra',
              'meridian', 'fiveElementRelation', 'cognitiveAroma']:
        dim_counts[k] = sum(1 for v in dna.values() if v.get(k))
    print('dimension coverage:')
    for k, n in dim_counts.items():
        print(f'  {k}: {n}/130')

    # Replace the head-top notice with an expanded one
    new_header = (
        '# 馥靈之鑰｜深化版主系統 v92\n\n'
        '版本：v92（深化版）｜合併日期：2026-04-12\n'
        '來源 1：v91 馥靈之鑰主系統完整版（原始文字內容）\n'
        '來源 2：js/cardData-protected.js（4/11 深化 33 維度 DNA，4290 個數據點）\n\n'
        '**商業機密文件｜不對外公開｜僅供創辦人與授權 AI 工具解牌使用**\n\n'
        '此份文件的結構：每張牌先放「33 維度速查」結構化區塊，後接 v91 主系統的完整文字敘述。\n'
        '外部 AI 工具（Claude Projects／Gemini Gems／Perplexity Spaces）讀入後，'
        '既能快速查到結構化對應資料，也能延伸閱讀角色描述、故事段、儀式引導等長文。\n\n'
        '牌卡名稱已定稿（部分已印刷），任何情況下不可竄改。\n\n'
        '~~\n\n'
    )

    # Strip the original first two lines (title + version) from head, keep rest
    # Find the first '## 目錄' or similar stopping point to preserve the TOC
    # We'll keep the entire head minus the original title block
    head_without_title = re.sub(
        r'^# 馥靈之鑰｜主系統完整版.*?牌卡名稱已定稿（部分已印刷），任何情況下不可竄改。\s*',
        '', head, count=1, flags=re.DOTALL)

    # Build output
    out = [new_header, head_without_title]

    for cid, body in cards:
        dna_block = format_dna_block(cid, dna.get(cid))
        # Insert DNA block right after the card header line
        # body starts with '<a id="X"></a>\n\n### X｜Title（...）\n\n...'
        lines = body.split('\n', 4)
        # find the index of the line that starts with '### '
        header_end_idx = None
        for idx, ln in enumerate(body.split('\n')):
            if ln.startswith('### '):
                header_end_idx = idx
                break
        if header_end_idx is None:
            out.append(body)
            out.append('\n')
            out.append(dna_block)
            out.append('\n')
            continue

        lines = body.split('\n')
        before = '\n'.join(lines[:header_end_idx + 1])
        after = '\n'.join(lines[header_end_idx + 1:])
        out.append(before + '\n\n')
        out.append('**33 維度速查**\n\n')
        out.append(dna_block + '\n')
        out.append('**v91 原系統敘述**\n\n')
        out.append(after.lstrip('\n') + '\n\n')

    content = ''.join(out)

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'\nwrote {OUTPUT}')
    print(f'size: {len(content.encode("utf-8")):,} bytes ({len(content):,} chars)')


if __name__ == '__main__':
    main()
