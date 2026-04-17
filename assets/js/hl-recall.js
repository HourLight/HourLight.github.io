/**
 * hl-recall.js · 溫柔召回 · Day 3 / Day 7
 * ─────────────────────────────────────────
 * 設計：Finch 責任感模式 + Duolingo Streak Freeze 溫柔版
 * 觸發：用戶返回網站時，若距離上次進城堡 >= 3 / >= 7 天，自動寄一封召回信
 * 不新增 API，共用 send-report.js（type: recall_day3 / recall_day7）
 *
 * 召回邏輯
 * ① 任何頁面載入時嗅一次 lastCastleVisit
 * ② 只在用戶已登入 + 有 email 時發信
 * ③ 每個週期只發一次（hl_recall_sent_day3 / hl_recall_sent_day7 時間戳）
 * ④ 新一輪城堡造訪會清掉 sent flag，下次離開 3/7 天後可重新召回
 * ⑤ castle-* 頁面造訪會更新 lastCastleVisit（不觸發召回）
 *
 * 絕不踩
 *  排行榜式羞辱、24h 倒數威脅、「不上線貓會死」恐嚇
 *  召回信 body 必須淡，不勵志，不推銷
 */
(function(){
  'use strict';

  var STORAGE_LAST_VISIT = 'hl_last_castle_visit';
  var STORAGE_SENT_D3 = 'hl_recall_sent_day3';
  var STORAGE_SENT_D7 = 'hl_recall_sent_day7';
  var API_URL = 'https://app.hourlightkey.com/api/send-report';
  var DAY_MS = 86400000;

  // 城堡相關頁面（造訪會更新 lastCastleVisit 且清 sent flag）
  var CASTLE_PAGES = /castle-|app\.html|game\.html|draw-hl|draw-hub/;

  function todayKey(){
    var d = new Date();
    return d.getFullYear() + '-'
      + String(d.getMonth()+1).padStart(2,'0') + '-'
      + String(d.getDate()).padStart(2,'0');
  }

  function daysBetween(a, b){
    if(!a || !b) return 0;
    var da = new Date(a), db = new Date(b);
    if(isNaN(da) || isNaN(db)) return 0;
    return Math.round((db - da) / DAY_MS);
  }

  // 取元辰動物名字（從 hl-castle-pets 的 localStorage）
  function getPetInfo(){
    try{
      var raw = localStorage.getItem('hlPets');
      if(!raw) return { name: '糖糖', emoji: '🐈' };
      var state = JSON.parse(raw);
      var zodiac = state.zodiac;
      var PET_NAMES = {
        rat:'靈靈', ox:'穩穩', tiger:'燦燦', rabbit:'小白', dragon:'賦賦',
        snake:'微微', horse:'奔奔', goat:'雲雲', monkey:'跳跳',
        rooster:'早早', dog:'橘子', pig:'圓圓'
      };
      var PET_EMOJIS = {
        rat:'🐭', ox:'🐮', tiger:'🐯', rabbit:'🐰', dragon:'🐉',
        snake:'🐍', horse:'🐴', goat:'🐑', monkey:'🐒',
        rooster:'🐓', dog:'🐶', pig:'🐷'
      };
      return {
        name: PET_NAMES[zodiac] || '糖糖',
        emoji: PET_EMOJIS[zodiac] || '🐈'
      };
    }catch(e){ return { name: '糖糖', emoji: '🐈' }; }
  }

  function isCastlePage(){
    return CASTLE_PAGES.test(location.pathname);
  }

  // 城堡造訪：更新 lastCastleVisit + 清召回 flag（下一輪可再召回）
  function markCastleVisit(){
    try{
      localStorage.setItem(STORAGE_LAST_VISIT, todayKey());
      localStorage.removeItem(STORAGE_SENT_D3);
      localStorage.removeItem(STORAGE_SENT_D7);
    }catch(e){}
  }

  // 發送召回信（fire and forget）
  function sendRecall(type, user, petInfo, days){
    var name = user.displayName || '';
    var payload = {
      email: user.email,
      name: name,
      type: type,
      subject: type === 'recall_day7'
        ? '你的房間還在，等你一眼就好'
        : '窗邊有一隻貓記得你',
      petName: petInfo.name,
      petZodiac: petInfo.emoji,
      lastVisitDays: days,
      // content 由模板產生，這裡給 placeholder 避免後端驗證
      content: '[召回信 · 模板產生]'
    };

    return fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function(){ /* 寄信失敗就算了，別打擾用戶 */ });
  }

  // 主邏輯
  function checkAndRecall(){
    var lastVisit;
    try{ lastVisit = localStorage.getItem(STORAGE_LAST_VISIT); }catch(e){ return; }

    if(!lastVisit) return; // 從沒進過城堡就不召回

    var today = todayKey();
    var days = daysBetween(lastVisit, today);

    if(days < 3) return; // 太新，不需要召回

    // 等 Firebase 準備好
    if(typeof firebase === 'undefined' || !firebase.auth) return;

    firebase.auth().onAuthStateChanged(function(user){
      if(!user || !user.email) return;

      var petInfo = getPetInfo();

      // Day 7（先檢查，較長的優先）
      if(days >= 7){
        var sent7 = localStorage.getItem(STORAGE_SENT_D7);
        if(!sent7){
          sendRecall('recall_day7', user, petInfo, days);
          try{ localStorage.setItem(STORAGE_SENT_D7, today); }catch(e){}
          // 同時標記 day3 已送，避免連發兩封
          try{ localStorage.setItem(STORAGE_SENT_D3, today); }catch(e){}
          return;
        }
      }

      // Day 3
      if(days >= 3 && days < 7){
        var sent3 = localStorage.getItem(STORAGE_SENT_D3);
        if(!sent3){
          sendRecall('recall_day3', user, petInfo, days);
          try{ localStorage.setItem(STORAGE_SENT_D3, today); }catch(e){}
        }
      }
    });
  }

  // 對外 API（給城堡頁面主動呼叫）
  window.hlRecall = {
    markVisit: markCastleVisit,
    check: checkAndRecall
  };

  // 自動掛鉤：城堡頁自動 markVisit；其他頁自動 checkAndRecall
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  function run(){
    if(isCastlePage()){
      markCastleVisit();
    } else {
      // 延後 4 秒，等 Firebase auth 初始化 + 避開首屏效能
      setTimeout(checkAndRecall, 4000);
    }
  }
})();
