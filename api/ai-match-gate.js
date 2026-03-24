// api/ai-match-gate.js
// 馥靈之鑰 合盤 AI 框架閘門 API v1.0
// 2026/3/24
//
// POST { system: "bazi", relation: "love" } + Authorization: Bearer <token>
// 回傳：{ ok, framework, quota }

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

// 從 ai-match-1-test.js 取框架
var _cached = null;
function getMatchSystems() {
  if (_cached) return _cached;
  var fs = require('fs');
  var path = require('path');
  var code = fs.readFileSync(path.join(__dirname, 'ai-match-1-test.js'), 'utf8');
  var sysEnd = code.indexOf('module.exports');
  var defs = code.substring(0, sysEnd);
  try {
    var fn = new Function(defs + '\nreturn SYSTEMS;');
    _cached = fn();
  } catch (e) {
    console.error('MATCH SYSTEMS parse error:', e.message);
    _cached = {};
  }
  return _cached;
}

var DAILY_LIMITS = { free: 3, plus: 10, pro: 999999 };

function getDayKey() {
  var now = new Date();
  var twMs = now.getTime() + 8 * 3600000;
  var tw = new Date(twMs);
  return tw.getUTCFullYear() + '-' + String(tw.getUTCMonth() + 1).padStart(2, '0') + '-' + String(tw.getUTCDate()).padStart(2, '0');
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

    var userDoc = await db.collection('users').doc(uid).get();
    var userData = userDoc.exists ? userDoc.data() : {};
    var plan = userData.plan || 'free';
    var bonus = userData.aiBonus || 0;
    var limit = DAILY_LIMITS[plan] || 3;

    var dayKey = getDayKey();
    var dailyRef = db.collection('users').doc(uid).collection('ai_daily').doc(dayKey);
    var dailyDoc = await dailyRef.get();
    var count = (dailyDoc.exists && dailyDoc.data().count) || 0;

    if (plan !== 'pro' && count >= limit) {
      if (bonus > 0) {
        await db.collection('users').doc(uid).update({
          aiBonus: fb.firestore.FieldValue.increment(-1)
        });
        bonus = bonus - 1;
      } else {
        var hoursLeft = 24 - new Date(new Date().getTime() + 8 * 3600000).getUTCHours();
        return res.status(429).json({
          error: '今日智慧解讀額度已用完',
          code: 'QUOTA_EXCEEDED',
          plan: plan, used: count, limit: limit, bonus: 0, hoursLeft: hoursLeft
        });
      }
    }

    var body = req.body || {};
    var system = body.system || '';
    var relation = body.relation || '';
    if (!system || !relation) {
      return res.status(400).json({ error: '需要 system 和 relation 參數' });
    }

    var systems = getMatchSystems();
    var sysData = systems[system];
    if (!sysData) return res.status(404).json({ error: system + ' 框架不存在' });
    var relData = sysData[relation];
    if (!relData) return res.status(404).json({ error: system + '/' + relation + ' 框架不存在' });

    // 記錄使用
    await dailyRef.set({
      count: fb.firestore.FieldValue.increment(1),
      lastUsed: fb.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    count = count + 1;

    // 組合框架文字
    var fw = '【' + relData.title + '】\n\n';
    if (relData.desc) fw += relData.desc + '\n\n';
    if (relData.focus && relData.focus.length) {
      fw += '══════ 解讀框架 ══════\n\n';
      relData.focus.forEach(function(f) { fw += f + '\n\n'; });
    }
    if (relData.books) fw += '【參考書目】\n' + relData.books + '\n';

    // 留底
    try {
      await db.collection('readings').add({
        uid: uid, email: decoded.email || '',
        type: 'ai-match-framework',
        system: system, relation: relation, plan: plan,
        createdAt: new Date(), source: 'ai-match-gate'
      });
    } catch (e) {}

    return res.status(200).json({
      ok: true,
      framework: fw,
      quota: { used: count, limit: limit, plan: plan, bonus: bonus }
    });
  } catch (e) {
    console.error('ai-match-gate error:', e);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
