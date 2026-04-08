/**
 * 馥靈之鑰 問題回報中心 v2.0
 * 原為 AI 客服「小馥」，改為問題回報表單
 * 用戶回報的問題會存入 Firestore feedback 集合
 */
(function(){
  'use strict';

  var SKIP = ['admin-dashboard.html','member-login.html','partner-dashboard.html'];
  var page = (location.pathname.split('/').pop()||'index.html').split('?')[0];
  if (SKIP.indexOf(page) > -1) return;

  var isOpen = false;
  var bubble, panel;

  function createUI(){
    var s = document.createElement('style');
    s.textContent = `
.hlc-bubble{position:fixed;bottom:78px;right:20px;z-index:9997;width:52px;height:52px;border-radius:50%;
  background:linear-gradient(135deg,rgba(248,223,165,.15),rgba(155,124,182,.15));cursor:pointer;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 20px rgba(0,0,0,.2);transition:all .35s;border:1.5px solid rgba(248,223,165,.2);font-size:1.4rem}
.hlc-bubble:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(248,223,165,.25);border-color:rgba(248,223,165,.4)}

.hlc-panel{position:fixed;bottom:140px;right:16px;z-index:9997;width:340px;max-width:calc(100vw - 32px);
  background:rgba(12,8,22,.97);border:1px solid rgba(248,223,165,.2);border-radius:20px;
  box-shadow:0 12px 48px rgba(0,0,0,.5);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  padding:24px 20px;display:none;animation:hlcFadeIn .25s ease}
.hlc-panel.open{display:block}
@keyframes hlcFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

.hlc-title{color:#f8dfa5;font-size:1rem;font-weight:600;letter-spacing:1px;margin-bottom:4px}
.hlc-sub{color:rgba(255,255,255,.45);font-size:.78rem;margin-bottom:16px;line-height:1.6}
.hlc-label{color:rgba(255,255,255,.6);font-size:.78rem;margin-bottom:6px;display:block}
.hlc-select{width:100%;padding:10px 14px;border-radius:10px;border:1px solid rgba(248,223,165,.2);background:rgba(255,255,255,.04);color:#fff;font-size:.88rem;margin-bottom:12px;outline:none;font-family:inherit}
.hlc-select option{background:#1a1428;color:#fff}
.hlc-textarea{width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(248,223,165,.15);background:rgba(255,255,255,.03);color:#fff;font-size:.88rem;min-height:80px;resize:vertical;outline:none;font-family:inherit;line-height:1.6}
.hlc-textarea::placeholder{color:rgba(255,255,255,.3)}
.hlc-textarea:focus,.hlc-select:focus{border-color:rgba(248,223,165,.4)}
.hlc-send{width:100%;padding:12px;border-radius:12px;background:linear-gradient(135deg,#f8dfa5,#e9c27d);color:#1a1520;font-weight:700;font-size:.9rem;border:none;cursor:pointer;margin-top:12px;font-family:inherit;letter-spacing:.5px;transition:all .2s}
.hlc-send:hover{box-shadow:0 4px 16px rgba(248,223,165,.3)}
.hlc-send:disabled{opacity:.5;cursor:not-allowed}
.hlc-ok{text-align:center;padding:20px 0;color:rgba(255,255,255,.7);font-size:.9rem;line-height:1.8}
.hlc-ok .ok-icon{font-size:2rem;margin-bottom:8px}
.hlc-close{position:absolute;top:12px;right:14px;background:none;border:none;color:rgba(255,255,255,.3);font-size:1.2rem;cursor:pointer;padding:4px}
@media(max-width:400px){.hlc-panel{right:8px;width:calc(100vw - 16px);bottom:130px}}
`;
    document.head.appendChild(s);

    // Bubble
    bubble = document.createElement('div');
    bubble.className = 'hlc-bubble';
    bubble.innerHTML = '💬';
    bubble.title = '問題回報';
    bubble.onclick = togglePanel;
    document.body.appendChild(bubble);

    // Panel
    panel = document.createElement('div');
    panel.className = 'hlc-panel';
    panel.innerHTML =
      '<button class="hlc-close" onclick="document.querySelector(\'.hlc-panel\').classList.remove(\'open\')">&times;</button>' +
      '<div class="hlc-title">問題回報中心</div>' +
      '<div class="hlc-sub">遇到問題？讓我們知道，會盡快處理。</div>' +
      '<label class="hlc-label">問題類型</label>' +
      '<select class="hlc-select" id="hlcType">' +
        '<option value="bug">功能異常 / 頁面壞掉</option>' +
        '<option value="payment">付款 / 解鎖碼問題</option>' +
        '<option value="display">顯示 / 排版問題</option>' +
        '<option value="suggestion">建議 / 想要的功能</option>' +
        '<option value="other">其他</option>' +
      '</select>' +
      '<label class="hlc-label">問題描述</label>' +
      '<textarea class="hlc-textarea" id="hlcMsg" placeholder="請描述您遇到的問題，越具體越好⋯"></textarea>' +
      '<button class="hlc-send" id="hlcSend" onclick="window._hlcSubmit()">送出回報</button>';
    document.body.appendChild(panel);
  }

  function togglePanel(){
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
  }

  window._hlcSubmit = function(){
    var type = document.getElementById('hlcType').value;
    var msg = document.getElementById('hlcMsg').value.trim();
    if (!msg) { document.getElementById('hlcMsg').style.borderColor = 'rgba(220,80,80,.5)'; return; }

    var btn = document.getElementById('hlcSend');
    btn.disabled = true;
    btn.textContent = '送出中⋯';

    var data = {
      type: type,
      message: msg,
      page: location.href,
      userAgent: navigator.userAgent,
      screenSize: screen.width + 'x' + screen.height,
      timestamp: new Date().toISOString()
    };

    // Try to get user info
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      var u = firebase.auth().currentUser;
      data.uid = u.uid;
      data.email = u.email || '';
    }

    // Save to Firestore
    var saved = false;
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      try {
        firebase.firestore().collection('feedback').add(data).then(function(){
          showSuccess();
        }).catch(function(){
          showSuccess(); // Still show success to user
        });
        saved = true;
      } catch(e) {}
    }
    if (!saved) showSuccess();

    function showSuccess(){
      panel.querySelector('.hlc-title').textContent = '';
      panel.querySelector('.hlc-sub').textContent = '';
      var content = panel.querySelectorAll('.hlc-label,.hlc-select,.hlc-textarea,.hlc-send');
      for (var i = 0; i < content.length; i++) content[i].style.display = 'none';
      var ok = document.createElement('div');
      ok.className = 'hlc-ok';
      ok.innerHTML = '<div class="ok-icon">✅</div>收到了！我們會盡快處理。<br><br>如果是緊急問題，請直接<br><a href="https://lin.ee/RdQBFAN" target="_blank" style="color:#f8dfa5;text-decoration:underline">LINE 聯繫我們</a>';
      panel.appendChild(ok);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }
})();
