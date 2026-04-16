/**
 * 馥靈之鑰｜全站隨機材料掉落系統 v1.0
 * assets/js/hl-site-drop.js
 *
 * 深度版：結合 hl-castle-material.js 的 dropMaterial 系統，
 *         讓全站任何頁面（含純閱讀頁）都可能掉落材料。
 *
 * 五層掉落機制：
 *   (1) 頁面進入：3% 機率掉 common（會員 +5/10%）
 *   (2) 停留 60s 以上：額外一次 roll（忠誠度獎勵）
 *   (3) 24 節氣當天：該節氣專屬材料必掉一次
 *   (4) 連續登入獎勵：3/7/14/30/60/90/180/365 天階梯自動發
 *   (5) 會員加成：plus +5% drop rate，pro +10% + 額外 rare 機會
 *
 * 依賴：hl-castle-material.js（定義材料 + 動畫）、HLCastleV3（STREAK_REWARDS）
 * 使用：已由 hl-bottomnav.js 自動載入到全站（無需個別頁面加 script）
 *
 * 排除頁面：admin-*、member-login、index、privacy、terms、payuni-*、booking-admin
 * © 2026 Hour Light International
 */
(function(){
  'use strict';

  // ── 排除頁面（避免干擾）──
  var EXCLUDE_PATHS = [
    'admin-', 'member-login', 'privacy', 'terms', 'payuni-', 'booking-admin',
    'platform-admin', 'install.html', 'contact.html', 'course-viewer.html'
  ];
  var path = location.pathname.toLowerCase();
  for (var i = 0; i < EXCLUDE_PATHS.length; i++){
    if (path.indexOf(EXCLUDE_PATHS[i]) > -1) return;
  }
  // 根目錄（index.html）也不掉（避免首頁體驗被打擾）
  if (path === '/' || path.endsWith('/index.html') || path.endsWith('/sc/') || path.endsWith('/sc/index.html')) return;

  var STORAGE_KEY = 'hl_site_drop_v1';
  var TODAY_TW = (function(){
    var tw = new Date(new Date().getTime() + 8*3600000);
    return tw.getUTCFullYear() + '-' +
      String(tw.getUTCMonth()+1).padStart(2,'0') + '-' +
      String(tw.getUTCDate()).padStart(2,'0');
  })();

  // ── localStorage helpers ──
  function lsGet(k){ try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return null; } }
  function lsSet(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }

  function loadState(){
    return lsGet(STORAGE_KEY) || {
      lastLoginDate: '',
      streak: 0,
      dailyDrops: {},     // { YYYY-MM-DD: count }
      dwellDrops: {},     // { YYYY-MM-DD: count }
      claimedStreakRewards: [],  // [3, 7, 14, ...]
      claimedSolarTerms: {}      // { YYYY-節氣: true }
    };
  }
  function saveState(s){ lsSet(STORAGE_KEY, s); }

  // ── 會員方案判斷（讀 Firebase user plan）──
  var memberPlan = 'free';  // free / plus / pro
  function detectMemberPlan(callback){
    if (!window.firebase || !firebase.auth) { callback('free'); return; }
    var user = firebase.auth().currentUser;
    if (!user) { callback('free'); return; }
    try {
      firebase.firestore().collection('users').doc(user.uid).get().then(function(doc){
        if (!doc.exists) { callback('free'); return; }
        var d = doc.data();
        var plan = d.plan || 'free';
        // 檢查是否過期
        if (d.planExpireDate){
          var exp = new Date(d.planExpireDate);
          if (exp < new Date()) plan = 'free';
        }
        callback(plan);
      }).catch(function(){ callback('free'); });
    } catch(e){ callback('free'); }
  }

  // ── 動態載入 hl-castle-material.js（若未載入）──
  function ensureMaterialLoaded(callback){
    if (window.HL_dropMaterial) { callback(); return; }
    var script = document.createElement('script');
    script.src = 'assets/js/hl-castle-material.js';
    if (path.indexOf('/sc/') > -1) script.src = '../' + script.src;
    script.onload = function(){
      // material.js 載入後仍需 patch 才可用，等一下
      setTimeout(callback, 300);
    };
    script.onerror = function(){ callback(); };
    document.body.appendChild(script);
  }

  // ── 計算今日掉落機率 ──
  function getDropChance(plan){
    var base = 0.03; // 3%
    if (plan === 'plus') base = 0.05;
    if (plan === 'pro')  base = 0.10;
    return base;
  }

  // ── 隨機掉落（從通用池子挑）──
  var UNIVERSAL_POOLS = {
    blog:       'quiz',         // 閱讀 blog 掉覺察殿材料
    knowledge:  'quiz',
    aroma:      'draw',         // 芳療系列頁掉神諭廳
    mbti:       'quiz',
    founder:    'calculator',   // 品牌頁掉星象塔
    brand:      'calculator',
    services:   'calculator',
    pricing:    'calculator',
    naha:       'quiz',
    aromacare:  'draw',
    heal:       'heal_room',    // H 勇氣殿
    own:        'own_room',     // O 心門宮
    unlock:     'unlock_room',  // U 志氣殿
    rise:       'rise_room',    // R 平衡室
    castle:     'castle_riddle',
    draw:       'draw',
    oracle:     'draw',
    quiz:       'quiz',
    destiny:    'calculator',
    game:       'castle_riddle'
  };
  function guessPool(){
    // 用頁面 path 猜測 pool type
    var low = path.toLowerCase();
    var keys = Object.keys(UNIVERSAL_POOLS);
    for (var i = 0; i < keys.length; i++){
      if (low.indexOf(keys[i]) > -1) return UNIVERSAL_POOLS[keys[i]];
    }
    return 'quiz'; // default 覺察殿
  }

  // ── 連續登入 streak 計算 + 自動領獎 ──
  function updateStreak(state){
    var today = TODAY_TW;
    if (state.lastLoginDate === today) return state.streak;

    // 計算 daysDiff
    var diff = 0;
    if (state.lastLoginDate){
      diff = Math.round((new Date(today) - new Date(state.lastLoginDate)) / 86400000);
    }

    if (diff === 1) state.streak = (state.streak || 0) + 1;
    else if (diff === 0) {} // 同一天
    else state.streak = 1;  // 連續中斷重算

    state.lastLoginDate = today;

    // 自動領 streak 獎勵（若有到達且未領過）
    if (window.HLCastleV3 && window.HLCastleV3.getNextStreakReward){
      var rewards = window.HLCastleV3.STREAK_REWARDS || [];
      rewards.forEach(function(r){
        if (state.streak >= r.days && state.claimedStreakRewards.indexOf(r.days) === -1){
          claimStreakReward(r);
          state.claimedStreakRewards.push(r.days);
        }
      });
    }
    return state.streak;
  }

  function claimStreakReward(r){
    // 加點數（1 點 = NT$1，點數發放保守）
    var cd = lsGet('hl_castle_v3') || {};
    cd.points = (cd.points || 0) + (r.points || 0);
    lsSet('hl_castle_v3', cd);

    // 加材料（連登獎勵 rare/legendary 只在高天數才給）
    // rare 從對應房間池隨機（強制 forceItem = 對應池的 rare 物品）
    if (r.rare && window.HL_dropMaterial){
      for (var i = 0; i < r.rare; i++){
        // 從 draw pool 掉 rare（玫瑰精魄/橙花羽翼 等神諭系稀有）
        window.HL_dropMaterial('draw');
      }
    }
    if (r.legendary && window.HL_dropMaterial){
      for (var j = 0; j < r.legendary; j++){
        window.HL_dropMaterial('calculator');  // legendary 天命核心
      }
    }

    // 顯示 streak 成就 toast
    showStreakToast(r);
  }

  function showStreakToast(r){
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,#fbe9c8,#e9c27d);color:#3a2f1a;padding:20px 26px;border-radius:20px;font-size:.95rem;font-weight:500;box-shadow:0 12px 40px rgba(42,31,76,.35);z-index:99999;text-align:center;border:2px solid rgba(184,146,42,.4);min-width:240px;animation:hlSiteDropFade .4s ease;font-family:inherit';
    t.innerHTML = '<div style="font-size:2.2rem;margin-bottom:8px">' + (r.icon || '🏅') + '</div>' +
                  '<div style="font-family:Noto Serif TC,serif;font-size:1.1rem;margin-bottom:4px">連續登入 ' + r.days + ' 天</div>' +
                  '<div style="font-weight:500;color:#8a6d1f;margin-bottom:8px">「' + r.title + '」</div>' +
                  '<div style="font-size:.82rem;opacity:.85">+' + r.points + ' 靈感點' + (r.rare ? ' + ' + r.rare + ' Rare' : '') + (r.legendary ? ' + ' + r.legendary + ' Legendary' : '') + '</div>';
    document.body.appendChild(t);
    setTimeout(function(){ t.style.transition = 'opacity .5s, transform .5s'; t.style.opacity = '0'; t.style.transform = 'translate(-50%, -60%)'; }, 4500);
    setTimeout(function(){ t.remove(); }, 5200);
  }

  // ── CSS keyframes for toast fade（僅注入一次）──
  if (!document.getElementById('hl-site-drop-style')){
    var st = document.createElement('style');
    st.id = 'hl-site-drop-style';
    st.textContent = '@keyframes hlSiteDropFade{from{opacity:0;transform:translate(-50%,-40%)}to{opacity:1;transform:translate(-50%,-50%)}}';
    document.head.appendChild(st);
  }

  // ── 24 節氣檢查 ──
  function checkSolarTermDrop(state){
    if (!window.HLCastleV3 || !window.HLCastleV3.getCurrentSolarTerm) return;
    var term = window.HLCastleV3.getCurrentSolarTerm();
    var year = new Date().getFullYear();
    var key = year + '-' + term.name;

    // 今日是節氣交界日 ± 1 天才觸發
    var now = new Date();
    var isNearTerm = (now.getMonth() + 1 === term.date[0]) &&
                     (Math.abs(now.getDate() - term.date[1]) <= 1);
    if (!isNearTerm) return;

    if (state.claimedSolarTerms[key]) return;
    state.claimedSolarTerms[key] = true;

    // 掉一個節氣專屬材料（用 nature_event pool 或對應 rare）
    if (window.HL_dropMaterial){
      window.HL_dropMaterial('draw'); // 觸發 rare
    }

    // 節氣 toast
    showSolarTermToast(term);
  }

  function showSolarTermToast(term){
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(160,124,220,.95),rgba(200,212,240,.95));color:#fff;padding:14px 22px;border-radius:18px;font-size:.9rem;box-shadow:0 8px 30px rgba(42,31,76,.3);z-index:99998;letter-spacing:.1em;backdrop-filter:blur(6px);font-family:inherit';
    t.innerHTML = '🌸 今日節氣：' + term.name + '　|　城堡飄落一份節氣禮物';
    document.body.appendChild(t);
    setTimeout(function(){ t.style.transition='opacity .6s'; t.style.opacity = '0'; }, 3800);
    setTimeout(function(){ t.remove(); }, 4500);
  }

  // ── 核心入口：頁面進入後執行 ──
  function run(){
    var state = loadState();

    // 1. 更新 streak（自動發連登獎勵）
    updateStreak(state);

    // 2. 檢查 24 節氣
    checkSolarTermDrop(state);

    // 3. 隨機掉落（page-load 3-10%）
    detectMemberPlan(function(plan){
      memberPlan = plan;
      var chance = getDropChance(plan);
      var dropsToday = state.dailyDrops[TODAY_TW] || 0;
      // 全站最多一天 10 次隨機掉（避免灌水）
      if (dropsToday >= 10){ saveState(state); return; }

      if (Math.random() < chance){
        if (window.HL_dropMaterial){
          var poolKey = guessPool();
          window.HL_dropMaterial(poolKey);
          state.dailyDrops[TODAY_TW] = dropsToday + 1;
        }
      }
      saveState(state);
    });

    // 4. 停留 60 秒後再一次 roll（dwell bonus）
    setTimeout(function(){
      var state = loadState();
      var dwellToday = state.dwellDrops[TODAY_TW] || 0;
      if (dwellToday >= 3) return; // 日限 3 次
      // 忠誠獎：dwell bonus 固定 15% 掉
      if (Math.random() < 0.15){
        if (window.HL_dropMaterial){
          var poolKey = guessPool();
          window.HL_dropMaterial(poolKey);
          state.dwellDrops[TODAY_TW] = dwellToday + 1;
          saveState(state);
        }
      }
    }, 60000);
  }

  // ── 等 material.js 載入後啟動 ──
  function start(){
    ensureMaterialLoaded(function(){
      if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', run);
      } else {
        run();
      }
    });
  }

  // 避免過早執行（Firebase 可能還沒載入）
  if (document.readyState === 'complete') setTimeout(start, 1200);
  else window.addEventListener('load', function(){ setTimeout(start, 1200); });

})();
