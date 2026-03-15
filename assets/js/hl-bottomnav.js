/**
 * 馥靈之鑰 固定底部導航 v1.0
 * 自動注入全站底部 nav bar，整合音樂開關
 * 使用：在每頁 </body> 前加 <script src="assets/js/hl-bottomnav.js"></script>
 */
(function () {
  'use strict';

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

  var NAV_ITEMS = [
    { icon: SVG_HOME,    label: '首頁',  tip: '回到首頁',      href: 'index.html' },
    { icon: SVG_CARD,    label: '抽牌',  tip: '馥靈牌卡抽牌',  href: 'draw-hl.html' },
    { icon: SVG_CODE,    label: '秘碼',  tip: '馥靈秘碼解析',  href: 'fuling-mima.html' },
    { icon: SVG_DESTINY, label: '命盤',  tip: '十六大命理系統',  href: 'destiny-engine.html' },
    { icon: SVG_QUIZ,    label: '測驗',  tip: '覺察測驗中心',  href: 'quiz-hub.html' },
    { icon: SVG_MAP,     label: '地圖',  tip: '完整網站地圖',  href: 'hourlight-sitemap.html' },
    { icon: SVG_MUSIC,   label: '音樂',  tip: '背景音樂開關',  href: '#', id: 'hl-bn-music' }
  ];

  // 取得目前頁面檔名
  var currentPage = location.pathname.split('/').pop() || 'index.html';

  // ── CSS ──
  var css = `
#hl-bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 9999;
  height: 58px;
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
  padding: 6px 0 4px;
  position: relative;
  transition: color 0.18s;
  gap: 2px;
  -webkit-tap-highlight-color: transparent;
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
  width: 20px;
  height: 20px;
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
  #hl-bottom-nav { height: 54px; }
  .hl-bn-icon { width: 22px; height: 22px; }
  .hl-bn-label { display: none; }
  .hl-bn-tip { display: none; }
}
/* body padding 避免內容被蓋住 */
body { padding-bottom: 68px !important; }
@media (max-width: 480px) { body { padding-bottom: 60px !important; } }
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

    // 標記當前頁
    if (item.href !== '#' && item.href === currentPage) {
      el.classList.add('active');
    }

    el.innerHTML =
      '<span class="hl-bn-icon">' + item.icon + '</span>' +
      '<span class="hl-bn-label">' + item.label + '</span>' +
      '<span class="hl-bn-tip">' + item.tip + '</span>';

    nav.appendChild(el);
  });

  document.body.appendChild(nav);

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

})();
