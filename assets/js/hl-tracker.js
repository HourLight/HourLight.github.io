/**
 * 馥靈之鑰 靜默使用追蹤器 v1.0
 * 純記錄，不擋任何人，不顯示任何 UI
 * 使用方式：在工具頁面 </body> 前加入
 * <script src="assets/js/hl-tracker.js" data-tool="quiz-disc" data-tool-name="DISC測驗" data-tool-type="quiz"></script>
 */
(function () {
  var s = document.currentScript || (function(){ var t=document.getElementsByTagName('script'); return t[t.length-1]; })();
  var TOOL_ID   = s.getAttribute('data-tool') || location.pathname.replace(/.*\//,'').replace('.html','');
  var TOOL_NAME = s.getAttribute('data-tool-name') || document.title;
  var TOOL_TYPE = s.getAttribute('data-tool-type') || 'tool';

  function init() {
    if (typeof firebase === 'undefined' || !window.FIREBASE_CONFIG || FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') return;
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      var auth = firebase.auth();
      var db   = firebase.firestore();
      auth.onAuthStateChanged(function(user) {
        if (!user) return; // 未登入就靜默不動
        record(db, user, 'page_enter', {});
        // 暴露給頁面內呼叫
        window.HL_track = function(eventType, detail) { record(db, user, eventType, detail||{}); };
        window.HL_userId = user.uid;
        // 相容舊版 HLMember.recordDraw / recordQuiz
        window.HLMember = {
          auth: auth, db: db,
          getCurrentUser: function(){ return user; },
          recordDraw: function(cards, spread){ record(db, user, 'draw_complete', { cards: Array.isArray(cards)?cards.join(','):cards, spread: spread||'1張' }); },
          recordQuiz: function(qName, result){ record(db, user, 'quiz_complete', { quizName: qName, result: result }); }
        };
        // GA4 同步：quiz_complete 事件也送 gtag
        var _origTrack = window.HL_track;
        window.HL_track = function(eventType, detail) {
          if (_origTrack) _origTrack(eventType, detail);
          // 同步到 GA4
          if (typeof gtag === 'function') {
            if (eventType === 'quiz_complete') {
              gtag('event', 'quiz_complete', { quiz_name: (detail && detail.toolName) || TOOL_NAME, tool_id: (detail && detail.toolId) || TOOL_ID });
            } else if (eventType === 'draw_complete') {
              gtag('event', 'draw_card', { spread: (detail && detail.spread) || '1張', tool_id: TOOL_ID });
            }
          }
          // 同步到 FB Pixel Custom Audience
          if (typeof fbq === 'function') {
            if (eventType === 'quiz_complete') {
              fbq('trackCustom', 'QuizComplete', { quiz_name: (detail && detail.toolName) || TOOL_NAME, tool_id: (detail && detail.toolId) || TOOL_ID });
            } else if (eventType === 'draw_complete') {
              fbq('trackCustom', 'DrawCard', { spread: (detail && detail.spread) || '1張', tool_id: TOOL_ID });
            } else if (eventType === 'page_enter') {
              if (TOOL_TYPE === 'destiny') fbq('trackCustom', 'UseDestinyTool', { tool_id: TOOL_ID });
            }
          }
          // ═══ 城堡中樞每日任務進度追蹤（hl_castle_v3.dailyStats）═══
          try {
            var tw = new Date(new Date().getTime() + 8*3600000);
            var today = tw.getUTCFullYear() + '-' + String(tw.getUTCMonth()+1).padStart(2,'0') + '-' + String(tw.getUTCDate()).padStart(2,'0');
            var cd = JSON.parse(localStorage.getItem('hl_castle_v3') || '{}');
            if (!cd.dailyStats) cd.dailyStats = {};
            if (!cd.dailyStats[today]) cd.dailyStats[today] = { draws:0, quizzes:0, destiny:0, furniture:0, pet_feed:0, share:0, breathe:0, aroma:0, match:0, journal:0, meditation:0, destiny_match:0 };
            var st = cd.dailyStats[today];
            if (eventType === 'draw_complete')      st.draws = (st.draws || 0) + 1;
            if (eventType === 'quiz_complete')      st.quizzes = (st.quizzes || 0) + 1;
            if (eventType === 'calc_complete' || eventType === 'calculator_complete' || eventType === 'destiny_complete')
              st.destiny = (st.destiny || 0) + 1;
            if (eventType === 'match_complete')     st.destiny_match = (st.destiny_match || 0) + 1;
            if (eventType === 'furniture_crafted')  st.furniture = (st.furniture || 0) + 1;
            if (eventType === 'pet_feed')           st.pet_feed = (st.pet_feed || 0) + 1;
            if (eventType === 'castle_share' || eventType === 'share')
              st.share = (st.share || 0) + 1;
            if (eventType === 'breathe_complete')   st.breathe = (st.breathe || 0) + 1;
            if (eventType === 'aroma_view')         st.aroma = (st.aroma || 0) + 1;
            if (eventType === 'journal_write')      st.journal = (st.journal || 0) + 1;
            if (eventType === 'meditation_complete')st.meditation = (st.meditation || 0) + 1;
            // 🎯 付費深度任務追蹤（2026/4/19）
            if (eventType === 'paid_reading_complete' && detail && detail.paidToolId){
              var ptid = detail.paidToolId;
              // 合法的付費工具 ID：yuan_chen / akashic / past_life / draw3 / draw5 / draw7
              var key = 'paid_' + ptid;
              st[key] = (st[key] || 0) + 1;
            }
            localStorage.setItem('hl_castle_v3', JSON.stringify(cd));
          } catch(e) {}
        };
      });
    } catch(e) {}
  }

  function record(db, user, eventType, detail) {
    try {
      var base = {
        uid: user.uid, email: user.email,
        toolId: TOOL_ID, toolName: TOOL_NAME, toolType: TOOL_TYPE,
        eventType: eventType, detail: detail,
        url: location.href,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      };
      db.collection('events').add(base).catch(function(){});
      if (eventType !== 'page_enter') {
        var histItem = {
          type: TOOL_TYPE,
          title: TOOL_NAME + (detail.spread ? '（'+detail.spread+'）' : ''),
          detail: fmtDetail(detail),
          toolId: TOOL_ID,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          tags: [TOOL_TYPE, TOOL_ID]
        };
        db.collection('users/'+user.uid+'/history').add(histItem).catch(function(){});
        var inc = { totalPageViews: firebase.firestore.FieldValue.increment(1), lastSeen: firebase.firestore.FieldValue.serverTimestamp() };
        if (TOOL_TYPE==='draw')        inc.totalDraws   = firebase.firestore.FieldValue.increment(1);
        if (TOOL_TYPE==='quiz')        inc.totalQuizzes = firebase.firestore.FieldValue.increment(1);
        if (TOOL_TYPE==='calculator')  inc.totalCalcs   = firebase.firestore.FieldValue.increment(1);
        db.doc('users/'+user.uid).set(inc, {merge:true}).catch(function(){});
      }
    } catch(e) {}
  }

  function fmtDetail(d) {
    if (!d) return '';
    var p = [];
    if (d.cards)    p.push('牌：'+d.cards);
    if (d.spread)   p.push(d.spread);
    if (d.result)   p.push('結果：'+d.result);
    if (d.quizName) p.push(d.quizName);
    return p.join(' ｜ ') || JSON.stringify(d).substring(0,100);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // ═══ 全站材料掉落系統自動載入 ═══
  // hl-castle-material.js 會 patch window.HL_track，讓工具完成時自動掉材料
  // 只在工具類頁面載入（避免首頁 / 登入頁 / admin 等白載）
  var AUTOLOAD_TOOL_TYPES = ['quiz', 'draw', 'calculator', 'destiny', 'oracle', 'game', 'tool'];
  if (AUTOLOAD_TOOL_TYPES.indexOf(TOOL_TYPE) > -1 && !window.HL_dropMaterial) {
    var matScript = document.createElement('script');
    matScript.src = 'assets/js/hl-castle-material.js';
    matScript.async = true;
    // 用 relative path，支援 sc/ 子目錄
    if (location.pathname.indexOf('/sc/') > -1) matScript.src = '../' + matScript.src;
    document.body.appendChild(matScript);
  }
})();
