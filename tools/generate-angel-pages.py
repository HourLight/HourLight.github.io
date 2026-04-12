"""
Generate angel-stories.html (hub) + assets/data/angel-stories.json (merged)
Run from repo root: python tools/generate-angel-pages.py
"""
import json, os, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

STORY_FILES = [
    'docs/天使故事完整版-A00至A04.json',
    'docs/天使故事完整版-A05至A09.json',
    'docs/天使故事完整版-A10至A15.json',
    'docs/天使故事完整版-A16至A21.json',
    'docs/天使故事完整版-001至010.json',
    'docs/天使故事完整版-011至020.json',
    'docs/天使故事完整版-021至030.json',
]

merged = {}
for f in STORY_FILES:
    if os.path.exists(f):
        with open(f, encoding='utf-8') as fh:
            merged.update(json.load(fh))

print(f'合併 {len(merged)} 篇故事')

os.makedirs('assets/data', exist_ok=True)
with open('assets/data/angel-stories.json', 'w', encoding='utf-8') as fh:
    json.dump(merged, fh, ensure_ascii=False, indent=2)

def first_sentences(text, n=3):
    sentences = []
    current = ''
    for ch in text:
        current += ch
        if ch in '。！？':
            sentences.append(current)
            if len(sentences) >= n:
                break
    return ''.join(sentences).strip()

def get_group(key):
    return 'major' if key.startswith('A') else 'oil'

sorted_keys = sorted(merged.keys(), key=lambda k: (0 if k.startswith('A') else 1, k))

cards = []
for key in sorted_keys:
    s = merged[key]
    title = s.get('title', '')
    tarot = s.get('tarot', '')
    fs = s.get('fullStory', '')
    teaser = first_sentences(fs, 3)
    if len(teaser) > 150:
        teaser = teaser[:150] + '…'
    group = get_group(key)
    group_label = '大阿爾克那' if group == 'major' else '精油牌'
    cards.append(
        f'    <a href="angel-story.html?id={key}" class="story-card" data-group="{group}">\n'
        f'      <div class="card-num">{key}</div>\n'
        f'      <div class="card-title">{title}</div>\n'
        f'      <div class="card-meta">\n'
        f'        <span class="meta-tarot">{tarot}</span>\n'
        f'        <span class="meta-group">{group_label}</span>\n'
        f'      </div>\n'
        f'      <p class="card-teaser">{teaser}</p>\n'
        f'      <div class="card-cta">讀完整故事 →</div>\n'
        f'    </a>'
    )

cards_joined = '\n'.join(cards)
major_count = sum(1 for k in merged if k.startswith('A'))
oil_count = len(merged) - major_count

css = """
html,body{background:#faf9f7;color:#2a2420;font-family:'Noto Sans TC','Noto Serif TC',sans-serif;margin:0}
.stories-wrap{max-width:1120px;margin:0 auto;padding:80px 20px 60px}
.hero{text-align:center;margin-bottom:60px}
.hero h1{font-family:'Noto Serif TC',serif;font-size:44px;line-height:1.35;color:#2a2420;margin:0 0 18px;font-weight:600}
.hero .subtitle{font-size:17px;color:#6b5d52;line-height:1.8;max-width:620px;margin:0 auto}
.hero .count{display:inline-block;margin-top:22px;padding:8px 20px;background:#e9c27d;color:#2a2420;border-radius:999px;font-size:14px;letter-spacing:1px}
.filter-bar{display:flex;justify-content:center;gap:10px;margin-bottom:40px;flex-wrap:wrap}
.filter-btn{padding:10px 24px;border:1.5px solid #d4b88c;background:transparent;color:#6b5d52;border-radius:999px;font-size:14px;cursor:pointer;transition:all .2s;font-family:inherit}
.filter-btn:hover{background:#f5ecd9}
.filter-btn.active{background:#e9c27d;border-color:#e9c27d;color:#2a2420}
.stories-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:22px}
.story-card{background:#fff;border:1px solid #ece5d6;border-radius:14px;padding:26px 24px 22px;text-decoration:none;color:inherit;display:flex;flex-direction:column;transition:all .25s ease;box-shadow:0 2px 8px rgba(180,150,100,0.06)}
.story-card:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(180,150,100,0.14);border-color:#e9c27d}
.card-num{font-family:'Cormorant Garamond',serif;font-size:14px;color:#b39b6f;letter-spacing:3px;margin-bottom:8px}
.card-title{font-family:'Noto Serif TC',serif;font-size:22px;color:#2a2420;margin-bottom:10px;font-weight:500;line-height:1.4}
.card-meta{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.card-meta span{font-size:12px;padding:4px 10px;border-radius:999px}
.meta-tarot{background:#f5ecd9;color:#8a6e3c}
.meta-group{background:#f0e8dc;color:#6b5d52}
.card-teaser{font-size:14px;color:#6b5d52;line-height:1.75;margin:0 0 16px;flex:1}
.card-cta{font-size:13px;color:#b39b6f;font-weight:500;letter-spacing:1px}
.story-card.hidden{display:none}
.footer-cta{text-align:center;margin-top:80px;padding:50px 30px;background:linear-gradient(135deg,#f5ecd9 0%,#f0e8dc 100%);border-radius:20px}
.footer-cta h2{font-family:'Noto Serif TC',serif;font-size:28px;color:#2a2420;margin:0 0 14px;font-weight:500}
.footer-cta p{color:#6b5d52;line-height:1.8;margin:0 0 26px;max-width:520px;margin-left:auto;margin-right:auto}
.cta-buttons{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}
.cta-btn{padding:12px 26px;background:#e9c27d;color:#2a2420;text-decoration:none;border-radius:999px;font-size:14px;font-weight:500;transition:all .2s}
.cta-btn:hover{background:#d4ab64;transform:translateY(-2px)}
.cta-btn.secondary{background:transparent;border:1.5px solid #b39b6f;color:#6b5d52}
.cta-btn.secondary:hover{background:#b39b6f;color:#fff;border-color:#b39b6f}
@media(max-width:640px){
  .hero h1{font-size:32px}
  .stories-wrap{padding:60px 16px 40px}
  .stories-grid{grid-template-columns:1fr;gap:16px}
}
"""

js = """
const buttons = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.story-card');
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;
    buttons.forEach(b => b.classList.toggle('active', b === btn));
    cards.forEach(card => {
      const match = filter === 'all' || card.dataset.group === filter;
      card.classList.toggle('hidden', !match);
    });
  });
});
"""

hub = f"""<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>每日覺察故事｜130 則心靈電影 — HOUR LIGHT 馥靈之鑰</title>
<meta name="description" content="來自馥靈 130 張牌卡的 130 則真實故事。每一則都是你我身邊會發生的瞬間 — 關於看見自己、允許自己、重新開始。每天一則，慢慢讀。">
<link rel="canonical" href="https://hourlightkey.com/angel-stories.html">
<meta property="og:title" content="每日覺察故事｜130 則心靈電影">
<meta property="og:description" content="來自馥靈 130 張牌卡的 130 則真實故事。每一則都是你我身邊會發生的瞬間。">
<meta property="og:url" content="https://hourlightkey.com/angel-stories.html">
<meta property="og:type" content="website">
<link rel="stylesheet" href="assets/css/hourlight-global.css">
<style>{css}</style>
</head>
<body>
<script src="assets/js/hl-topnav.js?v=4"></script>
<main class="stories-wrap">
  <section class="hero">
    <h1>每日覺察故事</h1>
    <p class="subtitle">來自馥靈 130 張牌卡的 130 則真實故事。<br>每一則都是你我身邊會發生的瞬間 —— 關於看見自己、允許自己、重新開始。<br>每天一則，慢慢讀。</p>
    <div class="count">目前共 {len(merged)} 則｜每日更新</div>
  </section>
  <nav class="filter-bar">
    <button class="filter-btn active" data-filter="all">全部（{len(merged)}）</button>
    <button class="filter-btn" data-filter="major">大阿爾克那（{major_count}）</button>
    <button class="filter-btn" data-filter="oil">精油牌（{oil_count}）</button>
  </nav>
  <section class="stories-grid" id="storiesGrid">
{cards_joined}
  </section>
  <section class="footer-cta">
    <h2>讀完故事，抽一張你的牌</h2>
    <p>每一則故事都是一種覺察的入口。讀完了，不如讓牌卡告訴你今天需要看見的是什麼？</p>
    <div class="cta-buttons">
      <a class="cta-btn" href="draw-hl.html">抽一張牌</a>
      <a class="cta-btn secondary" href="quiz-hub.html">做一個測驗</a>
      <a class="cta-btn secondary" href="knowledge-hub.html">逛知識學苑</a>
    </div>
  </section>
</main>
<script src="assets/js/hl-bottomnav.js?v=4"></script>
<script>{js}</script>
</body>
</html>"""

with open('angel-stories.html', 'w', encoding='utf-8') as fh:
    fh.write(hub)

print(f'寫入 angel-stories.html ({len(hub):,} 字元)')
print(f'寫入 assets/data/angel-stories.json ({os.path.getsize("assets/data/angel-stories.json"):,} bytes)')
print(f'大阿爾克那 {major_count} 篇 + 精油牌 {oil_count} 篇')

# ========== 簡體版 ==========
try:
    import zhconv
except ImportError:
    print('zhconv 未安裝，跳過簡體版')
    raise SystemExit(0)

def to_sc(s):
    return zhconv.convert(s, 'zh-hans')

# 簡體合併 JSON
merged_sc = {}
for k, v in merged.items():
    merged_sc[k] = {
        'title': to_sc(v.get('title', '')),
        'tarot': to_sc(v.get('tarot', '')),
        'fullStory': to_sc(v.get('fullStory', '')),
    }
    if 'oils' in v:
        merged_sc[k]['oils'] = to_sc(v['oils'])

os.makedirs('sc/assets/data', exist_ok=True)
with open('sc/assets/data/angel-stories.json', 'w', encoding='utf-8') as fh:
    json.dump(merged_sc, fh, ensure_ascii=False, indent=2)

# 簡體 hub cards
cards_sc = []
for key in sorted_keys:
    s = merged_sc[key]
    title = s['title']
    tarot = s['tarot']
    fs = s['fullStory']
    teaser = first_sentences(fs, 3)
    if len(teaser) > 150:
        teaser = teaser[:150] + '…'
    group = get_group(key)
    group_label = '大阿卡纳' if group == 'major' else '精油牌'
    cards_sc.append(
        f'    <a href="angel-story.html?id={key}" class="story-card" data-group="{group}">\n'
        f'      <div class="card-num">{key}</div>\n'
        f'      <div class="card-title">{title}</div>\n'
        f'      <div class="card-meta">\n'
        f'        <span class="meta-tarot">{tarot}</span>\n'
        f'        <span class="meta-group">{group_label}</span>\n'
        f'      </div>\n'
        f'      <p class="card-teaser">{teaser}</p>\n'
        f'      <div class="card-cta">读完整故事 →</div>\n'
        f'    </a>'
    )
cards_sc_joined = '\n'.join(cards_sc)

hub_sc = f"""<!DOCTYPE html>
<html lang="zh-Hans">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>每日觉察故事｜130 则心灵电影 — HOUR LIGHT 馥灵之钥</title>
<meta name="description" content="来自馥灵 130 张牌卡的 130 则真实故事。每一则都是你我身边会发生的瞬间 — 关于看见自己、允许自己、重新开始。每天一则，慢慢读。">
<link rel="canonical" href="https://hourlightkey.com/sc/angel-stories.html">
<link rel="alternate" hreflang="zh-Hant" href="https://hourlightkey.com/angel-stories.html">
<link rel="alternate" hreflang="zh-Hans" href="https://hourlightkey.com/sc/angel-stories.html">
<meta property="og:title" content="每日觉察故事｜130 则心灵电影">
<meta property="og:description" content="来自馥灵 130 张牌卡的 130 则真实故事。每一则都是你我身边会发生的瞬间。">
<meta property="og:url" content="https://hourlightkey.com/sc/angel-stories.html">
<meta property="og:type" content="website">
<link rel="stylesheet" href="../assets/css/hourlight-global.css">
<style>{css}</style>
</head>
<body>
<script src="../assets/js/hl-topnav.js?v=4"></script>
<main class="stories-wrap">
  <section class="hero">
    <h1>每日觉察故事</h1>
    <p class="subtitle">来自馥灵 130 张牌卡的 130 则真实故事。<br>每一则都是你我身边会发生的瞬间 —— 关于看见自己、允许自己、重新开始。<br>每天一则，慢慢读。</p>
    <div class="count">目前共 {len(merged)} 则｜每日更新</div>
  </section>
  <nav class="filter-bar">
    <button class="filter-btn active" data-filter="all">全部（{len(merged)}）</button>
    <button class="filter-btn" data-filter="major">大阿卡纳（{major_count}）</button>
    <button class="filter-btn" data-filter="oil">精油牌（{oil_count}）</button>
  </nav>
  <section class="stories-grid" id="storiesGrid">
{cards_sc_joined}
  </section>
  <section class="footer-cta">
    <h2>读完故事，抽一张你的牌</h2>
    <p>每一则故事都是一种觉察的入口。读完了，不如让牌卡告诉你今天需要看见的是什么？</p>
    <div class="cta-buttons">
      <a class="cta-btn" href="draw.html">抽一张牌</a>
      <a class="cta-btn secondary" href="quiz-hub.html">做一个测验</a>
      <a class="cta-btn secondary" href="index.html">回首页</a>
    </div>
  </section>
</main>
<script src="../assets/js/hl-bottomnav.js?v=4"></script>
<script>{js}</script>
</body>
</html>"""

with open('sc/angel-stories.html', 'w', encoding='utf-8') as fh:
    fh.write(hub_sc)

print(f'寫入 sc/angel-stories.html ({len(hub_sc):,} 字元)')
print(f'寫入 sc/assets/data/angel-stories.json ({os.path.getsize("sc/assets/data/angel-stories.json"):,} bytes)')
