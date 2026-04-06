/* ═══════════════════════════════════════
   hl-announce.js — 馥靈全站公告彈窗 v4
   2026/4/6 更新：推薦碼推廣 + 數字更新
   ═══════════════════════════════════════ */
(function(){
'use strict';

var ANNOUNCE_VER = '2026-04-06-welcome-v4';
var DISMISS_KEY = 'hl_announce_' + ANNOUNCE_VER;

try { if(sessionStorage.getItem(DISMISS_KEY)) return; } catch(e){}

setTimeout(function(){

var overlay = document.createElement('div');
overlay.id = 'hlAnnounce';
overlay.innerHTML = `
<div class="hla-backdrop"></div>
<div class="hla-modal">
  <div class="hla-close" onclick="document.getElementById('hlAnnounce').remove();try{sessionStorage.setItem('${DISMISS_KEY}','1')}catch(e){}" title="關閉">✕</div>

  <div class="hla-header">
    <div class="hla-brand">HOUR LIGHT ✦ 馥靈之鑰</div>
    <div class="hla-title">讀懂自己，活對人生</div>
  </div>

  <div class="hla-body">
    <div class="hla-welcome">
      這裡有 33 套命理系統、101 個心理測驗、130 張原創牌卡，全部線上免費用。<br>
      不用下載，不用預約，打開就能開始認識自己。
    </div>

    <div class="hla-popular">
      <div class="hla-popular-title">大家都在玩 ↓</div>
      <a href="destiny-engine.html" class="hla-link">🔮 33合1命盤引擎 — 一次算完所有命理</a>
      <a href="draw-hl.html" class="hla-link">🃏 130張牌卡抽牌 — 抽一張問問自己</a>
      <a href="quiz-hub.html" class="hla-link">🧠 101款心理測驗 — 從性格到潛意識都有</a>
    </div>

    <div class="hla-gift">
      🎁 註冊就送 48 小時大師體驗，AI 深度解讀隨你用。<br>
      分享給朋友？每多一位註冊，你再多一天。
    </div>
  </div>

  <div class="hla-footer">
    <button class="hla-btn" onclick="document.getElementById('hlAnnounce').remove();try{sessionStorage.setItem('${DISMISS_KEY}','1')}catch(e){}">
      好，我先逛逛
    </button>
    <a href="member-login.html" class="hla-sub-link">免費註冊，領 48 小時體驗 →</a>
  </div>
</div>
`;

var style = document.createElement('style');
style.textContent = `
#hlAnnounce{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;animation:hla-in .4s ease}
@keyframes hla-in{from{opacity:0}to{opacity:1}}
.hla-backdrop{position:absolute;inset:0;background:rgba(5,3,10,.85);backdrop-filter:blur(8px)}
.hla-modal{position:relative;max-width:480px;width:100%;max-height:85vh;overflow-y:auto;
  background:linear-gradient(160deg,rgba(15,10,25,.98),rgba(25,18,38,.95));
  border:1px solid rgba(233,194,125,.2);border-radius:24px;padding:0;
  box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 60px rgba(233,194,125,.06)}
.hla-close{position:absolute;top:16px;right:18px;width:32px;height:32px;display:flex;align-items:center;
  justify-content:center;border-radius:50%;background:rgba(249,240,229,.06);color:rgba(249,240,229,.4);
  font-size:.92rem;cursor:pointer;transition:.2s;z-index:1}
.hla-close:hover{background:rgba(249,240,229,.12);color:rgba(249,240,229,.8)}
.hla-header{text-align:center;padding:28px 24px 16px;border-bottom:1px solid rgba(233,194,125,.08)}
.hla-brand{font-size:.62rem;letter-spacing:3px;color:rgba(233,194,125,.3);margin-bottom:8px}
.hla-title{font-family:'Noto Serif TC',serif;font-size:1.15rem;color:#f8dfa5;font-weight:600;letter-spacing:1px}
.hla-body{padding:20px 24px}
.hla-welcome{font-size:.84rem;color:rgba(249,240,229,.55);line-height:1.9;margin-bottom:16px}
.hla-popular{margin-bottom:16px}
.hla-popular-title{font-size:.72rem;color:rgba(233,194,125,.4);letter-spacing:.15em;margin-bottom:10px}
.hla-link{display:block;padding:10px 14px;margin-bottom:6px;border-radius:12px;
  background:rgba(233,194,125,.04);border:1px solid rgba(233,194,125,.08);
  color:rgba(249,240,229,.7);font-size:.82rem;text-decoration:none;transition:.2s;line-height:1.5}
.hla-link:hover{background:rgba(233,194,125,.08);color:#f8dfa5;border-color:rgba(233,194,125,.15)}
.hla-gift{font-size:.82rem;color:rgba(249,240,229,.55);line-height:1.8;
  background:rgba(233,194,125,.04);padding:14px 16px;border-radius:12px;
  border:1px solid rgba(233,194,125,.1)}
.hla-footer{padding:12px 24px 24px;text-align:center}
.hla-btn{width:100%;padding:14px;border:none;border-radius:999px;
  background:linear-gradient(135deg,#f8dfa5,#ecd098);color:#1a1008;
  font-size:.9rem;font-weight:500;cursor:pointer;font-family:inherit;transition:.3s}
.hla-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(233,194,125,.25)}
.hla-sub-link{display:inline-block;margin-top:10px;font-size:.76rem;color:rgba(233,194,125,.45);
  text-decoration:none;transition:.2s;letter-spacing:.03em}
.hla-sub-link:hover{color:#f8dfa5}
@media(max-width:480px){.hla-modal{border-radius:18px}.hla-body{padding:16px 18px}.hla-footer{padding:10px 18px 20px}}
`;

document.head.appendChild(style);
document.body.appendChild(overlay);

}, 1500);

})();
