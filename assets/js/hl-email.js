/**
 * 馥靈之鑰 · 全站 Email 寄送模組 v1.0
 * 自動偵測所有「複製」按鈕，在旁邊加上「📧 寄到信箱」
 * 使用：在 </body> 前加 <script src="assets/js/hl-email.js"></script>
 */
(function(){
  'use strict';

  var API = 'https://app.hourlightkey.com/api/send-report';
  var SKIP = ['admin-dashboard.html','member-login.html','member-dashboard.html','privacy.html','terms.html'];
  var page = (location.pathname.split('/').pop()||'index.html').split('?')[0];
  if (SKIP.indexOf(page) > -1) return;

  // 取得頁面工具名稱
  var toolName = '馥靈之鑰';
  var metaTitle = document.querySelector('title');
  if (metaTitle) {
    var t = metaTitle.textContent.split('｜')[0].split(' - ')[0].trim();
    if (t) toolName = t;
  }

  // ── 注入 CSS ──
  var css = document.createElement('style');
  css.textContent = [
    '.hle-overlay{position:fixed;inset:0;z-index:99999;background:rgba(3,2,8,.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:20px}',
    '.hle-overlay.show{display:flex}',
    '.hle-box{background:#0a0714;border:1px solid rgba(240,212,138,.2);border-radius:20px;padding:32px 24px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.6);animation:hleUp .35s cubic-bezier(.4,0,.2,1)}',
    '@keyframes hleUp{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}',
    '.hle-box h3{font-size:1.05rem;color:#f0d48a;letter-spacing:.1em;margin-bottom:8px;text-align:center}',
    '.hle-box .hle-desc{font-size:.85rem;color:rgba(244,240,235,.8);text-align:center;margin-bottom:18px;line-height:1.7}',
    '.hle-box input[type=email]{width:100%;padding:13px 15px;border:1px solid rgba(240,212,138,.2);border-radius:10px;background:rgba(255,255,255,.04);color:#f4f0eb;font-size:.95rem;outline:none;font-family:inherit;transition:border-color .3s}',
    '.hle-box input:focus{border-color:rgba(240,212,138,.5);box-shadow:0 0 0 3px rgba(240,212,138,.06)}',
    '.hle-btns{display:flex;gap:10px;margin-top:16px}',
    '.hle-send{flex:1;padding:12px;border:none;border-radius:40px;background:linear-gradient(135deg,#c9985e,#f0d48a);color:#0a0714;font-size:.92rem;font-weight:600;letter-spacing:.12em;cursor:pointer;transition:all .3s}',
    '.hle-send:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(240,212,138,.25)}',
    '.hle-send:disabled{opacity:.5;cursor:not-allowed;transform:none}',
    '.hle-cancel{padding:12px 18px;border:1px solid rgba(240,212,138,.15);border-radius:40px;background:transparent;color:rgba(200,188,170,.7);font-size:.85rem;cursor:pointer;transition:all .3s}',
    '.hle-cancel:hover{border-color:rgba(240,212,138,.3);color:#f4f0eb}',
    '.hle-status{font-size:.85rem;text-align:center;margin-top:12px;min-height:20px}',
    '.hle-ok{color:#5a9e7a}.hle-err{color:#d4694a}',
    '.hle-btn{display:inline-flex;align-items:center;gap:4px;background:rgba(240,212,138,.06);border:1px solid rgba(240,212,138,.12);border-radius:16px;color:rgba(200,188,170,.7);font-size:.72rem;padding:5px 12px;cursor:pointer;margin-left:6px;transition:all .3s;font-family:inherit;letter-spacing:.03em;vertical-align:middle}',
    '.hle-btn:hover{background:rgba(240,212,138,.12);border-color:rgba(240,212,138,.25);color:#f0d48a;transform:translateY(-1px)}'
  ].join('\n');
  document.head.appendChild(css);

  // ── 注入 Modal HTML ──
  var overlay = document.createElement('div');
  overlay.className = 'hle-overlay';
  overlay.id = 'hleOverlay';
  overlay.onclick = function(e){ if(e.target === overlay) closeModal(); };
  overlay.innerHTML =
    '<div class="hle-box">' +
    '<h3>📧 寄送測算資料</h3>' +
    '<div class="hle-desc">將測算指令寄到您的信箱，方便貼到 AI 工具中解讀</div>' +
    '<input type="email" id="hleEmail" placeholder="請輸入您的電子信箱" autocomplete="email">' +
    '<div class="hle-btns">' +
    '<button class="hle-cancel" onclick="document.getElementById(\'hleOverlay\').classList.remove(\'show\')">取消</button>' +
    '<button class="hle-send" id="hleSendBtn">寄送到信箱</button>' +
    '</div>' +
    '<div class="hle-status" id="hleStatus"></div>' +
    '</div>';
  document.body.appendChild(overlay);

  // ── 綁定 Enter key ──
  var emailInput = document.getElementById('hleEmail');
  if (emailInput) emailInput.addEventListener('keydown', function(e){ if(e.key==='Enter') doSend(); });
  var sendBtn = document.getElementById('hleSendBtn');
  if (sendBtn) sendBtn.onclick = doSend;

  // ── 儲存要寄的內容 ──
  var _content = '';
  var _sysName = '';

  function openModal(content, sysName) {
    _content = content;
    _sysName = sysName || toolName;
    overlay.classList.add('show');
    var inp = document.getElementById('hleEmail');
    if (inp) { inp.value = ''; inp.focus(); }
    var st = document.getElementById('hleStatus');
    if (st) st.textContent = '';
  }
  function closeModal() { overlay.classList.remove('show'); }

  async function doSend() {
    var email = (document.getElementById('hleEmail').value || '').trim();
    var status = document.getElementById('hleStatus');
    var btn = document.getElementById('hleSendBtn');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.innerHTML = '<span class="hle-err">請輸入正確的電子信箱</span>'; return;
    }
    btn.disabled = true; btn.textContent = '⏳ 寄送中...'; status.textContent = '';
    try {
      var resp = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          email: email,
          name: '',
          system: _sysName,
          content: _content,
          subject: '您的' + _sysName + '測算資料 · 馥靈之鑰'
        })
      });
      var data = await resp.json();
      if (data.success) {
        status.innerHTML = '<span class="hle-ok">✅ ' + (data.message || '寄送成功！') + '</span>';
        setTimeout(closeModal, 2200);
      } else {
        status.innerHTML = '<span class="hle-err">❌ ' + (data.error || '寄送失敗') + '</span>';
      }
    } catch(e) {
      status.innerHTML = '<span class="hle-err">❌ 網路錯誤，請稍後再試</span>';
    }
    btn.disabled = false; btn.textContent = '寄送到信箱';
  }

  // ── 自動掃描並注入按鈕 ──
  function injectButtons() {
    // 找所有 onclick 含 copy 的按鈕
    var allBtns = document.querySelectorAll('button[onclick*="copy"], button[onclick*="Copy"]');
    allBtns.forEach(function(btn) {
      // 跳過已經加過的
      if (btn.nextElementSibling && btn.nextElementSibling.classList.contains('hle-btn')) return;
      if (btn.parentNode.querySelector('.hle-btn')) return;
      // 跳過非內容型的複製按鈕（邀請連結、推薦碼、URL 複製等）
      var onclick = btn.getAttribute('onclick') || '';
      var btnText = (btn.textContent || '').trim();
      if (onclick.match(/copyLink|copyInvite|copyUrl|copyCode|copyRef/i)) return;
      if (btn.closest('#inviteSec, #referralSec, .invite-section, .referral-section')) return;
      if (btnText.match(/^複製連結$|^複製網址$|^複製推薦碼$/)) return;

      // 找到對應的 pre/textarea 內容來源
      var onclick = btn.getAttribute('onclick') || '';
      var match = onclick.match(/['"]([\w-]+)['"]/);
      var preId = match ? match[1] : null;

      // 取得系統名稱（從最近的 h3 或 h2）
      var sysLabel = toolName;
      var panel = btn.closest('.panel, .ff-glass, .result-section, [id*="result"], section');
      if (panel) {
        var h = panel.querySelector('h3, h2');
        if (h) sysLabel = h.textContent.replace(/[🏛️🌟🎨🌑🕉️✍️🕎🔮⚷⚸🔺📜✦🧭🌈💫🔐🧪💡🎯]/g, '').trim().substring(0, 20);
      }

      var emailBtn = document.createElement('button');
      emailBtn.className = 'hle-btn';
      emailBtn.innerHTML = '📧 寄到信箱';
      emailBtn.onclick = function(e) {
        e.preventDefault();
        var content = '';
        if (preId) {
          var el = document.getElementById(preId);
          if (el) content = el.textContent || el.innerText;
        }
        if (!content) {
          // 嘗試從同層級的 pre 取
          var pre = btn.parentNode.querySelector('pre');
          if (pre) content = pre.textContent || pre.innerText;
        }
        // 全站通用結果容器（依優先順序嘗試）
        var RESULT_IDS = ['aiResultContent','readingBox','readingContent','quizResult','resultContent','resultArea','resultMain'];
        if (!content) {
          for (var ri = 0; ri < RESULT_IDS.length; ri++) {
            var rEl = document.getElementById(RESULT_IDS[ri]);
            if (rEl && rEl.textContent.trim().length > 20) { content = rEl.textContent; break; }
          }
        }
        if (!content) {
          // 從 class 選擇器找
          var RESULT_CLASSES = '.reading-box, .quiz-result, .result-section, .ai-box, .copy-section, .result-box, .ff-glass, [id*="result"], [id*="Result"]';
          var resultEls = document.querySelectorAll(RESULT_CLASSES);
          for (var rci = 0; rci < resultEls.length; rci++) {
            var txt = resultEls[rci].textContent.trim();
            if (txt.length > 50) { content = txt; break; }
          }
        }
        if (!content) {
          // 最後嘗試從 pre 標籤取
          var allPres = document.querySelectorAll('pre');
          for (var pi = 0; pi < allPres.length; pi++) {
            if (allPres[pi].textContent.trim().length > 30) { content = allPres[pi].textContent; break; }
          }
        }
        if (content) openModal(content, sysLabel);
        else alert('找不到測算內容');
      };

      // 插入到複製按鈕旁邊
      btn.parentNode.insertBefore(emailBtn, btn.nextSibling);
    });
  }

  // 頁面載入後執行 + MutationObserver 監聽動態產生的內容
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(injectButtons, 500); });
  } else {
    setTimeout(injectButtons, 500);
  }

  // 監聽動態內容（例如命盤引擎算完後才產生的按鈕）
  var observer = new MutationObserver(function(mutations) {
    var hasNew = false;
    mutations.forEach(function(m) { if (m.addedNodes.length) hasNew = true; });
    if (hasNew) setTimeout(injectButtons, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // 暴露全局函數（供 destiny-engine 內聯使用）
  window.hlEmailOpen = openModal;

  // ── Sticky Footer CTA：email 訂閱引導 ──
  (function initStickyEmailCTA() {
    // 已訂閱或已關閉 7 天內不顯示
    var SUBSCRIBED_KEY = 'hl_email_subscribed';
    var DISMISSED_KEY = 'hl_email_cta_dismissed';
    if (localStorage.getItem(SUBSCRIBED_KEY)) return;
    var dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed && (Date.now() - parseInt(dismissed, 10)) < 7 * 24 * 60 * 60 * 1000) return;

    // 注入 CSS
    var ctaCss = document.createElement('style');
    ctaCss.textContent = [
      '#hlEmailCta{position:fixed;bottom:0;left:0;right:0;z-index:9998;height:48px;background:#e9c27d;display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer;opacity:0;transform:translateY(48px);transition:opacity .5s,transform .5s;pointer-events:none;font-family:inherit}',
      '#hlEmailCta.show{opacity:1;transform:translateY(0);pointer-events:auto}',
      '#hlEmailCta .hle-cta-text{color:#0a0714;font-size:.85rem;font-weight:600;letter-spacing:.06em}',
      '#hlEmailCta .hle-cta-close{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#0a0714;font-size:1.1rem;cursor:pointer;padding:6px;opacity:.6;transition:opacity .2s}',
      '#hlEmailCta .hle-cta-close:hover{opacity:1}',
      '#hlEmailCtaForm{position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#0a0714;border-top:2px solid #e9c27d;padding:16px 20px;display:none;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}',
      '#hlEmailCtaForm.show{display:flex}',
      '#hlEmailCtaForm input[type=email]{padding:10px 14px;border:1px solid rgba(240,212,138,.3);border-radius:8px;background:rgba(255,255,255,.06);color:#f4f0eb;font-size:.9rem;outline:none;min-width:220px;font-family:inherit}',
      '#hlEmailCtaForm input:focus{border-color:#f0d48a}',
      '#hlEmailCtaForm .hle-cta-submit{padding:10px 22px;border:none;border-radius:8px;background:linear-gradient(135deg,#c9985e,#f0d48a);color:#0a0714;font-size:.88rem;font-weight:600;cursor:pointer;letter-spacing:.08em}',
      '#hlEmailCtaForm .hle-cta-submit:hover{transform:translateY(-1px)}',
      '#hlEmailCtaForm .hle-cta-cancel{background:none;border:1px solid rgba(240,212,138,.2);border-radius:8px;padding:10px 16px;color:rgba(200,188,170,.7);font-size:.85rem;cursor:pointer}',
      '#hlEmailCtaForm .hle-cta-msg{font-size:.82rem;width:100%;text-align:center;margin-top:4px;min-height:18px}'
    ].join('\n');
    document.head.appendChild(ctaCss);

    // 建立 sticky bar
    var bar = document.createElement('div');
    bar.id = 'hlEmailCta';
    bar.innerHTML = '<span class="hle-cta-text">加入馥靈之鑰，每週收到專屬覺察指引</span><button class="hle-cta-close" aria-label="關閉">&#x2715;</button>';
    document.body.appendChild(bar);

    // 建立展開表單
    var form = document.createElement('div');
    form.id = 'hlEmailCtaForm';
    form.innerHTML =
      '<input type="email" id="hlCtaEmail" placeholder="請輸入您的電子信箱" autocomplete="email">' +
      '<button class="hle-cta-submit" id="hlCtaSubmit">訂閱</button>' +
      '<button class="hle-cta-cancel" id="hlCtaCancel">取消</button>' +
      '<div class="hle-cta-msg" id="hlCtaMsg"></div>';
    document.body.appendChild(form);

    // 30 秒後淡入
    setTimeout(function() { bar.classList.add('show'); }, 30000);

    // 點擊 bar → 展開表單
    bar.addEventListener('click', function(e) {
      if (e.target.closest('.hle-cta-close')) return;
      bar.classList.remove('show');
      form.classList.add('show');
      var inp = document.getElementById('hlCtaEmail');
      if (inp) inp.focus();
    });

    // 關閉（7 天不再顯示）
    bar.querySelector('.hle-cta-close').addEventListener('click', function(e) {
      e.stopPropagation();
      bar.classList.remove('show');
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    });

    // 取消
    document.getElementById('hlCtaCancel').addEventListener('click', function() {
      form.classList.remove('show');
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    });

    // 提交訂閱
    document.getElementById('hlCtaSubmit').addEventListener('click', function() {
      var email = (document.getElementById('hlCtaEmail').value || '').trim();
      var msg = document.getElementById('hlCtaMsg');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.innerHTML = '<span style="color:#d4694a">請輸入正確的電子信箱</span>'; return;
      }
      msg.innerHTML = '<span style="color:rgba(244,240,235,.8)">訂閱中...</span>';
      // MailerLite API subscribe（與既有 MailerLite 整合一致）
      fetch('https://assets.mailerlite.com/jsonp/872953/forms/133498498498498132/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { email: email } })
      }).then(function() {
        msg.innerHTML = '<span style="color:#5a9e7a">訂閱成功，感謝您的加入</span>';
        localStorage.setItem(SUBSCRIBED_KEY, '1');
        if (window.hlTrackSubscribe) hlTrackSubscribe();
        if (typeof gtag === 'function') gtag('event', 'email_subscribe', { event_category: 'conversion', method: 'sticky_cta' });
        setTimeout(function() { form.classList.remove('show'); }, 2500);
      }).catch(function() {
        msg.innerHTML = '<span style="color:#d4694a">訂閱失敗，請稍後再試</span>';
      });
    });

    // Enter 鍵提交
    document.getElementById('hlCtaEmail').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') document.getElementById('hlCtaSubmit').click();
    });
  })();

})();
