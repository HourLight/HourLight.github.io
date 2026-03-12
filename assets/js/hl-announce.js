/* ═══════════════════════════════════════
   hl-announce.js — 馥靈全站公告彈窗
   放在需要顯示的頁面底部引入即可
   ═══════════════════════════════════════ */
(function(){
'use strict';

// 設定：公告版本（改版本號會讓已關閉的使用者再看一次）
var ANNOUNCE_VER = '2026-03-12-v1';
var DISMISS_KEY = 'hl_announce_' + ANNOUNCE_VER;

// 已經關過就不再顯示
try { if(sessionStorage.getItem(DISMISS_KEY)) return; } catch(e){}

// 延遲顯示（讓頁面先載入完）
setTimeout(function(){

var overlay = document.createElement('div');
overlay.id = 'hlAnnounce';
overlay.innerHTML = `
<div class="hla-backdrop"></div>
<div class="hla-modal">
  <div class="hla-close" onclick="document.getElementById('hlAnnounce').remove();try{sessionStorage.setItem('${DISMISS_KEY}','1')}catch(e){}" title="關閉">✕</div>
  
  <div class="hla-header">
    <div class="hla-brand">HOUR LIGHT ✦ 馥靈之鑰</div>
    <div class="hla-title">📢 開放測試中</div>
  </div>
  
  <div class="hla-body">
    <div class="hla-section">
      <div class="hla-icon">🤖</div>
      <div class="hla-text">
        <strong>所有測驗與工具皆附有簡易解讀</strong><br>
        想看更詳細的分析？每個結果頁都有「複製 AI 深度解讀提示詞」按鈕——<br>
        貼到 ChatGPT、Claude、Gemini 等任一 AI 工具，即可獲得完整深度解讀。
      </div>
    </div>
    
    <div class="hla-section">
      <div class="hla-icon">🔒</div>
      <div class="hla-text">
        <strong>隱私提醒</strong><br>
        使用 AI 工具時，建議關閉「分享對話以改善模型」等設定，保護你的個人資訊。
      </div>
    </div>
    
    <div class="hla-section">
      <div class="hla-icon">🧪</div>
      <div class="hla-text">
        <strong>目前為開放測試階段</strong><br>
        如遇到任何問題、錯誤或建議，歡迎回報！<br>
        <span style="color:#e9c27d">LINE ID：judyanee</span>
      </div>
    </div>
    
    <div class="hla-section hla-highlight">
      <div class="hla-icon">📅</div>
      <div class="hla-text">
        <strong>2026/3/26 起開始綁定會員登入</strong><br>
        部分進階內容將需要付費使用。<br>
        現在體驗的所有功能，趁免費期好好玩！
      </div>
    </div>
  </div>
  
  <div class="hla-footer">
    <button class="hla-btn" onclick="document.getElementById('hlAnnounce').remove();try{sessionStorage.setItem('${DISMISS_KEY}','1')}catch(e){}">
      我知道了，開始探索 ✨
    </button>
    <a href="https://lin.ee/OQDB5t6" class="hla-link" target="_blank">💬 LINE 聊聊</a>
  </div>
</div>
`;

// 注入 CSS
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
  font-size:.85rem;cursor:pointer;transition:.2s;z-index:1}
.hla-close:hover{background:rgba(249,240,229,.12);color:rgba(249,240,229,.8)}
.hla-header{text-align:center;padding:28px 24px 16px;border-bottom:1px solid rgba(233,194,125,.08)}
.hla-brand{font-size:.65rem;letter-spacing:3px;color:rgba(233,194,125,.3);margin-bottom:8px}
.hla-title{font-family:'Noto Serif TC',serif;font-size:1.2rem;color:#e9c27d;font-weight:600;letter-spacing:1px}
.hla-body{padding:20px 24px}
.hla-section{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(233,194,125,.05)}
.hla-section:last-child{border:none}
.hla-icon{font-size:1.3rem;flex-shrink:0;margin-top:2px}
.hla-text{font-size:.84rem;color:rgba(249,240,229,.6);line-height:1.8}
.hla-text strong{color:rgba(249,240,229,.85);font-weight:400}
.hla-highlight{background:rgba(233,194,125,.04);margin:8px -12px;padding:14px 12px;border-radius:12px;border:1px solid rgba(233,194,125,.1)}
.hla-footer{padding:8px 24px 24px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center}
.hla-btn{width:100%;padding:14px;border:none;border-radius:999px;
  background:linear-gradient(135deg,#e9c27d,#cda86e);color:#1a1008;
  font-size:.92rem;font-weight:500;cursor:pointer;font-family:inherit;transition:.3s}
.hla-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(233,194,125,.25)}
.hla-link{font-size:.78rem;color:rgba(233,194,125,.5);text-decoration:none;transition:.2s}
.hla-link:hover{color:#e9c27d}
@media(max-width:480px){.hla-modal{border-radius:18px}.hla-body{padding:16px 18px}}
`;

document.head.appendChild(style);
document.body.appendChild(overlay);

}, 1500); // 延遲 1.5 秒顯示

})();
