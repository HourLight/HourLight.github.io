// ═══════════════════════════════════════
// 馥靈之鑰 · 付款牆模組 hl-paywall.js v2.0
// 在 AI 解讀觸發前攔截，顯示付款資訊
// v2.0：加入 PAYUNi 線上付款（路徑 A）+ 保留代碼兌換（路徑 B）
// © 2026 Hour Light International
// ═══════════════════════════════════════

window.hlPaywall = (function(){
  'use strict';

  // ── 從 URL pathname 自動偵測商品類別（productCategory） ──
  function detectCategory() {
    var p = (location.pathname || '').toLowerCase();
    if (p.indexOf('pet-reading') !== -1 || p.indexOf('pet-') !== -1) return 'pet';
    if (p.indexOf('family-reading') !== -1 || p.indexOf('draw-family') !== -1) return 'family';
    if (p.indexOf('draw-spa') !== -1) return 'spa';
    if (p.indexOf('draw-nail') !== -1) return 'nail';
    if (p.indexOf('draw-light') !== -1) return 'light';
    if (p.indexOf('draw-hl') !== -1 || p.indexOf('draw-') !== -1) return 'draw';
    if (p.indexOf('wealth-wallpaper') !== -1) return 'wallpaper';
    return null;
  }

  // ── lazy-load hl-payment.js（讓不同頁面的 paywall 都能用 PAYUNi 線上付款） ──
  function ensurePaymentLoaded(cb) {
    if (window.HLPayment && window.HLPayment.pay) { cb(); return; }
    if (document.querySelector('script[data-hl-payment-loader]')) {
      // 已有人在載，等 200ms 後重試
      setTimeout(function(){ ensurePaymentLoaded(cb); }, 200);
      return;
    }
    var s = document.createElement('script');
    s.src = 'assets/js/hl-payment.js';
    s.setAttribute('data-hl-payment-loader', '1');
    s.onload = function(){ cb(); };
    s.onerror = function(){
      alert('線上付款模組載入失敗，請改用代碼兌換或銀行轉帳。');
    };
    document.head.appendChild(s);
  }

  // ── 建立付款牆 DOM ──
  function createOverlay(config) {
    var n = config.n || 0;
    var priceMap = config.priceMap || {};
    var price = priceMap[n];
    var serviceName = config.serviceName || '智慧解讀';
    var lineUrl = 'https://lin.ee/RdQBFAN';
    var category = config.productCategory || detectCategory();
    var canPayOnline = !!(category && price && n >= 1 && n <= 99);

    if (!price && price !== 0) {
      // 沒有對應價格 = 不收費（理論上不該到這裡）
      return null;
    }

    var overlay = document.createElement('div');
    overlay.id = 'hlPaywallOverlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(10,6,18,.92);display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto';

    var overlayId = 'hlPaywallOverlay';
    overlay.innerHTML =
      '<div style="max-width:480px;width:100%;background:rgba(20,16,32,.95);border:1px solid rgba(240,212,138,.2);border-radius:20px;padding:32px 24px;max-height:90vh;overflow-y:auto">' +
        '<div style="text-align:center;margin-bottom:20px">' +
          '<div style="font-size:1.2rem;font-weight:700;color:#f0d48a;letter-spacing:.06em">' + serviceName + '</div>' +
          '<div style="font-size:.85rem;color:rgba(255,255,255,.5);margin-top:6px">' + n + ' 張牌卡智慧解讀</div>' +
        '</div>' +

        // 價格
        '<div style="text-align:center;padding:16px;background:rgba(240,212,138,.06);border:1px solid rgba(240,212,138,.15);border-radius:14px;margin-bottom:20px">' +
          '<div style="font-size:.78rem;color:rgba(255,255,255,.4)">服務費用</div>' +
          '<div style="font-size:1.8rem;font-weight:700;color:#f0d48a;margin:6px 0">NT$ ' + price.toLocaleString() + '</div>' +
          '<div style="font-size:.78rem;color:rgba(255,255,255,.4)">單次計費，付款後幾分鐘內生成完整報告</div>' +
        '</div>' +

        // ── 路徑 A：PAYUNi 線上付款（最推薦）──
        (canPayOnline ?
        '<div style="background:linear-gradient(135deg,rgba(240,212,138,.12),rgba(201,160,96,.06));border:1.5px solid rgba(240,212,138,.4);border-radius:14px;padding:18px;margin-bottom:14px">' +
          '<div style="color:#f8dfa5;font-weight:700;font-size:.92rem;margin-bottom:6px">線上付款｜信用卡 ／ ATM ／ 超商</div>' +
          '<div style="font-size:.78rem;color:rgba(248,223,165,.65);line-height:1.7;margin-bottom:12px">PAYUNi 安全結帳，付款完成後系統自動發碼，立即回到頁面繼續解讀。不需要等人工確認。</div>' +
          '<button id="hlPayuniBtn" style="width:100%;padding:14px 20px;border-radius:10px;background:linear-gradient(135deg,#f0d48a,#c9a060);color:#1a1520;font-weight:700;font-size:.95rem;border:none;cursor:pointer;letter-spacing:.04em">開始線上付款 NT$ ' + price.toLocaleString() + '</button>' +
        '</div>' : '') +

        // 分隔線
        (canPayOnline ?
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
          '<div style="flex:1;height:1px;background:rgba(255,255,255,.07)"></div>' +
          '<div style="font-size:.72rem;color:rgba(255,255,255,.35);letter-spacing:.1em">或</div>' +
          '<div style="flex:1;height:1px;background:rgba(255,255,255,.07)"></div>' +
        '</div>' : '') +

        // 代碼兌換區塊
        '<div style="background:rgba(240,212,138,.05);border:1px solid rgba(240,212,138,.2);border-radius:14px;padding:16px;margin-bottom:16px">' +
          '<div style="color:#f0d48a;font-weight:700;font-size:.88rem;margin-bottom:10px">🎟️ 已有解讀代碼？直接兌換</div>' +
          '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
            '<input type="text" id="hlPaywallCodeInput" placeholder="輸入代碼，例如 HL3-ABCD12"' +
              ' style="flex:1;min-width:160px;padding:10px 14px;border-radius:10px;border:1.5px solid rgba(240,212,138,.3);background:rgba(255,255,255,.04);color:#fff;font-size:.9rem;font-family:monospace;letter-spacing:.06em;outline:none;text-transform:uppercase"' +
              ' oninput="this.value=this.value.toUpperCase()">' +
            '<button onclick="window._hlPaywallRedeemCode()"' +
              ' style="padding:10px 18px;border-radius:10px;background:linear-gradient(135deg,#f0d48a,#c9a060);color:#1a1520;font-weight:700;font-size:.85rem;border:none;cursor:pointer;white-space:nowrap">✨ 兌換</button>' +
          '</div>' +
          '<div id="hlPaywallCodeErr" style="display:none;margin-top:8px;padding:8px 12px;border-radius:8px;background:rgba(217,48,37,.08);color:#e57373;font-size:.78rem"></div>' +
          '<div style="margin-top:6px;font-size:.72rem;color:rgba(255,255,255,.35)">代碼來源：會員月禮、活動贈送、行銷促銷、過去 LINE 索取的解鎖碼</div>' +
        '</div>' +

        // 服務承諾
        '<div style="font-size:.76rem;color:rgba(255,255,255,.45);line-height:1.9;margin-top:14px;margin-bottom:12px">' +
          '線上付款後系統立即發碼，無需等待人工確認。<br>' +
          '若使用代碼兌換，付款相關問題請聯繫官方 LINE <strong style="color:rgba(240,212,138,.7)">@hourlight</strong>。'+
        '</div>' +

        // 消費者保護
        '<div style="font-size:.7rem;color:rgba(255,255,255,.32);line-height:1.8;padding-top:12px;border-top:1px solid rgba(255,255,255,.04)">' +
          '付款後尚未收到報告前可申請全額退款。報告交付後恕不退費。每份報告皆為針對您的牌卡組合獨立撰寫。<br>' +
          '服務提供者：馥靈之鑰國際有限公司（統編：60303284）' +
        '</div>' +

        // 關閉按鈕
        '<div style="text-align:center;margin-top:16px">' +
          '<button onclick="hlPaywall.close()" style="padding:10px 24px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.5);font-size:.85rem;cursor:pointer">返回</button>' +
        '</div>' +
      '</div>';

    return overlay;
  }

  // ── 公開方法 ──
  return {
    /**
     * 攔截 AI 呼叫，顯示付款牆
     * @param {Object} config
     * @param {number} config.n - 抽牌張數
     * @param {Object} config.priceMap - { 3: 600, 5: 900, 9: 1200 }
     * @param {string} config.serviceName - '指尖能量覺察' etc
     * @param {Function} config.onProceed - 付款確認後的回調（未來接金流用）
     */
    show: function(config) {
      // 移除舊的
      var old = document.getElementById('hlPaywallOverlay');
      if (old) old.remove();

      var overlay = createOverlay(config);
      if (!overlay) {
        // 沒有價格 = 免費，直接放行
        if (config.onProceed) config.onProceed();
        return;
      }

      document.body.appendChild(overlay);
      // 禁止背景滾動
      document.body.style.overflow = 'hidden';

      // 注入代碼兌換邏輯
      var _onProceed = config.onProceed || null;
      var _n = config.n;
      var _pageType = config.pageType || '';
      var _category = config.productCategory || detectCategory();
      var _serviceName = config.serviceName || '智慧解讀';
      var _price = (config.priceMap || {})[_n];

      // ── 路徑 A：PAYUNi 線上付款按鈕 ──
      var payuniBtn = document.getElementById('hlPayuniBtn');
      if (payuniBtn && _category && _price) {
        payuniBtn.addEventListener('click', function(){
          // 檢查登入
          var u = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
          if (!u) {
            alert('請先登入會員才能線上付款。\n按確定前往登入頁。');
            var redirect = encodeURIComponent(location.href.split('?')[0]);
            location.href = 'app.html?redirect=' + redirect;
            return;
          }
          payuniBtn.disabled = true;
          payuniBtn.textContent = '稍等一下⋯';
          ensurePaymentLoaded(function(){
            HLPayment.pay({
              productId:   _category + '-' + _n,
              productName: _serviceName + '（' + _n + ' 張）',
              amount:      _price,
              userId:      u.uid,
              userEmail:   u.email || '',
              returnUrl:   location.href.split('?')[0]
            });
          });
        });
      }
      // deferConsume：true = 只驗證不標記已用（由後端在生成成功後標記）
      var _deferConsume = config.deferConsume === true;
      window._hlPaywallRedeemCode = async function() {
        var input = document.getElementById('hlPaywallCodeInput');
        var errEl = document.getElementById('hlPaywallCodeErr');
        var code = input ? input.value.trim().toUpperCase() : '';
        if (!code || code.length < 6) {
          errEl.style.display = 'block';
          errEl.textContent = '請輸入解讀代碼';
          return;
        }
        // ✅ Master Code：管理員/VIP 永久通行碼
        if (code === 'ASDF2258') {
          window._lastUsedUnlockCode = code;
          hlPaywall.close();
          if (typeof _onProceed === 'function') _onProceed();
          return;
        }
        // ✅ 愚人節促銷碼（4/6 到期）
        var _PW_PROMO = {
          'FOOL199': {n:3, expires:'2026-04-07T23:59:59+08:00'},
          'FOOL399': {n:5, expires:'2026-04-07T23:59:59+08:00'},
          'FOOL599': {n:7, expires:'2026-04-07T23:59:59+08:00'}
        };
        if (_PW_PROMO[code]) {
          var _pp = _PW_PROMO[code];
          var _pNow = new Date(), _pExp = new Date(_pp.expires);
          if (_pNow >= _pExp) { errEl.style.display='block'; errEl.textContent='此兌換券已過期（4/6 截止）'; return; }
          if (_pp.n !== _n) { errEl.style.display='block'; errEl.textContent='此兌換券適用於 '+_pp.n+' 張解讀，您目前選了 '+_n+' 張'; return; }
          var _pKey = 'hl_promo_' + code;
          if (localStorage.getItem(_pKey)) { errEl.style.display='block'; errEl.textContent='此兌換券已使用過（每人限用一次）'; return; }
          localStorage.setItem(_pKey, Date.now());
          try{var _pdb=(typeof firebase!=='undefined'&&firebase.firestore)?firebase.firestore():null;var _pu=firebase.auth().currentUser;
            if(_pdb)_pdb.collection('promo_redemptions').add({code:code,n:_n,source:'paywall',uid:_pu?_pu.uid:'guest',email:_pu?_pu.email:'',ts:firebase.firestore.FieldValue.serverTimestamp()});
          }catch(e){}
          window._lastUsedUnlockCode = code;
          hlPaywall.close();
          if (typeof _onProceed === 'function') _onProceed();
          return;
        }
        // 驗證前 UI 更新
        var btn = input && input.nextElementSibling;
        if (btn) { btn.disabled = true; btn.textContent = '驗證中⋯'; }
        errEl.style.display = 'none';

        try {
          var db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
          if (!db) throw new Error('Firebase 未載入');

          var codeDoc = await db.collection('reading_codes').doc(code).get();
          if (!codeDoc.exists) {
            errEl.style.display = 'block';
            errEl.textContent = '代碼無效，請確認輸入是否正確';
            if (btn) { btn.disabled = false; btn.textContent = '✨ 兌換'; }
            return;
          }
          var codeData = codeDoc.data();
          if (codeData.used) {
            errEl.style.display = 'block';
            errEl.textContent = '這組代碼已經被用過了。要不要試試另一個？';
            if (btn) { btn.disabled = false; btn.textContent = '✨ 兌換'; }
            return;
          }
          // 服務類型守門（向後相容：舊代碼沒有 service 欄位 → 視為通用）
          var codeService = codeData.service || '';
          if (codeService && _pageType && codeService !== _pageType) {
            var svcNames = { 'reading':'牌卡解讀', 'beauty':'美甲/SPA', 'wealth-wallpaper':'蘊福桌布' };
            errEl.style.display = 'block';
            errEl.textContent = '此代碼僅適用於「' + (svcNames[codeService] || codeService) + '」服務';
            if (btn) { btn.disabled = false; btn.textContent = '✨ 兌換'; }
            return;
          }
          var codeN = codeData.n || codeData.spreads || 3;
          if (_n !== codeN) {
            errEl.style.display = 'block';
            errEl.textContent = '此代碼僅適用於 ' + codeN + ' 張，您目前選擇了 ' + _n + ' 張';
            if (btn) { btn.disabled = false; btn.textContent = '✨ 兌換'; }
            return;
          }
          // 標記已用（除非 deferConsume，由後端在生成成功後才消耗）
          if (!_deferConsume) {
            var currentUser = firebase.auth().currentUser;
            await db.collection('reading_codes').doc(code).update({
              used: true,
              usedAt: firebase.firestore.FieldValue.serverTimestamp(),
              usedBy: currentUser ? currentUser.uid : 'guest',
              usedByEmail: currentUser ? (currentUser.email || '') : ''
            });
          }

          // 記錄使用的解鎖碼（供後續 Firestore 留底）
          window._lastUsedUnlockCode = code;
          // 關閉付款牆，觸發 onProceed
          hlPaywall.close();
          if (typeof _onProceed === 'function') {
            _onProceed();
          }
        } catch(e) {
          errEl.style.display = 'block';
          errEl.textContent = '驗證失敗：' + (e.message || '過一下再試試');
          if (btn) { btn.disabled = false; btn.textContent = '✨ 兌換'; }
        }
      };
    },

    close: function() {
      var el = document.getElementById('hlPaywallOverlay');
      if (el) el.remove();
      document.body.style.overflow = '';
    }
  };
})();
