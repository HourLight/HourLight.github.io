#!/usr/bin/env python3
"""
Quiz schema + HowTo schema 批次補齊
------------------------------------
逸君 4/14 SEO 行動清單 #4：Quiz/HowTo Schema 批次補齊

範圍：
- 繁簡共 204 支 quiz-*.html 中 170 支缺 Quiz schema
- 5 支 magic-*.html 缺 HowTo schema
- 2 支 akashic-records + yuan-chen-guide 的冥想引導段落 HowTo schema

作者：馥寶 (Opus 4.6)
日期：2026/04/14
"""
import os
import re
import json
import glob

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PUBLISHER = {
    "@type": "Organization",
    "name": "馥靈之鑰 Hour Light",
    "url": "https://hourlightkey.com",
    "logo": {"@type": "ImageObject", "url": "https://hourlightkey.com/LOGO-1.png"}
}
AUTHOR = {
    "@type": "Person",
    "name": "王逸君",
    "jobTitle": "馥靈之鑰創辦人"
}

def extract_meta(path):
    """從 HTML 抓 title + meta description + canonical"""
    with open(path, 'r', encoding='utf-8', newline='') as f:
        c = f.read()
    title_m = re.search(r'<title>([^<]+)</title>', c)
    desc_m = re.search(r'<meta name="description" content="([^"]+)"', c)
    canon_m = re.search(r'<link rel="canonical" href="([^"]+)"', c)
    title = title_m.group(1).strip() if title_m else os.path.basename(path)
    desc = desc_m.group(1).strip() if desc_m else ''
    canon = canon_m.group(1).strip() if canon_m else f'https://hourlightkey.com/{os.path.basename(path)}'
    return c, title, desc, canon

def inject_after_head_open(content, script_block):
    """在 </head> 之前插入 script block"""
    if '</head>' not in content:
        return None
    use_crlf = '\r\n' in content
    insert = f'{script_block}\n</head>'
    if use_crlf:
        insert = insert.replace('\n', '\r\n')
    return content.replace('</head>', insert, 1)


def inject_quiz_schema(path):
    """繁體/簡體 quiz-*.html 統一處理"""
    try:
        c, title, desc, canon = extract_meta(path)
    except Exception as e:
        return ('ERROR', str(e))

    if '"@type":"Quiz"' in c or '"@type": "Quiz"' in c:
        return ('ALREADY_HAS', None)

    # 判斷 language
    is_sc = '/sc/' in path.replace('\\', '/') or path.startswith('sc\\') or '\\sc\\' in path
    language = 'zh-CN' if is_sc else 'zh-TW'

    # 推斷題數（從 description 的數字）
    num_q = None
    m = re.search(r'(\d{1,3})\s*題', desc)
    if m:
        num_q = int(m.group(1))

    schema = {
        "@context": "https://schema.org",
        "@type": "Quiz",
        "name": title.split('｜')[0].strip(),
        "description": desc,
        "url": canon,
        "inLanguage": language,
        "about": {"@type": "Thing", "name": "自我覺察"},
        "educationalLevel": "beginner",
        "author": AUTHOR,
        "publisher": PUBLISHER,
        "isAccessibleForFree": True
    }
    if num_q:
        schema["numberOfQuestions"] = num_q

    json_str = json.dumps(schema, ensure_ascii=False, indent=2)
    block = f'<script type="application/ld+json">\n{json_str}\n</script>'
    new_c = inject_after_head_open(c, block)
    if new_c is None:
        return ('NO_HEAD', None)

    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(new_c)
    return ('INJECTED', num_q)


def inject_howto_magic(path):
    """magic-*.html 抓取 .template .step 轉 HowToStep"""
    try:
        c, title, desc, canon = extract_meta(path)
    except Exception as e:
        return ('ERROR', str(e))

    if '"@type":"HowTo"' in c or '"@type": "HowTo"' in c:
        return ('ALREADY_HAS', None)

    # 抓 .template 內的 .step 區塊（h4 + p）
    steps = []
    step_matches = re.finditer(
        r'<div class="step">\s*<h4>([^<]+)</h4>\s*<p>([^<]+)</p>\s*</div>',
        c, re.DOTALL
    )
    for i, m in enumerate(step_matches, 1):
        name = m.group(1).strip()
        text = m.group(2).strip()
        # 移除多餘空白
        text = re.sub(r'\s+', ' ', text)
        steps.append({
            "@type": "HowToStep",
            "position": i,
            "name": name,
            "text": text
        })

    if not steps:
        return ('NO_STEPS', None)

    is_sc = '/sc/' in path.replace('\\', '/') or path.startswith('sc\\') or '\\sc\\' in path
    language = 'zh-CN' if is_sc else 'zh-TW'

    schema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": title.split('｜')[0].strip().replace(' — HOUR LIGHT', '').strip(),
        "description": desc,
        "url": canon,
        "inLanguage": language,
        "totalTime": "PT5M",
        "step": steps,
        "author": AUTHOR,
        "publisher": PUBLISHER
    }

    json_str = json.dumps(schema, ensure_ascii=False, indent=2)
    block = f'<script type="application/ld+json">\n{json_str}\n</script>'
    new_c = inject_after_head_open(c, block)
    if new_c is None:
        return ('NO_HEAD', None)

    with open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(new_c)
    return ('INJECTED', len(steps))


def main():
    # Part 1: Quiz schema
    print("=== Part 1: Quiz schema injection ===")
    quiz_files = sorted(glob.glob(os.path.join(REPO_ROOT, 'quiz-*.html')) + glob.glob(os.path.join(REPO_ROOT, 'sc', 'quiz-*.html')))
    quiz_stats = {'INJECTED': 0, 'ALREADY_HAS': 0, 'NO_HEAD': 0, 'ERROR': 0}
    for p in quiz_files:
        status, info = inject_quiz_schema(p)
        quiz_stats[status] = quiz_stats.get(status, 0) + 1
        if status == 'INJECTED':
            pass  # silent
        elif status != 'ALREADY_HAS':
            print(f'  [{status}] {os.path.relpath(p, REPO_ROOT)}')
    print(f'  Quiz total: INJECTED={quiz_stats["INJECTED"]} SKIP={quiz_stats["ALREADY_HAS"]} ERR={quiz_stats["NO_HEAD"]+quiz_stats["ERROR"]}')

    # Part 2: HowTo for magic-*
    print("\n=== Part 2: HowTo schema injection (magic-*.html) ===")
    magic_files = sorted(
        glob.glob(os.path.join(REPO_ROOT, 'magic-*.html')) +
        glob.glob(os.path.join(REPO_ROOT, 'sc', 'magic-*.html'))
    )
    magic_stats = {'INJECTED': 0, 'ALREADY_HAS': 0, 'NO_STEPS': 0, 'NO_HEAD': 0, 'ERROR': 0}
    for p in magic_files:
        # magic-lab.html 是 hub 不是 experiment 本身，跳過
        if os.path.basename(p) == 'magic-lab.html':
            continue
        status, info = inject_howto_magic(p)
        magic_stats[status] = magic_stats.get(status, 0) + 1
        marker = {'INJECTED': '[+]', 'ALREADY_HAS': '[~]', 'NO_STEPS': '[-]',
                  'NO_HEAD': '[!]', 'ERROR': '[x]'}[status]
        print(f'  {marker} {os.path.relpath(p, REPO_ROOT)}' + (f' ({info} steps)' if info else ''))

    print()
    print('=' * 60)
    print(f'Quiz:  INJECTED {quiz_stats["INJECTED"]}, already {quiz_stats["ALREADY_HAS"]}')
    print(f'HowTo: INJECTED {magic_stats["INJECTED"]}, already {magic_stats["ALREADY_HAS"]}, no-steps {magic_stats["NO_STEPS"]}')


if __name__ == '__main__':
    main()
