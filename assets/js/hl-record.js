/**
 * 馥靈之鑰 操作記錄器 v3.0
 * 
 * v2 的 bug：直接開頁面時 auth.currentUser 還是 null，recordDraw 靜默失敗
 * v3 修正：rec() 等 auth 就緒再寫入，最多重試 10 次（每次 1 秒）
 * 
 * 安全原則不變：任何錯誤都靜默，絕不影響頁面功能
 */
(function(){
  'use strict';

  var page = (location.pathname.split('/').pop() || '').split('?')[0];
  var recorded = false;

  // 等 Firebase auth 就緒後才寫入
  function rec(type, title, detail) {
    if (recorded) return;
    try {
      // 等 HLMember 和 auth.currentUser 都就緒
      var retries = 0;
      var tryWrite = function() {
        try {
          // 還沒有 HLMember → 等
          if (!window.HLMember) {
            if (++retries < 15) setTimeout(tryWrite, 1000);
            return;
          }
          // 檢查 auth.currentUser（直接用 firebase.auth()）
          var user = null;
          try { user = firebase.auth().currentUser; } catch(e) {}
          if (!user) {
            if (++retries < 15) setTimeout(tryWrite, 1000);
            return;
          }
          // 用戶已確認，寫入！
          recorded = true;
          var db = window.HLMember.db;
          if (!db) return;
          db.collection('users/' + user.uid + '/history').add({
            type: type,
            title: title,
            detail: detail || '',
            page: document.title || page,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            tags: [type, page.replace('.html','')]
          }).then(function(){
            // 更新計數
            var field = type === 'draw' ? 'totalDraws' : type === 'calculator' ? 'totalCalcs' : 'totalQuizzes';
            var upd = {};
            upd[field] = firebase.firestore.FieldValue.increment(1);
            db.doc('users/' + user.uid).set(upd, { merge: true });
          }).catch(function(){});
          // 5 秒後允許再次記錄
          setTimeout(function(){ recorded = false; }, 5000);
        } catch(e) { recorded = false; }
      };
      tryWrite();
    } catch(e) {}
  }

  // 觀察 DOM 元素出現子節點
  function watchForContent(selector, callback) {
    try {
      var attempts = 0;
      var check = setInterval(function(){
        var el = document.querySelector(selector);
        if (el) {
          clearInterval(check);
          // 元素已存在，設 MutationObserver
          var obs = new MutationObserver(function(mutations){
            for (var i = 0; i < mutations.length; i++) {
              if (mutations[i].addedNodes.length > 0) {
                // 延遲讓 DOM 完全渲染
                setTimeout(function(){ try{ callback(el); }catch(e){} }, 500);
                return;
              }
            }
          });
          obs.observe(el, { childList: true });
        } else if (++attempts > 30) {
          clearInterval(check);
        }
      }, 500);
    } catch(e) {}
  }

  // 從 grid 裡抓牌卡編號
  function grabCardsFromGrid(el) {
    try {
      var caps = el.querySelectorAll('.hl-v2-card-cap, .card-pos-lbl');
      var cards = [];
      // 方法1：從 card caption 抓
      if (caps.length) {
        caps.forEach(function(c){
          var t = c.textContent.trim();
          if (t && t !== '') cards.push(t.substring(0, 30));
        });
      }
      // 方法2：從 img alt 抓
      if (!cards.length) {
        var imgs = el.querySelectorAll('img[alt]');
        imgs.forEach(function(img){
          var a = img.alt.trim();
          if (a && a.length < 20) cards.push(a);
        });
      }
      return cards.length ? cards.join('、') : '已抽牌';
    } catch(e) { return '已抽牌'; }
  }

  // 從 quiz result 抓摘要
  function grabQuizSummary() {
    try {
      var selectors = [
        '.result-type-code','.result-animal-big','.result-combo-name',
        '.result-type-name','.result-title','.result-hero h2','.result-hero h3'
      ];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.textContent.trim()) return el.textContent.trim().substring(0, 200);
      }
      return '已完成測驗';
    } catch(e) { return '已完成測驗'; }
  }

  // ══════════════════════════════════════════
  //  依頁面類型，設定對應的觀察器
  // ══════════════════════════════════════════

  // ── 馥靈牌陣抽牌（draw-hl / draw-nail / draw-spa）──
  if (page === 'draw-hl.html' || page === 'draw-nail.html' || page === 'draw-spa.html' || page === 'draw-family.html' || page === 'family-reading.html') {
    watchForContent('#grid', function(el){
      if (!el.children.length) return;
      var n = el.querySelectorAll('.hl-v2-card-item, .hl-v2-card-thumb').length || '?';
      var detail = grabCardsFromGrid(el);
      rec('draw', n + '張牌陣', detail);
    });
  }

  // ── 馥靈輕盈（draw-light）──
  else if (page === 'draw-light.html') {
    watchForContent('#spreadResult, .spread-section', function(el){
      var cards = grabCardsFromGrid(el);
      rec('draw', '馥靈輕盈28張', cards);
    });
  }

  // ── 塔羅抽牌 ──
  else if (page === 'tarot-draw.html') {
    watchForContent('#spread', function(el){
      if (!el.children.length) return;
      var items = el.querySelectorAll('.c-zh');
      var cards = [];
      items.forEach(function(c){ cards.push(c.textContent.trim()); });
      rec('draw', '塔羅' + cards.length + '張', cards.join('、') || '已抽牌');
    });
  }

  // ── 心理測驗（quiz-*.html）──
  else if (page.indexOf('quiz-') === 0 && page !== 'quiz-hub.html') {

    if (page === 'quiz-aroma.html') {
      // 觀察 aromaResult 出現
      watchForContent('#aromaResult', function(el){
        if (el.style.display === 'none') return;
        var detail = el.querySelector('h3, .result-title');
        rec('quiz', '每日精油配方', detail ? detail.textContent.trim() : '配方完成');
      });
      // 也用 interval 監測 display 切換
      var aromaCheck = setInterval(function(){
        try {
          var r = document.getElementById('aromaResult');
          if (r && r.style.display !== 'none' && r.offsetHeight > 0) {
            clearInterval(aromaCheck);
            var detail = r.querySelector('h3, .result-title');
            rec('quiz', '每日精油配方', detail ? detail.textContent.trim() : '配方完成');
          }
        } catch(e){}
      }, 1000);
      setTimeout(function(){ clearInterval(aromaCheck); }, 120000);
    } else {
      // 所有其他 quiz：觀察 .quiz-result 出現 .active class
      var quizCheck = setInterval(function(){
        try {
          var result = document.querySelector('.quiz-result.active');
          if (result) {
            clearInterval(quizCheck);
            setTimeout(function(){
              var quizName = document.title.split('｜')[0].trim();
              var detail = grabQuizSummary();
              rec('quiz', quizName, detail);
            }, 300);
          }
        } catch(e){}
      }, 800);
      // 最多監測 5 分鐘
      setTimeout(function(){ clearInterval(quizCheck); }, 300000);
    }
  }

  // ══════════════════════════════════════════
  //  命盤計算工具（共 18 頁）
  // ══════════════════════════════════════════

  // 通用：抓輸入欄的生日資訊作為 detail
  function grabBirthInput() {
    try {
      var ids = [
        ['by','bm','bd','bh','bmin'],      // astro/bazi/hd/numerology
        ['byear','bmonth','bday','btime'],  // destiny-engine
        ['birthDate'],                       // maya
        ['by','lm','ld','bh'],              // ziwei
      ];
      for (var g = 0; g < ids.length; g++) {
        var parts = [];
        for (var i = 0; i < ids[g].length; i++) {
          var el = document.getElementById(ids[g][i]);
          if (el && el.value) parts.push(el.value);
        }
        if (parts.length >= 1) return parts.join('/');
      }
      // React apps: 從 DOM 文字抓
      var texts = document.querySelectorAll('.gold-text, .result-num, .text-2xl');
      if (texts.length) {
        var t = [];
        texts.forEach(function(el){ var v=el.textContent.trim(); if(v.length<30) t.push(v); });
        if (t.length) return t.slice(0,3).join(' ');
      }
      return '已計算';
    } catch(e) { return '已計算'; }
  }

  // 通用：抓結果區的摘要
  function grabCalcSummary() {
    try {
      var selectors = [
        '.type-main h2','.type-main h3','.sec-title',
        '.result h2','.result h3','.result-title',
        '.gold-text.text-2xl','.gold-text.text-xl'
      ];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.textContent.trim().length > 1) return el.textContent.trim().substring(0,100);
      }
      return '';
    } catch(e) { return ''; }
  }

  // 工具名稱對照
  var CALC_NAMES = {
    'astro-calculator.html': '西洋星盤',
    'bazi-calculator.html': '八字命理',
    'destiny-engine.html': '十大命盤引擎',
    'fuling-mima.html': '馥靈秘碼',
    'hd-calculator.html': '人類圖',
    'maya-calculator.html': '瑪雅曆',
    'numerology-calculator.html': '西方生命靈數',
    'lifepath-calculator.html': '生命路徑',
    'qizheng-calculator.html': '七政四餘',
    'rainbow-calculator.html': '彩虹數字',
    'triangle-calculator.html': '三角生命密碼',
    'ziwei-calculator.html': '紫微斗數',
    'digital-energy-analyzer.html': '數位能量分析',
    'scent-navigator.html': '香氣導航',
    'quantum-numerology.html': '量子靈數',
    'maslow-frequency.html': '生命覺察指數',
    'master.html': '馥靈秘碼進階',
    'aroma-daily.html': '今日精油處方箋'
  };

  var CALC_PAGES = Object.keys(CALC_NAMES);
  if (CALC_PAGES.indexOf(page) > -1) {
    var calcName = CALC_NAMES[page];

    // 策略1：觀察 #result.show 或 #resultSection.show（標準計算器）
    var resultCheck = setInterval(function(){
      try {
        var r = document.querySelector('#result.show, #resultSection.show, .result.show');
        if (r) {
          clearInterval(resultCheck);
          setTimeout(function(){
            var summary = grabCalcSummary();
            var birth = grabBirthInput();
            rec('calculator', calcName, birth + (summary ? '｜' + summary : ''));
          }, 500);
        }
      } catch(e){}
    }, 1000);

    // 策略2：觀察 display:block 切換（scent/quantum/maslow）
    var displayCheck = setInterval(function(){
      try {
        var els = [
          document.getElementById('resultSection'),
          document.getElementById('resultContent'),
          document.getElementById('resultCard')
        ];
        for (var i = 0; i < els.length; i++) {
          if (els[i] && els[i].offsetHeight > 0 && els[i].style.display !== 'none') {
            clearInterval(displayCheck);
            setTimeout(function(){
              var summary = grabCalcSummary();
              var birth = grabBirthInput();
              rec('calculator', calcName, birth + (summary ? '｜' + summary : ''));
            }, 500);
            return;
          }
        }
      } catch(e){}
    }, 1000);

    // 策略3：React apps（fuling-mima/digital-energy/master）觀察 radar canvas 或 .gold-text 出現
    var reactCheck = setInterval(function(){
      try {
        var canvas = document.querySelector('canvas[width="280"]');
        var goldTexts = document.querySelectorAll('.gold-text.text-2xl, .text-2xl.font-bold');
        if ((canvas && canvas.offsetHeight > 0) || goldTexts.length > 2) {
          clearInterval(reactCheck);
          setTimeout(function(){
            var birth = grabBirthInput();
            rec('calculator', calcName, birth);
          }, 800);
        }
      } catch(e){}
    }, 1000);

    // 策略4：aroma-daily 的 .aroma-result.active
    if (page === 'aroma-daily.html') {
      var aromaCalcCheck = setInterval(function(){
        try {
          var r = document.querySelector('.aroma-result.active');
          if (r) {
            clearInterval(aromaCalcCheck);
            var title = r.querySelector('h3, .result-title');
            rec('calculator', '今日精油處方箋', title ? title.textContent.trim() : '配方完成');
          }
        } catch(e){}
      }, 1000);
      setTimeout(function(){ clearInterval(aromaCalcCheck); }, 120000);
    }

    // 所有 interval 最多跑 3 分鐘
    setTimeout(function(){
      clearInterval(resultCheck);
      clearInterval(displayCheck);
      clearInterval(reactCheck);
    }, 180000);
  }

})();
