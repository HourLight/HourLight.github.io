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
  txt += '\n\n╔══════ 解讀要求（請完整執行以下所有指令）══════╗\n\n';

  txt += '【第一步：找出主要矛盾（必做，是整組解讀的靈魂）】\n';
  txt += '在所有資料中，找出能量最衝突或最有張力的兩個維度，\n';
  txt += '點名它們，說出這個張力在說什麼問題。\n';
  txt += '這個矛盾才是提問者真正在意的事，逐項翻譯是表面，矛盾才是核心。\n\n';

  txt += '【第二步：問題面向自動識別】\n';
  txt += '根據上方資料和命盤特質，判斷最核心的人生面向是：\n';
  txt += '感情與關係 / 事業與工作 / 財富與資源 / 家庭與家族 / 身心健康 / 決策與方向 / 自我覺察\n';
  txt += '（選一個，用這個鏡頭貫穿整組解讀，每一段都要回扣這個面向）\n\n';

  txt += '【第三步：能量層次三層拆解（遇到阻滯/不順的方向必做）】\n';
  txt += '任何「卡住」「逆位」「忌神」「空亡」「未定義」等不順的方向，都從三層分析：\n';
  txt += '  第一層：能量延遲——時機還沒到，或前一個階段還沒收尾\n';
  txt += '  第二層：需要向內——這個能量正在往內整合，不在外在顯現\n';
  txt += '  第三層：陰影浮現——這個方向的負面模式正在作用，需要被看見\n';
  txt += '（說清楚屬於哪一層，不要籠統說「能量受阻」）\n\n';

  txt += '【第四步：H.O.U.R. 行動建議（必須回答，要夠具體）】\n';
  txt += 'H（靜心殿）→ 根據命盤，現在最需要先安頓什麼？\n';
  txt += '  給出一個今天就能做的「讓身體靜下來」的具體動作\n';
  txt += 'O（覺察廳）→ 這組資料在提醒什麼「反覆出現的模式」？\n';
  txt += '  說出那個本人可能知道但不想正視的事\n';
  txt += 'U（解鎖密室）→ 今天就能踏出的第一步是什麼？\n';
  txt += '  要夠具體到「明天早上可以執行」，不是「保持正向」這種模糊建議\n';
  txt += 'R（啟程塔）→ 接下來一週的行動節奏，用三個關鍵字描述\n\n';

  txt += '【第五步：提問回扣收束】\n';
  txt += '最後一段永遠回扣上方命盤的核心矛盾——\n';
  txt += '這組資料的整體訊息，最核心的一句話是什麼？\n';
  txt += '（不是給答案，是給座標：此刻站在哪裡、需要往哪個方向調整）\n\n';

  txt += '╔══════ 語氣與風格要求 ══════╗\n';
  txt += '► 像一個很懂人的閨蜜在說真話：溫暖，但不軟弱；直接，但不刺傷\n';
  txt += '► 帶有香氣意象：每個段落至少一個精油或自然氣味的比喻\n';
  txt += '► 禁用詞（絕對不出現）：梳理、療癒、調頻、靈魂、頻率、顯化、宇宙安排、命定、雙破折號——\n';
  txt += '► 代用詞：用「校準」代替「梳理」，用「座標」代替「命運」，用「整合」代替「療癒」\n';
  txt += '► 術語必須轉譯：不說「化忌入財帛」，說「錢這件事反覆在考驗你」\n';
  txt += '► 結尾：用一段帶有香氣的收束語，讓人讀完有「被接住了」的感覺\n';
  txt += '► 深刻 > 冗長，每個段落說一件真正重要的事\n\n';

  txt += '╔══════ 馥靈座標哲學 ══════╗\n';
  txt += '命盤不是命定劇本，是人生藏寶圖。\n';
  txt += '算的是方向，幫您做出更好的判斷。\n';
  txt += '讀懂自己，活對人生。\n\n';
  txt += '🔗 馥靈之鑰 hourlightkey.com';

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
