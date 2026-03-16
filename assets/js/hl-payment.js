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
   * @param {string} opts.productId    - 商品ID（如 'pet-5', 'member-699'）
   * @param {string} opts.productName  - 商品名稱（如 '寵物溝通五感覺察'）
   * @param {number} opts.amount       - 金額（整數，新台幣）
   * @param {string} opts.userId       - Firebase UID
   * @param {string} opts.userEmail    - 使用者 email（選填）
   */
  window.HLPayment = {
    pay: async function(opts) {
      if (!opts.productId || !opts.productName || !opts.amount || !opts.userId) {
        alert('付款資訊不完整，請重新操作。');
        return;
      }

      // 顯示載入狀態
      var btn = document.activeElement;
      var originalText = '';
      if (btn && btn.tagName === 'BUTTON') {
        originalText = btn.textContent;
        btn.textContent = '處理中⋯⋯';
        btn.disabled = true;
      }

      try {
        var response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: opts.productId,
            productName: opts.productName,
            amount: opts.amount,
            userId: opts.userId,
            userEmail: opts.userEmail || ''
          })
        });

        var result = await response.json();

        if (!result.success || !result.action || !result.formData) {
          throw new Error(result.error || '建立訂單失敗');
        }

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
        console.error('HLPayment error:', err);
        alert('付款發生錯誤：' + (err.message || '請稍後再試'));
        // 還原按鈕
        if (btn && originalText) {
          btn.textContent = originalText;
          btn.disabled = false;
        }
      }
    }
  };

})();
