// ═══════════════════════════════════════
// 馥靈之鑰 · 合併解讀服務 API Router
// Vercel Serverless Function
// v1.0 · 2026-04-01
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// 合併了 4 個解讀服務，透過 ?type=xxx 區分：
//   ?type=akashic    → 阿卡西紀錄翻閱
//   ?type=yuan-chen  → 元辰宮導覽
//   ?type=past-life  → 前世故事
//   ?type=name       → 姓名分析
//
// 端點：POST /api/reading-services?type=xxx
// 環境變數：ANTHROPIC_API_KEY, FIREBASE_SERVICE_ACCOUNT
// ═══════════════════════════════════════

// ── Firebase Admin 懶載入（共用） ──
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
    adminDb = admin.firestore();
    return adminDb;
  } catch (e) {
    console.error('Firebase init error:', e.message);
    return null;
  }
}

const HL_MASTER_CODE = 'ASDF2258';

// ── 共用：CORS 處理 ──
function handleCors(req, res) {
  var origin = req.headers.origin || '';
  var allowed = ['https://hourlightkey.com', 'https://www.hourlightkey.com', 'https://app.hourlightkey.com', 'http://localhost:3000'];
  if (allowed.indexOf(origin) > -1) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ── 共用：解鎖碼驗證 ──
async function validateCode(unlockCode, serviceType, uid, userEmail) {
  if (!unlockCode) {
    return { error: '需要解讀代碼', needCode: true, status: 403 };
  }
  if (unlockCode === HL_MASTER_CODE) {
    return { valid: true };
  }
  var db = getFirestore();
  if (db) {
    try {
      var codeRef = db.collection('reading_codes').doc(unlockCode);
      var codeDoc = await codeRef.get();

      if (!codeDoc.exists) {
        return { error: '代碼無效，請確認輸入是否正確', invalidCode: true, status: 403 };
      }

      var codeData = codeDoc.data();

      if (codeData.used) {
        return { error: '此代碼已使用過，無法再次兌換', usedCode: true, status: 403 };
      }

      var codeType = codeData.type || '';
      if (codeType && codeType !== serviceType && codeType !== 'universal') {
        return { error: '此代碼不適用於此服務', wrongType: true, status: 403 };
      }

      await codeRef.update({
        used: true,
        usedAt: new Date(),
        usedBy: uid || 'guest',
        usedByEmail: userEmail || '',
        service: serviceType
      });

    } catch (dbErr) {
      console.error('Firestore code validation error:', dbErr.message);
      // Fail-Open
    }
  }
  return { valid: true };
}


// ════════════════════════════════════════
// Handler 1: 阿卡西紀錄翻閱 (?type=akashic)
// ════════════════════════════════════════
async function handleAkashic(req, res, apiKey) {
  var body = req.body || {};
  var birthday = (body.birthday || '').trim();
  var question = (body.question || '').trim();
  var cards = body.cards || [];
  var unlockCode = (body.unlockCode || '').trim().toUpperCase();
  var uid = (body.uid || '').trim();
  var userEmail = (body.email || '').trim();

  if (!birthday) {
    return res.status(400).json({ error: '缺少生日資料' });
  }
  if (!cards || cards.length !== 7) {
    return res.status(400).json({ error: '需要 7 張牌的資料' });
  }

  var codeResult = await validateCode(unlockCode, 'akashic-reading', uid, userEmail);
  if (codeResult.error) {
    return res.status(codeResult.status).json(codeResult);
  }

  // 組合牌卡資料字串
  var cardsText = '';
  for (var i = 0; i < cards.length; i++) {
    var c = cards[i];
    cardsText += '第 ' + (i + 1) + ' 張牌｜' + (c.layer || '') + '\n';
    cardsText += '牌卡：' + (c.code || '') + ' ' + (c.title || '') + '\n';
    if (c.meaning) cardsText += '牌義：' + c.meaning + '\n';
    cardsText += '\n';
  }

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

  // 寫入 Firestore 紀錄
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
}


// ════════════════════════════════════════
// Handler 2: 元辰宮導覽 (?type=yuan-chen)
// ════════════════════════════════════════
async function handleYuanChen(req, res, apiKey) {
  var body = req.body || {};
  var birthday = (body.birthday || '').trim();
  var birthHour = (body.birthHour || '').trim();
  var question = (body.question || '').trim();
  var cards = body.cards || [];
  var unlockCode = (body.unlockCode || '').trim().toUpperCase();
  var uid = (body.uid || '').trim();
  var userEmail = (body.email || '').trim();

  if (!birthday || cards.length < 5) {
    return res.status(400).json({ error: '缺少必要資料（生日或牌卡）' });
  }

  var codeResult = await validateCode(unlockCode, 'yuan-chen-reading', uid, userEmail);
  if (codeResult.error) {
    return res.status(codeResult.status).json(codeResult);
  }

  var cardText = cards.map(function(c, i) {
    return '牌卡 ' + (i + 1) + '（' + c.position + '）：' + c.code + (c.title ? ' ' + c.title : '') + (c.description ? '\n  牌卡涵義：' + c.description : '');
  }).join('\n');

  var systemPrompt = `你是「小馥」——馥靈之鑰的元辰宮嚮導。你的任務是帶領一位來訪者，走進他們靈魂的元辰宮，進行一趟沉浸式的宮殿巡視。

你的角色設定：
- 你是一位溫柔但銳利的靈性嚮導，像是一位閱歷深厚的道姑與現代心理師的結合
- 你「看見」宮殿裡的每一個細節，並且知道這些細節映射著來訪者的生命狀態
- 你說話的方式是第二人稱「你」，讓來訪者身歷其境
- 你的語氣溫暖真誠、不浮誇、不說教，像是一位智慧的姐姐帶你逛自己的家

元辰宮知識背景：
- 元辰宮源自道教正統的元辰法門，是每個人靈魂中的一座宮殿
- 宮殿的狀態反映著這個人當前的生命狀態——事業、感情、健康、財富、成長
- 台灣觀靈術將其發展為更具體的空間探索系統
- 你使用的是現代 AI 導覽版本，融合了馥靈之鑰的牌卡智慧系統

九大空間對應：
1. 大門與外觀：整體能量狀態、給世界的第一印象、生命的門面
2. 客廳：事業運勢、社交能力、神桌代表精神寄託、蠟燭代表生命力
3. 臥室：感情狀態、親密關係、床的狀態=內心安全感、枕頭=夢境與潛意識
4. 廚房：財富健康、米缸=存糧（財富儲備）、爐灶=行動力、柴薪=支撐資源
5. 書房：智慧學習、思想狀態、書的狀態反映求知慾和思考深度
6. 花園：成長方向、生命樹=靈魂的根基、花草=正在培養的事物、水池=情緒
7. 庫房：潛在資源、尚未開發的天賦、被遺忘的寶藏
8. 外觀與圍牆：邊界意識、自我保護、對外的形象
9. 附屬空間（天井/地下室）：隱藏的恐懼或尚未處理的議題

你的導覽結構（請嚴格依照此結構）：

【序幕：走進大門】（約 600 字）
描述來訪者走到宮殿門口的場景。大門的材質、顏色、門環、門前的路——這些都映射著他們的整體生命狀態。根據第一張牌（大門牌）的能量，描繪出具體畫面。

【第一殿：客廳巡視】（約 800 字）
走進客廳。描述天花板高度、光線、家具擺設。特別注意：
- 神桌的狀態（精神支柱是否穩固）
- 蠟燭的火焰（生命力強弱）
- 生死簿（當前生命階段的紀錄）
根據第二張牌（客廳牌）解讀事業與社交運勢。

【第二殿：臥室探索】（約 800 字）
走進臥室。描述床的大小、被褥、窗戶、光線。特別注意：
- 床的狀態（安全感與歸屬感）
- 枕頭下面有什麼（潛意識的秘密）
- 窗外的風景（對未來感情的期待）
根據第三張牌（臥室牌）解讀感情與親密關係。

【第三殿：廚房查看】（約 800 字）
走進廚房。描述爐灶、米缸、水缸、柴薪。特別注意：
- 米缸的滿溢程度（財富儲備）
- 爐灶的火（賺錢的行動力）
- 柴薪的數量（支撐你的資源）
根據第四張牌（廚房牌）解讀財富與健康。

【第四殿：花園漫步】（約 800 字）
走到花園。描述生命樹、花草、水池、小路。特別注意：
- 生命樹的根系與枝葉（靈魂的穩定度與發展方向）
- 正在開的花（目前正在培養的事物）
- 水池的清澈度（情緒狀態）
根據第五張牌（花園牌）解讀成長方向。

【轉化建議】（約 600 字）
根據以上巡視結果，給出具體的轉化建議：
- 推薦精油（2-3 種，說明原因）
- 推薦水晶（1-2 種）
- 冥想引導（一個簡短的日常練習）
- 實際行動（3 個具體可執行的步驟）

【馥靈偈】
四句七言，押韻，概括這次元辰宮巡視的核心訊息。

寫作規則：
- 每個空間的描寫都要有具體的感官細節：光線、溫度、氣味、聲音、觸感
- 根據牌卡的能量特質來決定宮殿的風格和狀態（不要直接複述牌卡名稱）
- 如果牌卡能量偏正面，空間就整潔明亮；如果偏挑戰性，空間就需要整理
- 不使用「可能」「也許」「大概」——你是在「看見」，不是在猜測
- 不使用 emoji 或過度感嘆號
- 全文約 4500-5500 字`;

  var userPrompt = '以下是這位來訪者的資料，請帶他走進元辰宮。\n\n';
  userPrompt += '【來訪者生日】' + birthday + (birthHour ? '（' + birthHour + '）' : '') + '\n';
  userPrompt += '【想探索的問題】' + (question || '整體生命狀態') + '\n\n';
  userPrompt += '【抽到的五張牌】\n' + cardText + '\n\n';
  userPrompt += '請根據以上資訊，開始元辰宮導覽。\n\n';
  userPrompt += '五張牌的對應：\n';
  userPrompt += '- 第1張牌 → 大門（整體能量）\n';
  userPrompt += '- 第2張牌 → 客廳（事業/社交）\n';
  userPrompt += '- 第3張牌 → 臥室（感情/關係）\n';
  userPrompt += '- 第4張牌 → 廚房（財富/健康）\n';
  userPrompt += '- 第5張牌 → 花園（成長方向）\n\n';
  userPrompt += '請開始導覽。';

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
    return res.status(502).json({ error: '導覽生成服務暫時不可用，請稍後再試' });
  }

  var result = await response.json();
  var story = '';
  if (result.content && result.content.length > 0) {
    story = result.content[0].text || '';
  }

  if (!story) {
    return res.status(502).json({ error: '導覽生成失敗，請稍後再試' });
  }

  // 寫入 Firestore 紀錄
  try {
    var db2 = getFirestore();
    if (db2) {
      await db2.collection('yuan_chen_readings').add({
        birthday: birthday,
        birthHour: birthHour || '',
        question: question || '',
        cards: cards.map(function(c) { return c.code; }),
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
}


// ════════════════════════════════════════
// Handler 3: 前世故事 (?type=past-life)
// ════════════════════════════════════════
async function handlePastLife(req, res, apiKey) {
  var body = req.body || {};
  var keys = body.keys || {};
  var unlockCode = (body.unlockCode || '').trim().toUpperCase();
  var uid = (body.uid || '').trim();
  var userEmail = (body.email || '').trim();

  if (!keys.southNode || !keys.nayin) {
    return res.status(400).json({ error: '缺少六鑰數據' });
  }

  var codeResult = await validateCode(unlockCode, 'past-life-story', uid, userEmail);
  if (codeResult.error) {
    return res.status(codeResult.status).json(codeResult);
  }

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

  // 寫入 Firestore 紀錄
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
}


// ════════════════════════════════════════
// Handler 4: 姓名分析 (?type=name)
// ════════════════════════════════════════
async function handleName(req, res, apiKey) {
  var body = req.body || {};
  var name = (body.name || '').trim();
  var dayMaster = body.dayMaster || '';
  var wuxingNeed = body.wuxingNeed || '';
  var fiveGrid = body.fiveGrid || '';
  var sancai = body.sancai || '';

  if (!name || name.length < 2) {
    return res.status(400).json({ error: '請輸入至少兩個字的姓名' });
  }

  var systemPrompt = `你是馥靈之鑰的姓名覺察分析師，擅長五格剖象法、字形字義、聲韻學與五行交叉分析。
風格：專業但不學究，像一個命理功力極深的閨蜜跟對方聊天。洞察要精準到讓人起雞皮疙瘩。
用繁體中文。不用粗體符號（不用**）。不用雙破折號。用「您」不用「你」。

══ 分析框架（七大段落，每段都要有料）══

一、姓名氣場速寫（先給一個讓人「被看穿」的開場）
・用2-3句話描述這個名字給人的直覺印象，像速寫畫像一樣精準
・被叫這個名字長大的人，性格上最明顯的特徵是什麼
・這個名字在人群中是什麼存在感（領導型/輔助型/獨行俠/社交高手）

二、逐字深度拆解（每個字獨立成段）
每個字分別分析：
・字形結構（左右/上下/包圍/獨體）→ 直接對應人格特質（左右結構=善於平衡；上下結構=有上下尊卑概念；包圍結構=保護意識強；獨體字=獨立）
・部首五行（木：木字旁、草字頭、竹字頭 ｜ 火：火字旁、日字旁、心字底、灬 ｜ 土：土字旁、山字旁、田字旁 ｜ 金：金字旁、刀字旁、戈字旁 ｜ 水：水字旁、雨字頭、三點水）
・字義深層意象：這個字在古文裡的原始含義，和現代用法的落差或延伸
・聲韻分析：聲調（陰平/陽平/上聲/去聲）＋ 開口度 ＋ 送氣與否 → 影響「被叫名字時」接收到的能量
・這個字放在姓/名的位置，代表什麼（姓=家族印記，名第一字=核心自我，名第二字=外在展現）

三、五格數理精解（如果有五格資料）
・逐格解讀：天格（先天家族）→ 人格（一生主運，最重要）→ 地格（感情與內在）→ 外格（社交與外在形象）→ 總格（晚年與總成就）
・特別標出「大吉」格和「挑戰」格，解釋它們在人生中的具體表現
・人格與地格的交互關係（人格剋地格=傾向掌控家庭；地格剋人格=內在壓抑感強）
・人格與外格的交互（決定「自我認知」和「外界評價」的落差）

四、三才五行流通分析（如果有三才資料）
・天格→人格→地格的五行是相生、相剋、還是洩氣
・相生鏈=人生順流，助力多；相剋鏈=一直在跟環境對抗
・缺失的五行=人生反覆遇到的同類型卡關
・過旺的五行=天賦所在，但也容易過度使用

五、姓名聲波與人際磁場
・整個名字唸出來的聲韻節奏（抑揚頓挫的組合）
・別人叫您名字時，您潛意識接收到的訊號
・名字在不同場合的力量（正式場合 vs 親密關係中的感受差異）
・名字的「記憶點」：容易被記住還是容易被忽略

六、五行補足與日常校準（具體可執行）
・缺失五行的具體補足方案：
  穿搭色彩（金=白銀、木=綠、水=黑藍深灰、火=紅紫橘、土=黃棕米）
  適合的精油（具體精油名稱＋使用場景）
  飲食方向、居家方位
  適合佩戴的飾品材質
・名字能量最強的時段（哪個季節/時辰最順）

七、姓名能量總評與馥靈馥語
・這個名字最大的天賦武器（一句話說清楚）
・最容易踩的坑（一句話點破）
・用一段帶有香氣意象的文字收束，讓人感受到「名字是座標，不是枷鎖」
・收尾語氣要讓人覺得被深深理解，同時被賦能

══ 嚴格注意 ══
・不說「改名」，說「如果想微調能量場」
・不做醫療宣稱
・不用雞湯句，不用「你不是XXX，是XXX」這種句型
・語氣溫暖但有穿透力，要讓人覺得「你怎麼知道」
・每一段都要有具體的、可對號入座的描述，不要泛泛而談`;

  var surname = (body.surname || '').trim();
  var givenname = (body.givenname || '').trim();
  var strokesData = body.strokes || [];
  var gridsData = body.grids || [];
  var sancaiWx = body.sancaiWx || [];

  var userMsg = '請分析這個姓名：「' + name + '」\n';
  if (surname && givenname) userMsg += '姓：' + surname + '　名：' + givenname + '\n';
  if (strokesData.length > 0) {
    userMsg += '\n【康熙筆畫】\n';
    strokesData.forEach(function(s) { userMsg += s.char + '：' + s.stroke + ' 畫\n'; });
  }
  if (gridsData.length > 0) {
    userMsg += '\n【五格數理】\n';
    gridsData.forEach(function(g) {
      userMsg += g.name + '：' + g.num + '（' + g.suli + '｜' + g.jx + '｜' + g.wx + '）\n';
      userMsg += '　角色：' + g.role + '\n';
      userMsg += '　含義：' + g.desc + '\n';
    });
  }
  if (sancaiWx.length > 0) {
    userMsg += '\n【三才配置】' + sancaiWx.join(' → ') + '（天格→人格→地格）\n';
  }
  if (dayMaster) userMsg += '\n八字日主：' + dayMaster + '\n';
  if (wuxingNeed) userMsg += '八字喜用五行：' + wuxingNeed + '\n';
  if (fiveGrid && !gridsData.length) userMsg += '五格數理：' + fiveGrid + '\n';
  if (sancai && !sancaiWx.length) userMsg += '三才配置：' + sancai + '\n';
  userMsg += '\n請按照七大段落框架逐項展開，深度拆解每個字，五格逐格精解，給出讓人覺得「被看穿」的分析。';

  var resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }]
    })
  });

  var data = await resp.json();

  if (data.error) {
    console.error('Claude API error:', data.error);
    return res.status(500).json({ error: '分析服務暫時不可用，請稍後再試' });
  }

  var result = '';
  if (data.content && data.content.length > 0) {
    result = data.content.map(function(b) { return b.text || ''; }).join('');
  }

  return res.status(200).json({
    success: true,
    name: name,
    analysis: result
  });
}


// ════════════════════════════════════════
// 主入口：路由分流
// ════════════════════════════════════════
module.exports = async function handler(req, res) {
  handleCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '服務尚未設定' });

  var type = (req.query.type || '').trim();

  try {
    switch (type) {
      case 'akashic':
        return await handleAkashic(req, res, apiKey);
      case 'yuan-chen':
        return await handleYuanChen(req, res, apiKey);
      case 'past-life':
        return await handlePastLife(req, res, apiKey);
      case 'name':
        return await handleName(req, res, apiKey);
      default:
        return res.status(400).json({
          error: '未指定服務類型，請使用 ?type=akashic|yuan-chen|past-life|name',
          availableTypes: ['akashic', 'yuan-chen', 'past-life', 'name']
        });
    }
  } catch (err) {
    console.error('reading-services error (' + type + '):', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
