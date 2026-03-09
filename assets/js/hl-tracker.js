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
})();
