/**
 * 馥靈之鑰 占卜抽牌計次門控 v1.1
 *
 * 收費邏輯（逸君確認 2026/04/09）：
 * ► 占卜類動作（抽牌/卜卦/算命）每天計次
 * ► 每日午夜 00:00 (UTC+8) 自動歸零，沒用完不累計
 * ► 每個占卜工具獨立計次（不是全部共用）
 *   例如：天使占卜 3 次/天 + 骨牌占卜 3 次/天 + 夢境解碼 3 次/天，互不影響
 *
 * 每日限額（每個工具獨立）：
 *   free  → 每天 3 次
 *   plus  → 每天 10 次（馥靈鑰友 $399/月）
 *   pro   → 無上限（馥靈大師 $999/月）
 *
 * Firestore 結構：
 *   users/{uid}/{toolId}_daily/{YYYY-MM-DD} → { count: N, lastUsed: timestamp }
 *   例如：users/abc123/angel_daily/2026-04-10 → { count:2, lastUsed:... }
 *
 * 已單獨實作（不需引用此模組）：
 *   - tarot-draw.html  （tarot_daily 集合）
 *
 * 整合方式（其他占卜工具）：
 *   1. <script src="assets/js/hl-divination-gate.js"></script>
 *   2. 把抽牌按鈕的點擊處理改為：
 *      function onDrawClick(){
 *        if (window.HL_drawCheck) {
 *          HL_drawCheck('angel', function(){ doActualDraw(); });
 *          //          ^^^^^ tool id（angel/bone/dream/mirror/yijing 等）
 *        } else {
 *          doActualDraw();
 *        }
 *      }
 */
(function(){
  'use strict';

  var DAILY_LIMITS = { 'free': 3, 'plus': 10, 'pro': Infinity };

  function getDayKey(){
    var n = new Date();
    var tw = new Date(n.getTime() + 8 * 3600000);
    return tw.getUTCFullYear() + '-' +
           String(tw.getUTCMonth() + 1).padStart(2, '0') + '-' +
           String(tw.getUTCDate()).padStart(2, '0');
  }

  function getHoursUntilReset(){
    var n = new Date();
    var tw = new Date(n.getTime() + 8 * 3600000);
    return 24 - tw.getUTCHours();
  }

  function getUser(){
    try {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        return firebase.auth().currentUser;
      }
    } catch(e) {}
    return null;
  }

  // 等 Firebase auth state 就緒（已登入/未登入都會回 callback）
  // 同步 currentUser 在 auth 初始化完成前可能是 null — 必須用 onAuthStateChanged
  // 2026/04/17 加入：修 mbti-tarot 等新占卜工具「明明登入卻彈登入窗」的 bug
  function waitAuthReady(cb, timeoutMs){
    if (typeof firebase === 'undefined' || !firebase.auth) { cb(null); return; }
    // 如果已 resolve 就直接走
    var current = firebase.auth().currentUser;
    if (current) { cb(current); return; }
    // 否則 listen 第一次 state change
    var done = false;
    var unsub = null;
    try {
      unsub = firebase.auth().onAuthStateChanged(function(user){
        if (done) return;
        done = true;
        if (unsub) unsub();
        cb(user || null);
      });
    } catch(e) {
      done = true;
      cb(null);
      return;
    }
    // 安全 timeout：若 3 秒還沒觸發就回 currentUser（可能真的未登入）
    setTimeout(function(){
      if (done) return;
      done = true;
      if (unsub) { try { unsub(); } catch(e){} }
      cb(firebase.auth().currentUser || null);
    }, timeoutMs || 3000);
  }

  function getUserPlan(uid, cb){
    try {
      firebase.firestore().collection('users').doc(uid).get().then(function(doc){
        var d = doc.exists ? doc.data() : {};
        var plan = d.plan || 'free';
        // 推薦碼獎勵期：視為 pro
        if (d.referral_premium_until) {
          var exp = new Date(d.referral_premium_until);
          if (exp > new Date()) plan = 'pro';
        }
        // localStorage trial 期：視為 pro（兼容愚人節 FOOL999 模式）
        try {
          var tu = localStorage.getItem('hl_promo_trial_until');
          if (tu && new Date(tu) > new Date()) plan = 'pro';
        } catch(e) {}
        cb(plan);
      }).catch(function(){ cb('free'); });
    } catch(e) {
      cb('free');
    }
  }

  function _toolCol(toolId){
    // 工具 id 轉為集合名稱：angel → angel_daily
    var safeId = String(toolId || 'divination').replace(/[^a-z0-9_-]/gi, '').toLowerCase();
    return safeId + '_daily';
  }

  function getDailyUsage(uid, toolId, cb){
    try {
      firebase.firestore()
        .collection('users').doc(uid)
        .collection(_toolCol(toolId)).doc(getDayKey())
        .get()
        .then(function(doc){
          cb(doc.exists ? (doc.data().count || 0) : 0);
        })
        .catch(function(){ cb(0); });
    } catch(e) {
      cb(0);
    }
  }

  function recordUsage(uid, toolId){
    try {
      firebase.firestore()
        .collection('users').doc(uid)
        .collection(_toolCol(toolId)).doc(getDayKey())
        .set({
          count: firebase.firestore.FieldValue.increment(1),
          lastUsed: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch(e) {}
  }

  function showLoginPrompt(){
    var old = document.getElementById('hl-div-login');
    if (old) old.remove();
    var m = document.createElement('div');
    m.id = 'hl-div-login';
    m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);padding:16px';
    m.innerHTML = '<div style="max-width:400px;width:100%;padding:32px 24px;background:#0a0612;border:1px solid rgba(240,212,138,.2);border-radius:20px;text-align:center;color:#f0e8d8">'
      + '<div style="font-size:2.5rem;margin-bottom:12px">🔮</div>'
      + '<div style="font-size:1.05rem;color:#f0d48a;font-weight:700;margin-bottom:10px">登入即可開始占卜</div>'
      + '<div style="font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.8;margin-bottom:18px">免費會員每天 3 次占卜，登入後立即開始。<br>不需信用卡，30 秒完成。</div>'
      + '<a href="member-login.html" style="display:block;padding:14px;background:linear-gradient(135deg,#c9a044,#f0d48a);color:#0a0612;font-weight:700;border-radius:12px;text-decoration:none;margin-bottom:10px">🔑 免費註冊 / 登入</a>'
      + '<button onclick="this.closest(\'#hl-div-login\').remove()" style="display:block;width:100%;padding:10px;background:transparent;border:1px solid rgba(240,212,138,.2);border-radius:10px;color:rgba(255,255,255,.5);font-size:.85rem;cursor:pointer;font-family:inherit">← 返回</button>'
      + '</div>';
    m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });
    document.body.appendChild(m);
  }

  function showRemainingHint(used, limit){
    var remaining = limit - used;
    if (remaining > 3) return;
    var old = document.getElementById('hl-div-hint');
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = 'hl-div-hint';
    el.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(10,6,18,.92);border:1px solid rgba(240,212,138,.25);color:#f0d48a;padding:8px 18px;border-radius:20px;font-size:.8rem;z-index:99998;pointer-events:none;opacity:1;transition:opacity .5s';
    el.textContent = '今日占卜剩餘 ' + remaining + ' 次';
    document.body.appendChild(el);
    setTimeout(function(){ el.style.opacity = '0'; }, 2500);
    setTimeout(function(){ el.remove(); }, 3200);
  }

  function showUpgradeModal(plan, used, limit){
    var old = document.getElementById('hl-div-upgrade');
    if (old) old.remove();
    var planName = plan === 'free' ? '免費會員' : (plan === 'plus' ? '馥靈鑰友' : '馥靈大師');
    var nextPlan = plan === 'free' ? '馥靈鑰友（NT$399/月，每天 10 次）' : '馥靈大師（NT$999/月，無限次）';
    var hr = getHoursUntilReset();
    var m = document.createElement('div');
    m.id = 'hl-div-upgrade';
    m.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);padding:16px';
    m.innerHTML = '<div style="max-width:420px;width:100%;padding:32px 24px;background:#0a0612;border:1px solid rgba(240,212,138,.2);border-radius:20px;text-align:center;color:#f0e8d8;max-height:90vh;overflow-y:auto">'
      + '<div style="font-size:2.5rem;margin-bottom:12px">✨</div>'
      + '<div style="font-size:1.05rem;color:#f0d48a;font-weight:700;margin-bottom:10px">今天的 ' + limit + ' 次占卜旅程完成了</div>'
      + '<div style="font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.8;margin-bottom:18px">'
      + '你今天已經抽了 ' + used + ' 次。<br>'
      + '占卜給方向，覺察給力量。<br>'
      + '今天看到的東西，先讓它沉澱一晚。<br><br>'
      + '明天午夜（台灣時間）自動歸零，還有約 ' + hr + ' 小時。</div>'
      + '<div style="text-align:left;font-size:.82rem;color:rgba(255,255,255,.55);line-height:2;margin-bottom:16px;padding:14px 16px;border-radius:12px;background:rgba(240,212,138,.04);border:1px solid rgba(240,212,138,.1)">'
      + '<div style="color:rgba(240,212,138,.85);font-weight:700;margin-bottom:6px">💛 想繼續探索？</div>'
      + '► 馥靈鑰友 NT$399/月：每天 10 次占卜<br>'
      + '► 馥靈大師 NT$999/月：無限占卜<br>'
      + '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(240,212,138,.08);font-size:.78rem;color:rgba(240,212,138,.65)">每月還會收到桌布兌換代碼月禮 🎁</div>'
      + '</div>'
      + '<a href="pricing.html" style="display:block;padding:14px;background:linear-gradient(135deg,#c9a044,#f0d48a);color:#0a0612;font-weight:700;border-radius:12px;text-decoration:none;margin-bottom:10px">查看會員方案</a>'
      + '<button onclick="this.closest(\'#hl-div-upgrade\').remove()" style="display:block;width:100%;padding:10px;background:transparent;border:1px solid rgba(240,212,138,.2);border-radius:10px;color:rgba(255,255,255,.5);font-size:.85rem;cursor:pointer;font-family:inherit">明天再來</button>'
      + '</div>';
    m.addEventListener('click', function(e){ if (e.target === m) m.remove(); });
    document.body.appendChild(m);
  }

  /**
   * 主要 API：在執行抽牌前呼叫，會自動處理計次與門控
   * @param {String} toolId - 工具 id（angel/bone/dream/mirror/yijing/...）每個工具獨立計次
   * @param {Function} callback - 通過檢查時要執行的抽牌動作
   * @example
   *   HL_drawCheck('angel', function(){
   *     // 你的實際抽牌邏輯
   *     doActualDraw();
   *   });
   */
  window.HL_drawCheck = function(toolId, callback){
    // 兼容舊呼叫：HL_drawCheck(callback)
    if (typeof toolId === 'function') {
      callback = toolId;
      toolId = 'divination';
    }
    // 等 auth state ready 再判斷（修登入後仍彈窗 bug）
    waitAuthReady(function(user){
      if (!user) {
        showLoginPrompt();
        return;
      }
      getUserPlan(user.uid, function(plan){
        var limit = DAILY_LIMITS[plan] || DAILY_LIMITS['free'];
        if (limit === Infinity) {
          if (callback) callback();
          recordUsage(user.uid, toolId);
          return;
        }
        getDailyUsage(user.uid, toolId, function(count){
          if (count < limit) {
            _sessionDrawn[toolId] = true;
            if (callback) callback();
            recordUsage(user.uid, toolId);
            showRemainingHint(count + 1, limit);
          } else {
            showUpgradeModal(plan, count, limit);
          }
        });
      });
    });
  };

  // 暴露工具函式給其他腳本使用
  window.HL_DIVINATION_LIMITS = DAILY_LIMITS;

})();
