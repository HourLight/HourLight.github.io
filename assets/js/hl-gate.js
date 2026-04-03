/**
 * 馥靈之鑰 全站互動攔截器 v2.0
 * 
 * 設計邏輯：
 * ► 用戶可以自由瀏覽所有頁面（不擋頁面載入）
 * ► 用戶要「做事」（按按鈕、抽牌、算命盤、做測驗、提交表單）時，
 *   如果未登入 → 彈出登入/註冊視窗
 * ► 登入後自動繼續原本的操作
 * 
 * 安全原則：Fail-Open
 * - Firebase 沒載入 → 放行
 * - JS 報錯 → 放行
 * - 超過 8 秒沒回應 → 放行
 * - 已登入 → 完全不介入
 */
(function(){
  'use strict';

  // ═══ 不需要攔截的頁面 ═══
  var SKIP = ['member-login.html','app.html','admin-dashboard.html','member-dashboard.html','index.html','privacy.html','terms.html','hourlight-sitemap.html'];
  var page = (location.pathname.split('/').pop()||'index.html').split('?')[0];
  if (SKIP.indexOf(page) > -1) return;

  var isLoggedIn = false, authReady = false, pendingAction = null, overlayEl = null;

  // 1. 等 Firebase
  var retries = 0;
  var safety = setTimeout(function(){ authReady=true; isLoggedIn=true; }, 8000);

  function checkAuth(){
    if (authReady) return;
    if (typeof firebase!=='undefined' && firebase.apps && firebase.apps.length>0) {
      try {
        firebase.auth().onAuthStateChanged(function(u){
          clearTimeout(safety); authReady=true; isLoggedIn=!!u;
        });
      } catch(e){ clearTimeout(safety); authReady=true; isLoggedIn=true; }
    } else if (retries<20) { retries++; setTimeout(checkAuth,400); }
    else { clearTimeout(safety); authReady=true; isLoggedIn=true; }
  }
  setTimeout(checkAuth,200);

  // 2. 判斷互動元素
  function isInteractive(el){
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toLowerCase();

    // 排除：導航/footer/音樂/漢堡/LINE/彈窗自身
    if (el.closest){
      if (el.closest('nav,.rb-topbar,.hl-home-nav,.hl-footer,footer,.concept-nav,.hl-bottomnav,#hl-bottom-nav,.hl-line-fab,#hl-gate-overlay,#matchBtn,[data-no-gate]')) return false;
    }
    if (el.classList && (el.classList.contains('rb-hamburger')||el.classList.contains('hl-music-toggle')||el.classList.contains('hl-nav-toggle')||el.classList.contains('hl-line-fab'))) return false;

    // 純頁面導航連結（無 onclick）
    if (tag==='a') {
      var href = el.getAttribute('href')||'';
      if (!el.getAttribute('onclick') && /^(https?:|mailto:|tel:|#|[a-z].*\.html|\/[a-z])/.test(href)) return false;
    }

    // 互動元素
    if (tag==='button') return true;
    if (tag==='input' && /^(submit|button)$/i.test(el.type||'')) return true;
    if (el.getAttribute && el.getAttribute('onclick')) return true;
    if (tag==='a' && el.classList) {
      var cl = el.classList;
      if (cl.contains('hl-v2-btn-primary')||cl.contains('hl-v2-btn')||cl.contains('btn')||cl.contains('cta')||cl.contains('draw-btn')||cl.contains('submit-btn')||cl.contains('calc-btn')||cl.contains('rb-topbar-cta')) return true;
      // href 是 javascript: 的連結
      if (/^javascript:/i.test(el.getAttribute('href')||'')) return true;
    }
    // select / textarea / 一般 input 是資料輸入元素，不攔截
    // 原本攔截 select/textarea 會導致用戶無法填寫生日、性別、問題等欄位

    return false;
  }

  // 3. 登入彈窗
  function createOverlay(){
    if (overlayEl) return overlayEl;
    overlayEl = document.createElement('div');
    overlayEl.id = 'hl-gate-overlay';
    overlayEl.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(8,6,4,.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);align-items:center;justify-content:center;font-family:"Noto Serif TC","LXGW WenKai TC",Georgia,serif';

    overlayEl.innerHTML = '<div style="text-align:center;max-width:420px;padding:48px 32px;animation:hlGF .5s ease">'
      + '<div style="font-size:48px;margin-bottom:16px;opacity:.8">🔑</div>'
      + '<div style="font-size:20px;color:#f8dfa5;letter-spacing:.12em;margin-bottom:10px;font-weight:300">登入後，這些工具都是你的</div>'
      + '<div style="font-size:13px;color:#a89878;line-height:2;margin-bottom:28px;letter-spacing:.05em">免費帳號即可使用所有覺察工具<br>一鍵 Google 登入，30 秒搞定</div>'
      + '<button id="hlGG" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 20px;background:rgba(233,194,125,.12);border:1px solid rgba(233,194,125,.4);border-radius:12px;color:#f8dfa5;font-size:15px;cursor:pointer;font-family:inherit;letter-spacing:.08em;transition:all .25s;margin-bottom:12px">'
      +   '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'
      +   'Google 快速登入'
      + '</button>'
      + '<a href="member-login.html" style="display:block;padding:12px 20px;border:1px solid rgba(233,194,125,.2);border-radius:12px;color:#999;font-size:13px;text-decoration:none;letter-spacing:.06em;transition:all .25s;margin-bottom:20px">Email 登入 / 註冊</a>'
      + '<div style="font-size:11px;color:#444;margin-top:16px;letter-spacing:.05em;line-height:1.8">免費帳號 ✦ 不需信用卡 ✦ 資料嚴格保護</div>'
      + '</div>';

    var s = document.createElement('style');
    s.textContent = '@keyframes hlGF{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}';
    document.head.appendChild(s);
    document.body.appendChild(overlayEl);

    // Google 登入
    document.getElementById('hlGG').onclick = function(){
      var b=this; b.textContent='登入中...'; b.style.opacity='.5'; b.style.pointerEvents='none';
      try {
        firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(function(){
          isLoggedIn=true; hideOL();
          if(pendingAction){try{pendingAction();}catch(e){} pendingAction=null;}
        }).catch(function(){
          b.textContent='登入失敗，請再試一次'; b.style.opacity='1'; b.style.pointerEvents='auto';
          setTimeout(function(){b.textContent='Google 快速登入';},2500);
        });
      } catch(e){ location.href='member-login.html'; }
    };

    return overlayEl;
  }

  function showOL(){ createOverlay().style.display='flex'; document.body.style.overflow='hidden'; }
  function hideOL(){ if(overlayEl) overlayEl.style.display='none'; document.body.style.overflow=''; }

  // 4. 全域攔截（capture phase）
  document.addEventListener('click', function(e){
    if (isLoggedIn||!authReady) return;
    var el=e.target, depth=0;
    while(el && depth<6){
      if(isInteractive(el)){
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        pendingAction = function(){ el.click(); };
        showOL();
        return;
      }
      el=el.parentElement; depth++;
    }
  }, true);

  // 5. 表單提交攔截
  document.addEventListener('submit', function(e){
    if (isLoggedIn||!authReady) return;
    e.preventDefault(); e.stopPropagation();
    pendingAction = function(){ e.target.submit(); };
    showOL();
  }, true);

})();
