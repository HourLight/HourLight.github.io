/**
 * hl-usage-wall.js — 馥靈之鑰 前端使用次數管控 v1.0
 * 2026/3/25
 *
 * 用法：在頁面載入此 JS，設定 data-tool 屬性
 *   <script src="assets/js/hl-usage-wall.js" data-tool="destiny-engine" data-limit="3"></script>
 *
 * 邏輯：
 *   1. 未登入 → 可用 1 次（localStorage），超過就彈登入
 *   2. 已登入免費會員 → 每日 3 次（Firestore）
 *   3. 超過 → 整頁蓋黑遮罩，不能用
 *
 * 依賴：firebase-app-compat + firebase-auth-compat + firebase-firestore-compat + firebase-config.js
 */
(function() {
  'use strict';

  // 讀取設定
  var me = document.currentScript || document.querySelector('script[data-tool][src*="hl-usage-wall"]');
  var TOOL = (me && me.getAttribute('data-tool')) || 'unknown';
  var LIMIT = parseInt((me && me.getAttribute('data-limit')) || '3', 10);

  // 取今日日期 key（台灣時間）
  function getDayKey() {
    var now = new Date();
    var tw = new Date(now.getTime() + 8 * 3600000);
    return tw.getUTCFullYear() + '-' + String(tw.getUTCMonth() + 1).padStart(2, '0') + '-' + String(tw.getUTCDate()).padStart(2, '0');
  }

  // 顯示擋牆
  function showWall(used, limit) {
    if (document.getElementById('hl-usage-wall')) return;
    var wall = document.createElement('div');
    wall.id = 'hl-usage-wall';
    wall.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(5,3,10,.95);z-index:99999;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:24px;text-align:center';
    wall.innerHTML =
      '<div style="max-width:420px">' +
      '<div style="font-size:3rem;margin-bottom:16px">🌙</div>' +
      '<div style="font-family:\'Noto Serif TC\',serif;font-size:1.4rem;color:#f0d48a;margin-bottom:10px">今天的次數用完囉</div>' +
      '<div style="font-size:.88rem;color:rgba(244,240,235,.6);margin-bottom:6px">已使用 ' + used + ' / ' + limit + ' 次 ｜ 今晚零時自動恢復 ✦</div>' +
      '<div style="margin:16px 0;padding:14px 16px;background:rgba(248,223,165,.06);border-radius:14px;border:1px solid rgba(248,223,165,.15);font-size:.85rem;color:rgba(244,240,235,.75);line-height:2">' +
        '💡 每天免費額度於今晚 00:00（台灣時間）自動歸零<br>' +
        '🌿 明天再來，或加入方案，讓平台持續穩定運作 🌟<br>' +
        '✨ 網站裡藏著隱藏點數彩蛋，找到可以折抵解讀費用<br>' +
        '🔑 升級方案可以獲得更多每日次數' +
      '</div>' +
      '<div style="color:rgba(244,240,235,.7);font-size:.88rem;line-height:1.8;margin-bottom:24px">' +
        '► <strong style="color:#f0d48a">馥靈鑰友 $399/月</strong>：每日 10 次解讀<br>' +
        '► <strong style="color:#f0d48a">馥靈大師 $999/月</strong>：無限次使用 + 兩張 $500 抵用券' +
      '</div>' +
      '<a href="https://lin.ee/RdQBFAN" target="_blank" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#c9a060,#a07820);color:#fff;border-radius:999px;font-size:.95rem;font-weight:600;text-decoration:none;margin-bottom:12px">💬 LINE 升級方案</a><br>' +
      '<a href="index.html" style="color:rgba(244,240,235,.5);font-size:.82rem;text-decoration:underline">← 回首頁</a>' +
      '</div>';
    document.body.appendChild(wall);
  }

  // 主邏輯
  function checkUsage() {
    // 等 Firebase 載入
    if (typeof firebase === 'undefined' || !firebase.auth) {
      setTimeout(checkUsage, 500);
      return;
    }

    firebase.auth().onAuthStateChanged(function(user) {
      if (!user) {
        // 未登入：用 localStorage 給 1 次
        var lsKey = 'hl_usage_' + TOOL + '_' + getDayKey();
        var used = parseInt(localStorage.getItem(lsKey) || '0', 10);
        if (used >= 1) {
          // 彈登入提示
          if (confirm('🔮 免費體驗 1 次已用完\n\n登入會員可享每日 ' + LIMIT + ' 次免費額度（免費註冊）\n\n點「確定」前往登入')) {
            window.location.href = 'member-login.html?from=' + encodeURIComponent(TOOL);
          } else {
            showWall(1, 1);
          }
          return;
        }
        // 記錄使用
        localStorage.setItem(lsKey, String(used + 1));
        return;
      }

      // 已登入：查 Firestore
      var db = firebase.firestore();
      var dayKey = getDayKey();
      var docRef = db.collection('users').doc(user.uid).collection('usage').doc(dayKey);

      docRef.get().then(function(doc) {
        var data = doc.exists ? doc.data() : {};
        var toolUsed = (data[TOOL] || 0);
        var plan = data._plan || 'free';

        // 付費會員不擋
        if (plan === 'plus') { LIMIT = 10; }
        if (plan === 'pro') { return; } // 無限

        if (toolUsed >= LIMIT) {
          showWall(toolUsed, LIMIT);
          return;
        }

        // 記錄使用 +1
        var update = {};
        update[TOOL] = firebase.firestore.FieldValue.increment(1);
        docRef.set(update, { merge: true });
      }).catch(function(e) {
        console.warn('hl-usage-wall:', e.message);
        // Firestore 出錯不擋使用者
      });
    });
  }

  // DOM ready 後執行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkUsage);
  } else {
    setTimeout(checkUsage, 300);
  }
})();
