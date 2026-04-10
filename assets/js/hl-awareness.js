/* ======================================================
   馥靈之鑰 Hour Light - 覺察累積微互動
   用 localStorage 追蹤用戶回訪，在關鍵觸點給予溫暖回饋
   ====================================================== */
(function(){
  'use strict';

  /* ---------- 共用：Toast 顯示 ---------- */
  function showAwarenessToast(msg, duration){
    duration = duration || 4000;
    var el = document.createElement('div');
    el.className = 'hl-awareness-toast';
    el.textContent = msg;
    // 樣式
    el.style.cssText = 'position:fixed;top:24px;left:50%;transform:translateX(-50%) translateY(-20px);' +
      'max-width:92vw;padding:14px 22px;border-radius:16px;font-size:.92rem;line-height:1.6;' +
      'text-align:center;z-index:9999;pointer-events:none;opacity:0;transition:opacity .6s,transform .6s;' +
      'font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;' +
      'background:rgba(12,8,20,.88);color:rgba(248,223,165,.92);' +
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);' +
      'border:1px solid rgba(248,223,165,.18);' +
      'box-shadow:0 8px 32px rgba(0,0,0,.45),0 0 16px rgba(248,223,165,.08);';
    document.body.appendChild(el);
    // 淡入
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        el.style.opacity = '1';
        el.style.transform = 'translateX(-50%) translateY(0)';
      });
    });
    // 淡出
    setTimeout(function(){
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(-12px)';
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 700);
    }, duration);
  }

  /* ---------- 共用：計算已完成的不同測驗數 ---------- */
  function countCompletedQuizzes(){
    var count = 0;
    try {
      for(var i = 0; i < localStorage.length; i++){
        var key = localStorage.key(i);
        if(key && key.indexOf('hl_quiz_') === 0) count++;
      }
    } catch(e){}
    return count;
  }

  /* ==========================================================
     1. draw-hl.html — 抽牌頁回訪提示
     ========================================================== */
  function initDrawAwareness(){
    var KEY = 'hl_draw_visits';
    try {
      var visits = parseInt(localStorage.getItem(KEY)) || 0;
      visits++;
      localStorage.setItem(KEY, visits);
      if(visits >= 3){
        setTimeout(function(){
          showAwarenessToast(
            '這是你第 ' + visits + ' 次來到這裡。每一次翻開，都是一次跟自己對話的勇氣。',
            4000
          );
        }, 800);
      }
    } catch(e){}
  }

  /* ==========================================================
     2. app.html — 會員中心使用量回饋
     ========================================================== */
  function initAppAwareness(totalActions){
    if(!totalActions || totalActions < 10) return;
    var msg;
    if(totalActions >= 100){
      msg = totalActions + ' 次。你已經不需要別人告訴你你是誰了。';
    } else if(totalActions >= 50){
      msg = totalActions + ' 次覺察，你比大多數人都更認真地在認識自己。';
    } else {
      msg = '你已經跟自己對話了 ' + totalActions + ' 次。每一次都算數。';
    }
    // 插入到 hero-stats 下方
    var statsEl = document.querySelector('.hero-stats');
    if(!statsEl) return;
    var existing = document.getElementById('hl-awareness-line');
    if(existing) existing.parentNode.removeChild(existing);
    var line = document.createElement('div');
    line.id = 'hl-awareness-line';
    line.textContent = msg;
    line.style.cssText = 'text-align:center;font-size:.85rem;color:var(--light,#9a8a74);' +
      'margin-top:8px;padding:0 16px;line-height:1.6;opacity:0;transition:opacity .8s;';
    statsEl.parentNode.insertBefore(line, statsEl.nextSibling);
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ line.style.opacity = '1'; });
    });
  }

  /* ==========================================================
     3. quiz 結果頁 — 多測驗覺察提示
     ========================================================== */
  function initQuizAwareness(){
    var n = countCompletedQuizzes();
    if(n < 5) return;
    setTimeout(function(){
      showAwarenessToast(
        '你已經完成了 ' + n + ' 項覺察。每多一個視角，就多一把鑰匙。',
        5000
      );
    }, 1200);
  }

  /* ==========================================================
     4. destiny-engine.html — 命盤回訪提示
     ========================================================== */
  function initDestinyAwareness(){
    var KEY = 'hl_destiny_visits';
    try {
      var visits = parseInt(localStorage.getItem(KEY)) || 0;
      visits++;
      localStorage.setItem(KEY, visits);
      if(visits >= 3){
        setTimeout(function(){
          showAwarenessToast(
            '這是你第 ' + visits + ' 次來查命盤。每一次查，都代表你在認真對待自己的人生方向。',
            4500
          );
        }, 800);
      }
    } catch(e){}
  }

  /* ==========================================================
     5. 占卜工具 — 跨工具種類累計提示
     ========================================================== */
  var DIVINATION_TOOLS = [
    'yijing-oracle', 'angel-oracle', 'tarot-draw', 'bone-casting',
    'dream-decoder', 'mirror-oracle', 'season-oracle', 'witch-power',
    'projection-cards', 'phone-oracle', 'name-oracle'
  ];

  function initDivinationAwareness(toolSlug){
    var VISIT_KEY = 'hl_divination_' + toolSlug;
    var CATEGORY_KEY = 'hl_divination_tools_used';
    try {
      // 記錄這支工具被用過
      var used = {};
      try { used = JSON.parse(localStorage.getItem(CATEGORY_KEY)) || {}; } catch(e){}
      used[toolSlug] = true;
      localStorage.setItem(CATEGORY_KEY, JSON.stringify(used));

      // 計算用過幾種不同的工具
      var toolCount = 0;
      for(var k in used){ if(used.hasOwnProperty(k)) toolCount++; }

      // 個別工具回訪次數
      var visits = parseInt(localStorage.getItem(VISIT_KEY)) || 0;
      visits++;
      localStorage.setItem(VISIT_KEY, visits);

      // 跨工具種類提示（優先）：用過 3 種以上才說
      if(toolCount >= 3){
        setTimeout(function(){
          showAwarenessToast(
            '你已經用了 ' + toolCount + ' 種不同的占卜工具。每多一個角度，就多一份清晰。',
            4500
          );
        }, 800);
      }
    } catch(e){}
  }

  /* ==========================================================
     6. aroma-garden.html — 芳療園地回訪提示
     ========================================================== */
  function initAromaAwareness(){
    var KEY = 'hl_aroma_visits';
    try {
      var visits = parseInt(localStorage.getItem(KEY)) || 0;
      visits++;
      localStorage.setItem(KEY, visits);
      if(visits >= 3){
        setTimeout(function(){
          showAwarenessToast(
            '你來芳療園地 ' + visits + ' 次了。氣味是最誠實的記憶。',
            4000
          );
        }, 800);
      }
    } catch(e){}
  }

  /* ==========================================================
     7. 微賦能結尾語 — 所有工具結尾注入「我更懂自己了」
     讓每次互動結尾都有一個反思的呼吸點
     ========================================================== */
  var CLOSING_POOL = [
    '看到這些結果的時候，你心裡第一個浮現的念頭是什麼？那個念頭，比任何分析都準。',
    '測驗量的不是你有多好或多差，是你此刻站在哪裡。知道自己在哪的人，不會迷路。',
    '數字和類型都只是座標。你不需要變成另一個人，只需要更清楚地看見這個自己。',
    '如果這份結果裡有一句話讓你停了一下，那就是今天最重要的收穫。',
    '你願意花這幾分鐘來認識自己，這件事本身就已經比結果重要了。',
    '結果只是起點。你接下來選擇怎麼回應它，才是真正的覺察。',
    '這份報告是一面鏡子，不是一張考卷。鏡子不打分數，它只是讓你看見。',
    '你剛剛回答的每一題，都是在跟自己對話。有些對話，只有你自己聽得到。',
    '不需要記住所有結果。記住那個讓你「嗯，好像是」的瞬間就夠了。',
    '看完了。現在深吸一口氣，問自己：我想帶走哪一個發現？'
  ];

  function injectMicroEmpowerment(){
    // 找到結果區域
    var resultEl = document.getElementById('quizResult')
      || document.getElementById('result-area')
      || document.getElementById('ra');
    if(!resultEl) return;
    // 如果已經注入過就不重複
    if(document.getElementById('hl-micro-empower')) return;
    // 隨機選一句結尾語
    var msg = CLOSING_POOL[Math.floor(Math.random() * CLOSING_POOL.length)];
    // 建立結尾語區塊
    var wrap = document.createElement('div');
    wrap.id = 'hl-micro-empower';
    wrap.style.cssText = 'margin:20px auto 8px;max-width:520px;padding:16px 20px;' +
      'text-align:center;font-size:.88rem;line-height:1.75;' +
      'color:rgba(248,223,165,.85);letter-spacing:.3px;' +
      'border-top:1px solid rgba(248,223,165,.1);' +
      'border-bottom:1px solid rgba(248,223,165,.1);' +
      'opacity:0;transition:opacity 1.2s ease;';
    wrap.textContent = msg;
    // 找注入位置：resultHour 後面，或 share-row 前面，或結果區尾巴
    var hourBridge = resultEl.querySelector('.result-hour-bridge')
      || document.getElementById('resultHour');
    var shareRow = resultEl.querySelector('.share-row');
    if(hourBridge && hourBridge.nextSibling){
      hourBridge.parentNode.insertBefore(wrap, hourBridge.nextSibling);
    } else if(shareRow){
      shareRow.parentNode.insertBefore(wrap, shareRow);
    } else {
      resultEl.appendChild(wrap);
    }
    // 淡入
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){ wrap.style.opacity = '1'; });
    });
  }

  /* ---------- 自動偵測頁面類型並初始化 ---------- */
  var path = location.pathname.replace(/^\//, '');

  // 抽牌頁
  if(path === 'draw-hl.html' || path.indexOf('draw-hl') !== -1){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initDrawAwareness);
    } else {
      initDrawAwareness();
    }
  }

  // 命盤引擎
  if(path === 'destiny-engine.html' || path.indexOf('destiny-engine') !== -1){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initDestinyAwareness);
    } else {
      initDestinyAwareness();
    }
  }

  // 占卜工具（跨工具種類追蹤）
  (function(){
    for(var i = 0; i < DIVINATION_TOOLS.length; i++){
      var slug = DIVINATION_TOOLS[i];
      if(path === slug + '.html' || path.indexOf(slug) !== -1){
        if(document.readyState === 'loading'){
          (function(s){ document.addEventListener('DOMContentLoaded', function(){ initDivinationAwareness(s); }); })(slug);
        } else {
          initDivinationAwareness(slug);
        }
        break;
      }
    }
  })();

  // 芳療園地
  if(path === 'aroma-garden.html' || path.indexOf('aroma-garden') !== -1){
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', initAromaAwareness);
    } else {
      initAromaAwareness();
    }
  }

  // 會員中心 — 暴露 hook 讓 app.html 在取得統計後呼叫
  window.hlAwareness = {
    showAppStats: initAppAwareness,
    showQuizDone: initQuizAwareness,
    injectClosing: injectMicroEmpowerment
  };

  // quiz 結果頁 — 攔截 showResult
  if(path.indexOf('quiz-') === 0){
    // 等 showResult 被定義後，用 wrapper 包裝它
    var _origShowResult = null;
    var _patched = false;
    function patchShowResult(){
      if(_patched) return;
      if(typeof window.showResult === 'function'){
        _patched = true;
        _origShowResult = window.showResult;
        window.showResult = function(){
          _origShowResult.apply(this, arguments);
          initQuizAwareness();
          setTimeout(injectMicroEmpowerment, 600);
        };
      }
    }
    // 嘗試立即 patch；若 showResult 尚未定義，用 interval 等它
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', function(){
        setTimeout(patchShowResult, 100);
      });
    } else {
      setTimeout(patchShowResult, 100);
    }
    // 備用：MutationObserver 監聽結果區域出現
    if(!_patched){
      var _checkInterval = setInterval(function(){
        patchShowResult();
        if(_patched) clearInterval(_checkInterval);
      }, 300);
      // 最多等 10 秒
      setTimeout(function(){ clearInterval(_checkInterval); }, 10000);
    }
  }

})();
