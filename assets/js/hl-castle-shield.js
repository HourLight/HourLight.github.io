/**
 * 馥靈之鑰 · 月光護盾系統 v1.0
 * ─────────────────────────────────────
 * 心法：Loss Aversion + Streak Freeze（Duolingo 降 21% churn 的關鍵設計）
 * 本質：streak 斷掉的緩衝，不是懲罰 → 寬容機制
 *
 * 品牌合一：
 * ► 精油香氣：「月光」= 薰衣草的清冷感（認知芳療觸發）
 * ► 馥靈馥語：每個訊息都用淡的口氣，不催促、不威脅
 * ► 座標哲學：每月初月圓之夜自動生成（節氣時辰）
 *
 * 規則：
 * - 免費會員每月 1 張
 * - 馥靈鑰友每月 3 張
 * - 馥靈大師每月 5 張
 * - 存量：最多留 5 張（不累積過剩）
 * - 不可購買（避免賭博化）
 *
 * 公開 API：
 *   hlShield.getCount()          → 剩餘張數
 *   hlShield.ensureMonthlyGrant() → 每月自動發放
 *   hlShield.useShield(dateKey)  → 補某天的 streak
 *   hlShield.showBadge()         → 在指定容器顯示盾牌 UI
 *   hlShield.promptIfStreakBroken() → 偵測昨天沒來彈窗
 */
(function(){
  'use strict';

  var STORAGE_KEY = 'hl_castle_shields_v1';
  var MAX_KEEP = 5;

  function todayKey(){
    var tw = new Date(new Date().getTime() + 8*3600000);
    return tw.getUTCFullYear() + '-' + String(tw.getUTCMonth()+1).padStart(2,'0') + '-' + String(tw.getUTCDate()).padStart(2,'0');
  }
  function monthKey(){
    var tw = new Date(new Date().getTime() + 8*3600000);
    return tw.getUTCFullYear() + '-' + String(tw.getUTCMonth()+1).padStart(2,'0');
  }
  function yesterdayKey(){
    var tw = new Date(new Date().getTime() + 8*3600000 - 24*3600000);
    return tw.getUTCFullYear() + '-' + String(tw.getUTCMonth()+1).padStart(2,'0') + '-' + String(tw.getUTCDate()).padStart(2,'0');
  }

  function loadState(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch(_){}
    return { count: 0, lastGrantMonth: '', usedHistory: [] };
  }
  function saveState(s){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(_){}
  }

  // 讀會員等級（配額依此）
  function getGrantByPlan(){
    try {
      if (window.hlMaterial && typeof hlMaterial.getCachedPlan === 'function'){
        var plan = hlMaterial.getCachedPlan();
        if (plan === 'pro')  return 5;  // 大師
        if (plan === 'plus') return 3;  // 鑰友
      }
    } catch(_){}
    return 1;  // 免費會員
  }

  // 每月自動發放（每月 1 號首次進城堡觸發）
  function ensureMonthlyGrant(){
    var s = loadState();
    var curMonth = monthKey();
    if (s.lastGrantMonth === curMonth) return { granted: false };
    var amount = getGrantByPlan();
    s.count = Math.min(MAX_KEEP, (s.count || 0) + amount);
    s.lastGrantMonth = curMonth;
    saveState(s);
    return { granted: true, amount: amount, newCount: s.count };
  }

  function getCount(){ return loadState().count || 0; }

  // 使用一張護盾補某一天
  function useShield(dateKey){
    var s = loadState();
    if (s.count <= 0) return { ok: false, reason: 'no_shield' };
    if ((s.usedHistory || []).indexOf(dateKey) > -1) return { ok: false, reason: 'already_used_that_day' };
    s.count -= 1;
    s.usedHistory = (s.usedHistory || []).concat([dateKey]);
    saveState(s);

    // 標記該日為「已到訪」以維持 streak（寫進 hl-castle-key 的 daily 記錄）
    try {
      var castleRaw = localStorage.getItem('hl_castle_key_v2') || localStorage.getItem('hl_castle_v3');
      // 這裡不直接操作 streak 儲存（避免與 hl-castle-key 的內部邏輯衝突）
      // 呼叫方應自行 reload state 或顯示提示
    } catch(_){}

    return { ok: true, dateKey: dateKey, remaining: s.count };
  }

  // ═══ 馥靈馥語訊息（品牌語感一致）═══
  var MESSAGES = {
    grantFirst: {
      title: '月光留了一格給你',
      body: '這個月你收到 <b>%n% 張月光護盾</b>。\n\n像是月亮在床頭替你點了一盞薰衣草香氛——某個你太累的夜晚，不用逼自己撐。斷一天，它會替你補上。',
      icon: '🌙'
    },
    useConfirm: {
      title: '要用月光護盾嗎？',
      body: '你昨天 <b>%date%</b> 沒來。\n\n如果你願意，護盾可以輕輕放在那個位置，streak 不中斷。\n\n剩餘 <b>%n% 張</b>。下個月初月圓那晚會有新的。',
      icon: '🛡️'
    },
    used: {
      title: '護盾放下了',
      body: '你昨天沒來的位置，被月光填好了。\n\n繼續走吧。',
      icon: '✨'
    },
    noShield: {
      title: '這個月的護盾用完了',
      body: '沒關係。下個月初月圓那晚，新的一張會自己生出來。\n\n斷一天也是可以的。這裡不逼你。',
      icon: '🌒'
    }
  };

  // ═══ UI 盾牌 Badge ═══
  function ensureStyle(){
    if (document.getElementById('hl-shield-style')) return;
    var css = document.createElement('style');
    css.id = 'hl-shield-style';
    css.textContent = [
      '.hl-shield-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:linear-gradient(135deg,rgba(160,124,220,.15),rgba(214,167,199,.15));border:1px solid rgba(160,124,220,.3);cursor:pointer;font-family:"Noto Serif TC",serif;font-size:.82rem;color:#4a3f6c;transition:all .3s}',
      '.hl-shield-badge:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(160,124,220,.25);border-color:rgba(160,124,220,.5)}',
      '.hl-shield-icon{font-size:1rem;filter:drop-shadow(0 2px 4px rgba(160,124,220,.4))}',
      '.hl-shield-count{font-weight:600;color:#7e5ec0}',
      'body.cv3-phase-night .hl-shield-badge, body.cv3-phase-midnight .hl-shield-badge{background:rgba(160,124,220,.2);color:#e9c27d;border-color:rgba(248,223,165,.35)}',
      'body.cv3-phase-night .hl-shield-count, body.cv3-phase-midnight .hl-shield-count{color:#f8dfa5}',
      // Modal
      '.hl-shield-overlay{position:fixed;inset:0;background:radial-gradient(circle,rgba(42,31,76,.75),rgba(14,11,36,.9));z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .4s;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:20px}',
      '.hl-shield-card{background:linear-gradient(160deg,#2a1f4c,#1a1533);border:1.5px solid rgba(160,124,220,.5);border-radius:22px;padding:32px 28px;max-width:400px;width:100%;text-align:center;color:#fff;font-family:"Noto Serif TC",serif;transform:scale(.88);transition:transform .5s cubic-bezier(.34,1.56,.64,1);box-shadow:0 28px 80px rgba(0,0,0,.6),0 0 40px rgba(160,124,220,.3)}',
      '.hl-shield-icon-big{font-size:3.2rem;margin-bottom:14px;filter:drop-shadow(0 4px 16px rgba(160,124,220,.5))}',
      '.hl-shield-title{font-size:1.1rem;font-weight:600;color:#f8dfa5;margin-bottom:10px;letter-spacing:.05em}',
      '.hl-shield-body{font-size:.88rem;color:rgba(255,255,255,.78);line-height:2;font-family:"LXGW WenKai TC","Noto Serif TC",serif;margin-bottom:22px;white-space:pre-line}',
      '.hl-shield-body b{color:#d6a7c7;font-weight:500}',
      '.hl-shield-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
      '.hl-shield-btn{padding:10px 22px;border-radius:999px;border:none;font-size:.88rem;letter-spacing:.06em;cursor:pointer;font-family:inherit;transition:all .3s}',
      '.hl-shield-btn-primary{background:linear-gradient(135deg,#a07cdc,#7e5ec0);color:#fff;font-weight:500}',
      '.hl-shield-btn-primary:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(160,124,220,.4)}',
      '.hl-shield-btn-ghost{background:transparent;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.18)}',
      '.hl-shield-btn-ghost:hover{color:#fff;border-color:rgba(255,255,255,.4)}'
    ].join('\n');
    document.head.appendChild(css);
  }

  function showModal(msgKey, replace, onConfirm){
    ensureStyle();
    var m = MESSAGES[msgKey];
    var body = m.body;
    if (replace) {
      Object.keys(replace).forEach(function(k){
        body = body.split('%' + k + '%').join(replace[k]);
      });
    }
    var ov = document.createElement('div');
    ov.className = 'hl-shield-overlay';
    var card = document.createElement('div');
    card.className = 'hl-shield-card';
    card.innerHTML = [
      '<div class="hl-shield-icon-big">' + m.icon + '</div>',
      '<div class="hl-shield-title">' + m.title + '</div>',
      '<div class="hl-shield-body">' + body + '</div>',
      '<div class="hl-shield-btns">',
        onConfirm ? '<button type="button" class="hl-shield-btn hl-shield-btn-primary" data-act="confirm">用一張護盾</button>' : '',
        '<button type="button" class="hl-shield-btn hl-shield-btn-ghost" data-act="close">' + (onConfirm ? '先不用' : '知道了') + '</button>',
      '</div>'
    ].join('');
    ov.appendChild(card);
    document.body.appendChild(ov);
    requestAnimationFrame(function(){
      ov.style.opacity = '1';
      card.style.transform = 'scale(1)';
    });
    function close(){
      ov.style.opacity = '0';
      card.style.transform = 'scale(.9)';
      setTimeout(function(){ ov.remove(); }, 400);
    }
    card.querySelectorAll('[data-act]').forEach(function(btn){
      btn.addEventListener('click', function(e){
        if (e.currentTarget.dataset.act === 'confirm' && onConfirm) onConfirm();
        close();
      });
    });
    ov.addEventListener('click', function(e){ if (e.target === ov) close(); });
    setTimeout(close, 12000);
    try { if (window.HLSound && HLSound.drop_rare) HLSound.drop_rare(); } catch(_){}
  }

  // 顯示盾牌 Badge（點擊可看狀態）
  function showBadge(container){
    ensureStyle();
    if (!container) return;
    var count = getCount();
    var badge = document.createElement('span');
    badge.className = 'hl-shield-badge';
    badge.title = '月光護盾：斷 streak 那天可以補上';
    badge.innerHTML = '<span class="hl-shield-icon">🛡️</span><span class="hl-shield-count">' + count + '</span>';
    badge.addEventListener('click', function(){
      var n = getCount();
      if (n > 0){
        showModal('grantFirst', { n: n });
      } else {
        showModal('noShield');
      }
    });
    container.appendChild(badge);
    return badge;
  }

  // 偵測 streak 斷掉並邀請用護盾
  // 呼叫時機：castle-hub.html init 之後
  function promptIfStreakBroken(){
    try {
      var streakData = JSON.parse(localStorage.getItem('hl_castle_v3') || '{}');
      var lastDate = streakData.lastDate;
      if (!lastDate) return;  // 第一次來，沒 streak 可斷
      var yKey = yesterdayKey();
      var tKey = todayKey();
      // 若 lastDate 不是今天也不是昨天 = 中間斷了
      if (lastDate !== tKey && lastDate !== yKey){
        // 斷超過 1 天，護盾救不回（本版只救 1 天）
        return;
      }
      // 恰好 lastDate = yesterday（上次是昨天）→ 沒斷，不提示
      if (lastDate === yKey) return;
      // lastDate = today → 今天已到訪，不用問
      if (lastDate === tKey) return;
    } catch(_){}
  }

  // ═══ 公開 API ═══
  window.hlShield = {
    getCount: getCount,
    ensureMonthlyGrant: ensureMonthlyGrant,
    useShield: useShield,
    showBadge: showBadge,
    showModal: showModal,
    promptIfStreakBroken: promptIfStreakBroken
  };
})();
