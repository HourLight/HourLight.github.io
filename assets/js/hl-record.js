/**
 * 馥靈之鑰 操作記錄橋接器 v1.0
 * 
 * 原則：
 * - 不修改任何現有函式的行為
 * - 只在「結果已經出來之後」安靜記錄一筆到 Firebase
 * - 任何錯誤都靜默處理，絕不影響頁面功能
 * - 如果 HLMember 不存在或 Firebase 沒載入，直接跳過
 */
(function(){
  'use strict';

  // 安全記錄：如果 HLMember 不存在就跳過
  function safeRecord(type, title, detail, tags) {
    try {
      if (!window.HLMember) return;
      if (type === 'draw') {
        window.HLMember.recordDraw(detail, title, document.title);
      } else if (type === 'quiz') {
        window.HLMember.recordQuiz(title, detail);
      }
    } catch(e) { /* 靜默 */ }
  }

  // 安全包裝：在原函式「之後」多做一件事，原函式完全不受影響
  function hookAfter(fnName, callback) {
    try {
      var check = setInterval(function(){
        if (typeof window[fnName] === 'function') {
          clearInterval(check);
          var orig = window[fnName];
          window[fnName] = function() {
            var result;
            try { result = orig.apply(this, arguments); } catch(e) { throw e; } // 原函式的錯誤照常拋出
            try { callback.apply(this, arguments); } catch(e) { /* 記錄失敗靜默 */ }
            return result;
          };
        }
      }, 500);
      // 最多等 10 秒，之後放棄
      setTimeout(function(){ clearInterval(check); }, 10000);
    } catch(e) { /* 靜默 */ }
  }

  // 從 DOM 抓取 quiz 結果摘要
  function grabQuizResult() {
    try {
      // 嘗試抓各種常見的結果標題元素
      var selectors = [
        '.result-type-code',      // MBTI
        '.result-animal-big',     // DISC
        '.result-combo-name',     // stress
        '.result-type-name',      // enneagram
        '.result-title',          // generic
        '.result-hero h2',
        '.result-hero h3'
      ];
      for (var i = 0; i < selectors.length; i++) {
        var el = document.querySelector(selectors[i]);
        if (el && el.textContent.trim()) return el.textContent.trim().substring(0, 200);
      }
      // Fallback: 抓 .quiz-result 內的第一段文字
      var resultBlock = document.querySelector('.quiz-result.active, .quiz-result[style*="block"]');
      if (resultBlock) {
        var firstText = resultBlock.querySelector('h2, h3, .result-type-code, strong');
        if (firstText) return firstText.textContent.trim().substring(0, 200);
      }
      return '已完成';
    } catch(e) { return '已完成'; }
  }

  // ══════════════════════════════════════
  //  偵測頁面，掛上對應的記錄鉤子
  // ══════════════════════════════════════

  var page = (location.pathname.split('/').pop() || '').split('?')[0];

  // ── 抽牌：draw-hl / draw-nail / draw-spa ──
  if (page === 'draw-hl.html' || page === 'draw-nail.html' || page === 'draw-spa.html') {
    hookAfter('drawCards', function(n) {
      try {
        var cards = [];
        if (window.selected && window.allFiles) {
          for (var i = 0; i < window.selected.length; i++) {
            cards.push(window.allFiles[window.selected[i]].replace('.png',''));
          }
        }
        var spreadName = n + '張牌陣';
        safeRecord('draw', spreadName, cards.join('、'), ['draw', page]);
      } catch(e) {}
    });
  }

  // ── 抽牌：draw-light（馥靈輕盈 28 張）──
  else if (page === 'draw-light.html') {
    hookAfter('performDraw', function() {
      try {
        var dr = window.drawResult;
        if (!dr) return;
        var cards = [dr.coreTheme];
        if (dr.typeHighSelf) cards = cards.concat(dr.typeHighSelf);
        if (dr.innerTypes) {
          dr.innerTypes.forEach(function(t) {
            cards.push(t.root, t.fear, t.oil);
          });
        }
        safeRecord('draw', '馥靈輕盈28張', cards.join('、'), ['draw', 'light']);
      } catch(e) {}
    });
  }

  // ── 塔羅抽牌 ──
  else if (page === 'tarot-draw.html') {
    hookAfter('doDraw', function() {
      try {
        if (!window.drawn || !window.drawn.length) return;
        var cards = window.drawn.map(function(c) {
          return c.zh + (c.rev ? '(逆)' : '(正)');
        });
        safeRecord('draw', '塔羅' + window.drawn.length + '張', cards.join('、'), ['draw', 'tarot']);
      } catch(e) {}
    });
  }

  // ── 心理測驗（所有 quiz-*.html，有 showResult）──
  else if (page.indexOf('quiz-') === 0 && page !== 'quiz-hub.html') {
    
    if (page === 'quiz-aroma.html') {
      // quiz-aroma 用 generateFormula
      hookAfter('generateFormula', function() {
        try {
          var result = document.querySelector('#aromaResult h3, #aromaResult .result-title');
          var detail = result ? result.textContent.trim() : '精油配方完成';
          safeRecord('quiz', '每日精油配方', detail, ['quiz', 'aroma']);
        } catch(e) {}
      });
    } else {
      // 其他 quiz 都用 showResult
      hookAfter('showResult', function() {
        // 延遲 200ms 讓 DOM 更新完畢再抓結果
        setTimeout(function() {
          try {
            var quizName = document.title.split('｜')[0].trim();
            var detail = grabQuizResult();
            safeRecord('quiz', quizName, detail, ['quiz', page.replace('.html','')]);
          } catch(e) {}
        }, 200);
      });
    }
  }

})();
