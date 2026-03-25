// ═══════════════════════════════════════
// 馥靈之鑰 · PAYUNi 統一金流建立訂單 API
// Vercel Serverless Function
// 整合式支付頁 UNiPaypage (UPP) 模式
// © 2026 Hour Light International
// ═══════════════════════════════════════

const crypto = require('crypto');

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
    const { productName, amount, userId, userEmail, productId } = body;

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

    // 建立加密參數
    const encryptData = {
      MerID: MER_ID,
      MerTradeNo: merTradeNo,
      TradeAmt: String(amount),
      TradeDesc: productName,
      TradeType: '1',            // 1=即時交易
      Timestamp: String(Math.floor(now / 1000)),
      NotifyURL: `${siteUrl}/api/payuni-notify`,
      ReturnURL: `${siteUrl}/api/payuni-return`,
    };

    // 選填：消費者資訊（有助於提高授權成功率）
    if (userEmail) {
      encryptData.PrdtName = productName;
    }

    // 加密
    const encryptInfo = payuniEncrypt(encryptData, HASH_KEY, HASH_IV);
    const hashInfo = payuniHash(encryptInfo, HASH_KEY, HASH_IV);

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
