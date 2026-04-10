// ═══════════════════════════════════════
// 馥靈之鑰 · PAYUNi 統一金流建立訂單 API
// Vercel Serverless Function
// 整合式支付頁 UNiPaypage (UPP) 模式
// v1.1 · 加入 pendingOrders 寫入 + ReturnURL 修正
// © 2026 Hour Light International
// ═══════════════════════════════════════

const crypto = require('crypto');

// ── Firebase Admin 初始化（懶載入）──
let adminDb = null;
function getFirestore() {
  if (adminDb) return adminDb;
  const SA_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!SA_JSON) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT 未設定，pendingOrders 寫入跳過');
    return null;
  }
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(SA_JSON)) });
    }
    adminDb = admin.firestore();
    return adminDb;
  } catch (err) {
    console.error('Firebase Admin 初始化失敗：', err.message);
    return null;
  }
}

// ── PAYUNi 加解密工具 ──
function payuniEncrypt(data, key, iv) {
  // 將物件轉為 URL-encoded query string
  const qs = Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  // AES-256-CBC 加密
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(qs, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function payuniHash(encryptedStr, key, iv) {
  // HashInfo = SHA256( HashIV + EncryptInfo + HashKey )
  const raw = iv + encryptedStr + key;
  return crypto.createHash('sha256').update(raw).digest('hex').toUpperCase();
}

function payuniDecrypt(encryptedHex, key, iv) {
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  // 解析 URL-encoded query string 回物件
  const result = {};
  decrypted.split('&').forEach(pair => {
    const [k, v] = pair.split('=');
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return result;
}

module.exports = async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  const allowed = ['https://hourlightkey.com', 'https://www.hourlightkey.com', 'https://app.hourlightkey.com', 'http://localhost:3000'];
  if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 環境變數
  const MER_ID = process.env.PAYUNI_MER_ID;
  const HASH_KEY = process.env.PAYUNI_HASH_KEY;
  const HASH_IV = process.env.PAYUNI_HASH_IV;
  const IS_TEST = process.env.PAYUNI_TEST_MODE === 'true';

  if (!MER_ID || !HASH_KEY || !HASH_IV) {
    return res.status(500).json({ error: '金流尚未設定' });
  }

  try {
    const body = req.body || {};
    const { productName, amount, userId, userEmail, productId, returnUrl: clientReturnUrl } = body;

    if (!productName || !amount || !userId) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    // 產生交易編號：HL + 時間戳 + 隨機4碼
    const now = Date.now();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const merTradeNo = `HL${now}${rand}`;

    // 基底 URL
    const baseUrl = IS_TEST
      ? 'https://sandbox-api.payuni.com.tw'
      : 'https://api.payuni.com.tw';

    const siteUrl = 'https://app.hourlightkey.com';

    // ── 若是 draw-N 抽牌商品，先產生 unlock code ──
    let preGeneratedCode = null;
    const drawMatch = (productId || '').match(/^draw-(\d+)$/i);
    if (drawMatch) {
      const drawN = parseInt(drawMatch[1], 10);
      const codeRand = Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
      preGeneratedCode = `HL${drawN}-${codeRand}`;
    }

    // ── 決定 ReturnURL ──
    // 1. 客戶端有指定 returnUrl（必須是 hourlightkey.com 主站白名單），優先使用
    // 2. 否則預設導回 member-dashboard
    let returnUrl;
    const allowedReturnHosts = ['hourlightkey.com', 'www.hourlightkey.com'];
    if (clientReturnUrl) {
      try {
        const u = new URL(clientReturnUrl);
        if (allowedReturnHosts.includes(u.hostname)) {
          // 加上 payment=success 與 order 參數（如有 code 也帶）
          u.searchParams.set('payment', 'success');
          u.searchParams.set('order', merTradeNo);
          if (preGeneratedCode) u.searchParams.set('code', preGeneratedCode);
          returnUrl = u.toString();
        }
      } catch (e) { /* invalid url, fall through */ }
    }
    if (!returnUrl) {
      returnUrl = 'https://hourlightkey.com/member-dashboard.html?tab=plans&payment=success';
    }

    // 建立加密參數
    const encryptData = {
      MerID: MER_ID,
      MerTradeNo: merTradeNo,
      TradeAmt: String(amount),
      TradeDesc: productName,
      TradeType: '1',            // 1=即時交易
      Timestamp: String(Math.floor(now / 1000)),
      NotifyURL: `${siteUrl}/api/payuni-notify`,
      ReturnURL: returnUrl,
    };

    // 選填：消費者資訊（有助於提高授權成功率）
    if (userEmail) {
      encryptData.PrdtName = productName;
    }

    // 加密
    const encryptInfo = payuniEncrypt(encryptData, HASH_KEY, HASH_IV);
    const hashInfo = payuniHash(encryptInfo, HASH_KEY, HASH_IV);

    // ── 寫入 pendingOrders（payuni-notify.js 需要從這對應 userId / productId）──
    // 即使 Firestore 寫入失敗，付款流程仍要繼續，避免擋住客人結帳
    try {
      const db = getFirestore();
      if (db) {
        const pendingPayload = {
          merTradeNo,
          userId,
          userEmail: userEmail || null,
          productId: productId || null,
          productName,
          amount: Number(amount),
          status: 'pending',
          createdAt: new Date(now),
        };
        if (preGeneratedCode) pendingPayload.unlockCode = preGeneratedCode;
        await db.collection('pendingOrders').doc(merTradeNo).set(pendingPayload);
        console.log(`✅ pendingOrders 已建立：${merTradeNo} userId=${userId} productId=${productId}${preGeneratedCode ? ' code=' + preGeneratedCode : ''}`);
      }
    } catch (fsErr) {
      console.error('⚠️  pendingOrders 寫入失敗（不阻斷付款）：', fsErr.message);
    }

    // 回傳表單資訊，前端用 form POST 跳轉到 PAYUNi 支付頁
    return res.status(200).json({
      success: true,
      action: `${baseUrl}/api/upp`,
      formData: {
        MerID: MER_ID,
        Version: '1.0',
        EncryptInfo: encryptInfo,
        HashInfo: hashInfo,
      },
      // 內部用：記錄訂單
      orderInfo: {
        merTradeNo,
        amount,
        productId,
        productName,
        userId,
        createdAt: now,
      }
    });

  } catch (err) {
    console.error('PAYUNi create order error:', err);
    return res.status(500).json({ error: '建立訂單失敗：' + err.message });
  }
};

// 匯出加解密工具供其他 API 使用
module.exports.payuniEncrypt = payuniEncrypt;
module.exports.payuniDecrypt = payuniDecrypt;
module.exports.payuniHash = payuniHash;
