// ═══════════════════════════════════════
// 馥靈之鑰 · PAYUNi 付款通知 API (NotifyURL)
// 接收 PAYUNi 背景 POST 通知 → 寫入 Firestore
// v2.0 · 實作 firebase-admin Firestore 寫入
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// Vercel 環境變數需設定：
// ► PAYUNI_HASH_KEY   → PAYUNi 後台的 HashKey
// ► PAYUNI_HASH_IV    → PAYUNi 後台的 HashIV
// ► FIREBASE_SERVICE_ACCOUNT → Firebase 服務帳號 JSON（整串，不換行）
//   取得方式：Firebase Console → 專案設定 → 服務帳戶 → 產生新的私密金鑰
//
// ═══════════════════════════════════════

const crypto = require('crypto');

// ── PAYUNi 解密工具 ──
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

// ── Firebase Admin 初始化（懶載入）──
let adminDb = null;

function getFirestore() {
  if (adminDb) return adminDb;

  const SA_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!SA_JSON) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT 未設定，Firestore 寫入跳過');
    return null;
  }

  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(SA_JSON)),
      });
    }
    adminDb = admin.firestore();
    return adminDb;
  } catch (err) {
    console.error('Firebase Admin 初始化失敗：', err.message);
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const HASH_KEY = process.env.PAYUNI_HASH_KEY;
  const HASH_IV  = process.env.PAYUNI_HASH_IV;

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

    // 驗證 Hash
    const expectedHash = payuniHash(EncryptInfo, HASH_KEY, HASH_IV);
    if (expectedHash !== HashInfo) {
      console.error('PAYUNi notify: hash mismatch');
      return res.status(400).send('Hash mismatch');
    }

    // 解密
    const data = payuniDecrypt(EncryptInfo, HASH_KEY, HASH_IV);
    const { MerTradeNo, TradeNo, TradeAmt, Status, Message } = data;

    console.log(`PAYUNi notify | ${MerTradeNo} | Status: ${Status} | NT$${TradeAmt}`);

    if (Status === 'SUCCESS') {
      const db = getFirestore();

      if (db) {
        // ── 1. 查找 pendingOrders 取得 userId + productId ──
        const pendingRef = db.collection('pendingOrders').doc(MerTradeNo);
        const pendingDoc = await pendingRef.get();

        let userId    = null;
        let productId = null;
        let userEmail = null;

        if (pendingDoc.exists) {
          userId    = pendingDoc.data().userId    || null;
          productId = pendingDoc.data().productId || null;
          userEmail = pendingDoc.data().userEmail || null;
        } else {
          console.warn(`⚠️  pendingOrders/${MerTradeNo} 不存在，無法對應 userId`);
        }

        const now = new Date();
        const orderPayload = {
          tradeNo:   TradeNo,
          merTradeNo: MerTradeNo,
          amount:    Number(TradeAmt),
          status:    'paid',
          paidAt:    now,
          userId:    userId,
          productId: productId,
          userEmail: userEmail,
          raw:       data,
        };

        // ── 2. 寫入訂單記錄（總表）──
        await db.collection('orders').doc(MerTradeNo).set(orderPayload);

        // ── 3. 在 user 的課程記錄中開通課程 ──
        if (userId && productId) {
          await db.collection('users').doc(userId)
            .collection('courses').doc(productId)
            .set({
              paid:       true,
              paidAt:     now,
              orderId:    MerTradeNo,
              tradeNo:    TradeNo,
              amount:     Number(TradeAmt),
              productId:  productId,
            }, { merge: true });

          // ── 4. 更新 pendingOrder 狀態為已付款 ──
          await pendingRef.update({ status: 'paid', paidAt: now });

          console.log(`✅ 課程開通：userId=${userId} productId=${productId} orderId=${MerTradeNo}`);
        }
      } else {
        // Firestore 未設定時，至少把訂單記到 console 方便人工處理
        console.log(`✅ 付款成功（Firestore 未設定，需人工處理）：${JSON.stringify(data)}`);
      }
    } else {
      console.log(`❌ 付款未成功：${MerTradeNo} | Status: ${Status} | ${Message}`);

      // 把失敗記錄也寫進 Firestore（方便追蹤）
      const db = getFirestore();
      if (db) {
        await db.collection('orders').doc(MerTradeNo).set({
          merTradeNo: MerTradeNo,
          status:     'failed',
          failReason: Message,
          failAt:     new Date(),
          raw:        data,
        }, { merge: true }).catch(() => {});
      }
    }

    // PAYUNi 要求回傳 SUCCESS 字串
    return res.status(200).send('SUCCESS');

  } catch (err) {
    console.error('PAYUNi notify error:', err);
    return res.status(500).send('Server error');
  }
};
