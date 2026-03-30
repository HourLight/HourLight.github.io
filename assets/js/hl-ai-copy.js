/**
 * hl-ai-copy.js v4.0
 * 從 window.AI_FRAMEWORKS 讀取框架（由 js/ai-frameworks.js 載入）
 * 次數管控由 hl-ai-gate.js + hl-usage-wall.js 負責
 *
 * iOS Safari 正確策略：
 * 先同步組內容+複製（在 user gesture context 內完成），
 * 再非同步 hlAIGateCheck 計次，不影響複製結果。
 */
(function(){
'use strict';

window.hlAICopy = function(preId, system, btn) {
  var pre = document.getElementById(preId);
  if (!pre) { alert('找不到命盤資料'); return; }
  var data = pre.textContent;

  // 同步組好完整內容
  var fw = (window.AI_FRAMEWORKS && window.AI_FRAMEWORKS[system]) || {};
  var framework = fw.framework || '';
  var txt = '═══ 馥靈之鑰｜' + (fw.title || system) + ' 深度解讀 AI 指令 ═══\n\n';
  txt += data;
  if (framework) { txt += '\n\n' + framework; }
  txt += '\n\n═══ 語氣要求 ═══\n';
  txt += '► 像一個很懂人的閨蜜在說真話，溫暖但不軟弱\n';
  txt += '► 帶有香氣意象（精油、花草、自然元素的比喻）\n';
  txt += '► 不使用「梳理」「節奏」等詞彙，不使用雙破折號\n';
  txt += '► 請將術語轉譯為日常語言\n';
  txt += '\n═══ H.O.U.R. 行動建議（必須回答）═══\n';
  txt += 'H（靜心殿）→ 現在最需要先安頓什麼？\n';
  txt += 'O（覺察廳）→ 這組資料在提醒什麼反覆出現的模式？\n';
  txt += 'U（解鎖密室）→ 今天就能做的一個具體動作\n';
  txt += 'R（啟程塔）→ 接下來一週的方向建議\n';
  txt += '\n🔗 馥靈之鑰 hourlightkey.com';

  // 同步複製（iOS Safari 在 user gesture context 內，必須同步完成）
  _syncCopy(txt);

  // UI 回饋
  if (btn) {
    var orig = btn.textContent;
    btn.textContent = '✅ 已複製';
    btn.style.background = 'rgba(160,124,220,.25)';
    setTimeout(function() { btn.textContent = orig; btn.style.background = ''; }, 2000);
  }

  // 非同步計次（已複製完成，只記錄次數；未登入才彈登入框）
  if (typeof hlAIGateCheck === 'function') {
    setTimeout(function() { hlAIGateCheck(function(){}); }, 80);
  }
};

function _syncCopy(txt) {
  // 同步複製，iOS Safari 相容寫法（position:fixed + top:50% + opacity:.01）
  var t = document.createElement('textarea');
  t.value = txt;
  t.setAttribute('readonly', '');
  t.style.cssText = 'position:fixed;top:50%;left:50%;width:2em;height:2em;'
    + 'padding:0;border:none;outline:none;background:transparent;'
    + 'font-size:16px;opacity:.01;transform:translate(-50%,-50%);z-index:99999;';
  document.body.appendChild(t);
  if (/ipad|iphone/i.test(navigator.userAgent)) {
    t.focus();
    var rng = document.createRange();
    rng.selectNodeContents(t);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rng);
    t.setSelectionRange(0, 999999);
  } else {
    t.focus();
    t.select();
  }
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(t);
  // 同時嘗試現代 API（非 iOS 的備援）
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(txt).catch(function(){});
  }
}

})();
