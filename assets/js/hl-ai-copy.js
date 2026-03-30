/**
 * hl-ai-copy.js v3.0
 * 從 window.AI_FRAMEWORKS 讀取框架（由 js/ai-frameworks.js 載入）
 * 次數管控由 hl-ai-gate.js + hl-usage-wall.js 負責
 */
(function(){
'use strict';

window.hlAICopy = function(preId, system, btn) {
  var pre = document.getElementById(preId);
  if (!pre) { alert('找不到命盤資料'); return; }
  var data = pre.textContent;

  // iOS Safari 相容：同步階段先建立 textarea 取得剪貼板權限
  var iosTa = document.createElement('textarea');
  iosTa.value = ' ';
  iosTa.style.cssText = 'position:fixed;opacity:0;top:0;left:0;font-size:16px;';
  document.body.appendChild(iosTa);
  iosTa.focus(); iosTa.select();
  if (btn) btn._iosTa = iosTa;

  if (typeof hlAIGateCheck === 'function') {
    hlAIGateCheck(function() { _doCopy(data, system, btn); });
    return;
  }
  _doCopy(data, system, btn);
};

function _doCopy(data, system, btn) {
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

  // iOS Safari 相容：優先用預佔的 textarea 複製
  var iosTa = btn && btn._iosTa;
  if (iosTa) {
    iosTa.value = txt;
    iosTa.focus(); iosTa.select();
    try { document.execCommand('copy'); } catch(e) {}
    document.body.removeChild(iosTa);
    if (btn) btn._iosTa = null;
    if (btn) {
      var orig = btn.textContent;
      btn.textContent = '✅ 已複製';
      btn.style.background = 'rgba(160,124,220,.25)';
      setTimeout(function() { btn.textContent = orig; btn.style.background = ''; }, 2000);
    }
    return;
  }
  // 一般瀏覽器
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(txt).then(function() {
      if (btn) {
        var orig = btn.textContent;
        btn.textContent = '✅ 已複製';
        btn.style.background = 'rgba(160,124,220,.25)';
        setTimeout(function() { btn.textContent = orig; btn.style.background = ''; }, 2000);
      }
    }).catch(function() { _fbCopy(txt, btn); });
  } else { _fbCopy(txt, btn); }
}

function _fbCopy(txt, btn) {
  var t = document.createElement('textarea');
  t.value = txt; t.style.cssText = 'position:fixed;opacity:0;font-size:16px;';
  document.body.appendChild(t); t.focus(); t.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(t);
  if (btn) { var orig = btn.textContent; btn.textContent = '✅ 已複製'; setTimeout(function() { btn.textContent = orig; }, 2000); }
}

})();
