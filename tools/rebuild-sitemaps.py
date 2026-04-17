#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
馥靈之鑰｜sitemap.xml + sc/sitemap.xml 完整重建
───────────────────────────────────────────────
掃描實際存在的 .html，自動產生乾淨的 sitemap：
- 補缺漏頁面
- 移除死連結
- priority 按類別推斷
- lastmod 保留原有或用今天

用法：python tools/rebuild-sitemaps.py
"""
import os, re, sys
from pathlib import Path
from datetime import datetime

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = Path(__file__).parent.parent
TODAY = datetime.now().strftime('%Y-%m-%d')


def should_exclude(name):
    bn = name.split('/')[-1]
    if bn == '404.html': return True
    if bn.startswith('admin-'): return True
    if bn.startswith('tarot-widget'): return True
    if bn.startswith('googled') and bn.endswith('.html'): return True  # GSC verify
    if bn in ('AIpreview.html', 'Bookpreview.html', 'Fulingpreview.html'): return True
    if bn == 'index.html' and '/' not in name: return False  # root index 特殊處理
    return False


def priority_of(name):
    bn = name.split('/')[-1]
    if name == 'index.html': return '1.0'
    # 最核心
    if bn in ('castle-hub.html', 'draw-hl.html', 'pricing.html', 'services.html',
              'founder.html', 'ai-about.html', 'destiny-engine.html',
              'destiny-match.html', 'quiz-hub.html', 'draw-hub.html',
              'member-login.html', 'member-dashboard.html', 'app.html'):
        return '0.9'
    # blog / 計算器 / 測驗 / 抽牌 / 核心工具
    if name.startswith('blog/'): return '0.8'
    if bn.startswith('quiz-') or bn.startswith('draw-') or bn.startswith('destiny-'): return '0.8'
    if bn.endswith('-calculator.html'): return '0.8'
    if bn in ('aroma-garden.html', 'knowledge-hub.html', 'coordinate-philosophy.html',
              'cognitive-aromatherapy-theory.html', 'fuling-mima.html',
              'mbti-tarot.html', 'castle-guide.html'):
        return '0.8'
    # 城堡 / 占卜
    if bn.startswith('castle-'): return '0.7'
    if bn.endswith('-oracle.html') or bn.endswith('-reading.html'): return '0.7'
    # 價目表
    if bn.startswith('price-list'): return '0.8'
    return '0.6'


def changefreq_of(name):
    if name == 'index.html': return 'weekly'
    if name.startswith('blog/'): return 'monthly'
    bn = name.split('/')[-1]
    if bn in ('castle-hub.html', 'draw-hl.html', 'quiz-hub.html'): return 'weekly'
    return 'monthly'


def parse_old(path):
    """從舊 sitemap 抓 {loc: lastmod} 對應"""
    if not path.exists(): return {}
    s = path.read_text(encoding='utf-8')
    m = {}
    for block in re.finditer(r'<url>(.*?)</url>', s, re.S):
        body = block.group(1)
        loc_m = re.search(r'<loc>([^<]+)</loc>', body)
        lm_m = re.search(r'<lastmod>([^<]+)</lastmod>', body)
        if loc_m and lm_m:
            m[loc_m.group(1).strip()] = lm_m.group(1).strip()
    return m


def collect_html(base_dir, subdir=''):
    """收集 base_dir / subdir 下的所有 .html（遞迴到 blog 一層）"""
    d = base_dir / subdir if subdir else base_dir
    if not d.exists(): return []
    files = []
    for f in d.glob('*.html'):
        files.append(f.relative_to(base_dir).as_posix())
    # 子目錄（blog）
    blog_d = d / 'blog'
    if blog_d.exists():
        for f in blog_d.glob('*.html'):
            files.append(f.relative_to(base_dir).as_posix())
    return files


def build_sitemap(html_paths, url_prefix, old_map):
    """產生 sitemap XML 字串"""
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')
    lines.append('        xmlns:xhtml="http://www.w3.org/1999/xhtml">')
    lines.append('')
    lines.append(f'  <!-- 自動產生於 {TODAY}｜by tools/rebuild-sitemaps.py -->')
    lines.append('')

    # 排序：index 最前，其他照字母
    def sort_key(p):
        if p == 'index.html': return (0, '')
        if p.startswith('blog/'): return (2, p)
        return (1, p)

    html_paths = sorted(html_paths, key=sort_key)

    for p in html_paths:
        if should_exclude(p): continue
        # url
        if p == 'index.html':
            url = url_prefix + '/'
        else:
            url = url_prefix + '/' + p
        lastmod = old_map.get(url, TODAY)
        prio = priority_of(p)
        cfreq = changefreq_of(p)

        lines.append('  <url>')
        lines.append(f'    <loc>{url}</loc>')
        lines.append(f'    <lastmod>{lastmod}</lastmod>')
        lines.append(f'    <changefreq>{cfreq}</changefreq>')
        lines.append(f'    <priority>{prio}</priority>')
        lines.append('  </url>')

    lines.append('</urlset>')
    return '\n'.join(lines) + '\n'


def main():
    # 繁體
    hant_paths = collect_html(ROOT)
    hant_old = parse_old(ROOT / 'sitemap.xml')
    hant_xml = build_sitemap(hant_paths, 'https://hourlightkey.com', hant_old)
    (ROOT / 'sitemap.xml').write_text(hant_xml, encoding='utf-8')
    print(f'✓ sitemap.xml：{hant_xml.count("<url>")} 頁 (before {len(hant_old)})')

    # 簡體
    sc_paths = collect_html(ROOT, 'sc')
    # sc 的 base 是 sc/，所以要把前綴去掉並用 sc/ url prefix
    # 但 collect_html 回傳的是相對於 sc/ 的 path
    sc_old = parse_old(ROOT / 'sc' / 'sitemap.xml')
    # sc_paths 是相對於 sc/ 的路徑（e.g., 'index.html' / 'blog/xxx.html'）
    # url prefix = https://hourlightkey.com/sc
    sc_xml = build_sitemap(sc_paths, 'https://hourlightkey.com/sc', sc_old)
    (ROOT / 'sc' / 'sitemap.xml').write_text(sc_xml, encoding='utf-8')
    print(f'✓ sc/sitemap.xml：{sc_xml.count("<url>")} 頁 (before {len(sc_old)})')


if __name__ == '__main__':
    main()
