// ═══════════════════════════════════════
// 馥靈之鑰 · PAYUNi 付款通知 API (NotifyURL)
// 接收 PAYUNi 背景 POST 通知 → 寫入 Firestore
// © 2026 Hour Light International
// ═══════════════════════════════════════

const crypto = require('crypto');

// ── PAYUNi 解密工具（與 payuni-create.js 一致）──
function payuniDecrypt(encryptedHex, key, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  const result = {};
  decrypted.split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return result;
}

function payuniHash(encryptedStr, key, iv) {
  const raw = iv + encryptedStr + key;
  return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
}

module.exports = async function handler(req, res) {
  // PAYUNi 用 POST 發送通知
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const HASH_KEY = process.env.PAYUNI_HASH_KEY;
  const HASH_IV = process.env.PAYUNI_HASH_IV;

  if (!HASH_KEY || !HASH_IV) {
    console.error('PAYUNi notify: missing config');
    return res.status(500).send('Config error');
  }

  try {
    const { EncryptInfo, HashInfo } = req.body || {};

    if (!EncryptInfo || !HashInfo) {
      console.error('PAYUNi notify: missing EncryptInfo or HashInfo');
      return res.status(400).send('Bad request');
    }

    // 驗證 HashInfo
    const expectedHash = payuniHash(EncryptInfo, HASH_KEY, HASH_IV);
    if (expectedHash !== HashInfo) {
      console.error('PAYUNi notify: hash mismatch', { expected: expectedHash, received: HashInfo });
      return res.status(400).send('Hash mismatch');
    }

    // 解密
    const data = payuniDecrypt(EncryptInfo, HASH_KEY, HASH_IV);
    console.log('PAYUNi notify data:', JSON.stringify(data));

    const { MerTradeNo, TradeNo, TradeAmt, Status, Message } = data;

    // Status === 'SUCCESS' 表示交易成功
    if (Status === 'SUCCESS') {
      // ══ 寫入 Firestore ══
      // 使用 Firebase Admin SDK（需在 Vercel 設定 FIREBASE_* 環境變數）
      // 或者用 REST API 寫入
      
      // 從交易編號解析 userId（前端建立訂單時記錄的對應關係）
      // 方案一：查 Firestore 的 pending-orders collection
      // 方案二：在 MerTradeNo 中編碼 userId

      console.log(`✅ 付款成功：${MerTradeNo} / PAYUNi ${TradeNo} / NT$${TradeAmt}`);

      // TODO: 當 Firebase Admin SDK 設定好後，在這裡寫入
      // await db.collection('orders').doc(MerTradeNo).set({
      //   tradeNo: TradeNo,
      //   amount: Number(TradeAmt),
      //   status: 'paid',
      //   paidAt: new Date(),
      //   raw: data
      // });
      // 
      // 同時更新用戶的付費狀態
      // await db.collection('users').doc(userId).collection('courses').doc(productId).set({
      //   paid: true,
      //   paidAt: new Date(),
      //   orderId: MerTradeNo,
      //   amount: Number(TradeAmt)
      // });

    } else {
      console.log(`❌ 付款失敗：${MerTradeNo} / Status: ${Status} / ${Message}`);
    }

    // PAYUNi 要求回傳 SUCCESS
    return res.status(200).send('SUCCESS');

  } catch (err) {
    console.error('PAYUNi notify error:', err);
    return res.status(500).send('Server error');
  }
};
