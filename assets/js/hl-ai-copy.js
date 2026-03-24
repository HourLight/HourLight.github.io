/**
 * hl-ai-copy.js — 馥靈之鑰 AI 智慧解讀指令複製模組 v1.0
 * 2026/3/24
 *
 * 統一門控邏輯：登入 → 扣次數（日制）→ 從 server 取框架 → 組合資料+框架 → 複製到剪貼簿
 * 螢幕上永遠看不到框架內容，只有剪貼簿裡有
 *
 * 使用方式（HTML）：
 *   <button class="cp" onclick="hlAICopy('ai1','bazi',this)">🔮 複製智慧解讀指令</button>
 *
 * 需要先載入：firebase-app-compat.js + firebase-auth-compat.js + firebase-config.js
 */
(function(){
'use strict';

window.hlAICopy = function(preId, system, btn) {
  // 取得命盤資料
  var pre = document.getElementById(preId);
  if (!pre) { alert('找不到命盤資料'); return; }
  var data = pre.textContent;

  // 檢查 Firebase 登入
  if (typeof firebase === 'undefined' || !firebase.auth || !firebase.auth().currentUser) {
    if (confirm('🔮 智慧解讀指令為會員功能（免費註冊即可）\n\n每日 3 次免費額度，登入後立即可用。\n\n點「確定」前往登入頁面')) {
      window.open('member-login.html?from=' + encodeURIComponent(location.pathname.replace(/.*\//,'')), '_blank');
    }
    return;
  }

  var user = firebase.auth().currentUser;
  if (!btn) btn = event && event.target;
  var origText = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '🔮 載入中...'; btn.disabled = true; }

  // 取得 token → 呼叫閘門 API
  user.getIdToken().then(function(token) {
    return fetch('https://app.hourlightkey.com/api/ai-framework-gate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ system: system })
    });
  }).then(function(r) { return r.json(); })
  .then(function(result) {
    if (result.error) {
      if (result.code === 'QUOTA_EXCEEDED') {
        var hl = result.hoursLeft || '?';
        alert('⏰ 今日智慧解讀額度已用完（' + result.used + '/' + result.limit + '）\n\n' +
              '約 ' + hl + ' 小時後（午夜 00:00）自動恢復。\n\n' +
              '► 免費會員每日 3 次\n' +
              '► 馥靈鑰友 $399/月：每日 10 次\n' +
              '► 馥靈大師 $999/月：無限次\n' +
              '► 單買 10 次 $199，永久有效');
      } else if (result.code === 'AUTH_REQUIRED' || result.code === 'TOKEN_INVALID') {
        alert('🔑 登入已過期，請重新登入');
      } else {
        alert(result.error);
      }
      if (btn) { btn.textContent = origText; btn.disabled = false; }
      return;
    }
    // 組合：命盤資料 + 框架 → 複製到剪貼簿（螢幕上看不到框架）
    var fullText = data + '\n\n' + result.framework;
    navigator.clipboard.writeText(fullText).then(function() {
      var q = result.quota || {};
      var remain = q.plan === 'pro' ? '∞' : ((q.limit || 3) - (q.used || 0) + (q.bonus || 0));
      if (btn) {
        btn.textContent = '✅ 已複製（今日剩餘 ' + remain + ' 次）';
        btn.style.background = 'rgba(160,124,220,.25)';
        setTimeout(function() {
          btn.textContent = origText;
          btn.style.background = '';
          btn.disabled = false;
        }, 2500);
      }
    }).catch(function() {
      alert('複製失敗，請手動操作（iOS 用戶請長按選取）');
      if (btn) { btn.textContent = origText; btn.disabled = false; }
    });
  }).catch(function(e) {
    console.error('hlAICopy error:', e);
    if (btn) { btn.textContent = origText; btn.disabled = false; }
    alert('網路錯誤，請稍後再試');
  });
};

})();
