// ═══════════════════════════════════════
// 馥靈之鑰 · 綠界 ECPay 付款結果頁面
// Vercel Serverless Function
// 客戶付款完成後導回這裡
// © 2026 Hour Light International
// ═══════════════════════════════════════

module.exports = async function handler(req, res) {
  var body = req.body || req.query || {};
  var rtnCode = body.RtnCode || '0';
  var rtnMsg = body.RtnMsg || '';
  var tradeNo = body.MerchantTradeNo || '';
  var amount = body.TradeAmt || '';
  var n = body.CustomField1 || '';

  var success = rtnCode === '1';
  var isSubscription = (body.CustomField1 || '').startsWith('sub_');
  var planNames = { sub_plus: '馥靈鑰友', sub_pro: '馥靈大師' };
  var planLabel = planNames[body.CustomField1] || '';

  var html = '<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8"/>' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>' +
    '<title>' + (success ? '付款成功' : '付款未完成') + '｜馥靈之鑰</title>' +
    '<style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{background:#0a0612;color:#f4f0eb;font-family:"Noto Sans TC","Noto Serif TC",sans-serif;min-height:100vh;display:flex;justify-content:center;align-items:center;padding:20px}' +
    '.card{max-width:480px;width:100%;background:rgba(255,255,255,.03);border:1px solid rgba(240,212,138,.15);border-radius:20px;padding:40px 30px;text-align:center}' +
    '.icon{font-size:3.5rem;margin-bottom:16px}' +
    '.title{font-size:1.4rem;font-weight:700;color:' + (success ? '#f0d48a' : 'rgba(255,100,100,.8)') + ';margin-bottom:12px;letter-spacing:.06em}' +
    '.desc{font-size:.92rem;color:rgba(255,255,255,.6);line-height:1.9;margin-bottom:24px}' +
    '.info{background:rgba(240,212,138,.04);border:1px solid rgba(240,212,138,.1);border-radius:12px;padding:16px;margin-bottom:24px;font-size:.85rem;color:rgba(255,255,255,.55);line-height:2;text-align:left}' +
    '.info strong{color:rgba(240,212,138,.8)}' +
    '.btn{display:inline-block;padding:14px 36px;border-radius:12px;font-size:1rem;font-weight:700;text-decoration:none;letter-spacing:.06em;transition:all .3s}' +
    '.btn-gold{color:#1a1520;background:linear-gradient(135deg,#f0d48a,#e9c27d);box-shadow:0 4px 16px rgba(240,212,138,.25)}' +
    '.btn-outline{color:rgba(240,212,138,.8);border:1px solid rgba(240,212,138,.3);background:transparent;margin-left:10px}' +
    '.promise{margin-top:20px;padding:16px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:12px;font-size:.8rem;color:rgba(255,255,255,.4);line-height:1.9;text-align:left}' +
    '</style></head><body><div class="card">';

  if (success) {
    if (isSubscription) {
      // ── 訂閱成功 ──
      html += '<div class="icon">🎉</div>' +
        '<div class="title">訂閱成功！</div>' +
        '<div class="desc">歡迎加入「' + planLabel + '」！您的會員方案已自動開通。</div>' +
        '<div class="info">' +
        '► 方案：<strong>' + planLabel + '</strong><br>' +
        '► 金額：<strong>NT$' + amount + '</strong><br>' +
        '► 有效期限：<strong>30 天</strong>（到期前 3 天會寄 Email 提醒）' +
        '</div>' +
        '<div class="desc">現在就可以使用 AI 深度解讀指令了 ✨</div>' +
        '<div style="margin-bottom:12px">' +
        '<a href="https://hourlightkey.com/destiny-engine.html" class="btn btn-gold">⭐ 前往命盤引擎</a>' +
        '</div>' +
        '<div class="promise">' +
        '► 到期後自動恢復免費會員，不會多收任何費用<br>' +
        '► 到期前 3 天會寄提醒信，您可自行決定是否續訂<br>' +
        '► 有任何問題：LINE 官方帳號 <strong style="color:rgba(240,212,138,.6)">@hourlight</strong>' +
        '</div>';
    } else {
      // ── 抽牌付款成功 ──
      html += '<div class="icon">✅</div>' +
        '<div class="title">付款成功！</div>' +
        '<div class="desc">感謝您的信任，馥靈之鑰已收到您的付款。</div>' +
        '<div class="info">' +
        '► 訂單編號：<strong>' + tradeNo + '</strong><br>' +
        '► 付款金額：<strong>NT$' + amount + '</strong><br>' +
        '► 牌卡張數：<strong>' + n + ' 張</strong>' +
        '</div>' +
        '<div class="desc">接下來請將您的 <strong style="color:rgba(240,212,138,.8)">抽牌結果</strong> 傳到 LINE 官方帳號，我們將盡快為您解讀 ✨</div>' +
        '<div style="margin-bottom:12px">' +
        '<a href="https://lin.ee/RdQBFAN" target="_blank" rel="noopener" class="btn btn-gold">💬 LINE 傳送抽牌結果</a>' +
        '</div>' +
        '<div class="promise">' +
        '⏰ 上班時間（週一至週五 10:00-18:00）：確認後 <strong style="color:rgba(240,212,138,.6)">30 分鐘內</strong>回覆<br>' +
        '⏰ 下班時間或假日：次營業日處理<br>' +
        '⏰ 急件：請加 LINE ID <strong style="color:rgba(240,212,138,.6)">judyanee</strong> 直接聯繫' +
        '</div>';
    }
  } else {
    html += '<div class="icon">⚠️</div>' +
      '<div class="title">付款未完成</div>' +
      '<div class="desc">' + (rtnMsg ? '原因：' + rtnMsg : '交易尚未完成，請重新操作或選擇其他付款方式。') + '</div>';
  }

  html += '<div style="margin-top:24px">' +
    '<a href="https://hourlightkey.com/draw-hl.html" class="btn btn-outline">🃏 回到抽牌頁</a>' +
    '<a href="https://app.hourlightkey.com/app.html" class="btn btn-outline" style="margin-left:10px">👤 會員中心</a>' +
    '</div>' +
    '</div></body></html>';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(html);
};
