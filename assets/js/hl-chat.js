/**
 * 馥靈之鑰 AI 客服「小馥」v1.0
 * 全站右下角聊天泡泡
 */
(function(){
  'use strict';

  var API = 'https://app.hourlightkey.com/api/chat';
  var SKIP = ['admin-dashboard.html','member-login.html'];
  var page = (location.pathname.split('/').pop()||'index.html').split('?')[0];
  if (SKIP.indexOf(page) > -1) return;

  var history = []; // {role,content}
  var isOpen = false;
  var bubble, panel, msgArea, inputEl;

  function createUI(){
    // CSS
    var s = document.createElement('style');
    s.textContent = `
.hlc-bubble{position:fixed;bottom:24px;right:90px;z-index:9997;width:56px;height:56px;border-radius:50%;
  background:linear-gradient(135deg,rgba(155,124,182,.3),rgba(233,194,125,.2));cursor:pointer;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 24px rgba(155,124,182,.35);transition:all .35s cubic-bezier(.4,0,.2,1);overflow:hidden;border:2px solid rgba(233,194,125,.3)}
.hlc-bubble img{width:48px;height:48px;object-fit:cover;border-radius:50%;pointer-events:none}
.hlc-bubble:hover{transform:scale(1.1);box-shadow:0 6px 32px rgba(155,124,182,.5);border-color:rgba(233,194,125,.5)}
.hlc-bubble.has-panel{box-shadow:0 4px 20px rgba(240,181,179,.3);border-color:rgba(240,181,179,.4)}
.hlc-pulse{position:absolute;inset:-4px;border-radius:50%;border:2px solid rgba(233,194,125,.3);animation:hlcPulse 3s ease-in-out infinite}
@keyframes hlcPulse{0%,100%{transform:scale(1);opacity:.5}50%{transform:scale(1.15);opacity:0}}

.hlc-panel{position:fixed;bottom:86px;right:24px;z-index:9997;width:360px;max-height:520px;
  background:rgba(14,12,20,.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  border:1px solid rgba(233,194,125,.15);border-radius:20px;overflow:hidden;
  display:none;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.6);
  font-family:"Noto Serif TC","LXGW WenKai TC",serif;
  animation:hlcSlideUp .4s cubic-bezier(.4,0,.2,1)}
@keyframes hlcSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.hlc-panel.show{display:flex}
@media(max-width:480px){.hlc-panel{right:8px;left:8px;width:auto;bottom:80px;max-height:70vh}}

.hlc-header{padding:16px 20px;border-bottom:1px solid rgba(233,194,125,.1);display:flex;align-items:center;gap:12px}
.hlc-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,rgba(155,124,182,.2),rgba(233,194,125,.15));display:flex;align-items:center;justify-content:center;flex:none;overflow:hidden;border:1px solid rgba(233,194,125,.2)}
.hlc-avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.hlc-header-info{flex:1}
.hlc-header-name{font-size:.95rem;color:#f8dfa5;letter-spacing:1px;font-weight:400}
.hlc-header-status{font-size:.7rem;color:rgba(233,194,125,.45);letter-spacing:.5px}
.hlc-close{background:none;border:none;color:rgba(255,255,255,.3);font-size:1.2rem;cursor:pointer;padding:4px 8px}
.hlc-close:hover{color:rgba(255,255,255,.6)}

.hlc-messages{flex:1;overflow-y:auto;padding:16px 18px;display:flex;flex-direction:column;gap:12px;min-height:200px;max-height:340px}
.hlc-msg{max-width:85%;padding:12px 16px;border-radius:14px;font-size:.9rem;line-height:1.9;letter-spacing:.3px;animation:hlcFadeIn .3s ease}
@keyframes hlcFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.hlc-msg.ai{align-self:flex-start;background:rgba(233,194,125,.06);border:1px solid rgba(233,194,125,.1);color:#f0e8d8;border-bottom-left-radius:4px}
.hlc-msg.user{align-self:flex-end;background:rgba(240,181,179,.1);border:1px solid rgba(240,181,179,.12);color:#fad5d3;border-bottom-right-radius:4px}
.hlc-msg.ai a{color:#f8dfa5;text-decoration:underline;text-underline-offset:3px}
.hlc-typing{align-self:flex-start;padding:12px 18px;font-size:.95rem;color:rgba(233,194,125,.4);letter-spacing:1px}
.hlc-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:rgba(233,194,125,.35);margin:0 2px;animation:hlcDot 1.2s ease-in-out infinite}
.hlc-dot:nth-child(2){animation-delay:.2s}.hlc-dot:nth-child(3){animation-delay:.4s}
@keyframes hlcDot{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}

.hlc-input-area{padding:12px 16px;border-top:1px solid rgba(233,194,125,.08);display:flex;gap:8px;align-items:center}
.hlc-input{flex:1;padding:10px 14px;background:rgba(255,255,255,.04);border:1px solid rgba(233,194,125,.1);border-radius:10px;
  color:#f9f0e5;font-size:.9rem;font-family:inherit;outline:none;resize:none;max-height:60px;line-height:1.6}
.hlc-input::placeholder{color:rgba(233,194,125,.25)}
.hlc-input:focus{border-color:rgba(233,194,125,.3)}
.hlc-send{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f8dfa5,#ecd098);border:none;
  color:#1a0e00;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;flex:none}
.hlc-send:hover{box-shadow:0 2px 12px rgba(233,194,125,.4)}
.hlc-send:disabled{opacity:.3;cursor:default}
`;
    document.head.appendChild(s);

    // Bubble
    bubble = document.createElement('div');
    bubble.className = 'hlc-bubble';
    bubble.innerHTML = '<img src="fufu-dark.png" alt="小馥"><div class="hlc-pulse"></div>';
    bubble.onclick = togglePanel;
    document.body.appendChild(bubble);

    // Panel
    panel = document.createElement('div');
    panel.className = 'hlc-panel';
    panel.innerHTML = `
      <div class="hlc-header">
        <div class="hlc-avatar"><img src="fufu-dark.png" alt="小馥"></div>
        <div class="hlc-header-info">
          <div class="hlc-header-name">小馥｜馥靈之鑰 AI 助理</div>
          <div class="hlc-header-status">帶著香氣，隨時都在</div>
        </div>
        <button class="hlc-close" onclick="document.querySelector('.hlc-panel').classList.remove('show');document.querySelector('.hlc-bubble').classList.remove('has-panel')">✕</button>
      </div>
      <div class="hlc-messages" id="hlcMsgs"></div>
      <div class="hlc-input-area">
        <textarea class="hlc-input" id="hlcInput" placeholder="想問什麼？" rows="1"></textarea>
        <button class="hlc-send" id="hlcSend" onclick="window._hlcSend()">➤</button>
      </div>
    `;
    document.body.appendChild(panel);

    msgArea = document.getElementById('hlcMsgs');
    inputEl = document.getElementById('hlcInput');

    // Enter to send
    inputEl.addEventListener('keydown', function(e){
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window._hlcSend(); }
    });

    // Welcome message
    addMsg('ai', '💫 嗨，我是小馥。\n\n您身上帶著什麼味道進來的？是忙了一天之後的疲倦，還是心裡有個問題繞了很久？\n\n不管是哪一種，跟我說說。我幫您找到方向。');
  }

  function togglePanel(){
    isOpen = !isOpen;
    panel.classList.toggle('show', isOpen);
    bubble.classList.toggle('has-panel', isOpen);
    if (isOpen) { setTimeout(function(){ inputEl.focus(); }, 300); }
  }

  function addMsg(role, text){
    var div = document.createElement('div');
    div.className = 'hlc-msg ' + role;
    // 簡易 markdown：[text](url) → <a>
    var html = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/\n/g, '<br>');
    div.innerHTML = html;
    msgArea.appendChild(div);
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  function addTyping(){
    var div = document.createElement('div');
    div.className = 'hlc-typing';
    div.id = 'hlcTyping';
    div.innerHTML = '<span class="hlc-dot"></span><span class="hlc-dot"></span><span class="hlc-dot"></span>';
    msgArea.appendChild(div);
    msgArea.scrollTop = msgArea.scrollHeight;
  }

  function removeTyping(){
    var t = document.getElementById('hlcTyping');
    if (t) t.remove();
  }

  window._hlcSend = async function(){
    var text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    document.getElementById('hlcSend').disabled = true;

    addMsg('user', text);
    history.push({ role: 'user', content: text });

    addTyping();

    try {
      var res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      var data = await res.json();
      var reply = data.reply || '我這邊訊號飄了一下 🌿 您直接加 LINE 找逸君聊最快 → lin.ee/p5tBihbe';

      removeTyping();
      addMsg('ai', reply);
      history.push({ role: 'assistant', content: reply });

      // 只保留最近 10 輪對話（控制成本）
      if (history.length > 20) history = history.slice(-20);

    } catch(e) {
      removeTyping();
      addMsg('ai', '訊號飄了一下，像精油瓶蓋沒蓋緊 😅 您直接加 LINE 跟逸君聊，比較穩 → lin.ee/p5tBihbe');
    }

    document.getElementById('hlcSend').disabled = false;
    inputEl.focus();
  };

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(createUI, 2000); });
  } else {
    setTimeout(createUI, 2000);
  }
})();
