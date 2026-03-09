/**
 * 馥靈之鑰 固定底部導航 v1.0
 * 自動注入全站底部 nav bar，整合音樂開關
 * 使用：在每頁 </body> 前加 <script src="assets/js/hl-bottomnav.js"></script>
 */
(function () {
  'use strict';

  // ── 告訴 hl-music.js 不要自己建浮動按鈕 ──
  window.HLBottomNavActive = true;

  var NAV_ITEMS = [
    { icon: '🏠', label: '首頁',   tip: '回到首頁',       href: 'index.html' },
    { icon: '✨', label: '抽牌',   tip: '馥靈牌卡抽牌',   href: 'draw-hl.html' },
    { icon: '🔢', label: '秘碼',   tip: '馥靈秘碼解析',   href: 'fuling-mima.html' },
    { icon: '🌌', label: '命盤',   tip: '十大命理系統',   href: 'destiny-engine.html' },
    { icon: '🧠', label: '測驗',   tip: '五大心理測驗',   href: 'quiz-mbti.html' },
    { icon: '🗺️', label: '地圖',  tip: '完整網站地圖',   href: 'hourlight-sitemap.html' },
    { icon: '♪',  label: '音樂',   tip: '背景音樂開關',   href: '#', id: 'hl-bn-music' }
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
  color: #e9c27d;
}
.hl-bn-item.active::after {
  content: '';
  position: absolute;
  top: 0; left: 25%; right: 25%;
  height: 2px;
  background: #e9c27d;
  border-radius: 0 0 2px 2px;
}
.hl-bn-icon {
  font-size: 1.2rem;
  line-height: 1;
  display: block;
  transition: transform 0.15s;
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
  color: #e9c27d;
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
  color: #e9c27d;
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
  .hl-bn-icon { font-size: 1.3rem; }
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
        if (icon) icon.textContent = '♫';
      } else {
        musicBtn.classList.remove('music-playing');
        if (icon) icon.textContent = '♪';
      }
    }

    // 每 800ms 同步一次
    setInterval(syncMusicState, 800);
    document.addEventListener('click', function () {
      setTimeout(syncMusicState, 300);
    });
  }

})();
