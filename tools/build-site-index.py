#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""全站工具索引產生器：掃所有 .html → 抽 title/desc → 分類 → 輸出 md"""
import os, re, sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

ROOT = Path(__file__).parent.parent


def meta(html_path):
    try:
        s = html_path.read_text(encoding='utf-8', errors='ignore')
    except Exception:
        return '', ''
    t = re.search(r'<title>([^<]+)</title>', s)
    d = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)', s, re.IGNORECASE)
    return (t.group(1).strip() if t else ''), (d.group(1).strip() if d else '')


def collect(base_dir, prefix=''):
    items = []
    if not base_dir.exists():
        return items
    for f in sorted(base_dir.glob('*.html')):
        t, d = meta(f)
        items.append({'path': prefix + f.name, 'title': t, 'desc': d})
    blog_dir = base_dir / 'blog'
    if blog_dir.exists():
        for f in sorted(blog_dir.glob('*.html')):
            t, d = meta(f)
            items.append({'path': prefix + 'blog/' + f.name, 'title': t, 'desc': d})
    return items


def classify(path):
    bn = path.split('/')[-1]
    if bn.startswith('admin-'):
        return '管理後台'
    if bn.startswith('member-') or bn in ('app.html', 'login.html', 'logout.html'):
        return '會員 / App'
    if bn.startswith('quiz-'):
        return '心理測驗'
    if bn.startswith('draw-'):
        return '馥靈牌卡'
    if (bn.endswith('-oracle.html') or bn.endswith('-scrying.html') or
        bn in ('poe-blocks.html', 'tarot-draw.html', 'tarot-free.html', 'mbti-tarot.html',
               'angel-story.html', 'angel-stories.html', 'bone-casting.html',
               'dream-decoder.html', 'witch-power.html', 'projection-cards.html',
               'poker-oracle.html', 'runes-oracle.html', 'body-map-oracle.html',
               'color-oracle.html', 'number-oracle.html', 'time-space-oracle.html',
               'word-oracle.html', 'temporal-threads.html', 'liuren-oracle.html',
               'phone-oracle.html', 'name-oracle.html', 'season-oracle.html',
               'aroma-daily.html')):
        return '抽牌占卜工具'
    if bn.startswith('destiny-') or bn.startswith('ziwei') or bn.startswith('bazi') or \
       bn.startswith('astro') or bn.startswith('hd-') or bn.startswith('maya') or \
       bn.startswith('lifepath') or bn.startswith('numerology') or \
       bn.startswith('qizheng') or bn.startswith('fuling-') or \
       bn.startswith('triangle-') or 'calculator' in bn:
        return '命理計算'
    if bn.startswith('castle-'):
        return '城堡系統'
    if 'aroma' in bn or bn.startswith('blending-') or 'essential-oil' in bn or \
       bn.startswith('cognitive-aromatherapy') or bn.startswith('aromatherapy') or \
       bn.startswith('aromacare'):
        return '芳療知識'
    if bn.startswith('akashic-') or bn.startswith('yuan-chen-') or \
       bn.startswith('past-life') or '-reading.html' in bn:
        return '深度解讀服務'
    if bn.startswith('mbti-') or bn.startswith('enneagram-') or bn.startswith('hsp-'):
        return '人格類型文章'
    if bn.startswith('ai-guide-') or bn.startswith('ai-tutorial'):
        return 'AI 指南'
    if bn.startswith('knowledge-') or bn.startswith('book') or 'course' in bn or \
       bn.startswith('naha-') or bn.startswith('reiki-') or bn.startswith('massage-') or \
       bn.startswith('skincare-') or bn.startswith('kids-') or bn.startswith('chakra'):
        return '知識學苑'
    if path.startswith('blog/') or path.startswith('sc/blog/'):
        return 'Blog SEO 文章'
    if bn.startswith('price-list') or bn.startswith('pricing'):
        return '價目 / 商業'
    if bn in ('index.html', 'about.html', 'services.html', 'contact.html', 'founder.html',
              'founder_v3.html', 'brand.html', 'brand-vision.html', 'brand-story.html',
              'faq.html', 'privacy.html', 'terms.html', 'changelog.html', 'ai-about.html',
              'sitemap.html', 'affiliate.html', 'partners.html', 'consulting.html',
              'booking.html', 'booking-admin.html', 'partner-dashboard.html',
              'platform-admin.html', 'hourbeauty.html', 'hourbeauty-basic.html'):
        return '官方核心頁'
    if 'abundance' in bn or bn.startswith('wealth-') or 'prosperity' in bn:
        return '富足系列'
    if bn.startswith('witch-') or 'prayer' in bn or 'ritual' in bn:
        return '儀式 / 禱文'
    if bn.startswith('auto-') or bn.startswith('angel-'):
        return '天使 / 自動化'
    return '其他'


def write_index(items, out_path, title):
    buckets = {}
    for it in items:
        buckets.setdefault(classify(it['path']), []).append(it)

    lines = [f'# {title}', '',
             f'> 自動產出 2026-04-17｜總 {len(items)} 頁',
             '> 這是歐寶建新頁前**必查**的清單。每項含 title + meta description，能快速判斷是否已有對應工具。',
             '',
             '---',
             '']
    for label in sorted(buckets.keys(), key=lambda k: -len(buckets[k])):
        ll = buckets[label]
        lines.append(f'## {label}（{len(ll)} 頁）')
        lines.append('')
        lines.append('| 檔案 | 標題 | 描述 |')
        lines.append('|---|---|---|')
        for it in ll:
            t = (it['title'] or '—').replace('|', '\\|')[:60]
            d = (it['desc'] or '—').replace('|', '\\|')[:80]
            lines.append(f'| `{it["path"]}` | {t} | {d} |')
        lines.append('')

    out_path.write_text('\n'.join(lines) + '\n', encoding='utf-8')
    print(f'wrote {out_path} ({len(items)} 頁, {len(buckets)} 類)')
    return buckets


hant = collect(ROOT)
hans = collect(ROOT / 'sc', 'sc/')

b1 = write_index(hant, ROOT / 'docs/site-tools-index.md', '馥靈之鑰 · 繁體站工具總索引（499 頁全覽）')
b2 = write_index(hans, ROOT / 'docs/sc-tools-index.md', '馥靈之鑰 · 簡體站工具總索引（370 頁全覽）')

print()
print('=== 繁體分類分布 ===')
for label in sorted(b1.keys(), key=lambda k: -len(b1[k])):
    print(f'  {label}: {len(b1[label])}')
