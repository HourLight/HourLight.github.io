#!/usr/bin/env python3
"""
馥靈之鑰 Course Slides Generator v1.0
Converts course .md files to branded HTML presentation slides.
"""

import os
import re
import html

BASE = os.path.dirname(os.path.abspath(__file__))
COURSE_DIR = os.path.join(BASE, '課程內容')
OUTPUT_DIR = os.path.join(BASE, 'course-slides')

STAGES = {
    'H階段-身心校準-第一週': ('H', '身心校準'),
    'O階段-智慧辨識-第二週': ('O', '智慧辨識'),
    'U階段-潛能解鎖-第三週': ('U', '潛能解鎖'),
    'R階段-行動進化-第四週': ('R', '行動進化'),
}

STAGE_COLORS = {
    'H': 'rgba(80,60,140,.25)',
    'O': 'rgba(60,100,140,.25)',
    'U': 'rgba(60,140,80,.25)',
    'R': 'rgba(140,80,60,.25)',
}

def escape(text):
    return html.escape(text)

def parse_md(filepath):
    """Parse markdown into sections for slides."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    slides = []

    # Extract title (first # heading)
    title_match = re.match(r'^#\s+(.+)', content, re.MULTILINE)
    title = title_match.group(1) if title_match else os.path.basename(filepath)

    # Split by ## headings
    sections = re.split(r'^## ', content, flags=re.MULTILINE)

    # First section is intro (before first ##)
    # Skip it for slides, title slide handles the intro

    for section in sections[1:]:
        lines = section.strip().split('\n')
        if not lines:
            continue
        heading = lines[0].strip()
        body_lines = lines[1:]

        # Split by ### sub-headings within this section
        subsections = []
        current_sub = {'heading': '', 'content': []}

        for line in body_lines:
            if line.startswith('### '):
                if current_sub['heading'] or current_sub['content']:
                    subsections.append(current_sub)
                current_sub = {'heading': line[4:].strip(), 'content': []}
            else:
                current_sub['content'].append(line)
        if current_sub['heading'] or current_sub['content']:
            subsections.append(current_sub)

        # If section has subsections, create a slide per subsection
        if len(subsections) > 1:
            # Section divider slide
            slides.append({
                'type': 'divider',
                'heading': heading,
                'subtitle': ''
            })
            for sub in subsections:
                if not sub['heading'] and not any(l.strip() for l in sub['content']):
                    continue
                content_html = format_content(sub['content'])
                if content_html.strip():
                    slides.append({
                        'type': 'content',
                        'heading': sub['heading'] or heading,
                        'content': content_html
                    })
        else:
            # Single content slide
            all_content = []
            for sub in subsections:
                if sub['heading']:
                    all_content.append(f'<h3>{escape(sub["heading"])}</h3>')
                all_content.extend(sub['content'])
            content_html = format_content(all_content) if not any(isinstance(l, str) and l.startswith('<h3>') for l in all_content) else '\n'.join(
                l if l.startswith('<h3>') else format_line(l) for l in all_content
            )
            if content_html.strip():
                slides.append({
                    'type': 'content',
                    'heading': heading,
                    'content': content_html
                })

    return title, slides

def format_content(lines):
    """Convert markdown lines to HTML."""
    result = []
    in_list = False
    in_table = False
    in_code = False
    table_rows = []

    for line in lines:
        if isinstance(line, str) and line.startswith('<h3>'):
            if in_list:
                result.append('</ul>')
                in_list = False
            result.append(line)
            continue

        line = str(line)
        stripped = line.strip()

        # Code blocks
        if stripped.startswith('```'):
            if in_code:
                result.append('</div>')
                in_code = False
            else:
                if in_list:
                    result.append('</ul>')
                    in_list = False
                result.append('<div class="card">')
                in_code = True
            continue

        if in_code:
            result.append(escape(line) + '<br>')
            continue

        # Empty line
        if not stripped:
            if in_list:
                result.append('</ul>')
                in_list = False
            continue

        # Table
        if '|' in stripped and stripped.startswith('|'):
            if not in_table:
                if in_list:
                    result.append('</ul>')
                    in_list = False
                in_table = True
                table_rows = []
            # Skip separator rows
            if re.match(r'^\|[\s\-:|]+\|$', stripped):
                continue
            cells = [c.strip() for c in stripped.split('|')[1:-1]]
            table_rows.append(cells)
            continue
        elif in_table:
            result.append(render_table(table_rows))
            in_table = False
            table_rows = []

        # List items
        if stripped.startswith('► ') or stripped.startswith('- ') or stripped.startswith('* '):
            if not in_list:
                result.append('<ul>')
                in_list = True
            text = stripped.lstrip('►-* ').strip()
            result.append(f'<li>{format_inline(text)}</li>')
            continue

        # Numbered list
        if re.match(r'^\d+[\.\)]\s', stripped):
            if not in_list:
                result.append('<ul>')
                in_list = True
            text = re.sub(r'^\d+[\.\)]\s*', '', stripped)
            result.append(f'<li>{format_inline(text)}</li>')
            continue

        # Quote (「...」 standalone)
        if stripped.startswith('「') and stripped.endswith('」'):
            if in_list:
                result.append('</ul>')
                in_list = False
            result.append(f'<div class="quote">{format_inline(stripped)}</div>')
            continue

        # Regular paragraph
        if in_list:
            result.append('</ul>')
            in_list = False
        result.append(f'<p>{format_inline(stripped)}</p>')

    if in_list:
        result.append('</ul>')
    if in_table:
        result.append(render_table(table_rows))
    if in_code:
        result.append('</div>')

    return '\n'.join(result)

def render_table(rows):
    if not rows:
        return ''
    html_parts = ['<table>']
    # First row as header
    html_parts.append('<tr>')
    for cell in rows[0]:
        html_parts.append(f'<th>{format_inline(cell)}</th>')
    html_parts.append('</tr>')
    for row in rows[1:]:
        html_parts.append('<tr>')
        for cell in row:
            html_parts.append(f'<td>{format_inline(cell)}</td>')
        html_parts.append('</tr>')
    html_parts.append('</table>')
    return '\n'.join(html_parts)

def format_inline(text):
    """Format inline markdown elements."""
    text = escape(text)
    # 「」quotes as highlights
    text = re.sub(r'「([^」]+)」', r'<span class="highlight">「\1」</span>', text)
    # →
    text = text.replace('→', '<span style="color:rgba(248,223,165,.6)"> → </span>')
    return text

def format_line(line):
    if isinstance(line, str) and line.startswith('<h3>'):
        return line
    return format_content([line])

def generate_html(title, slides, lesson_id, stage_letter, stage_name, all_lessons):
    """Generate complete HTML slide page."""

    # Build sidebar items
    sidebar_html = ''
    slide_idx = 0
    # Title slide
    sidebar_html += f'<div class="sidebar-item" data-slide="0">封面</div>\n'
    slide_idx = 1
    for s in slides:
        label = s.get('heading', '')[:20]
        sidebar_html += f'<div class="sidebar-item" data-slide="{slide_idx}">{escape(label)}</div>\n'
        slide_idx += 1

    # Build slides HTML
    slides_html = ''

    # Title slide
    color = STAGE_COLORS.get(stage_letter, 'rgba(80,60,140,.25)')
    slides_html += f'''
    <div class="slide slide-title active" style="background:radial-gradient(ellipse at 50% 40%,{color} 0%,#05030a 70%)">
      <div class="lesson-tag">{escape(stage_letter)} 階段｜{escape(stage_name)}</div>
      <h1>{escape(title)}</h1>
      <div class="subtitle">馥靈之鑰 H.O.U.R. 覺察師速成變現系統</div>
      <div class="brand">馥靈之鑰 Hour Light ✦ 讀懂自己，活對人生</div>
    </div>
'''

    for s in slides:
        if s['type'] == 'divider':
            slides_html += f'''
    <div class="slide slide-divider">
      <h2>{escape(s['heading'])}</h2>
      <div class="divider-line"></div>
      <p>{escape(s.get('subtitle', ''))}</p>
    </div>
'''
        elif s['type'] == 'content':
            slides_html += f'''
    <div class="slide slide-content">
      <h2>{escape(s['heading'])}</h2>
      {s['content']}
    </div>
'''

    # End slide
    slides_html += f'''
    <div class="slide slide-title" style="background:radial-gradient(ellipse at 50% 40%,{color} 0%,#05030a 70%)">
      <div class="lesson-tag">本堂重點回顧</div>
      <h1>{escape(title)}</h1>
      <div class="subtitle">下一堂課見 ✦</div>
      <div class="brand">馥靈之鑰 Hour Light ✦ 讀懂自己，活對人生</div>
    </div>
'''

    # Navigation between lessons
    lesson_nav = '<div style="position:fixed;top:16px;right:60px;z-index:100;display:flex;gap:8px">\n'
    for lid, lname in all_lessons:
        is_current = ' style="color:#f8dfa5;background:rgba(248,223,165,.15)"' if lid == lesson_id else ''
        lesson_nav += f'  <a href="{lid}.html" style="color:rgba(248,223,165,.5);text-decoration:none;font-size:.75rem;padding:4px 8px;border-radius:6px;border:1px solid rgba(248,223,165,.1)"{is_current}>{lid}</a>\n'
    lesson_nav += '</div>\n'

    return f'''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>{escape(title)}｜馥靈之鑰課程</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/css/hl-slides.css">
</head>
<body>

<div class="slide-progress" style="width:0%"></div>

<button class="sidebar-toggle" title="目錄">☰</button>
<button class="fullscreen-btn" title="全螢幕 (F)">⛶</button>

<div class="slide-sidebar">
  <h3>{escape(lesson_id)}｜{escape(title.split('｜')[-1] if '｜' in title else title)}</h3>
  {sidebar_html}
</div>

<div class="slides-wrap">
{slides_html}
</div>

<div class="slide-nav">
  <button class="nav-prev" title="上一頁 (←)">◀</button>
  <span class="page-info">1 / {len(slides) + 2}</span>
  <button class="nav-next" title="下一頁 (→)">▶</button>
</div>

<script src="../assets/js/hl-slides.js"></script>
</body>
</html>
'''

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Collect all lessons
    all_lessons = []
    lesson_files = []

    for stage_dir, (letter, name) in STAGES.items():
        stage_path = os.path.join(COURSE_DIR, stage_dir)
        if not os.path.isdir(stage_path):
            continue
        for fname in sorted(os.listdir(stage_path)):
            if not fname.endswith('.md'):
                continue
            lesson_id = fname.split('-')[0]  # H1, O2, etc.
            lesson_name = fname.replace('.md', '')
            all_lessons.append((lesson_id, lesson_name.split('-', 1)[1] if '-' in lesson_name else lesson_name))
            lesson_files.append((os.path.join(stage_path, fname), lesson_id, letter, name))

    print(f'Found {len(lesson_files)} lessons')

    for filepath, lesson_id, stage_letter, stage_name in lesson_files:
        try:
            title, slides = parse_md(filepath)
            html_content = generate_html(title, slides, lesson_id, stage_letter, stage_name, all_lessons)

            output_path = os.path.join(OUTPUT_DIR, f'{lesson_id}.html')
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)

            print(f'  {lesson_id}.html - {len(slides)+2} slides')
        except Exception as e:
            print(f'  ERROR {lesson_id}: {e}')

    # Generate index page
    generate_index(all_lessons)
    print(f'\nDone! {len(lesson_files)} slide files in {OUTPUT_DIR}/')

def generate_index(all_lessons):
    """Generate course slides index page."""
    cards_html = ''
    current_stage = ''

    for lesson_id, lesson_name in all_lessons:
        stage = lesson_id[0]
        if stage != current_stage:
            stage_names = {'H': 'H 身心校準｜第一週', 'O': 'O 智慧辨識｜第二週', 'U': 'U 潛能解鎖｜第三週', 'R': 'R 行動進化｜第四週'}
            if current_stage:
                cards_html += '</div>\n'
            cards_html += f'<h2 style="color:#f8dfa5;margin:32px 0 16px;font-size:1.3rem">{stage_names.get(stage, stage)}</h2>\n<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">\n'
            current_stage = stage

        cards_html += f'''<a href="{lesson_id}.html" style="display:block;text-decoration:none;background:rgba(14,10,24,.82);border:1px solid rgba(248,223,165,.2);border-radius:12px;padding:20px;transition:all .2s">
  <div style="color:rgba(248,223,165,.6);font-size:.85rem;margin-bottom:8px">{escape(lesson_id)}</div>
  <div style="color:#f8dfa5;font-size:1.1rem">{escape(lesson_name)}</div>
</a>
'''

    if current_stage:
        cards_html += '</div>\n'

    index_html = f'''<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>H.O.U.R. 覺察師課程簡報｜馥靈之鑰</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&display=swap" rel="stylesheet">
<style>
  * {{ margin:0;padding:0;box-sizing:border-box }}
  body {{ background:#05030a;color:rgba(255,255,255,.9);font-family:"Noto Serif TC",serif;padding:40px;min-height:100vh }}
  h1 {{ font-size:2rem;color:#f8dfa5;text-align:center;margin-bottom:8px;text-shadow:0 0 12px rgba(248,223,165,.3) }}
  .sub {{ text-align:center;color:rgba(255,255,255,.5);margin-bottom:40px }}
  a:hover {{ border-color:rgba(248,223,165,.5)!important;box-shadow:0 0 20px rgba(248,223,165,.1) }}
</style>
</head>
<body>
  <h1>H.O.U.R. 覺察師速成變現系統</h1>
  <p class="sub">馥靈之鑰 Hour Light ✦ 課程簡報 24 堂</p>
  {cards_html}
  <p style="text-align:center;color:rgba(248,223,165,.3);margin-top:48px;font-size:.85rem">馥靈之鑰 Hour Light ✦ 讀懂自己，活對人生</p>
</body>
</html>
'''

    with open(os.path.join(OUTPUT_DIR, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(index_html)
    print('  index.html - course overview')

if __name__ == '__main__':
    main()
