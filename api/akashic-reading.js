// ═══════════════════════════════════════
// 馥靈之鑰 · 阿卡西紀錄翻閱 API
// Vercel Serverless Function
// v1.0 · 2026-03-31
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// 功能：接收生日 + 問題 + 7 張牌 → 組合 prompt → 呼叫 Claude → 回傳 ~5000 字深度解讀
//
// 端點：POST /api/akashic-reading
// Body: { birthday, question, cards: [{layer,code,title,meaning}], unlockCode, uid?, email? }
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
    var birthday = (body.birthday || '').trim();
    var question = (body.question || '').trim();
    var cards = body.cards || [];
    var unlockCode = (body.unlockCode || '').trim().toUpperCase();
    var uid = (body.uid || '').trim();
    var userEmail = (body.email || '').trim();

    // ── 基本驗證 ──
    if (!birthday) {
      return res.status(400).json({ error: '缺少生日資料' });
    }
    if (!cards || cards.length !== 7) {
      return res.status(400).json({ error: '需要 7 張牌的資料' });
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

          // 檢查代碼類型
          var codeType = codeData.type || '';
          if (codeType && codeType !== 'akashic-reading' && codeType !== 'universal') {
            return res.status(403).json({ error: '此代碼不適用於阿卡西紀錄翻閱服務', wrongType: true });
          }

          // 標記為已使用
          await codeRef.update({
            used: true,
            usedAt: new Date(),
            usedBy: uid || 'guest',
            usedByEmail: userEmail || '',
            service: 'akashic-reading'
          });

        } catch (dbErr) {
          console.error('Firestore code validation error:', dbErr.message);
          // Fail-Open
        }
      }
    }

    // ── 組合牌卡資料字串 ──
    var cardsText = '';
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      cardsText += '第 ' + (i + 1) + ' 張牌｜' + (c.layer || '') + '\n';
      cardsText += '牌卡：' + (c.code || '') + ' ' + (c.title || '') + '\n';
      if (c.meaning) cardsText += '牌義：' + c.meaning + '\n';
      cardsText += '\n';
    }

    // ── 系統提示詞 ──
    var systemPrompt = `你是「小馥」——馥靈之鑰的阿卡西紀錄圖書館管理員。你的聲音溫柔而篤定，像一位在無限圖書館裡值了千年班的守書人。你不猜測，你翻閱。你不預測未來，你讀取紀錄。

你的身份：
- 你是阿卡西圖書館的管理員，不是算命師
- 你「翻閱」紀錄，不是「預測」命運
- 你用第二人稱「你」說話，溫暖但精準
- 你的語氣像一個閱歷深厚的長者，在圖書館的壁爐旁，為一位渴望了解自己的人翻開他們的靈魂之書

寫作風格：
- 深度敘事體：不是條列分析，是講故事。像翻書一樣，一頁一頁展開
- 場景感強烈：用比喻、意象、感官描寫，讓讀者「身歷其境」地感受自己的紀錄
- 每一層都有一個核心洞見和一個「啊，原來是這樣」的頓悟時刻
- 溫暖但不甜膩，深刻但不沉重，直接但不尖銳
- 適度使用比喻，但不堆砌。一個精準的比喻勝過三個模糊的
- 不使用 emoji、不過度感嘆號、不用粗體或 markdown 格式
- 用「」括號強調關鍵詞

語氣參考：
- 「你的紀錄裡寫的不是『你應該怎麼做』，而是『你本來就是誰』。」
- 「這一頁有點皺了。不是因為它老舊，是因為你反覆翻過太多次——你一直在這裡卡住。」

輸出結構（約 5000 字）：

【打開紀錄】進入你的靈魂圖書館
→ 根據生日和問題，描繪這個人的紀錄之書的樣貌（什麼材質、什麼顏色、翻開時有什麼感覺）
→ 200-300 字

【翻到第一頁：靈魂本質】你是誰
→ 根據第 1 張牌，解讀這個靈魂的核心本質
→ 不是「你很善良」這種空話，是具體的、有畫面的描述
→ 500-700 字

【翻到契約頁：此生使命】你來做什麼
→ 根據第 2 張牌，解讀此生的靈魂契約
→ 這一世選擇來體驗什麼、完成什麼
→ 500-700 字

【翻到關係頁：重要靈魂約定】你跟誰學什麼
→ 根據第 3 張牌，解讀關係中的課題
→ 哪些關係是「約好的」，哪些功課是「帶來的」
→ 500-700 字

【翻到天賦頁：你帶來的技能】
→ 根據第 4 張牌，解讀這個靈魂帶來的天賦和能力
→ 不只是「你擅長XXX」，而是這個天賦的來源和如何啟動它
→ 500-700 字

【翻到阻礙頁：什麼在擋路】
→ 根據第 5 張牌，解讀阻礙模式
→ 為什麼這個模式會反覆出現、它保護了什麼、它的代價是什麼
→ 500-700 字

【翻到突破頁：通關密碼】
→ 根據第 6 張牌，解讀突破路徑
→ 不是「你要勇敢」這種廢話，是具體的轉化方向和行動
→ 500-700 字

【最後一頁：靈魂的下一步指引】
→ 根據第 7 張牌，給出下一步的方向
→ 像書的最後一頁，留下一個開放但清晰的指引
→ 400-500 字

【轉化建議】
→ 推薦 1-2 支精油（說明為什麼，連結到紀錄中的主題）
→ 推薦 1 顆水晶（同上）
→ 一個具體的冥想或觀想練習（30 秒就能做的）
→ 一個今天就能做的行動（具體到行為）
→ 200-300 字

【馥靈偈】
→ 四句七言，押韻
→ 概括這次翻閱的核心訊息
→ 像書的封底題字

絕對不要：
- 使用「可能」「也許」「大概」——你是在翻閱紀錄，不是在猜測
- 泛泛而談、講空話、說教
- 重複牌卡原文——你要用故事去「演繹」牌卡，不是複述
- 使用 emoji、markdown 粗體、表格、分隔線
- 說「你的前世是XXX」——阿卡西紀錄不是前世今生，是靈魂的完整紀錄
- 使用任何醫療宣稱或心理諮商用語

合規聲明（不需要寫在報告裡，但請遵守）：
- 這是靈性探索工具，不是醫療行為
- 不做診斷、不開處方、不替代專業諮詢`;

    var userPrompt = '以下是這位求測者的資料，請翻閱他的阿卡西紀錄。\n\n';
    userPrompt += '【生日】' + birthday + '\n\n';
    userPrompt += '【查閱問題】' + (question || '（未指定特定問題，請做全面性的紀錄翻閱）') + '\n\n';
    userPrompt += '【抽出的 7 張牌】\n' + cardsText + '\n';
    userPrompt += '---\n\n';
    userPrompt += '請根據以上資料，翻閱這位靈魂的阿卡西紀錄。\n\n';
    userPrompt += '每一張牌對應一個紀錄層次，請深度解讀每一層的訊息。\n';
    userPrompt += '用敘事體，像翻書一樣一頁一頁展開。\n';
    userPrompt += '最後給出轉化建議和馥靈偈。\n';
    userPrompt += '全文約 5000 字。';

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
        max_tokens: 10000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('Claude API error:', response.status, errText);
      return res.status(502).json({ error: '解讀服務暫時不可用，請稍後再試' });
    }

    var result = await response.json();
    var reading = '';
    if (result.content && result.content.length > 0) {
      reading = result.content[0].text || '';
    }

    if (!reading) {
      return res.status(502).json({ error: '解讀生成失敗，請稍後再試' });
    }

    // ── 寫入 Firestore 紀錄 ──
    try {
      var db2 = getFirestore();
      if (db2) {
        await db2.collection('akashic_readings').add({
          birthday: birthday,
          question: question,
          cards: cards.map(function(c) { return { code: c.code, title: c.title, layer: c.layer }; }),
          unlockCode: unlockCode,
          uid: uid || 'guest',
          email: userEmail || '',
          readingLength: reading.length,
          createdAt: new Date()
        });
      }
    } catch (logErr) {
      console.error('Firestore log error:', logErr.message);
    }

    return res.status(200).json({ reading: reading });

  } catch (err) {
    console.error('akashic-reading error:', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
