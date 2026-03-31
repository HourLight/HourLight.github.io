// ═══════════════════════════════════════
// 馥靈之鑰 · 付款牆模組 hl-paywall.js
// 在 AI 解讀觸發前攔截，顯示付款資訊
// © 2026 Hour Light International
// ═══════════════════════════════════════

window.hlPaywall = (function(){
  'use strict';

  // ── 建立付款牆 DOM ──
  function createOverlay(config) {
    var n = config.n || 0;
    var priceMap = config.priceMap || {};
    var price = priceMap[n];
    var serviceName = config.serviceName || '智慧解讀';
    var lineUrl = 'https://lin.ee/RdQBFAN';

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
          '<div style="font-size:2.5rem;margin-bottom:8px">🔮</div>' +
          '<div style="font-size:1.2rem;font-weight:700;color:#f0d48a;letter-spacing:.06em">' + serviceName + '</div>' +
          '<div style="font-size:.85rem;color:rgba(255,255,255,.5);margin-top:6px">' + n + ' 張牌卡智慧解讀</div>' +
        '</div>' +

        // 價格
        '<div style="text-align:center;padding:16px;background:rgba(240,212,138,.06);border:1px solid rgba(240,212,138,.15);border-radius:14px;margin-bottom:20px">' +
          '<div style="font-size:.78rem;color:rgba(255,255,255,.4)">服務費用</div>' +
          '<div style="font-size:1.8rem;font-weight:700;color:#f0d48a;margin:6px 0">NT$ ' + price.toLocaleString() + '</div>' +
          '<div style="font-size:.78rem;color:rgba(255,255,255,.4)">單次計費，付款後生成完整報告</div>' +
        '</div>' +

        // 步驟
        '<div style="margin-bottom:20px">' +
          '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">' +
            '<span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:rgba(240,212,138,.12);color:rgba(240,212,138,.85);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700">1</span>' +
            '<span style="font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.7">匯款 <strong style="color:#f0d48a">NT$ ' + price.toLocaleString() + '</strong> 至下方帳戶</span>' +
          '</div>' +
          '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px">' +
            '<span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:rgba(240,212,138,.12);color:rgba(240,212,138,.85);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700">2</span>' +
            '<span style="font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.7">將<strong style="color:#f0d48a">匯款截圖</strong>傳到 LINE，索取解鎖碼</span>' +
          '</div>' +
          '<div style="display:flex;align-items:flex-start;gap:10px">' +
            '<span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:rgba(240,212,138,.12);color:rgba(240,212,138,.85);display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700">3</span>' +
            '<span style="font-size:.85rem;color:rgba(255,255,255,.6);line-height:1.7">輸入解鎖碼後即可抽牌，系統將自動生成完整智慧解讀報告</span>' +
          '</div>' +
        '</div>' +

        // 匯款資訊
        '<div style="background:rgba(240,212,138,.04);border:1px solid rgba(240,212,138,.12);border-radius:12px;padding:14px;margin-bottom:18px;font-size:.85rem;color:rgba(255,255,255,.6);line-height:2">' +
          '► 銀行：國泰世華銀行 同德分行（013）<br>' +
          '► 帳號：<span style="color:#f0d48a;font-family:monospace;font-weight:700">248-50-624013-3</span><br>' +
          '► 戶名：<span style="color:#f0d48a;font-weight:700">王逸君</span>' +
        '</div>' +

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
          '<div style="margin-top:6px;font-size:.72rem;color:rgba(255,255,255,.3)">付款完成後，請傳 LINE 索取解鎖碼</div>' +
        '</div>' +

        // 分隔線
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
          '<div style="flex:1;height:1px;background:rgba(255,255,255,.07)"></div>' +
          '<div style="font-size:.75rem;color:rgba(255,255,255,.3)">或</div>' +
          '<div style="flex:1;height:1px;background:rgba(255,255,255,.07)"></div>' +
        '</div>' +

        // LINE 按鈕
        '<div style="text-align:center;margin-bottom:16px">' +
          '<a href="' + lineUrl + '" target="_blank" rel="noopener" style="display:inline-block;padding:14px 32px;border-radius:12px;font-size:1rem;font-weight:700;color:#1a1520;background:linear-gradient(135deg,#f0d48a,#e9c27d);text-decoration:none;letter-spacing:.04em;box-shadow:0 4px 16px rgba(240,212,138,.2)">💬 LINE 傳送匯款截圖，索取解鎖碼</a>' +
        '</div>' +

        // 服務承諾
        '<div style="font-size:.78rem;color:rgba(255,255,255,.4);line-height:1.9;margin-bottom:14px">' +
          '⏰ 上班時間（週一至週五 10:00-18:00）確認付款後 <strong style="color:rgba(240,212,138,.6)">30 分鐘內</strong>回覆<br>' +
          '⏰ 下班時間或假日次營業日處理｜急件請加 LINE ID <strong style="color:rgba(240,212,138,.6)">judyanee</strong>' +
        '</div>' +

        // 消費者保護
        '<div style="font-size:.72rem;color:rgba(255,255,255,.3);line-height:1.8;padding-top:12px;border-top:1px solid rgba(255,255,255,.04)">' +
          '🛡️ 付款後尚未收到報告前可申請全額退款。報告交付後恕不退費。每份報告皆為針對您的牌卡組合獨立撰寫。<br>' +
          '服務提供者：馥靈之鑰國際有限公司（統編：60303284）' +
        '</div>' +

        // 關閉按鈕
        '<div style="text-align:center;margin-top:16px">' +
          '<button onclick="hlPaywall.close()" style="padding:10px 24px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.5);font-size:.85rem;cursor:pointer">← 返回</button>' +
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
          'FOOL199': {n:3, expires:'2026-04-07'},
          'FOOL399': {n:5, expires:'2026-04-07'},
          'FOOL599': {n:7, expires:'2026-04-07'}
        };
        if (_PW_PROMO[code]) {
          var _pp = _PW_PROMO[code];
          var _pNow = new Date(), _pExp = new Date(_pp.expires);
          if (_pNow >= _pExp) { errEl.style.display='block'; errEl.textContent='此兌換券已過期（4/6 截止）'; return; }
          if (_pp.n !== _n) { errEl.style.display='block'; errEl.textContent='此兌換券適用於 '+_pp.n+' 張解讀，您目前選了 '+_n+' 張'; return; }
          var _pKey = 'hl_promo_' + code;
          if (localStorage.getItem(_pKey)) { errEl.style.display='block'; errEl.textContent='此兌換券已使用過（每人限用一次）'; return; }
          localStorage.setItem(_pKey, Date.now());
          console.log('[HL] Paywall promo code accepted: ' + code);
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
            errEl.textContent = '此代碼已使用過，無法再次兌換';
            if (btn) { btn.disabled = false; btn.textContent = '✨ 兌換'; }
            return;
          }
          var codeN = codeData.n || codeData.spreads || 3;
          if (_n !== codeN) {
            errEl.style.display = 'block';
            errEl.textContent = '此代碼僅適用於 ' + codeN + ' 張解讀，您目前選擇了 ' + _n + ' 張';
            if (btn) { btn.disabled = false; btn.textContent = '✨ 兌換'; }
            return;
          }
          // 標記已用
          var currentUser = firebase.auth().currentUser;
          await db.collection('reading_codes').doc(code).update({
            used: true,
            usedAt: firebase.firestore.FieldValue.serverTimestamp(),
            usedBy: currentUser ? currentUser.uid : 'guest',
            usedByEmail: currentUser ? (currentUser.email || '') : ''
          });

          // 記錄使用的解鎖碼（供後續 Firestore 留底）
          window._lastUsedUnlockCode = code;
          // 關閉付款牆，觸發 onProceed
          hlPaywall.close();
          if (typeof _onProceed === 'function') {
            _onProceed();
          }
        } catch(e) {
          errEl.style.display = 'block';
          errEl.textContent = '驗證失敗：' + (e.message || '請稍後再試');
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
