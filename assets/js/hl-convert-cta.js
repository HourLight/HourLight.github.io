/**
 * 馥靈之鑰 展示頁轉化 CTA 系統
 * hl-convert-cta.js v1.0
 *
 * 在展示頁底部注入「加入會員」橫幅（未登入訪客才顯示）
 * 已登入用戶不顯示，讓體驗乾淨
 *
 * 用法：展示頁 </body> 前加入：
 *   <script src="assets/js/firebase-config.js"></script>
 *   <script src="assets/js/hl-convert-cta.js" data-page-type="brand"></script>
 */
(function () {
  'use strict';

  var thisScript = document.currentScript ||
    (function () { var s = document.getElementsByTagName('script'); return s[s.length - 1]; })();

  var PAGE_TYPE = thisScript.getAttribute('data-page-type') || 'general';

  var T = {
    zh: {
      cta_title:  '你已經在這裡了｜不如把覺察留下來',
      cta_sub:    '免費加入，解鎖所有工具、記錄你的每一次覺察旅程',
      cta_join:   '✨ 免費加入會員',
      cta_login:  '🔑 已有帳號，登入',
      cta_close:  '先看看就好',
      features: ['所有命理計算工具', '130 張牌卡完整解讀', '覺察筆記私人存檔', '個人命盤歷史記錄'],
    },
    en: {
      cta_title:  'You\'re already here — keep the insight',
      cta_sub:    'Join free. Unlock all tools and save your journey.',
      cta_join:   '✨ Join Free',
      cta_login:  '🔑 Sign In',
      cta_close:  'Maybe later',
      features: ['All numerology tools', '130 wisdom card readings', 'Private reflection notes', 'Personal chart history'],
    }
  };

  function getLang() {
    try { return localStorage.getItem('hl-lang') === 'en' ? 'en' : 'zh'; } catch (e) { return 'zh'; }
  }

  function t(key) {
    var l = getLang(); return (T[l] && T[l][key]) || T.zh[key] || key;
  }

  var DISMISS_KEY = 'hl-cta-dismissed-' + Math.floor(Date.now() / (24 * 60 * 60 * 1000 * 3)); // 每 3 天重置

  function shouldShow() {
    try { if (localStorage.getItem(DISMISS_KEY)) return false; } catch (e) {}
    return true;
  }

  function injectCTA() {
    if (!shouldShow()) return;

    var el = document.createElement('div');
    el.id = 'hl-convert-cta';
    el.style.cssText = [
      'position:fixed;bottom:0;left:0;right:0;z-index:8800;',
      'background:linear-gradient(135deg,rgba(7,4,18,0.98),rgba(12,8,24,0.98));',
      'border-top:1px solid rgba(233,194,125,0.25);',
      'backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);',
      'padding:20px 24px 20px;',
      'display:flex;align-items:center;gap:20px;flex-wrap:wrap;',
      'box-shadow:0 -8px 40px rgba(0,0,0,0.5);',
      'transform:translateY(100%);transition:transform .5s cubic-bezier(0.34,1.56,0.64,1);',
    ].join('');

    var lang = getLang();
    var features = T[lang].features;
    var featHtml = features.map(function (f) {
      return '<span style="font-size:0.72rem;color:rgba(193,177,156,0.55);white-space:nowrap;">'
        + '<span style="color:rgba(233,194,125,0.5);margin-right:4px;">✓</span>' + f + '</span>';
    }).join('');

    el.innerHTML = [
      '<div style="flex:1;min-width:200px;">',
        '<div style="font-family:\'Noto Serif TC\',serif;font-size:0.95rem;font-weight:400;',
          'color:#e9c27d;letter-spacing:0.5px;margin-bottom:4px;">',
          '<span class="zh">', T.zh.cta_title, '</span>',
          '<span class="en" style="display:none">', T.en.cta_title, '</span>',
        '</div>',
        '<div style="font-size:0.78rem;color:rgba(193,177,156,0.55);margin-bottom:8px;">',
          '<span class="zh">', T.zh.cta_sub, '</span>',
          '<span class="en" style="display:none">', T.en.cta_sub, '</span>',
        '</div>',
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">', featHtml, '</div>',
      '</div>',
      '<div style="display:flex;gap:10px;flex-shrink:0;flex-wrap:wrap;align-items:center;">',
        '<a href="member-login.html?mode=register" style="padding:11px 22px;border-radius:999px;',
          'background:linear-gradient(135deg,#e9c27d,#cda86e);color:#1a1008;',
          'font-size:0.85rem;font-weight:700;text-decoration:none;letter-spacing:0.5px;white-space:nowrap;">',
          '<span class="zh">', T.zh.cta_join, '</span>',
          '<span class="en" style="display:none">', T.en.cta_join, '</span>',
        '</a>',
        '<a href="member-login.html" style="padding:11px 18px;border-radius:999px;',
          'background:rgba(233,194,125,0.06);border:1px solid rgba(233,194,125,0.22);',
          'color:rgba(233,194,125,0.8);font-size:0.82rem;text-decoration:none;white-space:nowrap;">',
          '<span class="zh">', T.zh.cta_login, '</span>',
          '<span class="en" style="display:none">', T.en.cta_login, '</span>',
        '</a>',
        '<button id="hl-cta-close" style="background:none;border:none;color:rgba(193,177,156,0.35);',
          'font-size:0.75rem;cursor:pointer;font-family:inherit;white-space:nowrap;">',
          '<span class="zh">', T.zh.cta_close, '</span>',
          '<span class="en" style="display:none">', T.en.cta_close, '</span>',
        '</button>',
      '</div>',
    ].join('');

    document.body.appendChild(el);

    // 套用語言
    applyCurrLang(el);

    // 捲動後滑入
    setTimeout(function () {
      el.style.transform = 'translateY(0)';
      // 滑入完成後（transition 0.5s），補底部間距 + 移開浮動元素
      setTimeout(function () {
        var h = el.offsetHeight;
        document.body.style.paddingBottom = h + 'px';
        // LINE 浮動按鈕上移
        var lineBtn = document.getElementById('floatLine') || document.querySelector('.hl-float-line');
        if (lineBtn) lineBtn.style.bottom = (h + 16) + 'px';
        // 🌟 幸運籤按鈕上移
        var fab = document.getElementById('luckyFab') || document.querySelector('.hl-lucky-fab');
        if (fab) fab.style.bottom = (h + 16) + 'px';
      }, 520);
    }, 2500);

    document.getElementById('hl-cta-close').addEventListener('click', function () {
      el.style.transform = 'translateY(100%)';
      try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
      // 收起後恢復原位
      document.body.style.paddingBottom = '';
      var lineBtn = document.getElementById('floatLine') || document.querySelector('.hl-float-line');
      if (lineBtn) lineBtn.style.bottom = '';
      var fab = document.getElementById('luckyFab') || document.querySelector('.hl-lucky-fab');
      if (fab) fab.style.bottom = '';
    });

    // 監聽語言切換
    new MutationObserver(function () {
      var isEn = document.body.classList.contains('lang-en');
      el.querySelectorAll('.zh').forEach(function (n) { n.style.display = isEn ? 'none' : ''; });
      el.querySelectorAll('.en').forEach(function (n) { n.style.display = isEn ? '' : 'none'; });
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  function applyCurrLang(el) {
    var isEn = getLang() === 'en';
    el.querySelectorAll('.zh').forEach(function (n) { n.style.display = isEn ? 'none' : ''; });
    el.querySelectorAll('.en').forEach(function (n) { n.style.display = isEn ? '' : 'none'; });
  }

  function checkAuthAndInject() {
    if (typeof firebase === 'undefined' || !window.FIREBASE_CONFIG ||
        window.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
      // Firebase 未設定：直接顯示 CTA
      injectCTA();
      return;
    }

    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    var auth = firebase.auth();
    auth.onAuthStateChanged(function (user) {
      if (!user) {
        injectCTA(); // 未登入才顯示
      }
      // 已登入：加入左上角「我的城堡」按鈕（已由 auth-gate 處理，若無則補上）
      if (user && !document.getElementById('hl-member-badge')) {
        var badge = document.createElement('a');
        badge.id   = 'hl-member-badge';
        badge.href = 'member-dashboard.html';
        badge.style.cssText = 'position:fixed;top:18px;left:18px;z-index:9001;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:999px;background:rgba(5,3,10,0.88);border:1px solid rgba(233,194,125,0.35);color:#e9c27d;text-decoration:none;font-size:0.8rem;backdrop-filter:blur(12px);font-family:inherit;';
        var name = user.displayName || user.email.split('@')[0];
        badge.innerHTML = '<span>👑</span><span>' + name + '</span>';
        document.body.appendChild(badge);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuthAndInject);
  } else {
    checkAuthAndInject();
  }
})();
