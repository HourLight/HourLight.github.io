/**
 * 馥靈之鑰 美業合作平台門控 v1.0
 *
 * 邏輯：
 * ► 檢查 Firebase Auth 登入狀態
 * ► 登入後讀 Firestore users/{uid} 的 plan 欄位
 * ► plan 包含 biz / partner / b2b → 解鎖 .biz-locked 元素
 * ► 否則在 #contentGate 顯示加入提示
 * ► Fail-Open 8 秒（與 hl-gate.js 一致）
 */
(function(){
  'use strict';

  // ── 內嵌 CSS ──
  var css = document.createElement('style');
  css.textContent = [
    '.biz-locked{display:none!important}',
    '#hlBizGatePrompt{display:none;max-width:560px;margin:40px auto;padding:48px 32px;text-align:center;border-radius:16px;border:1px solid rgba(233,194,125,.25);background:rgba(233,194,125,.06);font-family:"Noto Serif TC",Georgia,serif}',
    '#hlBizGatePrompt .bgp-icon{font-size:40px;margin-bottom:12px;opacity:.7}',
    '#hlBizGatePrompt .bgp-title{font-size:1.15rem;color:#f8dfa5;letter-spacing:.1em;margin-bottom:10px;font-weight:400}',
    '#hlBizGatePrompt .bgp-desc{font-size:.88rem;color:rgba(255,255,255,.55);line-height:1.8;margin-bottom:24px}',
    '#hlBizGatePrompt .bgp-btn{display:inline-block;padding:12px 28px;border-radius:10px;background:rgba(233,194,125,.15);border:1px solid rgba(233,194,125,.4);color:#f8dfa5;font-size:.92rem;text-decoration:none;letter-spacing:.08em;transition:all .25s;cursor:pointer;font-family:inherit}',
    '#hlBizGatePrompt .bgp-btn:hover{background:rgba(233,194,125,.25)}'
  ].join('\n');
  document.head.appendChild(css);

  var resolved = false;

  // Fail-Open：8 秒後自動解鎖
  var safety = setTimeout(function(){ unlock(); }, 8000);

  function unlock(){
    if(resolved) return;
    resolved = true;
    clearTimeout(safety);
    var els = document.querySelectorAll('.biz-locked');
    for(var i=0;i<els.length;i++){
      els[i].style.display = '';
      els[i].classList.remove('biz-locked');
    }
  }

  function showGate(){
    if(resolved) return;
    resolved = true;
    clearTimeout(safety);
    var gate = document.getElementById('contentGate');
    if(!gate) return; // 沒有 #contentGate 就不顯示

    var prompt = document.createElement('div');
    prompt.id = 'hlBizGatePrompt';
    prompt.style.display = 'block';
    prompt.innerHTML =
      '<div class="bgp-icon">🔐</div>' +
      '<div class="bgp-title">此內容為美業合作夥伴專屬</div>' +
      '<div class="bgp-desc">這個頁面的完整內容僅開放給馥靈之鑰的合作夥伴。<br>成為合作夥伴，解鎖全部美業 AI 工具與範本。</div>' +
      '<a href="price-list-b2b.html" class="bgp-btn">了解合作方案</a>';
    gate.appendChild(prompt);
  }

  // ── 等 Firebase 載入 ──
  var retries = 0;
  function checkAuth(){
    if(resolved) return;
    if(typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0){
      try {
        firebase.auth().onAuthStateChanged(function(user){
          if(resolved) return;
          if(!user){ showGate(); return; }
          // 讀 plan
          try {
            firebase.firestore().collection('users').doc(user.uid).get().then(function(snap){
              if(resolved) return;
              if(!snap.exists){ showGate(); return; }
              var plan = (snap.data().plan || '').toLowerCase();
              if(plan.indexOf('biz') > -1 || plan.indexOf('partner') > -1 || plan.indexOf('b2b') > -1){
                unlock();
              } else {
                showGate();
              }
            }).catch(function(){ unlock(); }); // Firestore 失敗 → Fail-Open
          } catch(e){ unlock(); }
        });
      } catch(e){ unlock(); }
    } else if(retries < 20){
      retries++;
      setTimeout(checkAuth, 400);
    } else {
      unlock(); // Firebase 一直沒載入 → Fail-Open
    }
  }
  setTimeout(checkAuth, 200);

})();
