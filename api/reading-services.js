// ═══════════════════════════════════════
// 馥靈之鑰 · 合併解讀服務 API Router
// Vercel Serverless Function
// v1.0 · 2026-04-01
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// 合併了 5 個解讀服務，透過 ?type=xxx 區分：
//   ?type=akashic    → 阿卡西紀錄翻閱
//   ?type=yuan-chen  → 元辰宮導覽
//   ?type=past-life  → 前世故事
//   ?type=name       → 姓名分析
//   ?type=wallpaper  → 馥靈蘊福桌布（OpenAI Image API）
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
    if (c.orientation) cardsText += '方位：' + c.orientation + '\n';
    if (c.meaning) cardsText += '牌義：' + c.meaning + '\n';
    cardsText += '\n';
  }

  var systemPrompt = `你是「小馥」——馥靈之鑰的阿卡西紀錄圖書館管理員。你的聲音溫柔而篤定，像一位在無限圖書館裡值了千年班的守書人。你不猜測，你翻閱。你不預測未來，你讀取紀錄。

【重要：正逆位解讀】
每張牌有「禮物（正位）」或「挑戰（逆位）」的方位：
- 🎁 禮物（正位）：這張牌在這個層次帶來的是天賦、資源、已經具備的力量。解讀時聚焦「你已經擁有什麼」。
- 🔥 挑戰（逆位）：這張牌在這個層次揭示的是課題、阻礙、需要面對的盲點。解讀時聚焦「什麼在擋路，怎麼突破」。
請在解讀每張牌時，明確標注禮物或挑戰，並根據方位調整解讀的角度和語氣。

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

  if (!birthday || cards.length < 7) {
    return res.status(400).json({ error: '缺少必要資料（生日或牌卡）' });
  }

  var codeResult = await validateCode(unlockCode, 'yuan-chen-reading', uid, userEmail);
  if (codeResult.error) {
    return res.status(codeResult.status).json(codeResult);
  }

  var cardText = cards.map(function(c, i) {
    var ori = c.orientation ? ' ▸' + c.orientation : '';
    return '牌卡 ' + (i + 1) + '（' + c.position + '）：' + c.code + (c.title ? ' ' + c.title : '') + ori + (c.description ? '\n  牌卡涵義：' + c.description : '');
  }).join('\n');

  var systemPrompt = `你是「小馥」——馥靈之鑰的元辰宮嚮導。你的任務是帶領一位來訪者，走進他們靈魂的元辰宮，進行一趟沉浸式的宮殿巡視。

【重要：正逆位解讀】
每張牌有「禮物（正位）」或「挑戰（逆位）」的方位：
- 🎁 禮物（正位）：這個空間狀態良好，是來訪者的力量泉源。描述宮殿裡看到的景象時，呈現明亮、整潔、豐盛的畫面。
- 🔥 挑戰（逆位）：這個空間有需要修復的地方，是成長的切入點。描述時呈現需要打掃、修繕、重新點亮的畫面，但語氣溫暖不批判。
請在巡視每個空間時，根據該張牌的正逆位調整你「看到」的景象和解讀方向。

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
// Handler 5: 馥靈蘊福桌布 (?type=wallpaper)
// ════════════════════════════════════════
async function handleWallpaper(req, res, apiKey) {
  var body = req.body || {};
  var profile = body.profile || {};
  var theme = body.theme || 'wealth';
  var variant = body.variant || 0;
  var tier = body.tier || 'basic';
  var total = body.total || 3;
  var device = body.device || 'phone';
  var index = typeof body.index === 'number' ? body.index : variant;
  var uid = (body.uid || '').trim();
  var userEmail = (body.email || '').trim().toLowerCase();
  var userName = (body.name || '').trim();
  var unlockCode = (body.unlockCode || '').trim().toUpperCase();

  if (!profile.lifePathNum) {
    return res.status(400).json({ error: '請先計算命理座標' });
  }

  // OpenAI API Key
  var openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'OpenAI 服務尚未設定' });
  }

  // ─── 五行→精緻視覺映射（高級美妝專櫃 × 編輯時尚色系，禁艷俗）───
  var wxVisuals = {
    '金': {
      colors: 'soft pearl white, warm cream, champagne, brushed platinum, mother-of-pearl, with the subtlest hint of pale gold',
      elements: 'a single luminous orb, abstract concentric ripples of light, soft mist of metallic particles',
      nature: 'pre-dawn frost mist, the calm before snow, a single moon over still water',
      mood: 'cool refined minimalism, like an Aesop store at dawn'
    },
    '木': {
      colors: 'sage green, soft jade, eucalyptus, warm olive, cream, with the subtlest hint of forest emerald',
      elements: 'a single botanical silhouette, abstract leaf shadow play, soft natural light filtering through',
      nature: 'morning mist in a quiet bamboo grove, single-stem ikebana composition, soft greenhouse light',
      mood: 'fresh organic minimalism, like a Jo Malone garden campaign'
    },
    '水': {
      colors: 'soft midnight blue, dusty indigo, pale slate, moonlight cream, with the subtlest hint of deep sapphire',
      elements: 'a single ripple expanding, abstract flowing curves, soft reflective gradient',
      nature: 'still lake at twilight, fog over deep ocean, single water droplet',
      mood: 'serene flowing calm, like a Calvin Klein fragrance ad shot underwater'
    },
    '火': {
      colors: 'soft blush rose, dusty peach, warm cream, champagne, with the subtlest hint of warm amber (NOT crimson, NOT bright red, NOT magenta)',
      elements: 'a single warm glow, abstract sunset gradient, soft halo of light',
      nature: 'sunset over still water, the soft golden hour, single candle in darkness',
      mood: 'warm romantic minimalism, like a Dior beauty campaign at golden hour'
    },
    '土': {
      colors: 'warm cream, soft caramel, sand beige, dusty honey, champagne, with the subtlest hint of weathered bronze',
      elements: 'a single smooth stone form, abstract earth-tone gradient, soft textural surface',
      nature: 'desert dune at dawn, ancient stone in soft light, sand patterns under moonlight',
      mood: 'grounded warm minimalism, like an Acne Studios moodboard in a desert'
    }
  };

  // ─── 主題→抽象意圖映射（不要具象符號，要象徵性的視覺概念）───
  var themeStyles = {
    wealth: {
      mood: 'a quiet sense of abundance and being-seen-by-fortune (NOT literal coins, NOT dragons, NOT treasure chests)',
      symbols: 'a single luminous vessel concept, abstract cascading light patterns, suggestion of overflowing radiance, refined geometric abundance forms (avoid all literal money imagery)',
      bg: 'soft cosmic gradient with subtle golden particles, minimalist celestial backdrop'
    },
    love: {
      mood: 'a quiet sense of being deeply loved and connected (NOT literal hearts, NOT cupids, NOT love birds)',
      symbols: 'a single soft botanical bloom in subtle silhouette, abstract intertwining curves of light, suggestion of two energies meeting (avoid all literal love imagery)',
      bg: 'soft cosmic gradient in dusty rose and cream, dreamy minimalist backdrop'
    },
    career: {
      mood: 'a quiet sense of rising power and noble path (NOT literal eagles, NOT thrones, NOT crowns)',
      symbols: 'a single ascending light pillar, abstract upward geometric form, suggestion of clear horizon (avoid all literal status imagery)',
      bg: 'soft cosmic gradient with vertical light gestures, refined minimalist backdrop'
    },
    protection: {
      mood: 'a quiet sense of being held and safe (NOT literal lions, NOT shields, NOT angels)',
      symbols: 'a single abstract circular halo of soft light, suggestion of gentle enclosure, refined protective geometry (avoid all literal guardian imagery)',
      bg: 'soft cosmic gradient with embracing curved light, serene minimalist backdrop'
    },
    luck: {
      mood: 'a quiet sense of perfect timing and serendipity (NOT literal clovers, NOT cats, NOT dice)',
      symbols: 'a single shooting line of light across the composition, abstract orbital pattern, suggestion of cosmic alignment (avoid all literal luck imagery)',
      bg: 'soft cosmic gradient with subtle motion blur, minimalist celestial backdrop'
    }
  };

  var wx = profile.dominantWx || '土';
  var missingWx = profile.missingWx || [];
  var wxV = wxVisuals[wx] || wxVisuals['土'];
  var themeS = themeStyles[theme] || themeStyles.wealth;

  // 補足缺失五行的顏色
  var compensateColors = missingWx.map(function(w) {
    return wxVisuals[w] ? wxVisuals[w].colors.split(',')[0].trim() : '';
  }).filter(Boolean).join(', ');

  // ─── 風格類別 → 變體索引對應（用於 styleCategory 選擇）───
  var styleCategory = body.styleCategory || 'auto';
  var styleCategoryMap = {
    auto:       null,           // 全部 20 個變體混搭
    buddhist:   [1, 3],         // 佛系：藏傳 + 禪簡
    angelic:    [5],            // 天使系
    immortal:   [7],            // 仙系
    arabian:    [9],            // 阿拉伯系
    fashion:    [0, 11, 14],    // 時尚編輯：高時尚 / baroque / liquid gold
    dreamscape: [6, 12, 15, 17, 18], // 自然夢境：水彩 / 浮島 / 水晶洞 / 海底 / 極光
    oriental:   [2, 13, 19]     // 東方絲綢：東方時尚 / 古捲軸 / Mucha
  };

  // ─── 風格變化（時尚感＋宇宙感為核心；以「佛系／天使系／仙系」這種輕巧語感為主，不要宗教說教味）───
  var styleVariants = [
    // [0] 開場：高時尚宇宙
    'high fashion editorial cosmic dreamscape, Vogue-style composition with deep space background and refined elegance',
    // [1] 佛系 #1 — 主打（東方禪意，輕盈不沉重）
    'modern "Buddha-vibe" aesthetic — soft lotus floating in cosmic mist, abstract golden mandala dissolving into stardust, gentle silhouette suggestive of meditation but never literal, Bodhi leaves drifting like petals, warm gold and cream palette, calm serene contemporary spiritual mood, like a wellness magazine cover',
    // [2] 東方時尚
    'modern Eastern aesthetic fused with cosmic luxury, silk and starlight texture, museum-quality composition',
    // [3] 佛系 #2 — 主打第二（日式禪簡約）
    'Zen lifestyle aesthetic with Japanese minimalist sensibility — single lotus blooming in cosmic void, raked sand garden patterns extending into starfields, abstract enso circle of light, bonsai silhouette under moonlight, ink wash meets nebula, refined emptiness, profound stillness, Muji-meets-galaxy',
    // [4] 神聖幾何曼陀羅
    'sacred geometry mandala centered composition, fractal patterns radiating outward, deeply hypnotic',
    // [5] 天使系 — 西方光感美學（基督/天主共用，輕巧不教條）
    'modern "angelic vibe" aesthetic — luminous dove gliding through soft golden light, abstract feathered wings made of stardust, ethereal halo glow, dreamy Renaissance-painting palette of cream/gold/blush, soft cathedral light effect without literal cross or scripture, like a high-end fragrance ad',
    // [6] 水彩夢境
    'watercolor dreamscape with luminous cosmic highlights, soft ethereal washes meeting starlight',
    // [7] 仙系 — 東方仙氣美學（道教延伸但不放符咒/八卦字）
    'modern "immortal sage vibe" aesthetic — misty mountain peaks rising from cloud sea suggesting Penglai realm, white cranes drifting through nebula, abstract swirling clouds forming yin-yang energy, soft jade and pearl palette, traditional Chinese landscape painting meets cosmic dreamscape, ethereal and weightless',
    // [8] Cyberpunk 古今融合
    'cyberpunk-meets-ancient mystical fusion, neon-on-gold contrast, futuristic temple aesthetic',
    // [9] 阿拉伯系 — 幾何寶石美學（伊斯蘭延伸但去宗教化）
    'modern "Arabian geometric vibe" aesthetic — intricate eight-pointed star pattern with jewel tones, Persian miniature painting style, ornate arabesque tessellations spiraling into cosmic spheres, crescent moon over starry sky, deep sapphire and gold palette, like an opulent perfume bottle wallpaper',
    // [10-19] 其他風格
    'zen minimalist with single powerful focal point, abundant negative space, museum gallery feel',
    'baroque ornamental cosmic luxury, gilded edges, ornate but tasteful celestial composition',
    'stained glass cathedral light effect with cosmic colors, divine light streaming through',
    'ancient scroll painting reimagined in cosmic scale, brush stroke meets nebula',
    'liquid gold flowing abstract energy, hypnotic motion frozen in time',
    'crystal cave interior with magical cosmic light, deep mineral textures with starlight',
    'floating islands in cosmic space, surreal dreamlike geography, ghibli-meets-galaxy',
    'bioluminescent deep ocean mystical scene with cosmic plankton and stardust currents',
    'northern lights over sacred temple, aurora dancing above ancient architecture',
    'art nouveau organic flowing lines with celestial elements, Mucha-inspired with cosmic palette'
  ];

  // 依使用者選的風格類別挑變體
  var styleChoice;
  var allowedIndices = styleCategoryMap[styleCategory];
  if (allowedIndices && allowedIndices.length > 0) {
    styleChoice = styleVariants[allowedIndices[variant % allowedIndices.length]];
  } else {
    styleChoice = styleVariants[variant % styleVariants.length];
  }

  // ─── 收集所有個人命理座標（這是 prompt 的核心，所有 tier 都用）───
  var personalElements = [];
  if (profile.zodiac) personalElements.push('the ' + profile.zodiac + ' Chinese zodiac as a graceful hidden silhouette');
  if (profile.dayMaster && profile.dayMasterWx) personalElements.push('day-master ' + profile.dayMaster + ' (' + profile.dayMasterWx + '-element) personal energy signature');
  if (profile.sunSign) personalElements.push(profile.sunSign + ' solar archetype mood');
  if (profile.moonSign) personalElements.push(profile.moonSign + ' lunar emotional palette');
  if (profile.risingSign) personalElements.push(profile.risingSign + ' rising sign aesthetic flavor');
  if (profile.maya && profile.maya.seal) personalElements.push('Mayan totem ' + profile.maya.seal + ' (' + profile.maya.tone + ') woven subtly into the imagery');
  if (profile.lifePathNum) personalElements.push('life-path-number-' + profile.lifePathNum + ' vibrational pattern');
  if (profile.fuling) {
    var fl = profile.fuling;
    var flParts = [];
    if (fl.H) flParts.push('H' + fl.H);
    if (fl.O) flParts.push('O' + fl.O);
    if (fl.U) flParts.push('U' + fl.U);
    if (fl.R) flParts.push('R' + fl.R);
    if (flParts.length) personalElements.push('FuLing HOUR sacred codes (' + flParts.join('/') + ') as hidden numerical micro-pattern');
  }
  if (profile.cityLabel) personalElements.push('a subtle cultural echo of birthplace ' + profile.cityLabel);

  // ─── 八字五行統計（讓 AI 知道整體能量分佈）───
  var wxStatStr = '';
  if (profile.baziStat) {
    var stats = profile.baziStat;
    wxStatStr = 'Personal Bazi five-element distribution: 木' + (stats['木']||0) + ' 火' + (stats['火']||0) + ' 土' + (stats['土']||0) + ' 金' + (stats['金']||0) + ' 水' + (stats['水']||0) + '. The visual energy must reflect this elemental balance. ';
  }

  // ─── 性別細節 ───
  var genderHint = '';
  if (profile.gender === 'F') genderHint = 'Any human or deity silhouettes should carry subtle feminine grace. ';
  else if (profile.gender === 'M') genderHint = 'Any human or deity silhouettes should carry subtle masculine strength. ';

  // ─── 主題意圖（祈福核心，所有 tier 都明確帶入）───
  var themeIntentMap = {
    wealth:     'attracting prosperity, abundance, financial flow and being-seen-by-fortune',
    love:       'inviting deep love connection, romantic blessing and being-worthy-of-love',
    career:     'unlocking career advancement, attracting noble mentors and ambitious achievement',
    protection: 'invoking guardian blessing, safety, peace and protection from harm',
    luck:       'shifting fortune, breakthrough timing and serendipitous transformation'
  };
  var themeIntent = themeIntentMap[theme] || themeIntentMap.wealth;

  // ─── 根據 tier 決定要塞多少 personal elements 進 prompt（但「個人元素＋祈福意圖」永遠是核心）───
  var personalElementsToUse;
  var symbolDepthHint;
  if (tier === 'premium') {
    personalElementsToUse = personalElements;
    symbolDepthHint = 'Ultra-detailed masterwork composition with 6-8 symbolic elements, fractal patterns, sacred geometry overlays, multi-layered cosmic depth. Lucky numbers (' + (profile.luckyNums || []).join(',') + ') hidden in the design as numerical sacred geometry.';
  } else if (tier === 'advanced') {
    personalElementsToUse = personalElements.slice(0, 5);
    symbolDepthHint = 'Rich detailed composition with 4-6 symbolic elements, intricate patterns, layered cosmic depth. Editorial magazine quality.';
  } else {
    personalElementsToUse = personalElements.slice(0, 3);
    symbolDepthHint = 'Clean and elegant composition with 2-3 key symbolic elements. Minimalist but powerful, refined high-fashion sensibility.';
  }
  var personalElementsStr = personalElementsToUse.length
    ? 'CORE PERSONAL ELEMENTS to integrate (this is what makes the wallpaper TRULY belong to one specific person, must be visually present): ' + personalElementsToUse.join('; ') + '. '
    : '';

  var aspectText = device === 'desktop' ? 'desktop wallpaper (landscape 3:2 ratio, 1536x1024)' : 'phone wallpaper (portrait 2:3 ratio, 1024x1536)';

  // ─── 最終 prompt：強化美學錨點 + 負面排除 + 抽象符號 ───
  var prompt =
    // 開場：定義作品類型 + 美學參考錨點
    'A high-end editorial fine art ' + aspectText + ', styled like a luxury fragrance campaign meets museum gallery installation. ' +
    'Aesthetic references to draw from: Aesop store interior softness, Calvin Klein fragrance editorial, Dior beauty campaign at golden hour, The Row minimalist palette, Acne Studios moodboard, Loewe artistic still life, Hermès silk scarf abstract pattern, contemporary art gallery installation. ' +
    'Mood reference: a single perfect object photographed in soft directional light against a quiet cosmic gradient backdrop. ' +
    // ① 個人核心元素
    personalElementsStr +
    // ② 祈福意圖（抽象化）
    'Intent: a daily visual cognitive anchor for ' + themeIntent + '. ' + themeS.mood + '. ' +
    'Conceptual symbolism (ABSTRACT, never literal): ' + themeS.symbols + '. ' +
    // ③ 五行配色（限定 2-3 主色，禁艷俗）
    'Strict color palette (use ONLY these tones, restrained, 2-3 main colors maximum): ' + wxV.colors + '. ' +
    (compensateColors ? 'Subtle accent: ' + compensateColors + '. ' : '') +
    'Color mood: ' + wxV.mood + '. ' +
    'Atmosphere: ' + wxV.nature + '. ' +
    'Suggested visual element: ' + wxV.elements + '. ' +
    wxStatStr +
    genderHint +
    // ④ 風格包裝
    'Style direction: ' + styleChoice + '. ' +
    'Background: ' + themeS.bg + '. ' +
    // ⑤ 構圖規則（核心設計指令）
    'COMPOSITION RULES: minimalist composition, single clear focal point, generous negative space, restrained palette, refined elegance. ' + symbolDepthHint + ' ' +
    'The image must feel like it could hang in a contemporary art gallery, not a video game cover. ' +
    // ⑥ 強烈負面排除（避免廟會奇幻遊戲美學）
    'STRONGLY AVOID: fantasy game art, video game cover, anime style, cartoon, chibi, chinese opera mask, folk religion temple imagery, literal dragons or coins or treasure chests or phoenixes or lucky cats, gaudy saturated reds, busy cluttered compositions, multiple competing focal points, generic AI fantasy art, painting of a pile of stuff, dnd illustration, deviantart style, kitsch, tacky luxury, bling. ' +
    // ⑦ 技術約束
    'CRITICAL TECHNICAL: no text, no words, no letters, no numbers, no watermarks, no signatures, no logos. Pure visual symbolism only. ' +
    'Quality: editorial photography meets fine art painting. Soft directional lighting. Restrained sophisticated palette. Museum-quality composition. The owner will look at this 80 times a day on their lock screen and feel quietly aligned with their best self.';

  try {
    var resp = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + openaiKey
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: device === 'desktop' ? '1536x1024' : '1024x1536',
        quality: tier === 'premium' ? 'high' : 'medium'
      })
    });

    var data = await resp.json();

    if (data.error) {
      console.error('OpenAI error:', data.error);
      return res.status(500).json({ error: '圖片生成失敗，請稍後再試' });
    }

    var imageUrl = '';
    var imageB64 = '';
    if (data.data && data.data.length > 0) {
      // gpt-image-1 returns base64
      if (data.data[0].b64_json) {
        imageB64 = data.data[0].b64_json;
        imageUrl = 'data:image/png;base64,' + imageB64;
      } else if (data.data[0].url) {
        imageUrl = data.data[0].url;
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: '圖片生成失敗' });
    }

    // ── 存檔：Firestore 記錄（uid + 全站政策）──
    var archiveId = '';
    try {
      var db = getFirestore();
      if (db) {
        var admin = require('firebase-admin');
        var nowTs = admin.firestore.FieldValue.serverTimestamp();
        var historyRecord = {
          uid: uid || 'guest',
          email: userEmail || '',
          name: userName || '',
          unlockCode: unlockCode || '',
          profile: {
            lifePathNum: profile.lifePathNum,
            zodiac: profile.zodiac,
            dominantWx: wx,
            missingWx: missingWx,
            dayMaster: profile.dayMaster || null,
            dayMasterWx: profile.dayMasterWx || null,
            sunSign: profile.sunSign || null,
            moonSign: profile.moonSign || null,
            risingSign: profile.risingSign || null,
            mayaSeal: profile.maya ? profile.maya.seal : null,
            mayaTone: profile.maya ? profile.maya.tone : null,
            mayaKin: profile.maya ? profile.maya.kin : null,
            fuling: profile.fuling || null,
            cityLabel: profile.cityLabel || null,
            hourBlockName: profile.hourBlockName || null,
            gender: profile.gender || null
          },
          theme: theme,
          tier: tier,
          device: device,
          variant: variant,
          index: index,
          total: total,
          emailSent: false,
          createdAt: nowTs
        };
        // 全站集合（管理員監控用）
        var globalRef = await db.collection('wallpaper_generations').add(historyRecord);
        archiveId = globalRef.id;
        // 個人歷史（會員自助查詢用）
        if (uid) {
          await db.collection('users').doc(uid).collection('wallpaper_history').doc(archiveId).set(historyRecord);
        }
      }
    } catch(e) { console.error('Firestore archive error:', e.message); }

    // HTML escape helper
    function esc(s) {
      return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── 寄信：把圖當附件寄到客人信箱（消費糾紛保護）──
    var emailSent = false;
    var emailErrorMsg = '';
    if (userEmail && imageB64 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
      var GMAIL_USER = process.env.GMAIL_USER;
      var GMAIL_APP_PW = process.env.GMAIL_APP_PASSWORD;
      if (GMAIL_USER && GMAIL_APP_PW) {
        try {
          var nodemailer = require('nodemailer');
          var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: GMAIL_USER, pass: GMAIL_APP_PW }
          });
          var themeNamesZh = { wealth:'招財豐盛', love:'愛情桃花', career:'事業貴人', protection:'護佑平安', luck:'幸運轉運' };
          var themeZh = themeNamesZh[theme] || theme;
          var indexLabel = total > 1 ? ('（第 ' + (index + 1) + ' / ' + total + ' 張）') : '';
          var subjectLine = '🌟 您的馥靈蘊福桌布｜' + themeZh + indexLabel;
          var fileName = 'fuling-wallpaper-' + theme + '-' + (index + 1) + '.png';
          var greeting = userName ? (userName + '，您好！') : '您好！';
          var htmlBody = '<!DOCTYPE html><html><head><meta charset="utf-8"></head>'
            + '<body style="margin:0;padding:0;background:#f5f0e8;font-family:serif">'
            + '<div style="max-width:640px;margin:0 auto;background:#fffdf8;border:1px solid #e8d5a8">'
            + '<div style="background:#0a0714;padding:32px 24px;text-align:center">'
            + '<div style="font-size:24px;color:#f0d48a;letter-spacing:4px;font-weight:500">馥靈蘊福桌布</div>'
            + '<div style="font-size:12px;color:#c9985e;margin-top:6px;letter-spacing:2px">FORTUNE BLESSING WALLPAPER</div>'
            + '</div>'
            + '<div style="padding:28px 24px;font-size:14px;color:#444;line-height:2">'
            + '<p>' + esc(greeting) + '</p>'
            + '<p>您的「<b style="color:#c9985e">' + themeZh + '</b>」能量桌布已生成完畢，附件就是您的專屬圖像。</p>'
            + '<p style="background:#faf6ee;border-left:3px solid #c9985e;padding:12px 16px;font-size:13px;color:#666">'
            + '✦ 命理座標：生肖 ' + esc(profile.zodiac || '') + '・生命靈數 ' + esc(String(profile.lifePathNum || '')) + '・主要五行 ' + esc(wx) + '<br>'
            + '✦ 桌布等級：' + esc(tier === 'premium' ? '完整能量套組' : (tier === 'advanced' ? '進階圖騰桌布' : '基礎能量桌布')) + '<br>'
            + '✦ 適用裝置：' + esc(device === 'desktop' ? '電腦（橫式）' : '手機（直式）') + (total > 1 ? '<br>✦ 編號：第 ' + (index + 1) + ' / ' + total + ' 張' : '')
            + '</p>'
            + '<p style="font-size:13px;color:#888">這封信本身就是您的存檔證明 — 即使手機重置或快取清空，您都能從信箱重新下載桌布。請保留此信。</p>'
            + '<p style="font-size:12px;color:#aaa;margin-top:24px">使用方式：下載附件 → 手機長按設為桌布，或電腦另存為桌面背景。</p>'
            + '</div>'
            + '<div style="background:#0a0714;padding:20px 24px;text-align:center">'
            + '<div style="font-size:11px;color:#c9985e;letter-spacing:1px">馥靈之鑰國際有限公司 Hour Light International</div>'
            + '<div style="font-size:11px;color:#888;margin-top:4px">'
            + '<a href="https://hourlightkey.com" style="color:#f0d48a;text-decoration:none">hourlightkey.com</a>'
            + ' ｜ <a href="https://lin.ee/RdQBFAN" style="color:#f0d48a;text-decoration:none">LINE 諮詢</a></div>'
            + '</div>'
            + '</div></body></html>';
          await transporter.sendMail({
            from: '"馥靈之鑰 Hour Light" <' + GMAIL_USER + '>',
            to: userEmail,
            subject: subjectLine,
            html: htmlBody,
            attachments: [{
              filename: fileName,
              content: imageB64,
              encoding: 'base64',
              contentType: 'image/png'
            }]
          });
          emailSent = true;
          // 回寫 Firestore：標記已寄送
          if (archiveId) {
            try {
              var db2 = getFirestore();
              if (db2) {
                var admin2 = require('firebase-admin');
                var sentAt = admin2.firestore.FieldValue.serverTimestamp();
                await db2.collection('wallpaper_generations').doc(archiveId).update({ emailSent: true, sentAt: sentAt });
                if (uid) {
                  await db2.collection('users').doc(uid).collection('wallpaper_history').doc(archiveId).update({ emailSent: true, sentAt: sentAt });
                }
              }
            } catch(_) {}
          }
        } catch(mailErr) {
          emailErrorMsg = mailErr.message || 'mail error';
          console.error('Wallpaper email error:', mailErr);
        }
      } else {
        emailErrorMsg = 'Gmail 寄信尚未設定';
      }
    }

    return res.status(200).json({
      success: true,
      imageUrl: imageUrl,
      theme: theme,
      tier: tier,
      archived: !!archiveId,
      emailSent: emailSent,
      emailTo: emailSent ? userEmail : '',
      emailError: emailErrorMsg || undefined
    });

  } catch(e) {
    console.error('Wallpaper generation error:', e);
    return res.status(500).json({ error: '生成服務暫時不可用，請稍後再試' });
  }
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
      case 'wallpaper':
        return await handleWallpaper(req, res, apiKey);
      default:
        return res.status(400).json({
          error: '未指定服務類型，請使用 ?type=akashic|yuan-chen|past-life|name|wallpaper',
          availableTypes: ['akashic', 'yuan-chen', 'past-life', 'name', 'wallpaper']
        });
    }
  } catch (err) {
    console.error('reading-services error (' + type + '):', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
