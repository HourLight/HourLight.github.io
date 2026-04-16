/**
 * 馥靈之鑰 · PAYUNi 統一金流前端模組 v1.0
 * 處理付款按鈕 → 呼叫 API → 跳轉 PAYUNi 支付頁
 * 使用：在需要付款功能的頁面載入此 JS
 * © 2026 Hour Light International
 */
(function(){
  'use strict';

  var API_URL = 'https://app.hourlightkey.com/api/payuni-create';

  /**
   * 發起付款
   * @param {Object} opts
   * @param {string} opts.productId       - 商品ID（如 'pet-5', 'plus-30', 'draw-3', 'akashic-1'）
   * @param {string} opts.productName     - 商品名稱
   * @param {number} opts.amount          - 金額（整數，新台幣）
   * @param {string} opts.userId          - Firebase UID
   * @param {string} opts.userEmail       - 使用者 email（選填）
   * @param {string} opts.returnUrl       - 付款完成後客人被導回的 hourlightkey.com 頁面
   * @param {Array}  opts.cards           - 抽牌資料（用於 ATM/超商背景觸發）
   * @param {string} opts.question        - 問題描述
   * @param {string} opts.readingEndpoint - 解讀 API endpoint（ATM/超商付款成功後後端自動呼叫）
   *                                         例：'https://app.hourlightkey.com/api/pet-reading'
   * @param {Object} opts.readingBody     - 呼叫解讀 API 時的 request body（後端會自動補 email/uid/unlockCode）
   * @param {Object} opts.localState      - 要存到 localStorage 的頁面狀態（付款返回時復原用）
   *                                         會用 key `hl_pending_${productId}` 存
   */
  window.HLPayment = {
    pay: async function(opts) {
      if (!opts.productId || !opts.productName || !opts.amount || !opts.userId) {
        alert('資訊還有缺的地方，再試一次。');
        return;
      }

      // ── 存頁面狀態到 localStorage（付款返回時復原用）──
      if (opts.localState) {
        try {
          localStorage.setItem('hl_pending_' + opts.productId, JSON.stringify({
            productId: opts.productId,
            state: opts.localState,
            savedAt: Date.now()
          }));
        } catch (e) { /* 容量滿等錯誤忽略 */ }
      }

      // 顯示載入狀態
      var btn = document.activeElement;
      var originalText = '';
      if (btn && btn.tagName === 'BUTTON') {
        originalText = btn.textContent;
        btn.textContent = '稍等一下⋯';
        btn.disabled = true;
      }

      // ── GA4 事件：begin_checkout（使用者點擊付款）──
      try {
        if (typeof gtag === 'function') {
          gtag('event', 'begin_checkout', {
            currency: 'TWD',
            value: Number(opts.amount) || 0,
            items: [{
              item_id: opts.productId,
              item_name: opts.productName,
              price: Number(opts.amount) || 0,
              quantity: 1
            }]
          });
        }
        if (typeof fbq === 'function') {
          fbq('track', 'InitiateCheckout', {
            value: Number(opts.amount) || 0,
            currency: 'TWD',
            content_ids: [opts.productId],
            content_name: opts.productName
          });
        }
      } catch(e) { /* analytics never block payment */ }

      try {
        var response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: opts.productId,
            productName: opts.productName,
            amount: opts.amount,
            userId: opts.userId,
            userEmail: opts.userEmail || '',
            returnUrl: opts.returnUrl || '',
            businessId: opts.businessId || '',
            cards: opts.cards || null,
            question: opts.question || '',
            readingEndpoint: opts.readingEndpoint || '',
            readingBody: opts.readingBody || null
          })
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);
        var result = await response.json();

        if (!result.success || !result.action || !result.formData) {
          throw new Error(result.error || '建立訂單失敗');
        }

        // ── GA4 事件：add_payment_info（PAYUNi 建單成功，準備跳轉）──
        try {
          if (typeof gtag === 'function') {
            gtag('event', 'add_payment_info', {
              currency: 'TWD',
              value: Number(opts.amount) || 0,
              payment_type: 'PAYUNi',
              items: [{
                item_id: opts.productId,
                item_name: opts.productName,
                price: Number(opts.amount) || 0,
                quantity: 1
              }]
            });
          }
        } catch(e) {}

        // 建立隱藏表單，POST 跳轉到 PAYUNi 支付頁
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = result.action;
        form.style.display = 'none';

        Object.entries(result.formData).forEach(function(entry) {
          var input = document.createElement('input');
          input.type = 'hidden';
          input.name = entry[0];
          input.value = entry[1];
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();

      } catch (err) {
        // HLPayment error handled with user alert
        alert('付款發生錯誤：' + (err.message || '過一下再試試'));
        // 還原按鈕
        if (btn && originalText) {
          btn.textContent = originalText;
          btn.disabled = false;
        }
      }
    },

    /**
     * 檢查目前頁面是否剛從 PAYUNi 付款返回
     * 回傳：{ success: bool, code: string, orderId: string, localState: object } 或 null
     * 同時會自動從 URL 移除 payment/order/code 參數避免重複觸發
     */
    checkReturn: function(productId) {
      var params = new URLSearchParams(location.search);
      var payment = params.get('payment');
      var code = params.get('code');
      var order = params.get('order');
      if (payment !== 'success' || !code) return null;

      // 從 localStorage 復原頁面狀態
      var localState = null;
      try {
        var saved = localStorage.getItem('hl_pending_' + productId);
        if (saved) {
          var parsed = JSON.parse(saved);
          if (parsed && parsed.state) localState = parsed.state;
          localStorage.removeItem('hl_pending_' + productId);
        }
      } catch (e) { /* ignore */ }

      // ── GA4/FB 事件：purchase（付款成功回到）──
      try {
        var amount = localState && localState.amount ? Number(localState.amount) : 0;
        var itemName = localState && localState.productName ? localState.productName : productId;
        if (typeof gtag === 'function') {
          gtag('event', 'purchase', {
            transaction_id: order || code,
            value: amount,
            currency: 'TWD',
            items: [{
              item_id: productId,
              item_name: itemName,
              price: amount,
              quantity: 1
            }]
          });
        }
        if (typeof fbq === 'function') {
          fbq('track', 'Purchase', {
            value: amount,
            currency: 'TWD',
            content_ids: [productId],
            content_name: itemName
          });
        }
      } catch(e) { /* analytics never block */ }

      // 清掉 URL 參數避免 F5 重複觸發
      try {
        params.delete('payment');
        params.delete('order');
        params.delete('code');
        var newUrl = location.pathname + (params.toString() ? '?' + params.toString() : '') + location.hash;
        history.replaceState(null, '', newUrl);
      } catch (e) { /* ignore */ }

      return { success: true, code: code, orderId: order || '', localState: localState };
    }
  };

})();
