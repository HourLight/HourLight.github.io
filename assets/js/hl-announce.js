/* ═══════════════════════════════════════
   hl-announce.js — 馥靈全站公告彈窗 v3
   2026/3/24 更新：收費預告版
   ═══════════════════════════════════════ */
(function(){
'use strict';

var ANNOUNCE_VER = '2026-03-24-v4';
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
        <strong>命盤計算、測驗、抽牌，不用花一毛錢</strong><br>
        所有工具都可以免費使用。算完之後，命盤資料可以隨意複製、寄信箱，完全免費不限次數。
      </div>
    </div>
    
    <div class="hla-section">
      <div class="hla-icon">💡</div>
      <div class="hla-text">
        <strong>「AI深度解讀指令」是什麼？</strong><br>
        我們為每套命理系統打造了專業解讀框架（含書目、分析結構、座標哲學），點「🔮 複製AI深度解讀指令」就會把資料＋框架一起複製，貼到 ChatGPT、Claude、Gemini 就能拿到高品質的深度解讀。這個按鈕每天可以免費用 3 次，午夜自動恢復。
      </div>
    </div>
    
    <div class="hla-section">
      <div class="hla-icon">🔑</div>
      <div class="hla-text">
        <strong>如果您覺得 3 次不太夠用</strong><br>
        馥靈鑰友（$399/月）每天 10 次，馥靈大師（$999/月）無限次。<br>
        也可以單買 10 次 $199，買了永久有效不會過期。<br>
        <a href="pricing.html" style="color:#f8dfa5">完整方案說明 →</a>
      </div>
    </div>
    
    <div class="hla-section">
      <div class="hla-icon">🔮</div>
      <div class="hla-text">
        <strong>馥靈抽牌（130 張智慧牌卡）</strong><br>
        1 張免費隨時抽。3 張以上搭配深度解讀，單次付費。<br>
        覺察師親自解讀的 9 張以上服務，另外預約。
      </div>
    </div>
    
    <div class="hla-section">
      <div class="hla-icon">🔒</div>
      <div class="hla-text">
        <strong>小提醒</strong><br>
        使用外部 AI 工具時，建議關閉「分享對話以改善模型」的設定，保護您的個人資訊。
      </div>
    </div>
    
    <div class="hla-section hla-highlight">
      <div class="hla-icon">💬</div>
      <div class="hla-text">
        有任何問題，隨時敲我們。<br>
        <span style="color:#f8dfa5">LINE 官方帳號 @hourlight</span>
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
