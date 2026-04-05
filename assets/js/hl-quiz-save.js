/**
 * 馥靈之鑰 · 測驗結果保存模組 v1.0
 * 做完測驗自動保存結果，下次進來直接看上次結果
 * 點「重新測一次」才清除
 *
 * 使用：在 </body> 前、測驗 JS 之後載入
 * <script src="assets/js/hl-quiz-save.js"></script>
 *
 * 原理：showResult() 執行完後，把 #quizResult 的 innerHTML 存進 localStorage
 * 下次載入時檢查有無存檔，有的話直接還原結果頁，跳過題目
 */
(function(){
  'use strict';

  var page = (location.pathname.split('/').pop()||'').replace('.html','').replace(/[^a-zA-Z0-9_-]/g,'');
  if (!page || page === 'quiz-hub') return;

  var KEY = 'hlqs_' + page;
  var resultEl = document.getElementById('quizResult');
  if (!resultEl) return;

  // ── 還原存檔 ──
  function tryRestore() {
    var saved;
    try { saved = localStorage.getItem(KEY); } catch(e) { return; }
    if (!saved) return;

    var data;
    try { data = JSON.parse(saved); } catch(e) { localStorage.removeItem(KEY); return; }
    if (!data || !data.html) { localStorage.removeItem(KEY); return; }

    // 過期檢查：90天
    if (data.ts && Date.now() - data.ts > 90 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(KEY);
      return;
    }

    // 隱藏開始區域和題目
    var startArea = document.getElementById('startArea');
    var questionsArea = document.getElementById('questionsArea');
    var progressWrap = document.getElementById('progressWrap');
    var heroEl = document.querySelector('.quiz-hero');

    if (startArea) startArea.style.display = 'none';
    if (questionsArea) questionsArea.style.display = 'none';
    if (progressWrap) progressWrap.style.display = 'none';

    // 加上「上次的結果」提示條
    var banner = document.createElement('div');
    banner.id = 'hlqsSavedBanner';
    banner.style.cssText = 'text-align:center;padding:14px 20px;margin-bottom:20px;background:rgba(233,194,125,0.1);border:1px solid rgba(184,146,42,0.25);border-radius:12px;font-size:0.9rem;color:#5a4a30;';
    var timeAgo = getTimeAgo(data.ts);
    banner.innerHTML = '📋 這是您' + timeAgo + '的測驗結果 <button id="hlqsRetestBtn" style="margin-left:12px;padding:6px 18px;border:1px solid rgba(184,146,42,0.3);border-radius:999px;background:transparent;color:#8b6914;font-size:0.85rem;cursor:pointer;font-family:inherit">重新測一次</button>';

    // 插入到 hero 後面或 quiz-wrap 開頭
    var wrap = document.querySelector('.quiz-wrap');
    if (heroEl && heroEl.nextSibling) {
      heroEl.parentNode.insertBefore(banner, heroEl.nextSibling);
    } else if (wrap) {
      wrap.insertBefore(banner, wrap.firstChild);
    }

    // 還原結果
    resultEl.innerHTML = data.html;
    resultEl.classList.add('active');
    resultEl.style.display = 'block';

    // 重新綁定重測按鈕
    document.getElementById('hlqsRetestBtn').onclick = function() {
      localStorage.removeItem(KEY);
      location.reload();
    };

    // 結果頁裡的重測按鈕也要綁定清除
    var retryBtns = resultEl.querySelectorAll('.btn-retry, [onclick*="restart"], [onclick*="Restart"]');
    retryBtns.forEach(function(btn) {
      btn.onclick = function(e) {
        e.preventDefault();
        localStorage.removeItem(KEY);
        location.reload();
      };
    });
  }

  function getTimeAgo(ts) {
    if (!ts) return '';
    var diff = Date.now() - ts;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return '剛剛';
    if (mins < 60) return mins + '分鐘前';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + '小時前';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + '天前';
    return Math.floor(days / 30) + '個月前';
  }

  // ── 保存結果 ──
  function saveResult() {
    if (!resultEl.classList.contains('active') && resultEl.style.display !== 'block') return;
    var html = resultEl.innerHTML;
    if (!html || html.trim().length < 100) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ html: html, ts: Date.now() }));
    } catch(e) {}
  }

  // ── 監聽結果顯示 ──
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      if (m.type === 'attributes' && m.attributeName === 'class') {
        if (resultEl.classList.contains('active')) {
          setTimeout(saveResult, 500);
        }
      }
      if (m.type === 'childList' && m.addedNodes.length > 0) {
        if (resultEl.classList.contains('active') || resultEl.style.display === 'block') {
          setTimeout(saveResult, 500);
        }
      }
    });
  });
  observer.observe(resultEl, { attributes: true, childList: true });

  // 也監聽 style 變化
  var styleObserver = new MutationObserver(function() {
    if (resultEl.style.display === 'block' || resultEl.classList.contains('active')) {
      setTimeout(saveResult, 500);
    }
  });
  styleObserver.observe(resultEl, { attributes: true, attributeFilter: ['style'] });

  // ── 頁面載入時嘗試還原 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(tryRestore, 300); });
  } else {
    setTimeout(tryRestore, 300);
  }

})();
