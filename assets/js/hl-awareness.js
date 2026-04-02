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

  // 會員中心 — 暴露 hook 讓 app.html 在取得統計後呼叫
  window.hlAwareness = {
    showAppStats: initAppAwareness,
    showQuizDone: initQuizAwareness
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
