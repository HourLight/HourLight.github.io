/**
 * 馥靈之鑰 會員門檻系統 v1.0
 * 
 * 設計原則：Fail-Open（失敗就放行）
 * - Firebase 沒載入 → 放行
 * - JS 報錯 → 放行
 * - 超過 5 秒沒回應 → 放行
 * - 已登入 → 放行
 * - 不在門檻清單中的頁面 → 完全不受影響
 */
(function(){
  'use strict';

  // ═══ 需要登入才能使用的頁面清單 ═══
  var GATED = [
    // 抽牌工具
    'draw-hl.html','draw-light.html','draw-nail.html','draw-spa.html','tarot-draw.html',
    // 命盤計算
    'fuling-mima.html','destiny-engine.html','astro-calculator.html','bazi-calculator.html',
    'hd-calculator.html','maya-calculator.html','qizheng-calculator.html',
    'numerology-calculator.html','lifepath-calculator.html','triangle-calculator.html',
    'ziwei-calculator.html','rainbow-calculator.html',
    // 其他計算工具
    'digital-energy-analyzer.html','scent-navigator.html','quantum-numerology.html',
    'maslow-frequency.html','master.html','aroma-daily.html',
    // 心理測驗
    'quiz-mbti.html','quiz-bigfive.html','quiz-disc.html','quiz-enneagram.html',
    'quiz-bloodtype.html','quiz-eq.html','quiz-hsp.html','quiz-emotion.html',
    'quiz-stress.html','quiz-attachment.html','quiz-innerchild.html','quiz-lovelang.html',
    'quiz-relationship.html','quiz-strengths.html','quiz-via.html','quiz-riasec.html',
    'quiz-aroma.html',
    // 美業測驗
    'quiz-beauty-burnout.html','quiz-beauty-client.html',
    'quiz-beauty-locus.html','quiz-beauty-savior.html'
  ];

  try {
    // 1. 判斷當前頁面是否在清單中
    var page = location.pathname.split('/').pop() || 'index.html';
    if (page.indexOf('?') > -1) page = page.split('?')[0];
    if (GATED.indexOf(page) === -1) return; // 不在清單，完全不做任何事

    // 2. 建立遮罩（但先不顯示，等確認未登入才顯示）
    var overlay = document.createElement('div');
    overlay.id = 'hl-gate';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(8,6,4,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:none;align-items:center;justify-content:center;font-family:"Noto Serif TC",Georgia,serif;';
    overlay.innerHTML = ''
      + '<div style="text-align:center;max-width:420px;padding:48px 32px;animation:hlGateFade .6s ease">'
      +   '<div style="font-size:48px;margin-bottom:20px;opacity:.8">🔑</div>'
      +   '<div style="font-size:22px;color:#e9c27d;letter-spacing:.15em;margin-bottom:12px;font-weight:300">免費註冊，解鎖覺察工具</div>'
      +   '<div style="font-size:13px;color:#a89878;line-height:2;margin-bottom:32px;letter-spacing:.06em">'
      +     '登入後即可使用所有免費覺察工具<br>不需要付費，一鍵 Google 登入即可'
      +   '</div>'
      +   '<button id="hlGateGoogle" style="display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px 20px;background:rgba(233,194,125,0.12);border:1px solid rgba(233,194,125,0.4);border-radius:12px;color:#e9c27d;font-size:15px;cursor:pointer;font-family:inherit;letter-spacing:.08em;transition:all .25s;margin-bottom:12px">'
      +     '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'
      +     'Google 快速登入'
      +   '</button>'
      +   '<a href="app.html" style="display:block;padding:12px 20px;border:1px solid rgba(233,194,125,0.2);border-radius:12px;color:#888;font-size:13px;text-decoration:none;letter-spacing:.08em;transition:all .25s;margin-bottom:24px">Email 登入 / 註冊</a>'
      +   '<div style="font-size:11px;color:#555;letter-spacing:.08em;line-height:1.8">'
      +     '免費帳號即可使用｜不需要信用卡<br>'
      +     '<a href="index.html" style="color:#888;text-decoration:none;border-bottom:1px solid #444">← 回到首頁</a>'
      +   '</div>'
      + '</div>';

    // 加入淡入動畫
    var gateStyle = document.createElement('style');
    gateStyle.textContent = '@keyframes hlGateFade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}';
    document.head.appendChild(gateStyle);

    // 3. 插入但隱藏
    document.body.appendChild(overlay);

    // 4. 安全超時：5 秒後如果還沒決定，直接放行
    var safetyTimeout = setTimeout(function(){
      removeGate();
    }, 5000);

    // 5. 標記是否已決定
    var decided = false;
    function removeGate(){
      decided = true;
      clearTimeout(safetyTimeout);
      var g = document.getElementById('hl-gate');
      if (g) g.style.display = 'none';
    }
    function showGate(){
      if (decided) return;
      var g = document.getElementById('hl-gate');
      if (g) g.style.display = 'flex';
    }

    // 6. 等 Firebase 確認登入狀態
    var retries = 0;
    function checkAuth(){
      if (decided) return;
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
        try {
          firebase.auth().onAuthStateChanged(function(user){
            if (decided) return;
            clearTimeout(safetyTimeout);
            if (user) {
              // 已登入 → 放行
              removeGate();
            } else {
              // 確認未登入 → 顯示遮罩
              decided = true;
              showGate();
              // 綁定 Google 登入按鈕
              var btn = document.getElementById('hlGateGoogle');
              if (btn) {
                btn.onclick = function(){
                  btn.textContent = '登入中...';
                  btn.style.opacity = '0.6';
                  firebase.auth().signInWithPopup(
                    new firebase.auth.GoogleAuthProvider()
                  ).then(function(){
                    removeGate();
                    location.reload(); // 重新載入以正確初始化會員資料
                  }).catch(function(err){
                    btn.textContent = '登入失敗，請再試一次';
                    btn.style.opacity = '1';
                    setTimeout(function(){ btn.textContent = 'Google 快速登入'; }, 2000);
                  });
                };
              }
            }
          });
        } catch(e) {
          // Auth 出錯 → 放行
          removeGate();
        }
      } else if (retries < 15) {
        // Firebase 還沒載入，等一下再試（最多等 7.5 秒）
        retries++;
        setTimeout(checkAuth, 500);
      } else {
        // 重試太多次 → 放行
        removeGate();
      }
    }

    // 延遲 300ms 開始檢查，讓頁面先渲染
    setTimeout(checkAuth, 300);

  } catch(e) {
    // 任何未預期的錯誤 → 移除遮罩放行
    var g = document.getElementById('hl-gate');
    if (g) g.style.display = 'none';
  }
})();
