/**
 * 馥靈之鑰 Exit-Intent Popup v1.0
 * Desktop: 偵測滑鼠移出 viewport 上方
 * Mobile: 偵測 visibilitychange（切到背景）
 * 關閉後 24 小時不再顯示（localStorage）
 */
(function () {
  'use strict';

  // 排除頁面
  var SKIP_PAGES = ['member-login.html', 'app.html', 'admin-dashboard.html', 'checkout.html', 'privacy.html', 'terms.html', 'platform-admin.html', 'booking-admin.html'];
  var page = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  if (SKIP_PAGES.indexOf(page) > -1) return;

  // 24 小時內已關閉不再顯示
  var DISMISSED_KEY = 'hl_exit_intent_dismissed';
  var dismissed = localStorage.getItem(DISMISSED_KEY);
  if (dismissed && (Date.now() - parseInt(dismissed, 10)) < 24 * 60 * 60 * 1000) return;

  var shown = false;

  // 注入 CSS
  var css = document.createElement('style');
  css.textContent = [
    '#hlExitOverlay{position:fixed;inset:0;z-index:100000;background:rgba(6,4,14,.88);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:20px}',
    '#hlExitOverlay.show{display:flex}',
    '#hlExitBox{background:#0a0714;border:1px solid rgba(248,223,165,.2);border-radius:20px;padding:36px 28px 28px;max-width:380px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5);animation:hlExitUp .35s cubic-bezier(.4,0,.2,1);text-align:center}',
    '@keyframes hlExitUp{from{opacity:0;transform:translateY(20px) scale(.96)}to{opacity:1;transform:none}}',
    '#hlExitBox .hle-exit-title{font-size:1.1rem;color:#f8dfa5;letter-spacing:.1em;margin-bottom:8px}',
    '#hlExitBox .hle-exit-desc{font-size:.88rem;color:rgba(244,240,235,.75);line-height:1.7;margin-bottom:22px}',
    '#hlExitBox .hle-exit-btns{display:flex;flex-direction:column;gap:10px}',
    '#hlExitBox .hle-exit-btn{padding:14px 20px;border-radius:40px;font-size:.9rem;font-weight:600;letter-spacing:.1em;cursor:pointer;transition:all .3s;font-family:inherit;text-decoration:none;display:block;text-align:center}',
    '#hlExitBox .hle-exit-btn.primary{background:linear-gradient(135deg,#c9985e,#f0d48a);color:#0a0714;border:none}',
    '#hlExitBox .hle-exit-btn.primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(240,212,138,.25)}',
    '#hlExitBox .hle-exit-btn.secondary{background:transparent;color:#f0d48a;border:1px solid rgba(240,212,138,.25)}',
    '#hlExitBox .hle-exit-btn.secondary:hover{border-color:rgba(240,212,138,.5);background:rgba(240,212,138,.05)}',
    '#hlExitBox .hle-exit-close{position:absolute;top:12px;right:16px;background:none;border:none;color:rgba(200,188,170,.5);font-size:1.2rem;cursor:pointer;padding:6px;transition:color .2s}',
    '#hlExitBox .hle-exit-close:hover{color:#f4f0eb}'
  ].join('\n');
  document.head.appendChild(css);

  // 建立 popup DOM
  var overlay = document.createElement('div');
  overlay.id = 'hlExitOverlay';
  overlay.innerHTML =
    '<div id="hlExitBox" style="position:relative">' +
    '<button class="hle-exit-close" aria-label="關閉">&#x2715;</button>' +
    '<div class="hle-exit-title">等一下，有個東西你可能會喜歡</div>' +
    '<div class="hle-exit-desc">花 2 分鐘認識自己一點點，不花錢、不用填資料。</div>' +
    '<div class="hle-exit-btns">' +
    '<a href="quiz-hub.html" class="hle-exit-btn primary">做個測驗</a>' +
    '<a href="draw-hl.html" class="hle-exit-btn secondary">免費抽一張牌</a>' +
    '</div>' +
    '</div>';

  function showPopup() {
    if (shown) return;
    shown = true;
    document.body.appendChild(overlay);
    // 小延遲確保 DOM 渲染
    requestAnimationFrame(function () {
      overlay.classList.add('show');
    });
    // GA4 追蹤
    if (typeof gtag === 'function') {
      gtag('event', 'exit_intent_shown', { event_category: 'engagement', event_label: page });
    }
  }

  function closePopup() {
    overlay.classList.remove('show');
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setTimeout(function () {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 400);
  }

  // 關閉事件
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.closest('.hle-exit-close')) {
      closePopup();
    }
    // 點按鈕也關（但先 navigate）
    if (e.target.closest('.hle-exit-btn')) {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      if (typeof gtag === 'function') {
        var label = e.target.textContent.trim();
        gtag('event', 'exit_intent_click', { event_category: 'engagement', event_label: label });
      }
    }
  });

  // ESC 關閉
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && shown) closePopup();
  });

  // ── Desktop: mouseleave viewport 上方 ──
  // 至少等 5 秒才啟動偵測，避免誤觸
  var desktopReady = false;
  setTimeout(function () { desktopReady = true; }, 5000);

  document.addEventListener('mouseleave', function (e) {
    if (!desktopReady || shown) return;
    if (e.clientY <= 0) showPopup();
  });

  // ── Mobile: visibilitychange ──
  var mobileReady = false;
  setTimeout(function () { mobileReady = true; }, 10000);

  document.addEventListener('visibilitychange', function () {
    if (!mobileReady || shown) return;
    if (document.visibilityState === 'hidden') {
      // 記住要顯示，回來時觸發
      var onReturn = function () {
        if (document.visibilityState === 'visible' && !shown) {
          showPopup();
          document.removeEventListener('visibilitychange', onReturn);
        }
      };
      document.addEventListener('visibilitychange', onReturn);
    }
  });

})();
