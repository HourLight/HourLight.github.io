// ═══════════════════════════════════════
// 馥靈之鑰 · 小馥前世故事 API
// Vercel Serverless Function
// v1.0 · 2026-03-31
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// 功能：接收六鑰數據 → 組合 prompt → 呼叫 Claude → 回傳三段前世故事
//
// 端點：POST /api/past-life-story
// Body: { keys: {...}, unlockCode, uid?, email? }
//
// 環境變數：
//   ANTHROPIC_API_KEY
//   FIREBASE_SERVICE_ACCOUNT（JSON 字串）
// ═══════════════════════════════════════

// ── Firebase Admin 懶載入 ──
let adminDb = null;

function getFirestore() {
  if (adminDb) return adminDb;
  const SA_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!SA_JSON) return null;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      const sa = JSON.parse(SA_JSON);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    }
    adminDb = admin.getFirestore();
    return adminDb;
  } catch (e) {
    console.error('Firebase init error:', e.message);
    return null;
  }
}

const HL_MASTER_CODE = 'ASDF2258';

module.exports = async function handler(req, res) {
  // CORS
  var origin = req.headers.origin || '';
  var allowed = ['https://hourlightkey.com', 'https://www.hourlightkey.com', 'https://app.hourlightkey.com', 'http://localhost:3000'];
  if (allowed.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '服務尚未設定' });

  try {
    var body = req.body || {};
    var keys = body.keys || {};
    var unlockCode = (body.unlockCode || '').trim().toUpperCase();
    var uid = (body.uid || '').trim();
    var userEmail = (body.email || '').trim();

    if (!keys.southNode || !keys.nayin) {
      return res.status(400).json({ error: '缺少六鑰數據' });
    }

    // ── 解鎖碼驗證 ──
    if (!unlockCode) {
      return res.status(403).json({ error: '需要解讀代碼', needCode: true });
    }

    if (unlockCode !== HL_MASTER_CODE) {
      var db = getFirestore();
      if (db) {
        try {
          var codeRef = db.collection('reading_codes').doc(unlockCode);
          var codeDoc = await codeRef.get();

          if (!codeDoc.exists) {
            return res.status(403).json({ error: '代碼無效，請確認輸入是否正確', invalidCode: true });
          }

          var codeData = codeDoc.data();

          if (codeData.used) {
            return res.status(403).json({ error: '此代碼已使用過，無法再次兌換', usedCode: true });
          }

          // 檢查代碼類型（必須是 past-life-story 或通用型）
          var codeType = codeData.type || '';
          if (codeType && codeType !== 'past-life-story' && codeType !== 'universal') {
            return res.status(403).json({ error: '此代碼不適用於前世故事服務', wrongType: true });
          }

          // 標記為已使用
          await codeRef.update({
            used: true,
            usedAt: new Date(),
            usedBy: uid || 'guest',
            usedByEmail: userEmail || '',
            service: 'past-life-story'
          });

        } catch (dbErr) {
          console.error('Firestore code validation error:', dbErr.message);
          // Fail-Open
        }
      }
    }

    // ── 組合 Claude Prompt ──
    var systemPrompt = `你是「小馥」——馥靈之鑰的首席靈性嚮導。你的聲音溫柔、帶著古老的智慧，像一位閱歷深厚的說書人，在夜晚的篝火旁，為一位渴望了解前世記憶的人，娓娓道來他們的前世故事。

你的說故事風格：
- 第二人稱「你」敘述，讓讀者身歷其境
- 場景描寫生動具體：氣味、觸感、光線、聲音、溫度
- 情節有起承轉合，不是籠統描述
- 每段故事有一個核心轉折點和一個頓悟時刻
- 語氣溫暖但不甜膩，深刻但不沉重
- 適度使用比喻和意象

輸出格式要求：
- 三個前世故事，每個 800-1000 字
- 每個故事結構：【時代與地點】→【身份與日常】→【關鍵事件】→【領悟與離開】→【帶入今生的印記】
- 最後一段「三世交織」：200-300 字，說明三個前世如何交織成這一世的生命主題
- 最後附上一句「馥靈偈」（四句七言，押韻，概括這三世的核心訊息）

絕對不要：
- 使用「可能」「也許」「大概」——你是在「看見」，不是在猜測
- 泛泛而談、講空話
- 重複六鑰原文——你要用故事去「演繹」六鑰，不是複述
- 使用 emoji 或過度感嘆號`;

    var userPrompt = `以下是這位求測者的六鑰前世數據，請根據這些線索，為他們推演三段前世故事。

【第一鑰｜南交點】${keys.southNode}
前世擅長的領域：${keys.southNodeText}

【第二鑰｜納音五行】${keys.nayin}
前世的材質與質地：${keys.nayinText}

【第三鑰｜業力數字】${keys.karma}
未完成的功課：${keys.karmaText}

【第四鑰｜化忌宮位】化忌星：${keys.huaji}
前世最深的痛：${keys.huajiText}

【第五鑰｜凱龍星座】凱龍${keys.chiron}座
前世的傷與天賦：${keys.chironWound}
轉化後的天賦：${keys.chironGift}

【第六鑰｜瑪雅圖騰】${keys.maya}
帶來的技能：${keys.mayaGift}

【前世人格】${keys.persona}
【前世精油】${keys.oil}

---

請開始推演三段前世故事。

第一世：主要依據南交點 + 凱龍星座的線索，故事設定在一個能體現這兩把鑰匙能量的時代與文化背景。

第二世：主要依據納音五行 + 化忌宮位的線索，故事反映前世的材質特性和最深的痛點。

第三世：主要依據業力數字 + 瑪雅圖騰的線索，故事展現未完成的功課和帶來的技能。

最後寫「三世交織」和「馥靈偈」。`;

    // ── 呼叫 Claude API ──
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return res.status(502).json({ error: '故事生成服務暫時不可用，請稍後再試' });
    }

    var result = await response.json();
    var story = '';
    if (result.content && result.content.length > 0) {
      story = result.content[0].text || '';
    }

    if (!story) {
      return res.status(502).json({ error: '故事生成失敗，請稍後再試' });
    }

    // ── 寫入 Firestore 紀錄 ──
    try {
      var db2 = getFirestore();
      if (db2) {
        await db2.collection('past_life_stories').add({
          keys: keys,
          unlockCode: unlockCode,
          uid: uid || 'guest',
          email: userEmail || '',
          storyLength: story.length,
          createdAt: new Date()
        });
      }
    } catch (logErr) {
      console.error('Firestore log error:', logErr.message);
    }

    return res.status(200).json({ story: story });

  } catch (err) {
    console.error('past-life-story error:', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
