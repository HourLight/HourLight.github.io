/* ═══════════════════════════════════════
   hl-announce.js — 馥靈全站公告彈窗 v3
   2026/3/24 更新：收費預告版
   ═══════════════════════════════════════ */
(function(){
'use strict';

var ANNOUNCE_VER = '2026-03-31-v5';
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
    <div class="hla-title">🔑 這裡怎麼玩</div>
  </div>
  
  <div class="hla-body">
    <div class="hla-section">
      <div class="hla-icon">✨</div>
      <div class="hla-text">
        <strong>33 大命理、50+ 測驗、130 張牌卡，全部免費用</strong><br>
        命盤資料免費複製不限次。點「🔮 AI 深度解讀指令」可產出專業框架，貼到任何 AI 即可深度解讀，每天免費 3 次。
      </div>
    </div>

    <div class="hla-section">
      <div class="hla-icon">🔑</div>
      <div class="hla-text">
        <strong>想用更多？</strong><br>
        鑰友 $399/月（每天 10 次）｜大師 $999/月（無限次）｜加購 10 次 $199（永久有效）<br>
        <a href="pricing.html" style="color:#f8dfa5">方案說明 →</a>
      </div>
    </div>

    <div class="hla-section">
      <div class="hla-icon">🔮</div>
      <div class="hla-text">
        <strong>抽牌</strong><br>
        1 張免費。3 張以上搭配解讀，單次付費。9 張以上找覺察師一對一。
      </div>
    </div>

    <div class="hla-section hla-highlight">
      <div class="hla-icon">💬</div>
      <div class="hla-text">
        有問題隨時敲 <span style="color:#f8dfa5">LINE @hourlight</span>
      </div>
    </div>
  </div>
  
  <div class="hla-footer">
    <button class="hla-btn" onclick="document.getElementById('hlAnnounce').remove();try{sessionStorage.setItem('${DISMISS_KEY}','1')}catch(e){}">
      知道了，開始探索 ✨
    </button>
  </div>
</div>
`;

var style = document.createElement('style');
style.textContent = `
#hlAnnounce{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;animation:hla-in .4s ease}
@keyframes hla-in{from{opacity:0}to{opacity:1}}
.hla-backdrop{position:absolute;inset:0;background:rgba(5,3,10,.85);backdrop-filter:blur(8px)}
.hla-modal{position:relative;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;
  background:linear-gradient(160deg,rgba(15,10,25,.98),rgba(25,18,38,.95));
  border:1px solid rgba(233,194,125,.2);border-radius:24px;padding:0;
  box-shadow:0 24px 80px rgba(0,0,0,.6),0 0 60px rgba(233,194,125,.06)}
.hla-close{position:absolute;top:16px;right:18px;width:32px;height:32px;display:flex;align-items:center;
  justify-content:center;border-radius:50%;background:rgba(249,240,229,.06);color:rgba(249,240,229,.4);
  font-size:.92rem;cursor:pointer;transition:.2s;z-index:1}
.hla-close:hover{background:rgba(249,240,229,.12);color:rgba(249,240,229,.8)}
.hla-header{text-align:center;padding:28px 24px 16px;border-bottom:1px solid rgba(233,194,125,.08)}
.hla-brand{font-size:.65rem;letter-spacing:3px;color:rgba(233,194,125,.3);margin-bottom:8px}
.hla-title{font-family:'Noto Serif TC',serif;font-size:1.2rem;color:#f8dfa5;font-weight:600;letter-spacing:1px}
.hla-body{padding:20px 24px}
.hla-section{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid rgba(233,194,125,.05)}
.hla-section:last-child{border:none}
.hla-icon{font-size:1.3rem;flex-shrink:0;margin-top:2px}
.hla-text{font-size:.84rem;color:rgba(249,240,229,.6);line-height:1.8}
.hla-text strong{color:rgba(249,240,229,.85);font-weight:400}
.hla-highlight{background:rgba(233,194,125,.04);margin:8px -12px;padding:12px 12px;border-radius:12px;border:1px solid rgba(233,194,125,.1)}
.hla-footer{padding:8px 24px 24px;text-align:center}
.hla-btn{width:100%;padding:14px;border:none;border-radius:999px;
  background:linear-gradient(135deg,#f8dfa5,#ecd098);color:#1a1008;
  font-size:.92rem;font-weight:500;cursor:pointer;font-family:inherit;transition:.3s}
.hla-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(233,194,125,.25)}
@media(max-width:480px){.hla-modal{border-radius:18px}.hla-body{padding:16px 18px}}
`;

document.head.appendChild(style);
document.body.appendChild(overlay);

}, 1500);

})();
