// ═══════════════════════════════════════
// 馥靈之鑰 · 綠界 ECPay 付款通知 API
// Vercel Serverless Function
// 綠界付款完成後會 POST 到這裡
// © 2026 Hour Light International
// ═══════════════════════════════════════

var crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('0|Method not allowed');

  var HASH_KEY = process.env.ECPAY_HASH_KEY;
  var HASH_IV = process.env.ECPAY_HASH_IV;

  if (!HASH_KEY || !HASH_IV) {
    console.error('ECPay env vars missing');
    return res.status(500).send('0|Config error');
  }

  try {
    var body = req.body || {};

    // 驗證 CheckMacValue
    var receivedMac = body.CheckMacValue;
    var params = {};
    var keys = Object.keys(body);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== 'CheckMacValue') {
        params[keys[i]] = body[keys[i]];
      }
    }

    var expectedMac = generateCheckMacValue(params, HASH_KEY, HASH_IV);

    if (receivedMac !== expectedMac) {
      console.error('CheckMacValue mismatch', { received: receivedMac, expected: expectedMac });
      return res.status(400).send('0|CheckMacValue Error');
    }

    // 交易結果
    var rtnCode = body.RtnCode;       // 1 = 成功
    var tradeNo = body.MerchantTradeNo;
    var ecpayNo = body.TradeNo;
    var amount = body.TradeAmt;
    var paymentType = body.PaymentType;
    var n = body.CustomField1;          // 張數

    console.log('ECPay notify:', {
      tradeNo: tradeNo,
      ecpayNo: ecpayNo,
      amount: amount,
      rtnCode: rtnCode,
      paymentType: paymentType,
      n: n
    });

    if (rtnCode === '1') {
      // 付款成功 → 寫入 Firestore
      try {
        var FIREBASE_SA = process.env.FIREBASE_SERVICE_ACCOUNT;
        if (FIREBASE_SA) {
          var admin = require('firebase-admin');
          if (!admin.apps.length) {
            var sa = JSON.parse(FIREBASE_SA);
            admin.initializeApp({
              credential: admin.credential.cert(sa)
            });
          }
          var db = admin.firestore();

          // 寫入訂單紀錄
          await db.collection('orders').doc(tradeNo).set({
            tradeNo: tradeNo,
            ecpayTradeNo: ecpayNo || '',
            amount: parseInt(amount) || 0,
            customField1: body.CustomField1 || '',
            customField2: body.CustomField2 || '',
            paymentType: paymentType || '',
            status: 'paid',
            gateway: 'ecpay',
            paidAt: new Date().toISOString(),
            raw: body
          });
          console.log('Order saved to Firestore:', tradeNo);

          // ── 如果是訂閱付款，自動開通會員 ──
          var cf1 = body.CustomField1 || '';
          var uid = body.CustomField2 || '';

          if (cf1.startsWith('sub_') && uid) {
            var plan = cf1.replace('sub_', '');  // 'plus' or 'pro'
            var expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);

            await db.collection('users').doc(uid).update({
              plan: plan,
              planExpiry: expiry.toISOString()
            });
            console.log('Auto-activated member:', uid, plan, expiry.toISOString());

            // 發送開通通知信
            var userSnap = await db.collection('users').doc(uid).get();
            if (userSnap.exists) {
              var userData = userSnap.data();
              var planNames = { plus: '馥靈鑰友', pro: '馥靈大師' };
              var planName = planNames[plan] || plan;

              try {
                var https = require('https');
                var emailData = JSON.stringify({
                  email: userData.email || '',
                  name: userData.displayName || '',
                  subject: '馥靈之鑰｜您的「' + planName + '」方案已開通 🎉',
                  system: '會員系統',
                  content: '親愛的 ' + (userData.displayName || '馥靈夥伴') + '：\n\n' +
                    '恭喜！您的「' + planName + '」方案已成功開通 🎉\n\n' +
                    '► 方案：' + planName + '\n' +
                    '► 有效期限：' + expiry.toLocaleDateString('zh-TW') + '（30 天）\n' +
                    '► AI 深度解讀指令：' + (plan === 'pro' ? '無限次' : '每天 15 次') + '\n\n' +
                    '現在就前往體驗：\nhttps://hourlightkey.com/destiny-engine.html\n\n' +
                    '有任何問題歡迎聯繫：\nLINE 官方帳號 @hourlight\n\n' +
                    '馥靈之鑰 Hour Light 敬上'
                });

                var emailReq = https.request({
                  hostname: 'app.hourlightkey.com',
                  path: '/api/send-report',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(emailData) }
                });
                emailReq.write(emailData);
                emailReq.end();
              } catch (mailErr) {
                console.warn('Activation email failed:', mailErr.message);
              }
            }
          }
        }
      } catch (fbErr) {
        console.warn('Firestore write failed (non-blocking):', fbErr.message);
      }
    }

    // 綠界要求回傳 1|OK 表示收到
    return res.status(200).send('1|OK');

  } catch (e) {
    console.error('ECPay notify error:', e);
    return res.status(500).send('0|Server error');
  }
};

// ═══ CheckMacValue 驗證用（同 ecpay-create.js）═══
function generateCheckMacValue(params, hashKey, hashIV) {
  var keys = Object.keys(params).sort(function(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
  var raw = 'HashKey=' + hashKey;
  for (var i = 0; i < keys.length; i++) {
    raw += '&' + keys[i] + '=' + params[keys[i]];
  }
  raw += '&HashIV=' + hashIV;
  var encoded = encodeURIComponent(raw);
  encoded = encoded.replace(/%20/g, '+')
    .replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.')
    .replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(').replace(/%29/g, ')')
    .replace(/%2D/g, '-').replace(/%5F/g, '_').replace(/%2E/g, '.')
    .replace(/%21/g, '!').replace(/%2A/g, '*').replace(/%28/g, '(').replace(/%29/g, ')');
  encoded = encoded.toLowerCase();
  var hash = crypto.createHash('sha256').update(encoded).digest('hex');
  return hash.toUpperCase();
}
