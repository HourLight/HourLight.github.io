/**
 * hl-back-to-castle.js · 從城堡出發的頁面顯示「返回城堡」浮動按鈕
 * ──────────────────────────────────────────────────────────
 * 解決：castle-hub 房間 modal 引導出去做測驗 / 抽牌 / 命盤 後，
 *       用戶找不到回城堡的入口。
 *
 * 判斷邏輯（三重備援）：
 * 1. URL query string 有 ?from=castle → 顯示
 * 2. document.referrer 包含 castle-hub / castle-room → 顯示
 * 3. sessionStorage hl_from_castle = 'true' → 顯示（持續整個 session）
 *
 * 顯示位置：右下角浮動按鈕（不遮主內容）
 * 不顯示於：castle-* 頁本身（避免無限圈套）
 */
(function(){
  'use strict';

  var CURRENT = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  // castle-* 自己不需要返回按鈕
  if (CURRENT.indexOf('castle-') === 0 || CURRENT === 'castle.html') return;

  // 判斷是否從城堡來
  function cameFromCastle(){
    // 1. URL query
    try {
      var q = new URLSearchParams(location.search);
      var from = q.get('from');
      if (from === 'castle' || (from && from.indexOf('castle') > -1)) {
        sessionStorage.setItem('hl_from_castle', 'true');
        return true;
      }
    } catch(e){}

    // 2. sessionStorage flag（持續整個 session）
    try {
      if (sessionStorage.getItem('hl_from_castle') === 'true') return true;
    } catch(e){}

    // 3. referrer
    try {
      var ref = (document.referrer || '').toLowerCase();
      if (ref.indexOf('castle-hub') > -1 || ref.indexOf('castle-room') > -1 ||
          ref.indexOf('castle-game') > -1 || ref.indexOf('app.html') > -1){
        sessionStorage.setItem('hl_from_castle', 'true');
        return true;
      }
    } catch(e){}

    return false;
  }

  if (!cameFromCastle()) return;

  // 注入樣式
  function injectStyle(){
    if (document.getElementById('hlbtc-style')) return;
    var s = document.createElement('style');
    s.id = 'hlbtc-style';
    s.textContent = ''
      + '.hlbtc-btn{position:fixed;right:18px;bottom:84px;z-index:9998;display:inline-flex;align-items:center;gap:6px;padding:10px 16px 10px 14px;background:linear-gradient(135deg,#a07cdc,#7d5bb8);color:#fff;border-radius:999px;text-decoration:none;font-size:.86rem;letter-spacing:.04em;box-shadow:0 6px 20px rgba(125,91,184,.28);transition:transform .2s,box-shadow .2s;font-family:"Noto Serif TC","PingFang TC",serif}'
      + '.hlbtc-btn:hover{transform:translateY(-2px);box-shadow:0 8px 26px rgba(125,91,184,.4)}'
      + '.hlbtc-btn:active{transform:translateY(0)}'
      + '.hlbtc-btn svg{width:16px;height:16px}'
      + '@media(max-width:600px){.hlbtc-btn{right:12px;bottom:80px;padding:9px 14px 9px 12px;font-size:.82rem}}';
    document.head.appendChild(s);
  }

  function render(){
    injectStyle();
    var a = document.createElement('a');
    a.className = 'hlbtc-btn';
    a.href = 'castle-hub.html';
    a.setAttribute('aria-label', '返回內在城堡');
    a.innerHTML = ''
      + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>'
      + '返回城堡';
    // 點擊後清除 flag（已經回到城堡了）
    a.addEventListener('click', function(){
      try { sessionStorage.removeItem('hl_from_castle'); } catch(e){}
    });
    document.body.appendChild(a);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
