// api/ai-framework-gate.js
// 馥靈之鑰 AI 框架閘門 API v2.0
// 2026/3/24 更新：週制→日制 + 加購次數 + 留底
//
// 框架文字是核心知識產權，只有登入會員且有額度才能取得
// POST { system: "bazi" } + Authorization: Bearer <firebase_token>
// 回傳：{ ok, framework, quota: {used, limit, plan, bonus} }

var admin = null;
function getAdmin() {
  if (admin) return admin;
  var a = require('firebase-admin');
  if (!a.apps.length) {
    var sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    a.initializeApp({ credential: a.credential.cert(sa) });
  }
  admin = a;
  return a;
}

// 從同目錄的 ai-prompt-test.js 取框架
var _cachedSystems = null;
function getSystems() {
  if (_cachedSystems) return _cachedSystems;
  var fs = require('fs');
  var path = require('path');
  var code = fs.readFileSync(path.join(__dirname, 'ai-prompt-test.js'), 'utf8');
  var defsEnd = code.indexOf('module.exports');
  var defs = code.substring(0, defsEnd);
  try {
    var fn = new Function(defs + '\nreturn SYSTEMS;');
    _cachedSystems = fn();
  } catch (e) {
    console.error('SYSTEMS parse error:', e.message);
    _cachedSystems = {};
  }
  return _cachedSystems;
}

// 日制配額（對齊 hl-ai-gate.js v3）
var DAILY_LIMITS = { free: 3, plus: 10, pro: 999999 };

// 取得台灣日期 key
function getDayKey() {
  var now = new Date();
  var twMs = now.getTime() + 8 * 3600000;
  var tw = new Date(twMs);
  var y = tw.getUTCFullYear();
  var m = String(tw.getUTCMonth() + 1).padStart(2, '0');
  var d = String(tw.getUTCDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
}

module.exports = async function handler(req, res) {
  var origin = req.headers.origin || '';
  var allowed = ['https://hourlightkey.com', 'https://www.hourlightkey.com'];
  if (allowed.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    var authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '需要登入才能使用智慧解讀指令', code: 'AUTH_REQUIRED' });
    }
    var fb = getAdmin();
    var decoded;
    try {
      decoded = await fb.auth().verifyIdToken(authHeader.substring(7));
    } catch (e) {
      return res.status(401).json({ error: '登入已過期，請重新登入', code: 'TOKEN_INVALID' });
    }
    var uid = decoded.uid;
    var db = fb.firestore();

    // 取會員資料（方案 + 加購次數）
    var userDoc = await db.collection('users').doc(uid).get();
    var userData = userDoc.exists ? userDoc.data() : {};
    var plan = userData.plan || 'free';
    var bonus = userData.aiBonus || 0;
    var limit = DAILY_LIMITS[plan] || 3;

    // 日制配額檢查
    var dayKey = getDayKey();

    // ★ 寬限期：2026/3/26 之前不限次數（公告日期）
    var gracePeriod = dayKey < '2026-03-26';

    var dailyRef = db.collection('users').doc(uid).collection('ai_daily').doc(dayKey);
    var dailyDoc = await dailyRef.get();
    var count = (dailyDoc.exists && dailyDoc.data().count) || 0;

    // Pro 用戶無上限
    if (plan === 'pro' || gracePeriod) {
      // 直接放行，不扣次但記錄
    } else if (count >= limit) {
      // 每日額度用完，檢查加購
      if (bonus > 0) {
        // 扣加購次數
        await db.collection('users').doc(uid).update({
          aiBonus: fb.firestore.FieldValue.increment(-1)
        });
        bonus = bonus - 1;
      } else {
        // 沒有加購，擋住
        var hoursLeft = 24 - new Date(new Date().getTime() + 8 * 3600000).getUTCHours();
        return res.status(429).json({
          error: '今日智慧解讀額度已用完',
          code: 'QUOTA_EXCEEDED',
          plan: plan, used: count, limit: limit, bonus: 0,
          hoursLeft: hoursLeft
        });
      }
    }

    // 取框架
    var body = req.body || {};
    var system = body.system || '';
    if (!system) return res.status(400).json({ error: '需要 system 參數' });

    var systems = getSystems();
    var sysData = systems[system];
    if (!sysData || !sysData.framework) {
      return res.status(404).json({ error: system + ' 框架不存在' });
    }

    // 記錄使用（日制）
    await dailyRef.set({
      count: fb.firestore.FieldValue.increment(1),
      lastUsed: fb.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    count = count + 1;

    // 組合框架
    var fw = '';
    if (sysData.framework) fw += sysData.framework;
    if (sysData.books) fw += '\n\n' + sysData.books;
    if (sysData.navigation) fw += '\n\n' + sysData.navigation;

    // 留底（Firestore）
    try {
      await db.collection('readings').add({
        uid: uid,
        email: decoded.email || '',
        type: 'ai-framework',
        system: system,
        plan: plan,
        createdAt: new Date(),
        source: 'ai-framework-gate'
      });
    } catch (saveErr) {
      // 留底失敗不影響回傳
    }

    return res.status(200).json({
      ok: true,
      framework: fw,
      quota: { used: count, limit: limit, plan: plan, bonus: bonus }
    });
  } catch (e) {
    console.error('ai-framework-gate error:', e);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
