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

// ── PAYUNi 加解密工具（照抄官方 Node.js 範例 docs.payuni.com.tw/web/#/7/312）──
const querystring = require('querystring');

function payuniEncrypt(data, key, iv) {
  // 1. 物件轉 URL-encoded query string（用 Node.js 標準 querystring）
  const plaintext = querystring.stringify(data);
  // 2. AES-256-GCM 加密（iv 必須是 Buffer）
  const ivBuf = Buffer.from(iv);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, ivBuf);
  let cipherText = cipher.update(plaintext, 'utf8', 'base64');
  cipherText += cipher.final('base64');
  // 3. 取得 auth tag（base64）
  const tag = cipher.getAuthTag().toString('base64');
  // 4. 格式：base64(ciphertext) + ":::" + base64(tag) → 整段轉 hex
  return Buffer.from(`${cipherText}:::${tag}`).toString('hex').trim();
}

function payuniHash(encryptedStr, key, iv) {
  // PAYUNi 官方公式：SHA256( key + encryptedStr + iv ).toUpperCase()
  // 注意順序：key 在前、iv 在後（不是 iv + encrypted + key）
  const hash = crypto.createHash('sha256').update(`${key}${encryptedStr}${iv}`);
  return hash.digest('hex').toUpperCase();
}

function payuniDecrypt(encryptedHex, key, iv) {
  // 1. hex → string → split ":::" → [base64_ciphertext, base64_tag]
  const [encryptData, tag] = Buffer.from(encryptedHex, 'hex').toString().split(':::');
  // 2. AES-256-GCM 解密
  const ivBuf = Buffer.from(iv);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, ivBuf);
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  let decrypted = decipher.update(encryptData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  // 3. 解析 URL-encoded query string
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
    const { productName, amount, userId, userEmail, productId, returnUrl: clientReturnUrl, businessId } = body;

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

    // ── 若是解讀類商品，先產生 unlock code（含所有解讀類 productId）──
    // 支援的 productId 格式：
    //   draw-N / pet-N / family-N / spa-N / nail-N / light-N（N 張牌）
    //   akashic-N / yuan-chen-N / past-life-N / name-1 / wallpaper-N（特殊服務）
    let preGeneratedCode = null;
    const drawMatch = (productId || '').match(/^(draw|pet|family|spa|nail|light|akashic|yuan-chen|past-life|name|wallpaper|abundance-prayer)[-]?(\d+)?$/i);
    if (drawMatch) {
      const category = drawMatch[1].toLowerCase();
      const drawN = drawMatch[2] ? parseInt(drawMatch[2], 10) : 1;
      const codeRand = Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
      // 代碼格式化：抽牌類用 HL{N}-{RAND}，服務類用 {CATEGORY}-{RAND}
      if (['draw','pet','family','spa','nail','light'].indexOf(category) > -1) {
        preGeneratedCode = `HL${drawN}-${codeRand}`;
      } else {
        // 服務類代碼：AK（阿卡西）/ YC（元辰宮）/ PL（前世）/ NM（姓名）/ WP（桌布）/ AP（吸引力祈禱文）
        const prefix = category === 'akashic' ? 'AK'
                     : category === 'yuan-chen' ? 'YC'
                     : category === 'past-life' ? 'PL'
                     : category === 'name' ? 'NM'
                     : category === 'wallpaper' ? 'WP'
                     : category === 'abundance-prayer' ? 'AP'
                     : 'HL';
        preGeneratedCode = `${prefix}-${codeRand}`;
      }
    }

    // ── 決定 ReturnURL ──
    // PAYUNi 付款完成後用 POST 導回 ReturnURL，但 GitHub Pages 不接受 POST（405）
    // 所以先導到 Vercel 的 api/payuni-return?to=目標URL，再 302 GET 跳轉到靜態頁面
    let finalPageUrl;
    const allowedReturnHosts = ['hourlightkey.com', 'www.hourlightkey.com'];
    if (clientReturnUrl) {
      try {
        const u = new URL(clientReturnUrl);
        if (allowedReturnHosts.includes(u.hostname)) {
          u.searchParams.set('payment', 'success');
          u.searchParams.set('order', merTradeNo);
          if (preGeneratedCode) u.searchParams.set('code', preGeneratedCode);
          finalPageUrl = u.toString();
        }
      } catch (e) { /* invalid url, fall through */ }
    }
    if (!finalPageUrl) {
      finalPageUrl = 'https://hourlightkey.com/member-dashboard.html?payment=success';
    }
    // 透過 payuni-notify 的 ?to= 參數做 302 redirect，避免 GitHub Pages 405
    // （不用 api/payuni-return.js 因為 Vercel Hobby plan 限 12 個 function）
    const returnUrl = `${siteUrl}/api/payuni-notify?to=${encodeURIComponent(finalPageUrl)}`;

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
      // ── 支付方式全開 ──
      Credit: '1',               // 信用卡一次付清
      ATM: '1',                  // ATM 虛擬帳號
      CVS: '1',                  // 超商代碼
      Aftee: '1',                // AFTEE 先買後付
      ApplePay: '1',             // Apple Pay
      GooglePay: '1',            // Google Pay
      SamsungPay: '1',           // Samsung Pay
      CreditInst: '3,6,12',     // 信用卡分期（3/6/12期）
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
          businessId: businessId || null,
          status: 'pending',
          createdAt: new Date(now),
        };
        if (preGeneratedCode) pendingPayload.unlockCode = preGeneratedCode;
        // 延遲付款時需要的牌卡資料（超商/ATM 繳費完成後自動解讀用）
        if (body.cards) pendingPayload.cards = body.cards;
        if (body.question) pendingPayload.question = body.question;
        // ── 泛用觸發機制：前端可以傳整個 reading 請求 body + 目標 endpoint ──
        // payuni-notify 收到 notify 後會用 readingEndpoint 呼叫 API 並傳 readingBody
        // 適用所有解讀類服務（pet/family/spa/nail/akashic/yuan-chen/past-life 等）
        // readingBody 內部必須包含 userEmail（API 會自動寄信）
        if (body.readingEndpoint) pendingPayload.readingEndpoint = body.readingEndpoint;
        if (body.readingBody) pendingPayload.readingBody = body.readingBody;
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
