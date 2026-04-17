/**
 * 馥靈之鑰 AI 聊天助手 v1.0
 * 小馥（公開版）& 馥寶（管理者模式）
 */
(function(){
  'use strict';

  var SKIP = ['admin-dashboard.html','member-login.html','partner-dashboard.html'];
  var page = (location.pathname.split('/').pop()||'index.html').split('?')[0];
  if (SKIP.indexOf(page) > -1) return;

  var isOpen = false;
  var bubble, panel, chatHistory = [], isTyping = false;
  var isRubyBrain = false;

  function createUI(){
    var s = document.createElement('style');
    s.textContent = `
.hlai-bubble{position:fixed;bottom:78px;right:20px;z-index:9997;width:56px;height:56px;border-radius:50%;
  background:linear-gradient(135deg,rgba(248,223,165,.9),rgba(155,124,182,.7));cursor:pointer;display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 24px rgba(248,223,165,.4);transition:all .35s;border:2px solid rgba(248,223,165,.6);font-size:1.5rem}
.hlai-bubble:hover{transform:scale(1.1);box-shadow:0 8px 32px rgba(248,223,165,.5)}
.hlai-bubble.ruby{background:linear-gradient(135deg,#ff6b6b,#ee5a24);border-color:#ff6b6b}

.hlai-panel{position:fixed;bottom:145px;right:16px;z-index:9997;width:380px;max-width:calc(100vw - 32px);height:500px;max-height:70vh;
  background:rgba(6,4,14,.98);border:1px solid rgba(248,223,165,.3);border-radius:20px;
  box-shadow:0 16px 64px rgba(0,0,0,.6);backdrop-filter:blur(25px);-webkit-backdrop-filter:blur(25px);
  display:none;flex-direction:column;animation:hlaiSlideIn .3s ease}
.hlai-panel.open{display:flex}
@keyframes hlaiSlideIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}

.hlai-header{padding:16px 20px;border-bottom:1px solid rgba(248,223,165,.15);display:flex;align-items:center;justify-content:space-between}
.hlai-title{color:#f8dfa5;font-size:1.1rem;font-weight:600;display:flex;align-items:center;gap:8px}
.hlai-mode-switch{font-size:.7rem;color:rgba(255,255,255,.4);cursor:pointer;padding:4px 8px;border-radius:6px;transition:.2s}
.hlai-mode-switch:hover{background:rgba(248,223,165,.1);color:rgba(255,255,255,.7)}
.hlai-close{background:none;border:none;color:rgba(255,255,255,.4);font-size:1.3rem;cursor:pointer;padding:4px;border-radius:4px;transition:.2s}
.hlai-close:hover{color:rgba(255,255,255,.8);background:rgba(248,223,165,.1)}

.hlai-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.hlai-msg{max-width:85%;word-wrap:break-word;line-height:1.6}
.hlai-msg.user{align-self:flex-end;background:linear-gradient(135deg,#f8dfa5,#e9c27d);color:#1a1520;padding:10px 14px;border-radius:18px 18px 6px 18px;font-weight:500}
.hlai-msg.ai{align-self:flex-start;background:rgba(248,223,165,.08);color:#f9f0e5;padding:12px 16px;border-radius:18px 18px 18px 6px;border:1px solid rgba(248,223,165,.12)}
.hlai-msg.ai.ruby{background:rgba(255,107,107,.08);border-color:rgba(255,107,107,.15)}

.hlai-typing{align-self:flex-start;padding:12px 16px;background:rgba(248,223,165,.05);border-radius:18px 18px 18px 6px;color:rgba(255,255,255,.4);font-style:italic}
.hlai-typing .dots{display:inline-block}
.hlai-typing .dots::after{content:'●●●';animation:hlaiDots 1.5s infinite;font-size:.6em;vertical-align:middle}
@keyframes hlaiDots{0%,20%{color:rgba(255,255,255,.2)}50%{color:rgba(248,223,165,.6)}80%,100%{color:rgba(255,255,255,.2)}}

.hlai-input-area{padding:16px;border-top:1px solid rgba(248,223,165,.1);display:flex;gap:10px;align-items:flex-end}
.hlai-input{flex:1;border:1px solid rgba(248,223,165,.2);background:rgba(255,255,255,.04);color:#fff;padding:12px 16px;border-radius:20px;font-size:.9rem;resize:none;outline:none;font-family:inherit;min-height:20px;max-height:100px;transition:.2s}
.hlai-input:focus{border-color:rgba(248,223,165,.4);background:rgba(255,255,255,.06)}
.hlai-input::placeholder{color:rgba(255,255,255,.3)}
.hlai-send{background:linear-gradient(135deg,#f8dfa5,#e9c27d);color:#1a1520;border:none;border-radius:50%;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1.1rem;transition:.2s;font-weight:600}
.hlai-send:hover{transform:scale(1.05);box-shadow:0 4px 16px rgba(248,223,165,.3)}
.hlai-send:disabled{opacity:.4;cursor:not-allowed;transform:none}

.hlai-welcome{text-align:center;color:rgba(255,255,255,.6);font-size:.85rem;line-height:1.6;margin:20px 0}
.hlai-welcome .icon{font-size:2rem;margin-bottom:8px}

@media(max-width:440px){
  .hlai-panel{right:8px;width:calc(100vw - 16px);height:450px}
}
    `;
    document.head.appendChild(s);

    // Bubble
    bubble = document.createElement('div');
    bubble.className = 'hlai-bubble';
    bubble.innerHTML = '🤖';
    bubble.title = 'AI 助手';
    bubble.onclick = togglePanel;
    document.body.appendChild(bubble);

    // Panel
    panel = document.createElement('div');
    panel.className = 'hlai-panel';
    panel.innerHTML =
      '<div class="hlai-header">' +
        '<div class="hlai-title"><span class="title-text">🌸 小馥</span></div>' +
        '<div class="hlai-mode-switch" onclick="window._hlaiSwitchMode()">切換模式</div>' +
        '<button class="hlai-close" onclick="window._hlaiToggle()">&times;</button>' +
      '</div>' +
      '<div class="hlai-messages" id="hlaiMessages">' +
        '<div class="hlai-welcome">' +
          '<div class="icon">🌸</div>' +
          '我是小馥，馥靈之鑰的 AI 助理<br>有什麼想聊的嗎？' +
        '</div>' +
      '</div>' +
      '<div class="hlai-input-area">' +
        '<textarea class="hlai-input" id="hlaiInput" placeholder="輸入訊息..." rows="1"></textarea>' +
        '<button class="hlai-send" id="hlaiSend" onclick="window._hlaiSend()">→</button>' +
      '</div>';
    document.body.appendChild(panel);

    // Input auto-resize
    var input = document.getElementById('hlaiInput');
    input.addEventListener('input', function(){
      this.style.height = '20px';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
    input.addEventListener('keypress', function(e){
      if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault();
        window._hlaiSend();
      }
    });

    checkRubyMode();
  }

  function togglePanel(){
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    if(isOpen && !chatHistory.length){
      showWelcome();
    }
  }

  function checkRubyMode(){
    // Check if admin user
    if(typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser){
      var email = firebase.auth().currentUser.email;
      var adminEmails = ['info@hourlightkey.com', 'judyanee@gmail.com', 'judyanee@hotmail.com'];
      if(email && adminEmails.indexOf(email) > -1){
        isRubyBrain = true;
        updateUI();
      }
    }
  }

  function updateUI(){
    if(isRubyBrain){
      bubble.className = 'hlai-bubble ruby';
      bubble.innerHTML = '👑';
      bubble.title = '馥寶 · 管理者模式';
      var title = panel.querySelector('.title-text');
      if(title) title.textContent = '👑 馥寶';
      var welcome = panel.querySelector('.hlai-welcome');
      if(welcome) welcome.innerHTML = '<div class="icon">👑</div>馥寶為您服務<br>今天要處理什麼？';
    } else {
      bubble.className = 'hlai-bubble';
      bubble.innerHTML = '🌸';
      bubble.title = 'AI 助手 - 小馥';
      var title = panel.querySelector('.title-text');
      if(title) title.textContent = '🌸 小馥';
    }
  }

  // 60 句快捷提問（每次隨機顯示 6 句）
  var QUICK_CHIPS = [
    // 抽牌占卜
    '我現在的狀態適合抽幾張牌？','今天想抽一張牌，從哪裡開始好？','塔羅、易經、天使牌有什麼差？','抽牌之前需要做什麼準備嗎？','抽到逆位代表什麼意思？',
    // 心理測驗
    '我適合做哪個心理測驗？','MBTI 和九型人格哪個更準？','DISC 測驗可以測什麼？','我想了解自己的依附型態','怎麼知道自己的愛之語？',
    // 命理工具
    '我想查自己的生命靈數怎麼算？','馥靈秘碼是什麼？','八字和紫微有什麼不同？','人類圖是什麼？怎麼看？','我的出生日期可以算什麼？',
    // 城堡系統
    '城堡裡有哪些房間？','什麼是城堡材料？怎麼收集？','靈感點數怎麼使用？','我今天可以做什麼城堡任務？','H.O.U.R. 四殿是什麼意思？',
    // 精油與芳療
    '有沒有適合放鬆的精油？','我最近很焦慮，推薦哪款精油？','薰衣草跟羅馬洋甘菊有什麼不同？','什麼是認知芳療？','精油可以直接塗皮膚嗎？',
    // 關係與情感
    '我和某人的關係適合做合盤嗎？','怎麼用牌卡看感情狀態？','我想了解自己的感情模式','愛的 5 種語言怎麼測？','家族動力測驗是什麼？',
    // 覺察與成長
    '什麼是 H.O.U.R. 覺察系統？','我想知道自己的潛能在哪裡','怎麼開始自我覺察的練習？','我感覺卡住了，從哪個工具開始？','什麼是身心校準？',
    // 會員方案
    '馥靈鑰友和大師有什麼差別？','免費會員每天有幾次 AI 解讀？','AI 解讀怎麼用？','加購次數怎麼計算？','推薦碼是什麼？',
    // 品牌與服務
    '馥靈之鑰是什麼？','逸君是誰？','一對一覺察師服務怎麼預約？','馥靈之鑰有哪些服務？','我適合哪種方案？',
    // 元辰宮與特殊解讀
    '元辰宮是什麼？','阿卡西紀錄怎麼解讀？','前世故事是什麼？','姓名分析怎麼做？','我想做深度解讀從哪裡開始？'
  ];

  function showWelcome(){
    if(isRubyBrain){
      addMessage('ai', '馥寶為您服務。\n\n今天要處理什麼工作嗎？\n• 網站技術問題\n• 內容創作\n• 數據分析\n• 商業策略');
    } else {
      addMessage('ai', '您好！我是小馥 🌸\n\n我可以幫您：\n• 推薦適合的測驗或工具\n• 回答馥靈之鑰的問題\n• 聊聊您想探索的話題');
      showQuickChips();
    }
  }

  function showQuickChips(){
    var messagesDiv = document.getElementById('hlaiMessages');
    if(!messagesDiv) return;
    // 隨機取 6 句
    var pool = QUICK_CHIPS.slice();
    var chosen = [];
    while(chosen.length < 6 && pool.length){
      var idx = Math.floor(Math.random() * pool.length);
      chosen.push(pool.splice(idx, 1)[0]);
    }
    var chipsDiv = document.createElement('div');
    chipsDiv.id = 'hlaiChips';
    chipsDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;padding:0 4px 4px;';
    chosen.forEach(function(text){
      var chip = document.createElement('button');
      chip.style.cssText = 'padding:6px 12px;border-radius:20px;border:1px solid rgba(248,223,165,.25);background:rgba(248,223,165,.07);color:rgba(249,240,229,.75);font-size:.75rem;cursor:pointer;font-family:inherit;transition:.2s;text-align:left;line-height:1.4;min-height:0;';
      chip.textContent = text;
      chip.onmouseenter = function(){ this.style.background='rgba(248,223,165,.14)'; this.style.borderColor='rgba(248,223,165,.4)'; this.style.color='#f8dfa5'; };
      chip.onmouseleave = function(){ this.style.background='rgba(248,223,165,.07)'; this.style.borderColor='rgba(248,223,165,.25)'; this.style.color='rgba(249,240,229,.75)'; };
      chip.onclick = function(){
        var input = document.getElementById('hlaiInput');
        if(input){ input.value = this.textContent; input.focus(); }
        var c = document.getElementById('hlaiChips');
        if(c) c.remove();
      };
      chipsDiv.appendChild(chip);
    });
    messagesDiv.appendChild(chipsDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function addMessage(type, text){
    var messagesDiv = document.getElementById('hlaiMessages');
    var msgDiv = document.createElement('div');
    msgDiv.className = 'hlai-msg ' + type + (isRubyBrain && type === 'ai' ? ' ruby' : '');
    msgDiv.textContent = text;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function showTyping(){
    var messagesDiv = document.getElementById('hlaiMessages');
    var typingDiv = document.createElement('div');
    typingDiv.className = 'hlai-typing';
    typingDiv.id = 'hlaiTyping';
    typingDiv.innerHTML = '<span class="dots"></span>';
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function hideTyping(){
    var typing = document.getElementById('hlaiTyping');
    if(typing) typing.remove();
  }

  async function sendMessage(message){
    if(isTyping) return;
    isTyping = true;

    var input = document.getElementById('hlaiInput');
    var sendBtn = document.getElementById('hlaiSend');

    input.disabled = true;
    sendBtn.disabled = true;

    // Add user message
    addMessage('user', message);
    chatHistory.push({ role: 'user', content: message });

    // Show typing
    showTyping();

    try {
      var headers = { 'Content-Type': 'application/json' };

      // Add Ruby token if in Ruby mode
      if(isRubyBrain && typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser){
        var token = await firebase.auth().currentUser.getIdToken();
        headers['x-ruby-token'] = token;
      }

      var response = await fetch('https://app.hourlightkey.com/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          messages: chatHistory.slice(-10), // Last 10 messages
          page: location.href
        })
      });

      if(!response.ok) throw new Error('API Error');

      var data = await response.json();
      var reply = data.reply || '抱歉，我現在無法回應。過一下再試試。';

      hideTyping();
      addMessage('ai', reply);
      chatHistory.push({ role: 'assistant', content: reply });

    } catch(err) {
      hideTyping();
      addMessage('ai', '抱歉，連接出了點問題。過一下再試試或直接聯繫我們 LINE：@hourlight');
    }

    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
    isTyping = false;
  }

  // Global functions
  window._hlaiToggle = togglePanel;
  window._hlaiSwitchMode = function(){
    if(!isRubyBrain) return;
    // Future: switch between different modes
    alert('模式切換功能開發中...');
  };
  window._hlaiSend = function(){
    var input = document.getElementById('hlaiInput');
    var message = input.value.trim();
    if(!message || isTyping) return;

    input.value = '';
    input.style.height = '20px';
    sendMessage(message);
  };

  // Initialize
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }

  // Check auth state
  if(typeof firebase !== 'undefined' && firebase.auth){
    firebase.auth().onAuthStateChanged(function(user){
      if(user) checkRubyMode();
    });
  }

})();