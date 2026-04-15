// ═══════════════════════════════════════
// 馥靈之鑰 · 命盤測算報告 / 通知信 寄送 API
// Vercel Serverless Function
// © 2026 Hour Light International
// ═══════════════════════════════════════

module.exports = async function handler(req, res) {
  // CORS
  var origin = req.headers.origin || '';
  var allowed = ['https://hourlightkey.com','https://www.hourlightkey.com','https://app.hourlightkey.com','http://localhost:3000'];
  if (allowed.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var ML_KEY = process.env.MAILERLITE_API_KEY;
  var GMAIL_USER = process.env.GMAIL_USER;
  var GMAIL_APP_PW = process.env.GMAIL_APP_PASSWORD;

  if (!ML_KEY) return res.status(500).json({ error: 'MailerLite not configured' });

  try {
    var body = req.body || {};
    var email = (body.email || '').trim().toLowerCase();
    var name = (body.name || '').trim();
    var subject = body.subject || '您的馥靈座標哲學 · 命盤測算資料';
    var content = body.content || '';
    var system = body.system || '命盤引擎';
    // type: 'report'（預設）= 測算報告，'notification' = 會員通知信
    var type = body.type || 'report';

    // 驗證 email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '請輸入正確的電子信箱' });
    }
    if (!content) {
      return res.status(400).json({ error: '沒有內容可寄送' });
    }

    // ── 1. 加入 MailerLite 訂閱名單（僅報告信加入）──
    var mlResult = null;
    if (type === 'report') {
      try {
        var mlResp = await fetch('https://connect.mailerlite.com/api/subscribers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ML_KEY
          },
          body: JSON.stringify({
            email: email,
            fields: { name: name || undefined, company: '命盤引擎用戶' },
            groups: body.groupId ? [body.groupId] : [],
            status: 'active'
          })
        });
        mlResult = await mlResp.json();
      } catch(mlErr) {
        console.error('MailerLite error:', mlErr);
      }
    }

    // ── 2. 寄送 Email（Gmail SMTP via Nodemailer）──
    // 2026/04/15 新增：BCC 所有外寄信件到 info@hourlightkey.com 做寄件備份
    // 用途：客服存檔、消費糾紛保護、自動金流對帳
    // 可透過 env SEND_REPORT_BCC 覆蓋（空值代表關閉）
    var BCC_ADDR = (typeof process !== 'undefined' && process.env.SEND_REPORT_BCC !== undefined)
      ? process.env.SEND_REPORT_BCC
      : 'info@hourlightkey.com';
    var emailSent = false;
    if (GMAIL_USER && GMAIL_APP_PW) {
      try {
        var nodemailer = require('nodemailer');
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: GMAIL_USER, pass: GMAIL_APP_PW }
        });

        // 依 type 選擇模板
        var htmlContent = type === 'notification'
          ? buildNotificationHTML(content)
          : buildReportHTML(name, system, content);

        var mailOpts = {
          from: '"馥靈之鑰 Hour Light" <' + GMAIL_USER + '>',
          to: email,
          subject: subject,
          text: content,
          html: htmlContent
        };
        // 不 bcc 自己寄給自己的信（避免無限回圈 + 雜訊）
        if (BCC_ADDR && BCC_ADDR !== email) {
          mailOpts.bcc = BCC_ADDR;
        }

        await transporter.sendMail(mailOpts);
        emailSent = true;
      } catch(mailErr) {
        console.error('Email send error:', mailErr);
      }
    }

    return res.status(200).json({
      success: true,
      subscribed: !!mlResult,
      emailSent: emailSent,
      message: emailSent
        ? '信件已寄送至 ' + email
        : '已處理，但信件寄送尚未設定。請聯繫管理員完成 Gmail 應用程式密碼設定。'
    });

  } catch(err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};

// ── 共用：HTML 跳脫 ──
function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── 共用：品牌 Header ──
function emailHeader() {
  return '<div style="background:#0a0714;padding:32px 24px;text-align:center">'
    + '<div style="font-size:24px;color:#f0d48a;letter-spacing:4px;font-weight:500">馥靈之鑰</div>'
    + '<div style="font-size:12px;color:#c9985e;margin-top:6px;letter-spacing:2px">HOUR LIGHT · 座標哲學</div>'
    + '</div>';
}

// ── 共用：品牌 Footer ──
function emailFooter() {
  return '<div style="background:#0a0714;padding:20px 24px;text-align:center">'
    + '<div style="font-size:11px;color:#c9985e;letter-spacing:1px">馥靈之鑰國際有限公司 Hour Light International</div>'
    + '<div style="font-size:11px;color:#888;margin-top:4px">'
    + '<a href="https://hourlightkey.com" style="color:#f0d48a;text-decoration:none">hourlightkey.com</a>'
    + ' ｜ <a href="https://lin.ee/RdQBFAN" style="color:#f0d48a;text-decoration:none">LINE 諮詢</a></div>'
    + '</div>';
}

// ── 測算報告模板（type: 'report'）──
function buildReportHTML(name, system, content) {
  var greeting = name ? (name + '，您好！') : '您好！';
  var formatted = esc(content)
    .replace(/\n/g, '<br>')
    .replace(/══+/g, '<hr style="border:none;border-top:1px solid #e8d5a8;margin:16px 0">')
    .replace(/▍/g, '<b style="color:#c9985e">▍</b>');

  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
    + '<body style="margin:0;padding:0;background:#f5f0e8;font-family:serif">'
    + '<div style="max-width:640px;margin:0 auto;background:#fffdf8;border:1px solid #e8d5a8">'
    + emailHeader()
    + '<div style="padding:28px 24px">'
    + '<p style="font-size:15px;color:#333;line-height:1.8;margin-bottom:16px">' + esc(greeting) + '</p>'
    + '<p style="font-size:14px;color:#666;line-height:1.8;margin-bottom:20px">'
    + '這是你剛才在馥靈之鑰「' + esc(system) + '」算出來的結果，幫你存起來了。<br><br>'
    + '你可以慢慢看，也可以把下面這段資料複製起來，貼到 AI 工具就能得到更完整的深度解讀。</p>'
    + '<p style="font-size:13px;color:#888;line-height:1.7;margin-bottom:16px">我們推薦的 AI 解讀工具：</p>'
    + '<div style="text-align:center;margin:0 0 20px">'
    + '<a href="https://claude.ai/referral/h5rHG3kOjA" style="display:inline-block;padding:8px 20px;background:#e9c27d;color:#1a1a2e;border-radius:8px;text-decoration:none;font-size:13px;margin:4px">Claude AI（最推薦）</a>'
    + '<a href="https://chatgpt.com" style="display:inline-block;padding:8px 20px;background:transparent;color:#c9985e;border:1px solid #e8d5a8;border-radius:8px;text-decoration:none;font-size:13px;margin:4px">ChatGPT</a>'
    + '<a href="https://chat.deepseek.com" style="display:inline-block;padding:8px 20px;background:transparent;color:#c9985e;border:1px solid #e8d5a8;border-radius:8px;text-decoration:none;font-size:13px;margin:4px">DeepSeek</a>'
    + '<a href="https://grok.com" style="display:inline-block;padding:8px 20px;background:transparent;color:#c9985e;border:1px solid #e8d5a8;border-radius:8px;text-decoration:none;font-size:13px;margin:4px">Grok</a>'
    + '<a href="https://www.perplexity.ai" style="display:inline-block;padding:8px 20px;background:transparent;color:#c9985e;border:1px solid #e8d5a8;border-radius:8px;text-decoration:none;font-size:13px;margin:4px">Perplexity</a>'
    + '<a href="https://manus.im/invitation/ADFDJWHFVORWIO?utm_source=invitation&utm_medium=social&utm_campaign=copy_link" style="display:inline-block;padding:8px 20px;background:transparent;color:#c9985e;border:1px solid #e8d5a8;border-radius:8px;text-decoration:none;font-size:13px;margin:4px">Manus AI</a>'
    + '</div>'
    + '<div style="background:#faf6ee;border:1px solid #e8d5a8;border-radius:8px;padding:20px;margin:16px 0">'
    + '<div style="font-size:13px;color:#555;line-height:1.85;font-family:monospace,serif;white-space:pre-wrap;word-break:break-word">'
    + formatted
    + '</div></div>'
    + '<p style="font-size:13px;color:#888;margin-top:20px;line-height:1.7">'
    + '想更深入了解自己？試試這些免費工具：</p>'
    + '<div style="text-align:center;margin:16px 0 24px">'
    + '<a href="https://hourlightkey.com/draw-hl.html" style="display:inline-block;padding:10px 24px;background:#e9c27d;color:#1a1a2e;border-radius:8px;text-decoration:none;font-size:14px;margin:4px">抽一張牌</a>'
    + '<a href="https://hourlightkey.com/quiz-hub.html" style="display:inline-block;padding:10px 24px;background:transparent;color:#c9985e;border:1px solid #e8d5a8;border-radius:8px;text-decoration:none;font-size:14px;margin:4px">做個測驗</a>'
    + '</div>'
    + '</div>'
    + emailFooter()
    + '</div></body></html>';
}

// ── 通知信模板（type: 'notification'）──
// content 自帶完整文字（含稱呼），模板只加品牌外框
function buildNotificationHTML(content) {
  var formatted = esc(content)
    .replace(/\n/g, '<br>')
    .replace(/►/g, '<span style="color:#c9985e">►</span>');

  return '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
    + '<body style="margin:0;padding:0;background:#f5f0e8;font-family:serif">'
    + '<div style="max-width:640px;margin:0 auto;background:#fffdf8;border:1px solid #e8d5a8">'
    + emailHeader()
    + '<div style="padding:28px 24px">'
    + '<div style="font-size:14px;color:#444;line-height:2">'
    + formatted
    + '</div>'
    + '</div>'
    + emailFooter()
    + '</div></body></html>';
}
