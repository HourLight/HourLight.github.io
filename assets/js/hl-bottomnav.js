/**
 * 馥靈之鑰 固定底部導航 v1.0
 * 自動注入全站底部 nav bar，整合音樂開關
 * 使用：在每頁 </body> 前加 <script src="assets/js/hl-bottomnav.js"></script>
 */
(function () {
  'use strict';
  // -- iOS img onerror global fallback --
  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('img').forEach(function(img){
      if(!img.onerror) img.onerror = function(){ this.style.display='none'; };
    });
  });


  // ── 告訴 hl-music.js 不要自己建浮動按鈕 ──
  window.HLBottomNavActive = true;

  var SVG_HOME = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>';
  var SVG_CARD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="11" height="16" rx="2"/><path d="M8 7h3M8 10h5M8 13h2"/><path d="M14 7l5 3-5 3" opacity="0.5"/><circle cx="17" cy="17" r="3" opacity="0.6"/><path d="M16 17l.8.8L18.5 16" opacity="0.6"/></svg>';
  var SVG_CODE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/><path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" opacity="0.4"/><circle cx="12" cy="12" r="3"/></svg>';
  var SVG_DESTINY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><path d="M12 9V3M9 12H3" opacity="0.35"/></svg>';
  var SVG_QUIZ = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 00-2.5 13.5V17h5v-1.5A7 7 0 0012 2z"/><rect x="9.5" y="17" width="5" height="2" rx="1"/><rect x="10" y="19" width="4" height="2" rx="1"/></svg>';
  var SVG_MAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="1,6 1,22 8,18 16,22 23,18 23,2 16,6 8,2"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>';
  var SVG_MUSIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
  var SVG_MUSIC_ON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3" fill="currentColor" opacity="0.4"/><circle cx="18" cy="16" r="3" fill="currentColor" opacity="0.4"/><path d="M19 8c1 .5 1.5 1.5 1 2.5" opacity="0.6"/></svg>';

  var SVG_MATCH='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="9" r="5"/><circle cx="15" cy="15" r="5"/></svg>';
  var SVG_KNOWLEDGE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/></svg>';
  var SVG_MEMBER='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>';
  var SVG_CASTLE='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="1"/><path d="M3 11V7h3V4h2v3h2V4h2v3h2V4h2v3h3v4"/><path d="M9 22v-5a3 3 0 0 1 6 0v5" opacity="0.5"/></svg>';
  var NAV_ITEMS = [
    { icon: SVG_HOME,       label: '首頁',   tip: '回到首頁',              href: 'index.html' },
    { icon: SVG_CARD,       label: '抽牌占卜', tip: '抽牌 × 占卜中心',       href: 'draw-hub.html' },
    { icon: SVG_DESTINY,    label: '命盤',   tip: '命盤中心・33 大系統',    href: 'destiny-hub.html' },
    { icon: SVG_QUIZ,       label: '測驗',   tip: '覺察測驗中心',          href: 'quiz-hub.html' },
    { icon: SVG_KNOWLEDGE,  label: '知識',   tip: '知識學苑',              href: 'knowledge-hub.html' },
    { icon: SVG_CASTLE,     label: '城堡',   tip: '內在城堡探索',          href: 'castle-game.html' },
    { icon: SVG_MEMBER,     label: '會員',   tip: '會員中心',              href: 'app.html' },
    { icon: SVG_MUSIC,      label: '音樂',   tip: '背景音樂開關',          href: '#', id: 'hl-bn-music' }
  ];

  // 取得目前頁面檔名
  var currentPage = location.pathname.split('/').pop() || 'index.html';

  // hub 對應表：在這些頁面時，高亮對應的 hub 按鈕
  var hubMap = {
    // 抽牌 hub
    'draw-hl.html':'draw-hub.html','draw-light.html':'draw-hub.html',
    'tarot-draw.html':'draw-hub.html','angel-oracle.html':'draw-hub.html',
    'past-life.html':'draw-hub.html','witch-power.html':'draw-hub.html',
    'projection-cards.html':'draw-hub.html',
    'pet-reading.html':'draw-hub.html','family-reading.html':'draw-hub.html',
    'draw-spa.html':'draw-hub.html','draw-nail.html':'draw-hub.html',
    // 命盤 hub
    'destiny-engine.html':'destiny-hub.html','destiny-match.html':'destiny-hub.html',
    'bazi-calculator.html':'destiny-hub.html','ziwei-calculator.html':'destiny-hub.html',
    'astro-calculator.html':'destiny-hub.html','hd-calculator.html':'destiny-hub.html',
    'maya-calculator.html':'destiny-hub.html','lifepath-calculator.html':'destiny-hub.html',
    'triangle-calculator.html':'destiny-hub.html','fuling-mima.html':'destiny-hub.html',
    'name-oracle.html':'destiny-hub.html','rainbow-number.html':'destiny-hub.html',
    'cardology.html':'destiny-hub.html','celtic-tree.html':'destiny-hub.html',
    'gene-keys.html':'destiny-hub.html','chiron-lilith.html':'destiny-hub.html',
    'nakshatra.html':'destiny-hub.html','bg5-career.html':'destiny-hub.html',
    'nine-star-ki.html':'destiny-hub.html','xiuyao.html':'destiny-hub.html',
    'tieban.html':'destiny-hub.html','taiyi.html':'destiny-hub.html',
    'wuyun-liuqi.html':'destiny-hub.html','helo-lishu.html':'destiny-hub.html',
    'korean-saju.html':'destiny-hub.html','meihua-yishu.html':'destiny-hub.html',
    // 占卜類（已併入抽牌占卜 hub）
    'yijing-oracle.html':'draw-hub.html','liuren-oracle.html':'draw-hub.html',
    'qimen-dunjia.html':'draw-hub.html',
    'liuren.html':'draw-hub.html','phone-oracle.html':'draw-hub.html',
    'poker-oracle.html':'draw-hub.html','akashic-records.html':'draw-hub.html',
    'yuan-chen-gong.html':'draw-hub.html','abundance-prayer.html':'draw-hub.html',
    'moon-calendar.html':'draw-hub.html',
    'scent-navigator.html':'draw-hub.html',
    'divination-hub.html':'draw-hub.html',
    'time-space-oracle.html':'draw-hub.html','temporal-threads.html':'draw-hub.html',
    'dream-decoder.html':'draw-hub.html','number-oracle.html':'draw-hub.html',
    'body-map-oracle.html':'draw-hub.html','color-oracle.html':'draw-hub.html',
    'word-oracle.html':'draw-hub.html','season-oracle.html':'draw-hub.html',
    'mirror-oracle.html':'draw-hub.html','runes-oracle.html':'draw-hub.html',
    'name-oracle.html':'draw-hub.html','poe-blocks.html':'draw-hub.html',
    'meihua-yishu.html':'draw-hub.html','magic-morning.html':'draw-hub.html',
    'cognitive-aroma.html':'draw-hub.html','angel-stories.html':'draw-hub.html',
    // 知識學苑
    'knowledge-hub.html':'knowledge-hub.html',
    'aromatherapy-science.html':'knowledge-hub.html','certification-guide.html':'knowledge-hub.html',
    'blending-guide.html':'knowledge-hub.html','yuan-chen-guide.html':'knowledge-hub.html',
    'kids-aromatherapy.html':'knowledge-hub.html','reiki-guide.html':'knowledge-hub.html',
    'skincare-science.html':'knowledge-hub.html','massage-guide.html':'knowledge-hub.html',
    'aroma-garden.html':'knowledge-hub.html','cognitive-aromatherapy-theory.html':'knowledge-hub.html',
    'meridian-guide.html':'knowledge-hub.html','chakra-guide.html':'knowledge-hub.html',
    'crystal-guide.html':'knowledge-hub.html','five-elements-guide.html':'knowledge-hub.html',
    'nine-purple-fire-guide.html':'knowledge-hub.html','hour-methodology.html':'knowledge-hub.html',
    'nail-energy-guide.html':'knowledge-hub.html','naha-study-guide.html':'knowledge-hub.html',
    'blog-hub.html':'knowledge-hub.html',
  };
  var activeHref = hubMap[currentPage] || currentPage;

  // ── CSS ──
  var css = `
#hl-bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 9999;
  height: calc(58px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: rgba(14, 9, 28, 0.97);
  border-top: 1px solid rgba(233,194,125,0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: stretch;
  justify-content: space-around;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.35);
}
.hl-bn-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: rgba(196,183,166,0.7);
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
  padding: 8px 0 6px;
  min-height: 48px;
  position: relative;
  transition: color 0.18s;
  gap: 3px;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.hl-bn-item:hover, .hl-bn-item.active {
  color: #f8dfa5;
}
.hl-bn-item.active::after {
  content: '';
  position: absolute;
  top: 0; left: 25%; right: 25%;
  height: 2px;
  background: #f8dfa5;
  border-radius: 0 0 2px 2px;
}
.hl-bn-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
  flex-shrink: 0;
}
.hl-bn-icon svg {
  width: 100%;
  height: 100%;
  display: block;
}
.hl-bn-item:hover .hl-bn-icon {
  transform: translateY(-1px);
}
.hl-bn-label {
  font-size: 0.62rem;
  letter-spacing: 0.04em;
  line-height: 1;
}
/* 音樂播放中動態 */
.hl-bn-item.music-playing .hl-bn-icon {
  color: #f8dfa5;
  animation: hl-bn-pulse 1.4s ease-in-out infinite;
}
@keyframes hl-bn-pulse {
  0%,100%{ transform: scale(1) translateY(0); }
  50%{ transform: scale(1.15) translateY(-1px); }
}
/* Tooltip（桌機 hover） */
.hl-bn-tip {
  position: absolute;
  bottom: 68px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(14,9,28,0.95);
  color: #f8dfa5;
  font-size: 0.72rem;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid rgba(233,194,125,0.25);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  letter-spacing: 0.04em;
}
.hl-bn-tip::after {
  content: '';
  position: absolute;
  top: 100%; left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(233,194,125,0.25);
}
@media (hover: hover) {
  .hl-bn-item:hover .hl-bn-tip {
    opacity: 1;
  }
}
/* 手機：隱藏 label，縮小 */
@media (max-width: 480px) {
  #hl-bottom-nav { height: calc(54px + env(safe-area-inset-bottom, 0px)); }
  .hl-bn-icon { width: 22px; height: 22px; }
  .hl-bn-label { display: none; }
  .hl-bn-tip { display: none; }
}
/* body padding 避免內容被蓋住（含 iPhone 底部安全區域） */
body { padding-bottom: calc(68px + env(safe-area-inset-bottom, 0px)) !important; }
@media (max-width: 480px) { body { padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px)) !important; } }
`;

  // ── 建立 style tag ──
  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── 建立 nav ──
  var nav = document.createElement('nav');
  nav.id = 'hl-bottom-nav';
  nav.setAttribute('aria-label', '底部導航');

  NAV_ITEMS.forEach(function (item) {
    var el;
    if (item.href === '#') {
      el = document.createElement('button');
      el.type = 'button';
    } else {
      el = document.createElement('a');
      el.href = item.href;
    }
    el.className = 'hl-bn-item';
    if (item.id) el.id = item.id;

    // 標記當前頁（含 hub 對應）
    if (item.href !== '#' && item.href === activeHref) {
      el.classList.add('active');
    }

    el.innerHTML =
      '<span class="hl-bn-icon">' + item.icon + '</span>' +
      '<span class="hl-bn-label">' + item.label + '</span>' +
      '<span class="hl-bn-tip">' + item.tip + '</span>';

    nav.appendChild(el);
  });

  document.body.appendChild(nav);

  // ── 在 footer-links 注入全站共用連結 ──
  var footerLinks = document.querySelector('.hl-footer-links');
  if (footerLinks) {
    var injectFooterLink = function(href, label){
      if (!footerLinks.querySelector('a[href="' + href + '"]')) {
        var a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        footerLinks.appendChild(a);
      }
    };
    injectFooterLink('pricing.html', '服務價目');
    injectFooterLink('price-list.html', '價目表');
    injectFooterLink('pricing.html#contact', '客服聯絡');
    injectFooterLink('ai-about.html', 'AI 認識我們');
  }

  // ── 在 footer copyright 區注入客服聯絡資訊（一行） ──
  var copyEl = document.querySelector('.hl-footer-copyright');
  if (copyEl && !document.getElementById('hl-footer-contact-line')) {
    var contactLine = document.createElement('div');
    contactLine.id = 'hl-footer-contact-line';
    contactLine.style.cssText = 'font-size:.78rem;color:rgba(248,223,165,.7);margin:8px 0;letter-spacing:.5px;line-height:1.8';
    contactLine.innerHTML =
      '客服 LINE <a href="https://lin.ee/RdQBFAN" target="_blank" rel="noopener" style="color:#f8dfa5;text-decoration:underline">@hourlight</a>' +
      '　|　服務信箱 <a href="mailto:info@hourlightkey.com" style="color:#f8dfa5;text-decoration:underline">info@hourlightkey.com</a>' +
      '　|　追蹤 Facebook <a href="https://www.facebook.com/SUFUYASPA" target="_blank" rel="noopener" style="color:#f8dfa5;text-decoration:underline">HOUR LIGHT 粉絲團</a>' +
      '　|　服務時間 週一至週五 10:00–18:00';
    copyEl.parentNode.insertBefore(contactLine, copyEl);
  }

  // ── 音樂整合 ──
  var musicBtn = document.getElementById('hl-bn-music');
  if (musicBtn) {
    musicBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (window.hlToggleMusic) {
        window.hlToggleMusic();
      }
    });

    // 偵測音樂狀態，同步按鈕樣式
    function syncMusicState() {
      var audio = document.getElementById('hlBgMusic');
      if (!audio) return;
      var icon = musicBtn.querySelector('.hl-bn-icon');
      if (!audio.paused) {
        musicBtn.classList.add('music-playing');
        if (icon) icon.innerHTML = SVG_MUSIC_ON;
      } else {
        musicBtn.classList.remove('music-playing');
        if (icon) icon.innerHTML = SVG_MUSIC;
      }
    }

    // 每 800ms 同步一次
    setInterval(syncMusicState, 800);
    document.addEventListener('click', function () {
      setTimeout(syncMusicState, 300);
    });
  }

  // ── 動態載入 exit-intent popup ──
  (function loadExitIntent() {
    // 從 bottomnav 自身 src 推算 assets/js/ 路徑，確保子目錄也能正確載入
    var scripts = document.querySelectorAll('script[src*="hl-bottomnav"]');
    var basePath = 'assets/js/';
    if (scripts.length) {
      var src = scripts[scripts.length - 1].getAttribute('src') || '';
      basePath = src.replace('hl-bottomnav.js', '');
    }
    var s = document.createElement('script');
    s.src = basePath + 'hl-exit-intent.js';
    s.defer = true;
    document.body.appendChild(s);
  })();

})();
