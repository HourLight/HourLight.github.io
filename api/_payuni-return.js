// ═══════════════════════════════════════
// 馥靈之鑰 · PAYUNi 付款完成導回 (ReturnURL)
// 消費者付款後跳轉回官網
// © 2026 Hour Light International
// ═══════════════════════════════════════

const crypto = require('crypto');

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
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  const HASH_KEY = process.env.PAYUNI_HASH_KEY;
  const HASH_IV = process.env.PAYUNI_HASH_IV;

  let status = 'unknown';
  let tradeNo = '';
  let amount = '';
  let message = '';

  try {
    // PAYUNi 可能用 POST 或 GET 導回
    const params = req.method === 'POST' ? req.body : req.query;
    const { EncryptInfo, HashInfo } = params || {};

    if (EncryptInfo && HashInfo && HASH_KEY && HASH_IV) {
      const expectedHash = payuniHash(EncryptInfo, HASH_KEY, HASH_IV);
      if (expectedHash === HashInfo) {
        const data = payuniDecrypt(EncryptInfo, HASH_KEY, HASH_IV);
        status = data.Status === 'SUCCESS' ? 'success' : 'fail';
        tradeNo = data.MerTradeNo || '';
        amount = data.TradeAmt || '';
        message = data.Message || '';
      }
    }
  } catch (err) {
    console.error('PAYUNi return parse error:', err);
    status = 'error';
  }

  // 導回官網的付款結果頁
  const siteUrl = 'https://hourlightkey.com';
  const redirectUrl = `${siteUrl}/payment-result.html?status=${status}&order=${encodeURIComponent(tradeNo)}&amount=${encodeURIComponent(amount)}`;

  // 用 HTML redirect（比 302 更可靠，避免 POST 被瀏覽器攔截）
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><meta http-equiv="refresh" content="0;url=${redirectUrl}"></head>
    <body style="background:#05030a;color:#f0d48a;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh">
      <p>正在返回馥靈之鑰⋯⋯</p>
      <script>window.location.href="${redirectUrl}";</script>
    </body>
    </html>
  `);
};
