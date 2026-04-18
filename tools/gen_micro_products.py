#!/usr/bin/env python3
"""生成 3 個微承諾產品頁（馥靈語感版）"""
import os

TEMPLATE = r'''<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-BXP7K53QG6"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-BXP7K53QG6');</script>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,viewport-fit=cover"/>
<title>__TITLE__｜馥靈之鑰</title>
<meta name="description" content="__DESC__"/>
<meta name="robots" content="index,follow"/>
<link rel="icon" href="favicon.ico"/>
<link rel="canonical" href="https://hourlightkey.com/__SLUG__.html"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Noto+Serif+TC:wght@300;400;500&family=Noto+Sans+TC:wght@300;400;500&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="assets/css/hourlight-global.css"/>
<link rel="stylesheet" href="assets/css/hl-design-tokens.css"/>
<style>
:root{--bg:#faf9f7;--bg-card:#ffffff;--bg-card-2:#f5f1ea;--ink:#2a2013;--ink-soft:#5a4a32;--gold:#b8902a;--gold-light:#d4a853;--gold-bg:rgba(184,146,42,.08);--border:rgba(184,146,42,.18);--shadow:0 4px 16px rgba(120,90,40,.08);}
*,*::before,*::after{box-sizing:border-box;}
body{margin:0;background:var(--bg);color:var(--ink);font-family:'Noto Sans TC',sans-serif;line-height:1.85;padding-top:60px;padding-bottom:80px;}
main{max-width:820px;margin:0 auto;padding:24px 20px 80px;}
.m-hero{text-align:center;padding:56px 20px 36px;}
.m-hero .eyebrow{font-family:'Cormorant Garamond',serif;font-size:.88rem;color:var(--gold);letter-spacing:.42em;text-transform:uppercase;margin-bottom:16px;display:inline-flex;align-items:center;gap:18px;}
.m-hero .eyebrow::before,.m-hero .eyebrow::after{content:"";width:36px;height:1px;background:linear-gradient(90deg,transparent,var(--gold) 50%,transparent);display:inline-block;}
.m-hero h1{font-family:'Noto Serif TC',serif;font-size:2rem;font-weight:400;margin:0 0 20px;letter-spacing:.12em;line-height:1.45;}
.m-hero .sub{color:var(--ink-soft);font-size:1rem;margin:0;line-height:2;letter-spacing:.04em;}
.m-price-top{display:inline-flex;align-items:baseline;gap:10px;margin-top:22px;padding:8px 20px;background:var(--gold-bg);border:1px solid var(--border);border-radius:30px;}
.m-price-top .amt{font-family:'Cormorant Garamond',serif;font-size:1.4rem;color:var(--gold);font-weight:500;}
.m-price-top .unit{font-size:.78rem;color:var(--ink-soft);}
.section{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:32px 30px;margin:24px 0;box-shadow:var(--shadow);}
.section-title{font-family:'Cormorant Garamond',serif;font-size:.85rem;letter-spacing:.32em;color:var(--gold);text-transform:uppercase;margin-bottom:18px;text-align:center;}
.section h2{font-family:'Noto Serif TC',serif;font-size:1.25rem;font-weight:500;margin:0 0 18px;text-align:center;letter-spacing:.1em;}
.who-list{list-style:none;padding:0;margin:0;}
.who-list li{padding:14px 0;border-top:1px solid rgba(184,146,42,.1);font-size:.95rem;line-height:1.9;color:var(--ink);display:flex;gap:14px;align-items:baseline;}
.who-list li:first-child{border-top:none;}
.who-list li::before{content:"▸";color:var(--gold);font-weight:500;}
.deliver{display:grid;gap:16px;}
.deliver-item{padding:18px 22px;background:var(--bg-card-2);border-radius:10px;border-left:3px solid var(--gold);}
.deliver-item strong{font-family:'Noto Serif TC',serif;color:var(--ink);font-weight:500;letter-spacing:.04em;}
.deliver-item span{display:block;font-size:.88rem;color:var(--ink-soft);margin-top:6px;line-height:1.8;}
.value-quote{font-family:'Cormorant Garamond',serif;font-style:italic;color:var(--gold);text-align:center;font-size:1.1rem;line-height:2;padding:24px 20px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin:20px 0;letter-spacing:.04em;}
.cta-box{text-align:center;padding:48px 30px;background:linear-gradient(135deg,#fff8ea,#faf0d5);border:1px solid rgba(184,146,42,.28);border-radius:18px;margin:32px 0;}
.cta-box h3{font-family:'Noto Serif TC',serif;font-size:1.3rem;font-weight:500;margin:0 0 12px;letter-spacing:.12em;}
.cta-box .price{font-family:'Cormorant Garamond',serif;font-size:2.2rem;color:var(--gold);font-weight:500;margin:14px 0 6px;line-height:1;}
.cta-box .price-note{font-size:.82rem;color:var(--ink-soft);margin-bottom:20px;}
.cta-btn{display:inline-block;padding:14px 36px;background:var(--gold);color:#fff;border-radius:30px;text-decoration:none;font-family:'Noto Serif TC',serif;font-size:1rem;letter-spacing:.1em;}
.cta-btn:hover{background:var(--gold-light);}
.upgrade{background:var(--bg-card-2);border:1px dashed rgba(184,146,42,.3);border-radius:14px;padding:24px 26px;margin:32px 0;}
.upgrade .eyebrow{font-family:'Cormorant Garamond',serif;font-size:.75rem;letter-spacing:.3em;color:var(--gold);text-transform:uppercase;margin-bottom:10px;}
.upgrade h4{font-family:'Noto Serif TC',serif;font-size:1.05rem;font-weight:500;margin:0 0 10px;letter-spacing:.08em;}
.upgrade p{font-size:.9rem;color:var(--ink-soft);line-height:1.9;margin:0 0 14px;}
.upgrade a{color:var(--gold);text-decoration:none;border-bottom:1px solid rgba(184,146,42,.3);font-size:.9rem;letter-spacing:.04em;}
.yuju-signoff{text-align:center;padding:28px 20px 16px;color:var(--ink-soft);font-size:.9rem;line-height:2;}
.yuju-signoff .sig{display:block;margin-top:10px;font-family:'Cormorant Garamond',serif;font-style:italic;color:var(--gold);font-size:.82rem;letter-spacing:.12em;}
</style>
</head>
<body>
<main>

<div class="m-hero">
  <div class="eyebrow">__EYEBROW__</div>
  <h1>__H1__</h1>
  <p class="sub">__SUB__</p>
  <div class="m-price-top"><span class="amt">NT$__PRICE__</span><span class="unit">單次 · 約 __DELIVER_MIN__ 分鐘體驗</span></div>
</div>

<div class="section">
  <div class="section-title">Who Is This For</div>
  <h2>為哪一種人設計</h2>
  <ul class="who-list">
    __WHO_ITEMS__
  </ul>
</div>

<div class="section">
  <div class="section-title">What You Get</div>
  <h2>你會拿到什麼</h2>
  <div class="deliver">
    __DELIVER_ITEMS__
  </div>
  <div class="value-quote">__VALUE_QUOTE__</div>
</div>

<div class="cta-box">
  <h3>準備好看一眼了嗎</h3>
  <div class="price">NT$__PRICE__</div>
  <div class="price-note">單次 · 線上付款 · 付完立刻啟動</div>
  <a href="__CTA_LINK__" class="cta-btn">__CTA_TEXT__ →</a>
</div>

<div class="upgrade">
  <div class="eyebrow">Next Step · 看得更深</div>
  <h4>__UPGRADE_TITLE__</h4>
  <p>__UPGRADE_DESC__</p>
  <a href="__UPGRADE_LINK__">看 NT$599 深度方案 →</a>
</div>

<div class="yuju-signoff">
  付費，是對自己改變的承諾。<br>
  也是讓我能繼續做下去的養分。
  <span class="sig">— 王逸君</span>
</div>

</main>
<footer class="hl-footer"><div class="hl-footer-inner"><div class="hl-footer-links"></div></div></footer>
<script src="assets/js/hl-topnav.js" defer></script>
<script src="assets/js/hl-bottomnav.js" defer></script>
<script src="assets/js/hl-email.js" defer></script>
<script src="assets/js/hl-music.js" defer></script>
<script src="assets/js/hl-tracker.js" defer></script>
</body>
</html>
'''

products = [
    {
        'SLUG': 'micro-relationship',
        'TITLE': '關係盲區 · 看見你在重複的那個模式',
        'DESC': '關係裡的那份累，不是你的錯。只是你還沒看見，自己在重複什麼模式。用馥靈秘碼 H 數 + 關係動態看清楚，NT$199 起。',
        'EYEBROW': 'Micro · Relationship',
        'H1': '關係裡的那份累，不是你的錯',
        'SUB': '只是你還沒看見，自己在重複什麼模式。<br>這不是解決方案。是一張清楚的地圖。<br>走不走由你，但你至少知道自己站在哪。',
        'PRICE': '199',
        'DELIVER_MIN': '3',
        'WHO_ITEMS': '\n    '.join([
            '<li>每一次戀愛，好像都遇到同一種人</li>',
            '<li>朋友關係裡，總是你付出比較多</li>',
            '<li>家人之間有一個你一直沒敢碰的拉鋸</li>',
            '<li>看到某一種人會心動，但心動之後常常是受傷</li>'
        ]),
        'DELIVER_ITEMS': '\n    '.join([
            '<div class="deliver-item"><strong>單頁 PDF · 關係模式快照</strong><span>用馥靈秘碼 H 數 + 關係動態圖，看見你在關係中慣性扮演的角色。不是貼標籤，是讓你認出自己。</span></div>',
            '<div class="deliver-item"><strong>3 分鐘專屬語音</strong><span>逸君式三拍節奏：先接住（這不是你的錯），再指出客觀事實（你一直在做什麼），再給一個可驗證的觀察指標（下次遇到類似場景，試試這樣看）。</span></div>',
            '<div class="deliver-item"><strong>一句話核心判斷</strong><span>把你當下的關係狀態濃縮成一句話，讓你往後每次在關係裡猶豫時，回頭看這句話就有方向。</span></div>'
        ]),
        'VALUE_QUOTE': '這 NT$199，不是為了愛情的答案。<br>是讓你知道，這個問題裡，你自己站在哪裡。',
        'CTA_LINK': 'https://lin.ee/RdQBFAN',
        'CTA_TEXT': 'LINE 告訴我 我想測',
        'UPGRADE_TITLE': '想知道這個模式從哪裡來？',
        'UPGRADE_DESC': '如果看完 NT$199 的快照，你發現這個模式不只是這一世的事 —— 它跟著你很多年、很多段關係都一樣 —— 那可能有一個更老的故事藏在裡面。NT$599 的前世故事解讀，會把這個故事攤開來給你看。',
        'UPGRADE_LINK': 'past-life.html'
    },
    {
        'SLUG': 'micro-wealth',
        'TITLE': '金錢盲區 · 你和錢的關係裡藏了個故事',
        'DESC': '月底算帳時那個疑問 ——「我明明賺得不少，錢都跑去哪了？」不是你不會理財。是你和錢的關係裡，藏了一個故事。NT$149 看你的財富底色。',
        'EYEBROW': 'Micro · Wealth',
        'H1': '錢都跑去哪了？',
        'SUB': '不是你不會理財。<br>是你和錢的關係裡，藏了一個故事。<br>這 149，不是理財課。是一面鏡子。',
        'PRICE': '149',
        'DELIVER_MIN': '5',
        'WHO_ITEMS': '\n    '.join([
            '<li>月底算帳那個疑問 ——「我明明賺不少，錢都去哪了？」</li>',
            '<li>存款永遠存不住，一有錢就會有地方花掉</li>',
            '<li>開口要價很困難，覺得不好意思收錢</li>',
            '<li>對「有錢」這件事有隱隱的不安或罪惡感</li>'
        ]),
        'DELIVER_ITEMS': '\n    '.join([
            '<div class="deliver-item"><strong>3 題深度反思</strong><span>三個問題，幫你看見自己對錢的潛意識信念從哪裡來。不是算命，是看自己的故事。</span></div>',
            '<div class="deliver-item"><strong>M04 富命覺醒座標</strong><span>從你的生日算出「財富底色」：你和錢的關係模式屬於哪一種？什麼情境下錢會往你這裡聚、什麼情境下會漏？</span></div>',
            '<div class="deliver-item"><strong>一段文字摘要</strong><span>用馥靈語感告訴你：你的錢不是沒來，是來了留不住。留不住的地方，往往就是你的界線破洞。</span></div>'
        ]),
        'VALUE_QUOTE': '這 NT$149，不是幫你存錢。<br>是讓你看清楚，你和錢之間到底卡在哪裡。',
        'CTA_LINK': 'https://lin.ee/RdQBFAN',
        'CTA_TEXT': 'LINE 告訴我 我想測',
        'UPGRADE_TITLE': '想看財庫的具體樣貌？',
        'UPGRADE_DESC': '如果 NT$149 讓你看到「那個洞」在哪，NT$599 的元辰宮解讀可以帶你看到財庫本身 —— 你家廚房的爐火點著沒、客廳整不整齊、倉庫裡堆了什麼東西。每一個細節都是一個訊號。',
        'UPGRADE_LINK': 'yuan-chen-reading.html'
    },
    {
        'SLUG': 'micro-soul',
        'TITLE': '靈魂疲勞 · 你照顧所有人 但那份累沒有人照顧',
        'DESC': '那份累不是工作量造成的。是你一直在扛一個自己都不知道有的承諾。NT$299 用馥靈秘碼 U 數 + L.I.G.H.T. 看你靈魂的出廠設定。',
        'EYEBROW': 'Micro · Soul',
        'H1': '你照顧所有人<br>那份累，沒有人照顧',
        'SUB': '這不是工作量造成的。<br>是你的靈魂出廠設定裡，藏了一個太老的承諾。<br>NT$299 翻開它，不用消化完。看見，就是第一步。',
        'PRICE': '299',
        'DELIVER_MIN': '5',
        'WHO_ITEMS': '\n    '.join([
            '<li>你是家裡朋友圈的情緒回收桶，聽完人家倒的苦水，自己要花好幾天消化</li>',
            '<li>總覺得自己還不夠好，不敢停下來</li>',
            '<li>無法拒絕別人，一答應就是自己受傷</li>',
            '<li>給別人的比給自己的多，很多，很多</li>'
        ]),
        'DELIVER_ITEMS': '\n    '.join([
            '<div class="deliver-item"><strong>U 數深度解讀</strong><span>U 數是馥靈秘碼裡的「隱藏潛能」，但它也藏著你最深的恐懼。用你的農曆生日算出 U 數，翻譯你那個「一直覺得自己不夠好」的根源。</span></div>',
            '<div class="deliver-item"><strong>L.I.G.H.T. 五房間快篩</strong><span>你內在城堡的五個房間（愛之殿 / 直覺閣 / 磐石廳 / 和諧苑 / 蛻變室）當下的能量分佈 —— 哪個房間在漏水、哪個房間燈沒點著、哪個房間門鎖起來了。</span></div>',
            '<div class="deliver-item"><strong>5 分鐘專屬語音</strong><span>逸君式解讀，先接住你（這份累不是你的錯，是你扛了不屬於你的東西），再指出事實（你扛的是誰的），再給一個具體的日常觀察指標。</span></div>'
        ]),
        'VALUE_QUOTE': '這 NT$299，不是心靈雞湯。<br>是把你這十幾年來沒有人聽懂的委屈，<br>清清楚楚地翻譯給你聽。',
        'CTA_LINK': 'https://lin.ee/RdQBFAN',
        'CTA_TEXT': 'LINE 告訴我 我想測',
        'UPGRADE_TITLE': '那個承諾，是什麼時候簽下的？',
        'UPGRADE_DESC': 'NT$299 讓你看見「有一個承諾」，但這個承諾具體是什麼、什麼時候、為誰簽下 —— 這些需要更深的閱讀。NT$599 的阿卡西紀錄解讀，會把這份合約正本找出來給你。看見，是鬆手的開始。',
        'UPGRADE_LINK': 'akashic-reading.html'
    }
]

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

for p in products:
    html = TEMPLATE
    for key, val in p.items():
        html = html.replace(f'__{key}__', val)
    out = os.path.join(repo_root, p['SLUG'] + '.html')
    with open(out, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Written: {p['SLUG']}.html ({len(html)} bytes)")
