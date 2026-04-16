/**
 * 馥靈之鑰 結果頁三大 CTA 模組 v1.0
 * ─────────────────────────────────────
 * 解決問題：測驗/命理/抽牌做完之後，用戶沒有下一步引導 → 流失
 * 策略：統一注入三顆 CTA，把「免費體驗完」的人導到「更深的探索」或「付費 AI 解讀」或「分享好友」
 *
 * 使用方式（結果頁）：
 *   1. 在結果顯示區塊加 <div id="hl-result-cta"></div>（可選；沒有會自動 append body 尾）
 *   2. 載入模組：<script src="assets/js/hl-result-cta.js"></script>
 *   3. 可選：頁面自訂配置
 *      <script>window.HL_RESULT_CTA = { sourceType:'quiz', sourceId:'mbti' };</script>
 *
 * 自動偵測：讀 URL path 判斷來源類型（quiz-* / draw-* / destiny-* / fuling-* 等）
 * 呼叫時機：用戶抽完牌 / 測驗做完 / 命盤算完後，觸發事件 window.dispatchEvent(new Event('hl:result-ready'))
 * 或 DOMContentLoaded 時自動顯示（對靜態結果頁）
 */
(function(){
  'use strict';

  // 跳過首頁/會員/admin 等不該出現 CTA 的頁
  var page = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  var SKIP = [
    'index.html','','member-login.html','member-dashboard.html',
    'admin-dashboard.html','admin-analytics.html','admin-payments.html',
    'privacy.html','terms.html','app.html','404.html',
    'pricing.html','price-list.html','price-list-vip.html','price-list-b2b.html',
    'services.html','booking.html','contact.html','founder.html','about.html','book.html'
  ];
  if (SKIP.indexOf(page) > -1 || /^admin-/.test(page)) return;

  // ═════════════════════════════════════════════════
  // 推薦路由：根據當前頁類型 → 推薦下一步
  // ═════════════════════════════════════════════════
  function getSourceType(){
    var cfg = window.HL_RESULT_CTA || {};
    if (cfg.sourceType) return cfg.sourceType;
    if (/^quiz-/.test(page)) return 'quiz';
    if (/^draw-|draw\.html|tarot-|angel-|past-life|witch-|projection-|oracle|divination|yijing/.test(page)) return 'draw';
    if (/^destiny-|bazi|ziwei|astro|hd-|maya|lifepath|numerology|qizheng|triangle|fuling-mima|name-oracle|rainbow/.test(page)) return 'destiny';
    if (/castle-room-|castle-/.test(page)) return 'castle';
    return 'generic';
  }

  // 三大 CTA 配置（照類型給不同推薦）
  var CTA_PRESETS = {
    quiz: {
      label: '做完測驗，再走一步',
      cta1: { title:'看懂你的能量座標', desc:'用古今中外大數據系統交叉定位你的設定', href:'destiny-engine.html', tag:'命盤引擎' },
      cta2: { title:'讓 AI 為你深度解讀', desc:'不只告訴你是什麼，還告訴你怎麼走', href:'pricing.html#ai-reading', tag:'AI 深度解讀' },
      cta3: { title:'送朋友一次免費體驗', desc:'推薦碼自動帶入，朋友註冊你收分潤', href:'#share', tag:'分享' }
    },
    destiny: {
      label: '知道自己的座標後，下一步',
      cta1: { title:'抽一張，問一個當下的問題', desc:'130 張原創智慧牌卡，AI 即時解讀', href:'draw-hl.html', tag:'智慧抽牌' },
      cta2: { title:'升級看完整 33 套合盤', desc:'與另一半/家人/夥伴的能量交叉', href:'destiny-match.html', tag:'33 套合盤' },
      cta3: { title:'送朋友一張免費體驗', desc:'推薦碼自動帶入，朋友註冊你收分潤', href:'#share', tag:'分享' }
    },
    draw: {
      label: '抽完之後',
      cta1: { title:'你的命盤告訴你為何抽到這張', desc:'把牌卡放進 33 大命理系統的座標看', href:'destiny-engine.html', tag:'命盤引擎' },
      cta2: { title:'AI 深度解讀這 3/5/7 張', desc:'免費抽牌，付費看更深的故事', href:'pricing.html#draw-reading', tag:'AI 解讀' },
      cta3: { title:'把這張送朋友看看', desc:'產生專屬分享連結 + 推薦碼', href:'#share', tag:'分享' }
    },
    castle: {
      label: '走出城堡，帶一把鑰匙',
      cta1: { title:'看看你缺哪一塊', desc:'做深潛覺察測驗，補上缺口', href:'quiz-hub.html', tag:'覺察測驗' },
      cta2: { title:'抽一張今日指引', desc:'從 130 張牌卡挑一張回答你', href:'draw-hl.html', tag:'智慧抽牌' },
      cta3: { title:'讓朋友也進城堡', desc:'分享連結 + 推薦碼', href:'#share', tag:'分享' }
    },
    generic: {
      label: '繼續你的內在探索',
      cta1: { title:'做一個覺察測驗', desc:'101 項心理測驗幫你定位', href:'quiz-hub.html', tag:'覺察測驗' },
      cta2: { title:'算一次你的命盤座標', desc:'33 大系統交叉定位你的設定', href:'destiny-engine.html', tag:'命盤引擎' },
      cta3: { title:'抽一張牌看看今天', desc:'130 張智慧牌卡回答你當下的問題', href:'draw-hl.html', tag:'智慧抽牌' }
    }
  };

  // ═════════════════════════════════════════════════
  // UI：三張卡片（RWD，深色/淺色自動辨識）
  // ═════════════════════════════════════════════════
  function isLightTheme(){
    // 偵測淺色頁（新頁面背景 #faf9f7 / #fdf6ef 系列）
    var bg = window.getComputedStyle(document.body).backgroundColor;
    if (!bg) return false;
    var m = bg.match(/\d+/g);
    if (!m || m.length < 3) return false;
    var r = parseInt(m[0]), g = parseInt(m[1]), b = parseInt(m[2]);
    // 平均亮度 > 200 視為淺色
    return (r + g + b) / 3 > 200;
  }

  function injectCSS(light){
    if (document.getElementById('hl-result-cta-style')) return;
    var css = document.createElement('style');
    css.id = 'hl-result-cta-style';
    css.textContent = light ? `
      .hl-rcta{margin:40px auto;max-width:960px;padding:0 16px;font-family:'Noto Serif TC',serif}
      .hl-rcta-label{font-size:.78rem;letter-spacing:.18em;color:#9a7a60;text-align:center;margin-bottom:8px;text-transform:uppercase}
      .hl-rcta-title{font-size:1.15rem;color:#3e2a1a;text-align:center;margin-bottom:24px;font-weight:500;letter-spacing:.04em}
      .hl-rcta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
      .hl-rcta-card{background:rgba(255,255,255,.9);border:1px solid rgba(200,134,42,.2);border-radius:16px;padding:20px 18px;text-decoration:none;color:inherit;transition:all .3s;display:flex;flex-direction:column;gap:10px;box-shadow:0 6px 20px rgba(62,42,26,.06)}
      .hl-rcta-card:hover{transform:translateY(-3px);border-color:rgba(200,134,42,.45);box-shadow:0 14px 32px rgba(62,42,26,.1)}
      .hl-rcta-tag{font-size:.68rem;letter-spacing:.1em;color:#c8862a;text-transform:uppercase}
      .hl-rcta-ct{font-size:1rem;font-weight:600;color:#3e2a1a;line-height:1.4}
      .hl-rcta-desc{font-size:.82rem;color:#6b4a30;line-height:1.55;flex:1}
      .hl-rcta-arrow{margin-top:auto;font-size:.8rem;color:#c8862a;letter-spacing:.04em;opacity:.85}
      .hl-rcta-keepsake-wrap{margin-top:18px;text-align:center}
      .hl-rcta-keepsake{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:999px;border:1px dashed rgba(200,134,42,.4);background:rgba(200,134,42,.04);font-family:'Noto Serif TC',serif;font-size:.88rem;letter-spacing:.04em;color:#6b4a30;cursor:pointer;transition:all .3s}
      .hl-rcta-keepsake:hover{border-color:#c8862a;background:rgba(200,134,42,.08);color:#3e2a1a;transform:translateY(-1px)}
      .hl-rcta-keepsake.kept{background:linear-gradient(135deg,rgba(200,134,42,.14),rgba(232,184,109,.14));border-style:solid;color:#3e2a1a;cursor:default}
      .hl-rcta-keepsake-icon{font-size:1.05rem}
      .hl-rcta-reflect{margin-bottom:28px;padding:22px 20px;background:linear-gradient(135deg,rgba(200,134,42,.05),rgba(160,124,220,.04));border:1px solid rgba(200,134,42,.18);border-radius:18px}
      .hl-rcta-reflect-eyebrow{font-size:.7rem;letter-spacing:.28em;color:#c8862a;text-transform:uppercase;text-align:center;margin-bottom:8px}
      .hl-rcta-reflect-title{font-size:1.05rem;color:#3e2a1a;font-weight:500;letter-spacing:.06em;text-align:center;margin-bottom:16px}
      .hl-rcta-reflect-q{border:1px solid rgba(200,134,42,.15);border-radius:12px;padding:11px 15px;background:rgba(255,255,255,.6);margin-bottom:9px;transition:all .3s}
      .hl-rcta-reflect-q[open]{border-color:rgba(200,134,42,.4)}
      .hl-rcta-reflect-q summary{cursor:pointer;font-size:.88rem;color:#4a3f6c;letter-spacing:.04em;list-style:none}
      .hl-rcta-reflect-q summary::-webkit-details-marker{display:none}
      .hl-rcta-reflect-q textarea{width:100%;min-height:60px;margin-top:10px;padding:9px 11px;background:rgba(255,255,255,.75);border:1px solid rgba(200,134,42,.15);border-radius:8px;font-family:inherit;font-size:.86rem;line-height:1.8;color:#3e2a1a;resize:vertical}
      .hl-rcta-reflect-hint{font-size:.76rem;color:#8a7a6a;text-align:center;margin-top:12px;font-family:'LXGW WenKai TC','Noto Serif TC',serif;line-height:1.8}
      @media(max-width:640px){.hl-rcta-grid{grid-template-columns:1fr;gap:10px}.hl-rcta-card{padding:16px}}
    ` : `
      .hl-rcta{margin:40px auto;max-width:960px;padding:0 16px;font-family:'Noto Serif TC',serif}
      .hl-rcta-label{font-size:.78rem;letter-spacing:.18em;color:rgba(248,223,165,.55);text-align:center;margin-bottom:8px;text-transform:uppercase}
      .hl-rcta-title{font-size:1.15rem;color:#f8dfa5;text-align:center;margin-bottom:24px;font-weight:500;letter-spacing:.04em}
      .hl-rcta-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
      .hl-rcta-card{background:rgba(248,223,165,.04);border:1px solid rgba(248,223,165,.15);border-radius:16px;padding:20px 18px;text-decoration:none;color:inherit;transition:all .3s;display:flex;flex-direction:column;gap:10px}
      .hl-rcta-card:hover{transform:translateY(-3px);border-color:rgba(248,223,165,.45);background:rgba(248,223,165,.08);box-shadow:0 14px 32px rgba(0,0,0,.3)}
      .hl-rcta-tag{font-size:.68rem;letter-spacing:.1em;color:#f0d48a;text-transform:uppercase}
      .hl-rcta-ct{font-size:1rem;font-weight:500;color:#f8dfa5;line-height:1.4}
      .hl-rcta-desc{font-size:.82rem;color:rgba(244,240,235,.72);line-height:1.55;flex:1}
      .hl-rcta-arrow{margin-top:auto;font-size:.8rem;color:#f0d48a;letter-spacing:.04em;opacity:.85}
      .hl-rcta-keepsake-wrap{margin-top:18px;text-align:center}
      .hl-rcta-keepsake{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:999px;border:1px dashed rgba(248,223,165,.35);background:rgba(248,223,165,.04);font-family:'Noto Serif TC',serif;font-size:.88rem;letter-spacing:.04em;color:rgba(244,240,235,.78);cursor:pointer;transition:all .3s}
      .hl-rcta-keepsake:hover{border-color:rgba(248,223,165,.6);background:rgba(248,223,165,.08);color:#f8dfa5;transform:translateY(-1px)}
      .hl-rcta-keepsake.kept{background:linear-gradient(135deg,rgba(248,223,165,.14),rgba(232,184,109,.14));border-style:solid;color:#f8dfa5;cursor:default}
      .hl-rcta-keepsake-icon{font-size:1.05rem}
      .hl-rcta-reflect{margin-bottom:28px;padding:22px 20px;background:linear-gradient(135deg,rgba(248,223,165,.06),rgba(160,124,220,.05));border:1px solid rgba(248,223,165,.2);border-radius:18px}
      .hl-rcta-reflect-eyebrow{font-size:.7rem;letter-spacing:.28em;color:#f8dfa5;text-transform:uppercase;text-align:center;margin-bottom:8px}
      .hl-rcta-reflect-title{font-size:1.05rem;color:#f0d48a;font-weight:500;letter-spacing:.06em;text-align:center;margin-bottom:16px}
      .hl-rcta-reflect-q{border:1px solid rgba(248,223,165,.15);border-radius:12px;padding:11px 15px;background:rgba(0,0,0,.18);margin-bottom:9px;transition:all .3s}
      .hl-rcta-reflect-q[open]{border-color:rgba(248,223,165,.4)}
      .hl-rcta-reflect-q summary{cursor:pointer;font-size:.88rem;color:#f8dfa5;letter-spacing:.04em;list-style:none}
      .hl-rcta-reflect-q summary::-webkit-details-marker{display:none}
      .hl-rcta-reflect-q textarea{width:100%;min-height:60px;margin-top:10px;padding:9px 11px;background:rgba(255,255,255,.04);border:1px solid rgba(248,223,165,.15);border-radius:8px;font-family:inherit;font-size:.86rem;line-height:1.8;color:rgba(244,240,235,.88);resize:vertical}
      .hl-rcta-reflect-hint{font-size:.76rem;color:rgba(244,240,235,.5);text-align:center;margin-top:12px;font-family:'LXGW WenKai TC','Noto Serif TC',serif;line-height:1.8}
      @media(max-width:640px){.hl-rcta-grid{grid-template-columns:1fr;gap:10px}.hl-rcta-card{padding:16px}}
    `;
    document.head.appendChild(css);
  }

  // 分享連結生成（hl-referral.js 若存在則用，不然純分享）
  function handleShare(e){
    e.preventDefault();
    var refCode = '';
    try {
      if (window.hlReferral && typeof hlReferral.getMyCode === 'function') {
        refCode = hlReferral.getMyCode();
      } else {
        refCode = localStorage.getItem('hl_my_ref_code') || '';
      }
    } catch(_) {}
    var shareURL = location.origin + location.pathname + (refCode ? '?ref=' + encodeURIComponent(refCode) : '');
    var shareText = '剛在馥靈之鑰做了一個很有感的覺察 — 你也試看看：';
    if (navigator.share) {
      navigator.share({ title:'馥靈之鑰 Hour Light', text: shareText, url: shareURL }).catch(function(){});
    } else {
      // fallback 複製到剪貼簿
      var ta = document.createElement('textarea');
      ta.value = shareText + '\n' + shareURL;
      ta.style.position = 'fixed';
      ta.style.top = '50%'; ta.style.left = '50%'; ta.style.opacity = '.01';
      document.body.appendChild(ta);
      ta.setAttribute('readonly','');
      try {
        if (/iPad|iPhone/.test(navigator.userAgent)) {
          var range = document.createRange();
          range.selectNodeContents(ta);
          var sel = window.getSelection();
          sel.removeAllRanges(); sel.addRange(range);
          ta.setSelectionRange(0, 999999);
        } else { ta.select(); }
        document.execCommand('copy');
        alert('分享連結已複製，貼給朋友吧');
      } catch(_) {
        prompt('複製下面這段給朋友：', shareText + '\n' + shareURL);
      }
      document.body.removeChild(ta);
    }
  }

  // ═════════════════════════════════════════════════
  // 「留給以後的自己」· 收藏到城堡
  // ═════════════════════════════════════════════════
  function keepForFuture(extra){
    try {
      var key = 'hl_castle_keepsakes_v1';
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      var title = document.title.replace(/[｜\|].*$/, '').trim() || page;
      var entry = Object.assign({
        page: page,
        type: getSourceType(),
        title: title.slice(0, 50),
        ts: Date.now()
      }, extra || {});
      // 同頁 24 小時內只收藏一次
      var dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      var existingIdx = list.findIndex(function(e){ return e.page === page && e.ts > dayAgo; });
      if (existingIdx > -1) return { ok: false, reason: 'already_kept_today' };
      list.unshift(entry);
      if (list.length > 100) list = list.slice(0, 100);
      localStorage.setItem(key, JSON.stringify(list));
      return { ok: true, entry: entry };
    } catch(e){
      return { ok: false, reason: 'error', error: e.message };
    }
  }

  function showKeepsakeToast(msg, variant){
    var t = document.createElement('div');
    var bg = variant === 'error' ? 'rgba(180,80,80,.92)' : 'linear-gradient(135deg,rgba(184,146,42,.95),rgba(232,184,109,.95))';
    t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:10000;padding:12px 22px;border-radius:14px;background:' + bg + ';color:#fff;font-family:"Noto Serif TC",serif;font-size:.88rem;letter-spacing:.04em;box-shadow:0 10px 30px rgba(0,0,0,.3);opacity:0;transition:all .4s cubic-bezier(.4,0,.2,1);max-width:320px;text-align:center;line-height:1.7';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function(){ t.style.opacity = '1'; t.style.transform = 'translate(-50%,8px)'; });
    setTimeout(function(){ t.style.opacity = '0'; t.style.transform = 'translate(-50%,-12px)'; setTimeout(function(){ t.remove(); }, 450); }, 3200);
  }

  // ═════════════════════════════════════════════════
  // 全站 → 城堡 閉環：記錄這次探索到 localStorage
  // castle-hub 會讀取這個 list 渲染「最近探索」widget
  // ═════════════════════════════════════════════════
  function recordExploration(type){
    try {
      var key = 'hl_castle_explorations';
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      var title = document.title.replace(/[｜\|].*$/, '').trim() || page;
      var entry = {
        page: page,
        type: type || getSourceType(),
        title: title.slice(0, 40),
        ts: Date.now()
      };
      // 同頁 60 分鐘內只記一次（避免重入）
      var hourAgo = Date.now() - 60 * 60 * 1000;
      var existingIdx = list.findIndex(function(e){ return e.page === page && e.ts > hourAgo; });
      if (existingIdx === -1) {
        list.unshift(entry);
        // 最多保留 30 筆
        if (list.length > 30) list = list.slice(0, 30);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } catch(_) {}
  }

  function renderCTAs(){
    var target = document.getElementById('hl-result-cta');
    if (!target) {
      // 沒有指定容器 → 自動 append 到 body 尾（main 之後，footer 之前）
      var footer = document.querySelector('.hl-footer, .ff-footer, footer');
      target = document.createElement('div');
      target.id = 'hl-result-cta';
      if (footer && footer.parentNode) footer.parentNode.insertBefore(target, footer);
      else document.body.appendChild(target);
    }
    // 防重入
    if (target.dataset.rendered === '1') return;
    target.dataset.rendered = '1';

    // 自動記錄這次探索
    recordExploration();

    var light = isLightTheme();
    injectCSS(light);

    var type = getSourceType();
    var preset = CTA_PRESETS[type] || CTA_PRESETS.generic;

    var html = '<section class="hl-rcta" role="complementary" aria-label="接下來的探索">';

    // ═══ Layer 2：quiz 類型專屬反思層（利他 · CTA 合理化）═══
    // 測驗做完 → 先給反思空間 → 再自然接升級 CTA
    if (type === 'quiz') {
      html += '<div class="hl-rcta-reflect">';
      html += '<div class="hl-rcta-reflect-eyebrow">Pause · 先停一下</div>';
      html += '<h4 class="hl-rcta-reflect-title">看完結果，三個問題</h4>';
      html += '<details class="hl-rcta-reflect-q" data-reflect-key="nod"><summary>🔍　這個結果有什麼讓你點頭？</summary><textarea placeholder="一個詞、一句話都可以"></textarea></details>';
      html += '<details class="hl-rcta-reflect-q" data-reflect-key="known"><summary>🌱　有什麼是你早就知道但沒說出口的？</summary><textarea placeholder="寫給自己看"></textarea></details>';
      html += '<details class="hl-rcta-reflect-q" data-reflect-key="action"><summary>🎯　如果這個結果幫你看懂一件事，那是什麼？</summary><textarea placeholder="不用完整，寫片段也可以"></textarea></details>';
      html += '<p class="hl-rcta-reflect-hint">覺察不用完整。這幾秒的停頓，已經是你給自己的禮物。</p>';
      html += '</div>';
    }

    html += '<div class="hl-rcta-label">' + preset.label + '</div>';
    html += '<h3 class="hl-rcta-title">下一步，走哪條路</h3>';
    html += '<div class="hl-rcta-grid">';
    [preset.cta1, preset.cta2, preset.cta3].forEach(function(c, i){
      var isShare = c.href === '#share';
      var href = isShare ? '#share' : c.href;
      var attr = isShare ? ' data-hl-cta-share' : '';
      html += '<a class="hl-rcta-card" href="' + href + '"' + attr + ' data-hl-cta-idx="' + (i+1) + '">';
      html += '<div class="hl-rcta-tag">' + c.tag + '</div>';
      html += '<div class="hl-rcta-ct">' + c.title + '</div>';
      html += '<div class="hl-rcta-desc">' + c.desc + '</div>';
      html += '<div class="hl-rcta-arrow">繼續 →</div>';
      html += '</a>';
    });
    html += '</div>';
    // 第 4 顆：留給以後的自己（收藏到城堡，馥靈馥語）
    html += '<div class="hl-rcta-keepsake-wrap">';
    html += '<button type="button" class="hl-rcta-keepsake" data-hl-keepsake><span class="hl-rcta-keepsake-icon">🗝️</span><span>留給以後的自己 · 收藏到你的城堡</span></button>';
    html += '</div>';
    html += '</section>';
    target.innerHTML = html;

    // 綁收藏按鈕
    var keepBtn = target.querySelector('[data-hl-keepsake]');
    if (keepBtn) {
      keepBtn.addEventListener('click', function(){
        var result = keepForFuture();
        if (result.ok){
          keepBtn.classList.add('kept');
          keepBtn.innerHTML = '<span class="hl-rcta-keepsake-icon">✓</span><span>已留下｜它會在你城堡裡等你</span>';
          showKeepsakeToast('收到你城堡的鑰匙了。需要的時候回來看。');
          try { if (window.gtag) gtag('event','keepsake_save',{page:page,type:type}); } catch(_){}
        } else if (result.reason === 'already_kept_today'){
          showKeepsakeToast('今天已經收藏過這個了，換別的吧');
        } else {
          showKeepsakeToast('收藏沒成功，之後再試', 'error');
        }
      });
    }

    // 綁分享事件
    target.querySelectorAll('[data-hl-cta-share]').forEach(function(el){
      el.addEventListener('click', handleShare);
    });

    // 追蹤
    target.querySelectorAll('.hl-rcta-card').forEach(function(el){
      el.addEventListener('click', function(){
        try {
          if (window.gtag) gtag('event', 'result_cta_click', {
            cta_idx: el.dataset.hlCtaIdx,
            source_type: type,
            source_page: page
          });
        } catch(_) {}
      });
    });
  }

  // ═════════════════════════════════════════════════
  // 觸發時機（三層）
  // ═════════════════════════════════════════════════
  // 1. 頁面標明是結果頁 [data-hl-result-ready] → 立即注入
  // 2. 工具頁 dispatch 'hl:result-ready' 事件 → 注入
  // 3. 自動偵測常見結果容器（#quizResult/.active、#result 等）變 visible → 注入
  var cfg = window.HL_RESULT_CTA || {};
  var isStaticResult = document.querySelector('[data-hl-result-ready]') || cfg.autoRender === true;

  var AUTO_SELECTORS = [
    '#quizResult.active', '#result.active', '#resultPanel.active',
    '#output.show', '#result-panel.active', '.result-page.active',
    '[data-result-visible="true"]'
  ];

  function isVisible(el){
    if (!el) return false;
    try {
      var style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      var r = el.getBoundingClientRect();
      return r.height > 50;
    } catch(_) { return false; }
  }

  function checkAutoVisible(){
    for (var i = 0; i < AUTO_SELECTORS.length; i++){
      var el = document.querySelector(AUTO_SELECTORS[i]);
      if (el && isVisible(el)) { renderCTAs(); return true; }
    }
    return false;
  }

  function setupAutoDetect(){
    // 立刻檢查一次（用戶重新進頁面時結果可能已在）
    if (checkAutoVisible()) return;
    // 監聽 body 的 class/style 變化（結果區塊通常 class='active' 或 display 切換）
    var rendered = false;
    var mo = new MutationObserver(function(){
      if (rendered) return;
      if (checkAutoVisible()) { rendered = true; mo.disconnect(); }
    });
    mo.observe(document.body, {
      subtree: true, attributes: true,
      attributeFilter: ['class','style','data-result-visible']
    });
    // 10 分鐘超時清理
    setTimeout(function(){ try{mo.disconnect();}catch(_){} }, 10 * 60 * 1000);
  }

  function boot(){
    if (isStaticResult) { renderCTAs(); return; }
    // 等工具頁主動 dispatch 事件
    window.addEventListener('hl:result-ready', renderCTAs);
    // 並行啟動自動偵測（萬一頁面沒 dispatch 事件）
    setupAutoDetect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 公開 API（方便工具頁手動觸發）
  window.hlResultCTA = {
    render: renderCTAs,
    recordExploration: recordExploration,
    keepForFuture: keepForFuture
  };
})();
