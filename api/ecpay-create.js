// ═══════════════════════════════════════
// 馥靈之鑰 · 綠界 ECPay 建立訂單 API
// Vercel Serverless Function
// © 2026 Hour Light International
// ═══════════════════════════════════════

var crypto = require('crypto');

module.exports = async function handler(req, res) {
  // CORS
  var origin = req.headers.origin || '';
  var allowed = ['https://hourlightkey.com','https://www.hourlightkey.com','http://localhost:3000'];
  if (allowed.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var MID = process.env.ECPAY_MERCHANT_ID;
  var HASH_KEY = process.env.ECPAY_HASH_KEY;
  var HASH_IV = process.env.ECPAY_HASH_IV;
  var TEST_MODE = process.env.ECPAY_TEST_MODE === 'true';

  if (!MID || !HASH_KEY || !HASH_IV) {
    return res.status(500).json({ error: '綠界金流尚未設定' });
  }

  try {
    var body = req.body || {};
    var orderType = body.type || 'draw';  // 'draw' = 抽牌解讀, 'subscription' = 會員訂閱

    var amount, itemName, customField1, customField2;

    if (orderType === 'subscription') {
      // ── 會員訂閱 ──
      var plan = body.plan;  // 'plus' or 'pro'
      var uid = body.uid || '';
      var email = body.email || '';

      var subPriceMap = { plus: 399, pro: 999 };
      var subNameMap = { plus: '馥靈鑰友（30天）', pro: '馥靈大師（30天）' };
      amount = subPriceMap[plan];
      if (!amount) {
        return res.status(400).json({ error: '不支援的方案：' + plan });
      }
      itemName = '馥靈之鑰 ' + subNameMap[plan];
      customField1 = 'sub_' + plan;  // sub_plus 或 sub_pro
      customField2 = uid;             // 用戶 UID

    } else {
      // ── 抽牌解讀 ──
      var n = parseInt(body.n) || 3;
      var cards = body.cards || '';
      var question = body.question || '';

      var priceMap = { 3: 199, 5: 399, 7: 599 };
      amount = priceMap[n];
      if (!amount) {
        return res.status(400).json({ error: '不支援的張數：' + n });
      }
      itemName = '馥靈智慧牌 ' + n + ' 張深度解讀';
      customField1 = '' + n;
      customField2 = encodeURIComponent((question || '').substring(0, 200));
    }

    // 產生交易編號（20碼以內）
    var now = new Date();
    var pad = function(v) { return v < 10 ? '0' + v : '' + v; };
    var tradeNo = 'HL' + now.getFullYear() +
      pad(now.getMonth() + 1) + pad(now.getDate()) +
      pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds()) +
      Math.floor(Math.random() * 100);

    // 交易時間
    var tradeDate = now.getFullYear() + '/' +
      pad(now.getMonth() + 1) + '/' + pad(now.getDate()) + ' ' +
      pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

    var BASE_URL = 'https://app.hourlightkey.com';

    // 綠界參數
    var params = {
      MerchantID: MID,
      MerchantTradeNo: tradeNo,
      MerchantTradeDate: tradeDate,
      PaymentType: 'aio',
      TotalAmount: amount,
      TradeDesc: encodeURIComponent('馥靈之鑰'),
      ItemName: itemName,
      ReturnURL: BASE_URL + '/api/ecpay-notify',
      OrderResultURL: BASE_URL + '/api/ecpay-return',
      ChoosePayment: 'Credit',
      EncryptType: 1,
      CustomField1: customField1,
      CustomField2: customField2,
      NeedExtraPaidInfo: 'Y'
    };

    // 產生 CheckMacValue
    var checkMac = generateCheckMacValue(params, HASH_KEY, HASH_IV);
    params.CheckMacValue = checkMac;

    // 綠界付款 URL
    var ecpayURL = TEST_MODE
      ? 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5'
      : 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5';

    // 產生自動提交的 HTML 表單
    var formHtml = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
      '<title>導向綠界付款中⋯</title>' +
      '<style>body{background:#0a0612;color:#f0d48a;display:flex;justify-content:center;align-items:center;height:100vh;font-family:"Noto Sans TC",sans-serif;font-size:1.1rem}' +
      '.loading{text-align:center}.dot{animation:pulse 1.5s infinite}@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}</style></head>' +
      '<body><div class="loading"><div style="font-size:2.5rem;margin-bottom:16px">🔮</div>' +
      '<div>正在導向綠界付款頁面<span class="dot">⋯</span></div>' +
      '<div style="font-size:.8rem;color:rgba(255,255,255,.4);margin-top:12px">如果沒有自動跳轉，請點擊下方按鈕</div></div>' +
      '<form id="ecpay" method="POST" action="' + ecpayURL + '">';

    var keys = Object.keys(params);
    for (var i = 0; i < keys.length; i++) {
      formHtml += '<input type="hidden" name="' + keys[i] + '" value="' + params[keys[i]] + '"/>';
    }

    formHtml += '<noscript><button type="submit" style="margin-top:20px;padding:14px 36px;border:none;border-radius:12px;background:#f0d48a;color:#1a1520;font-size:1rem;font-weight:700;cursor:pointer">前往付款</button></noscript>' +
      '</form><script>document.getElementById("ecpay").submit();</script></body></html>';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(formHtml);

  } catch (e) {
    console.error('ECPay create error:', e);
    return res.status(500).json({ error: '建立訂單失敗：' + e.message });
  }
};

// ═══ CheckMacValue 產生器（SHA256）═══
function generateCheckMacValue(params, hashKey, hashIV) {
  // 1. 按 key 排序
  var keys = Object.keys(params).sort(function(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  // 2. 組合字串
  var raw = 'HashKey=' + hashKey;
  for (var i = 0; i < keys.length; i++) {
    raw += '&' + keys[i] + '=' + params[keys[i]];
  }
  raw += '&HashIV=' + hashIV;

  // 3. URL encode（綠界用 .NET 的 UrlEncode 規則）
  var encoded = encodeURIComponent(raw);

  // 4. .NET UrlEncode 特殊轉換
  encoded = encoded.replace(/%20/g, '+')
    .replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.')
    .replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(').replace(/%29/g, ')')
    .replace(/%2D/g, '-').replace(/%5F/g, '_').replace(/%2E/g, '.')
    .replace(/%21/g, '!').replace(/%2A/g, '*').replace(/%28/g, '(').replace(/%29/g, ')');

  // 5. 轉小寫
  encoded = encoded.toLowerCase();

  // 6. SHA256
  var hash = crypto.createHash('sha256').update(encoded).digest('hex');

  // 7. 轉大寫
  return hash.toUpperCase();
}
