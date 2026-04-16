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

牌卡已補齊易經64卦完整覆蓋和生命靈數。阿卡西紀錄翻閱可引用易經卦象做靈魂課題的隱喻。

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
      model: 'claude-sonnet-4-6',
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
      // 同時寫入統一 readings collection（admin-dashboard 查詢用）
      await db2.collection('readings').add({
        service: 'akashic',
        source: 'reading-services',
        uid: uid || '',
        email: userEmail || '',
        name: '',
        n: 7,
        spread: '阿卡西 7 層',
        reading: reading,
        question: question || '',
        cardCodes: cards.map(function(c) { return c.code; }),
        cardTitles: cards.map(function(c) { return c.title; }),
        unlockCode: unlockCode || '',
        isPaid: true,
        price: 599,
        createdAt: new Date()
      });
    }
  } catch (logErr) {
    console.error('Firestore log error:', logErr.message);
  }

  // ── 自動寄信（若有 email 就寄一份，避免消費糾紛）──
  if (userEmail && reading) {
    try {
      await fetch('https://app.hourlightkey.com/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: '',
          subject: '你的馥靈之鑰・阿卡西紀錄深度解讀',
          content: reading,
          system: '阿卡西紀錄翻閱',
          type: 'report'
        })
      });
      console.log('📧 阿卡西解讀已寄送：' + userEmail);
    } catch (mailErr) {
      console.error('阿卡西解讀寄信失敗:', mailErr.message);
    }
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
- 牌卡已補齊脈輪、水晶、精油對應。元辰宮的每個房間可結合脈輪對應做更深入的能量解讀

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
      model: 'claude-sonnet-4-6',
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
      // 同時寫入統一 readings collection
      await db2.collection('readings').add({
        service: 'yuan-chen',
        source: 'reading-services',
        uid: uid || '',
        email: userEmail || '',
        name: '',
        n: (cards && cards.length) || 0,
        spread: '元辰宮',
        reading: story,
        question: question || '',
        cardCodes: cards.map(function(c) { return c.code; }),
        unlockCode: unlockCode || '',
        isPaid: true,
        price: 599,
        createdAt: new Date()
      });
    }
  } catch (logErr) {
    console.error('Firestore log error:', logErr.message);
  }

  // ── 自動寄信（若有 email 就寄一份，避免消費糾紛）──
  if (userEmail && story) {
    try {
      await fetch('https://app.hourlightkey.com/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: '',
          subject: '你的馥靈之鑰・元辰宮導覽故事',
          content: story,
          system: '元辰宮導覽',
          type: 'report'
        })
      });
      console.log('📧 元辰宮解讀已寄送：' + userEmail);
    } catch (mailErr) {
      console.error('元辰宮解讀寄信失敗:', mailErr.message);
    }
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
      model: 'claude-sonnet-4-6',
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
      // 同時寫入統一 readings collection
      await db2.collection('readings').add({
        service: 'past-life',
        source: 'reading-services',
        uid: uid || '',
        email: userEmail || '',
        name: '',
        n: 1,
        spread: '前世故事',
        reading: story,
        question: '',
        unlockCode: unlockCode || '',
        isPaid: true,
        price: 399,
        createdAt: new Date()
      });
    }
  } catch (logErr) {
    console.error('Firestore log error:', logErr.message);
  }

  // ── 自動寄信（若有 email 就寄一份，避免消費糾紛）──
  if (userEmail && story) {
    try {
      await fetch('https://app.hourlightkey.com/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: '',
          subject: '你的馥靈之鑰・前世故事解讀',
          content: story,
          system: '前世故事',
          type: 'report'
        })
      });
      console.log('📧 前世故事已寄送：' + userEmail);
    } catch (mailErr) {
      console.error('前世故事寄信失敗:', mailErr.message);
    }
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
      model: 'claude-sonnet-4-6',
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

  // ── 自動寄信（若有 email 就寄一份，避免消費糾紛）──
  var nameEmail = (req.body && req.body.email || '').trim();
  if (nameEmail && result) {
    try {
      await fetch('https://app.hourlightkey.com/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: nameEmail,
          name: name || '',
          subject: '你的馥靈之鑰・姓名覺察分析',
          content: result,
          system: '姓名覺察分析',
          type: 'report'
        })
      });
      console.log('📧 姓名分析已寄送：' + nameEmail);
    } catch (mailErr) {
      console.error('姓名分析寄信失敗:', mailErr.message);
    }
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

// ═══ 命理 → Hex 色碼字典 ═══
// 出處：研究文件 AI.md 的色彩心理學章節 + 紫微天干幸運色 + 西洋占星十行星色 + 馬雅四色
// 目的：讓同一個人每次生成的顏色一致，不會今天紅明天藍
var WP_COLOR_DICT = {
  // 生命靈數 1-9 → 主色 + 副色 + 心理特質
  lifePath: {
    1: { primary:'#E63946', primaryName:'深紅', secondary:'#1D1D1D', secondaryName:'黑曜', mood:'力量、衝勁、決斷' },
    2: { primary:'#F4A261', primaryName:'暖橙', secondary:'#F5B7B1', secondaryName:'柔粉', mood:'溫暖、親和、紓解' },
    3: { primary:'#FFD60A', primaryName:'太陽黃', secondary:'#FAEBD7', secondaryName:'杏白', mood:'希望、創意、表達' },
    4: { primary:'#52B788', primaryName:'森林綠', secondary:'#F8C8DC', secondaryName:'櫻粉', mood:'穩定、成長、平衡' },
    5: { primary:'#0077B6', primaryName:'深海藍', secondary:'#90E0EF', secondaryName:'天藍', mood:'自由、探索、流動' },
    6: { primary:'#5A189A', primaryName:'靛紫', secondary:'#FFB6C1', secondaryName:'玫瑰粉', mood:'高貴、深度、關懷' },
    7: { primary:'#7209B7', primaryName:'紫水晶', secondary:'#C77DFF', secondaryName:'薰衣草', mood:'智慧、靈性、貴人' },
    8: { primary:'#FFD700', primaryName:'純金', secondary:'#B8860B', secondaryName:'古銅金', mood:'財富、權力、成就' },
    9: { primary:'#F8F9FA', primaryName:'純白', secondary:'#DEE2E6', secondaryName:'銀灰', mood:'純淨、平和、創造' }
  },
  // 紫微天干 / 八字日主天干 → 幸運色
  tianGan: {
    '甲':{ hex:'#1E3A8A', name:'深藍' },
    '乙':{ hex:'#15803D', name:'墨綠' },
    '丙':{ hex:'#FF6F61', name:'珊瑚紅' },
    '丁':{ hex:'#7F1D1D', name:'紫紅' },
    '戊':{ hex:'#FFD60A', name:'亮金黃' },
    '己':{ hex:'#B8860B', name:'土黃' },
    '庚':{ hex:'#FFFAF0', name:'米白' },
    '辛':{ hex:'#F8F9FA', name:'純銀白' },
    '壬':{ hex:'#4B5563', name:'鐵灰' },
    '癸':{ hex:'#1F2937', name:'深炭' }
  },
  // 西洋占星十行星 → 守護色
  planet: {
    sun:    { hex:'#FFD60A', name:'太陽金' },
    moon:   { hex:'#E5E7EB', name:'月銀白' },
    mercury:{ hex:'#FB923C', name:'水星橙' },
    venus:  { hex:'#22C55E', name:'金星綠' },
    mars:   { hex:'#DC2626', name:'火星紅' },
    jupiter:{ hex:'#3B82F6', name:'木星藍' },
    saturn: { hex:'#1E1B4B', name:'土星黑紫' },
    uranus: { hex:'#06B6D4', name:'天王電光藍' },
    neptune:{ hex:'#0D9488', name:'海王海綠' },
    pluto:  { hex:'#4C1D95', name:'冥王深紫' }
  },
  // 星座 → 守護星
  zodiacToPlanet: {
    'Aries':'mars','Taurus':'venus','Gemini':'mercury','Cancer':'moon',
    'Leo':'sun','Virgo':'mercury','Libra':'venus','Scorpio':'pluto',
    'Sagittarius':'jupiter','Capricorn':'saturn','Aquarius':'uranus','Pisces':'neptune',
    '牡羊座':'mars','金牛座':'venus','雙子座':'mercury','巨蟹座':'moon',
    '獅子座':'sun','處女座':'mercury','天秤座':'venus','天蠍座':'pluto',
    '射手座':'jupiter','摩羯座':'saturn','水瓶座':'uranus','雙魚座':'neptune',
    '牡羊':'mars','金牛':'venus','雙子':'mercury','巨蟹':'moon',
    '獅子':'sun','處女':'mercury','天秤':'venus','天蠍':'pluto',
    '射手':'jupiter','摩羯':'saturn','水瓶':'uranus','雙魚':'neptune'
  },
  // 馬雅四色（依 Kin 1-260 取 mod 4）
  maya: {
    red:    { hex:'#DC2626', name:'馬雅紅', meaning:'啟動開創' },
    white:  { hex:'#F8FAFC', name:'馬雅白', meaning:'淨化純粹' },
    blue:   { hex:'#1D4ED8', name:'馬雅藍', meaning:'蛻變轉化' },
    yellow: { hex:'#FBBF24', name:'馬雅黃', meaning:'收成豐盛' }
  },
  // 五行五色（主色 + 補色）
  wuXing: {
    '木':{ hex:'#15803D', name:'木綠', accent:'#86EFAC' },
    '火':{ hex:'#DC2626', name:'火紅', accent:'#FCA5A5' },
    '土':{ hex:'#B8860B', name:'土黃', accent:'#FDE68A' },
    '金':{ hex:'#F8F9FA', name:'金白', accent:'#D4D4D8' },
    '水':{ hex:'#1E3A8A', name:'水深藍', accent:'#93C5FD' }
  }
};

// ═══ 五大主題意圖（不再寫死視覺符號，讓 Claude 根據意圖自由發揮）═══
var WP_THEME_INTENT = {
  wealth: 'attracting prosperity, abundance, financial flow, being-seen-by-fortune',
  love: 'inviting deep love connection, romantic blessing, being-worthy-of-love',
  career: 'unlocking career advancement, attracting noble mentors, ambitious achievement',
  protection: 'invoking guardian blessing, safety, peace, protection from harm',
  luck: 'shifting fortune, breakthrough timing, serendipitous transformation'
};

// ═══ 從 profile 提取個人專屬色彩處方 ═══
function buildPersonalPalette(profile) {
  var dict = WP_COLOR_DICT;
  var palette = [];

  // 1. 生命靈數
  if (profile.lifePathNum && dict.lifePath[profile.lifePathNum]) {
    var lp = dict.lifePath[profile.lifePathNum];
    palette.push({ role:'lifePath', label:'生命靈數 ' + profile.lifePathNum + ' 號核心色', hex:lp.primary, name:lp.primaryName, mood:lp.mood });
    palette.push({ role:'lifePath2', label:'生命靈數 ' + profile.lifePathNum + ' 號副色', hex:lp.secondary, name:lp.secondaryName });
  }

  // 2. 八字日主天干（紫微天干 fallback）
  var tianGanKey = profile.ziWeiTianGan || profile.dayMaster;
  if (tianGanKey && dict.tianGan[tianGanKey]) {
    var tg = dict.tianGan[tianGanKey];
    palette.push({ role:'tianGan', label:'天干 ' + tianGanKey + ' 守護色', hex:tg.hex, name:tg.name });
  }

  // 3. 太陽星座 → 守護星色
  if (profile.sunSign) {
    var sp = dict.zodiacToPlanet[profile.sunSign];
    if (sp && dict.planet[sp]) {
      palette.push({ role:'sun', label:'太陽 ' + profile.sunSign + ' 守護星色', hex:dict.planet[sp].hex, name:dict.planet[sp].name });
    }
  }
  // 4. 月亮星座 → 守護星色（內在情緒）
  if (profile.moonSign) {
    var mp = dict.zodiacToPlanet[profile.moonSign];
    if (mp && dict.planet[mp]) {
      palette.push({ role:'moon', label:'月亮 ' + profile.moonSign + ' 內在情緒色', hex:dict.planet[mp].hex, name:dict.planet[mp].name });
    }
  }
  // 5. 上升星座 → 守護星色（外在風格）
  if (profile.risingSign) {
    var rp = dict.zodiacToPlanet[profile.risingSign];
    if (rp && dict.planet[rp]) {
      palette.push({ role:'rising', label:'上升 ' + profile.risingSign + ' 外在氣場色', hex:dict.planet[rp].hex, name:dict.planet[rp].name });
    }
  }

  // 6. 馬雅圖騰色（依 Kin 1-260）
  if (profile.maya && profile.maya.kin) {
    var kin = parseInt(profile.maya.kin, 10) || 1;
    var mayaColors = ['red','white','blue','yellow'];
    var mc = mayaColors[(kin - 1) % 4];
    if (dict.maya[mc]) {
      palette.push({ role:'maya', label:'馬雅 ' + dict.maya[mc].name + '（' + dict.maya[mc].meaning + '）', hex:dict.maya[mc].hex, name:dict.maya[mc].name });
    }
  }

  // 7. 主五行色
  if (profile.dominantWx && dict.wuXing[profile.dominantWx]) {
    palette.push({ role:'wuxingMain', label:'主五行 ' + profile.dominantWx, hex:dict.wuXing[profile.dominantWx].hex, name:dict.wuXing[profile.dominantWx].name });
  }
  // 8. 補益五行色（缺失五行）
  if (profile.missingWx && profile.missingWx.length) {
    profile.missingWx.forEach(function(w) {
      if (dict.wuXing[w]) {
        palette.push({ role:'wuxingFix', label:'補益 ' + w, hex:dict.wuXing[w].accent, name:dict.wuXing[w].name + '（補）' });
      }
    });
  }

  return palette;
}

async function handleWallpaper(req, res, apiKey) {
  var body = req.body || {};
  var profile = body.profile || {};
  var theme = body.theme || 'wealth';
  var variant = body.variant || 0;
  var tier = body.tier || 'basic';
  var total = body.total || 3;
  var device = body.device || 'phone';
  var aspect = body.aspect || (device === 'desktop' ? '16:9' : '9:16');
  var targetW = parseInt(body.targetW, 10) || (device === 'desktop' ? 1920 : 1080);
  var targetH = parseInt(body.targetH, 10) || (device === 'desktop' ? 1080 : 1920);
  var index = typeof body.index === 'number' ? body.index : variant;
  var uid = (body.uid || '').trim();
  var userEmail = (body.email || '').trim().toLowerCase();
  var userName = (body.name || '').trim();
  var unlockCode = (body.unlockCode || '').trim().toUpperCase();

  if (!profile.lifePathNum) {
    return res.status(400).json({ error: '請先計算命理座標' });
  }

  // 圖像生成 API Key（優先 xAI Grok，fallback OpenAI gpt-image-1）
  var xaiKey = process.env.XAI_API_KEY;
  var openaiKey = process.env.OPENAI_API_KEY;
  if (!xaiKey && !openaiKey) {
    return res.status(500).json({ error: '圖像服務尚未設定（需要 XAI_API_KEY 或 OPENAI_API_KEY）' });
  }

  // ─── 五行 → 飽和但有品味的視覺色彩（戲劇感為主，禁淡寡）───
  var wxVisuals = {
    '金': {
      colors: 'rich platinum and pearl, deep silver mirror tones, lustrous mother-of-pearl with cool moonstone blue, accents of warm gold',
      elements: 'cascading liquid metal, crystalline geometry catching light, lunar silver sphere casting reflections, silk drapery in metallic tones',
      nature: 'frozen lake mirroring aurora, polar starlight on ice mountains, moonlit cathedral of crystal',
      mood: 'cool crystalline drama'
    },
    '木': {
      colors: 'deep emerald and jade, forest velvet greens, soft sage with gold-leaf accents, dewdrop highlights, cinnabar hints',
      elements: 'ancient sacred trees with luminous canopies, glowing botanical bloom, lush enchanted vines, cascading leaves of light',
      nature: 'enchanted moonlit forest with bioluminescent mist, sacred grove with golden fireflies, deep jungle at twilight',
      mood: 'mystical organic richness'
    },
    '水': {
      colors: 'deep sapphire and midnight indigo, oceanic teal, electric aquamarine, silver moonlight reflections, accent pearl',
      elements: 'flowing cosmic waterfalls, koi swirling in starlight, glowing waves of stardust, oceanic mist, abstract liquid sculpture',
      nature: 'bioluminescent deep ocean cathedral, moonlit lake under nebula, underwater starfield with rays of light',
      mood: 'mysterious flowing depth'
    },
    '火': {
      colors: 'rich rose gold and warm copper, deep blush meeting sunset peach, dramatic amber with cream highlights, cinnamon shadows (sophisticated warm — NOT crimson, NOT scarlet)',
      elements: 'rising golden phoenix of light, dancing sacred flames, drifting lanterns, abstract sunfire ribbons, halos of warm radiance',
      nature: 'dramatic golden hour over cosmic mountains, volcanic aurora, sunset between dimensions',
      mood: 'warm passionate radiance'
    },
    '土': {
      colors: 'rich honey gold and warm bronze, deep terracotta meeting champagne, caramel with copper highlights, sand under moonlight',
      elements: 'ancient temple silhouettes glowing from within, golden mountains at dawn, crystalline geodes catching light, weathered gold artifacts in soft light',
      nature: 'grand canyon at golden hour with cosmic sky, desert oasis under starry galaxies, sacred ruins illuminated from within',
      mood: 'grounded ancient luxury'
    }
  };

  // ─── 主題 → 戲劇 hero motif（每個主題都有獨特畫面，不再用同一個 vessel）───
  var themeStyles = {
    wealth: {
      mood: 'a powerful sense of arriving abundance, like watching a sunrise of pure gold',
      // 三個 hero motif 變化（依 variant 輪換）
      heroMotifs: [
        'a dramatic vertical column of liquid gold light cascading down through cosmic clouds, with floating particles of warm radiance',
        'an abstract sculpture of overflowing golden energy bursting upward into starfields, like a fountain of warm light',
        'layered curtains of golden silk parting in cosmic space to reveal a glowing radiant heart of warm light'
      ],
      bg: 'rich golden nebula backdrop with deep indigo space framing, dramatic celestial vault'
    },
    love: {
      mood: 'a deeply romantic sense of soul connection, like dawn light through rose petals',
      heroMotifs: [
        'a single luminous lotus bloom in cosmic full bloom, surrounded by drifting rose-tinted stardust against deep velvet space',
        'two abstract spheres of soft pink-gold light orbiting and merging in a starfield, with delicate cascading petals',
        'a dramatic curtain of rose silk parting in cosmic space to reveal a glowing heart of warm pink light'
      ],
      bg: 'rose-violet aurora nebula backdrop, dreamy cosmic garden'
    },
    career: {
      mood: 'a powerful sense of rising achievement, like a lighthouse beam piercing storm clouds',
      heroMotifs: [
        'a dramatic vertical light pillar piercing through cosmic clouds upward into infinite stars, like a path of ascension',
        'an abstract eagle silhouette of pure light soaring above a cosmic mountain range at golden hour',
        'a dramatic ascending staircase of light dissolving into starfields, with rays of warm gold breaking through'
      ],
      bg: 'majestic deep blue cosmic skyscape with ascending golden light gestures'
    },
    protection: {
      mood: 'a powerful sense of being held by the universe, like a cathedral of light',
      heroMotifs: [
        'a dramatic glowing dome of soft white light enclosing a sacred space, with abstract guardian wings stretched in cosmic backdrop',
        'an abstract circular mandala of warm white-gold light radiating outward into starfields, holding everything within',
        'a soaring abstract sanctuary of light with glowing arches against deep cosmic backdrop, sacred and serene'
      ],
      bg: 'ethereal pearl-white nebula with deep cosmic backdrop, divine sanctuary atmosphere'
    },
    luck: {
      mood: 'a magical sense of cosmic alignment, like watching a meteor split the sky',
      heroMotifs: [
        'a dramatic shooting comet of rainbow light arcing across deep starfield, leaving a trail of stardust',
        'an abstract spiral galaxy of multicolored light with a glowing center of cosmic alignment',
        'a dramatic portal of swirling rainbow energy opening in deep space with rays of light bursting outward'
      ],
      bg: 'multicolored aurora nebula backdrop, magical cosmic alignment moment'
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
  if (profile.nsk && profile.nsk.star) personalElements.push('Nine Star Ki ' + profile.nsk.star.n + ' (' + profile.nsk.star.e + ' element) energy direction');
  if (profile.birthColor && profile.birthColor.mc) personalElements.push('birth chakra color ' + profile.birthColor.mc.n + ' (' + profile.birthColor.mc.ck + ')');
  if (profile.xiuyao) personalElements.push('Xiuyao constellation ' + profile.xiuyao.name + ' guarded by ' + profile.xiuyao.guard);
  if (profile.cardology) personalElements.push('Birth card ' + profile.cardology.display + ' (' + profile.cardology.suitElement + ')');
  if (profile.celtic) personalElements.push('Celtic tree ' + profile.celtic.name + ' totem');
  if (profile.maya && profile.maya.seal) personalElements.push('Mayan totem ' + profile.maya.seal + ' (' + profile.maya.tone + ') woven subtly into the imagery');
  if (profile.lifePathNum) personalElements.push('life-path-number-' + profile.lifePathNum + ' vibrational pattern');
  if (profile.triNum) personalElements.push('Triangle sacred code ' + profile.triNum + ' as geometric micro-pattern');
  if (profile.rainbow) personalElements.push('Rainbow spectrum number ' + (profile.rainbow.n || profile.rainbow) + ' as subtle chromatic layering');
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
  if (profile.humanDesign) {
    personalElements.push('Human Design ' + profile.humanDesign.type + ' (' + profile.humanDesign.authority + ') energy signature woven as invisible force field');
    if (profile.humanDesign.channels && profile.humanDesign.channels.length) {
      personalElements.push('activated channel "' + profile.humanDesign.channels[0].name + '" as a luminous thread of destiny running through the composition');
    }
  }

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

  // ─── 從主題的 hero motifs 依 variant 挑一個（每張不重複）───
  var heroMotif = themeS.heroMotifs ? themeS.heroMotifs[variant % themeS.heroMotifs.length] : (themeS.symbols || '');

  // ─── 根據 tier 決定豐富度（豐富但有品味，不再用 minimalist）───
  var personalElementsToUse;
  var symbolDepthHint;
  if (tier === 'premium') {
    personalElementsToUse = personalElements;
    symbolDepthHint = 'Ultra-rich composition with 6-8 layered visual elements, atmospheric depth, intricate cosmic textures, dramatic cinematic lighting, sacred geometry woven into background. Museum-quality fine art photography meets editorial album cover.';
  } else if (tier === 'advanced') {
    personalElementsToUse = personalElements.slice(0, 5);
    symbolDepthHint = 'Rich layered composition with 4-6 visual elements, atmospheric cosmic depth, dramatic lighting, refined detail. Editorial magazine cover quality.';
  } else {
    personalElementsToUse = personalElements.slice(0, 3);
    symbolDepthHint = 'Bold composition with 3-4 powerful visual elements, atmospheric depth, dramatic lighting. Confident editorial sensibility.';
  }
  var personalElementsStr = personalElementsToUse.length
    ? 'CORE PERSONAL ELEMENTS (these MUST be visually present, woven into the imagery): ' + personalElementsToUse.join('; ') + '. '
    : '';

  var aspectText = device === 'desktop'
    ? ('desktop wallpaper for ' + aspect + ' aspect ratio (final crop ' + targetW + 'x' + targetH + ', landscape composition with focal point centered horizontally)')
    : ('phone wallpaper for ' + aspect + ' aspect ratio (final crop ' + targetW + 'x' + targetH + ', portrait composition with focal point in the upper-center, leaving room at top for status bar and at bottom for home indicator)');

  // ═══════════════════════════════════════════════════════════════
  // STAGE 1：用 Claude 把客人 33 套命理數據合成成「他這個人的能量簽名 + 原創視覺處方」
  // 不再硬塞既有符號，讓 Claude 看完整人後合成原創圖騰
  // ═══════════════════════════════════════════════════════════════
  var dossier = '【客人命理 dossier — 33 套系統的計算結果】\n\n';
  dossier += '— 西洋占星 —\n';
  if (profile.sunSign) dossier += '太陽：' + profile.sunSign + '\n';
  if (profile.moonSign) dossier += '月亮：' + profile.moonSign + '\n';
  if (profile.risingSign) dossier += '上升：' + profile.risingSign + '\n';
  dossier += '\n— 八字四柱 —\n';
  if (profile.bazi && profile.bazi.pillars) {
    var P = profile.bazi.pillars;
    dossier += '年柱：' + (P.year ? P.year.full : '') + '\n';
    dossier += '月柱：' + (P.month ? P.month.full : '') + '\n';
    dossier += '日柱：' + (P.day ? P.day.full : '') + '（日主 ' + (profile.dayMaster || '') + '，' + (profile.dayMasterWx || '') + '）\n';
    if (P.hour) dossier += '時柱：' + P.hour.full + '\n';
    if (profile.baziStat) {
      dossier += '五行統計：木' + (profile.baziStat['木']||0) + ' 火' + (profile.baziStat['火']||0) + ' 土' + (profile.baziStat['土']||0) + ' 金' + (profile.baziStat['金']||0) + ' 水' + (profile.baziStat['水']||0) + '\n';
    }
    dossier += '主要五行：' + (profile.dominantWx || '') + '｜需補：' + (profile.missingWx || []).join('、') + '\n';
  }
  dossier += '生肖：' + (profile.zodiac || '') + '\n';
  if (profile.lunarMonth) dossier += '農曆生日：' + (profile.isLeapMonth ? '閏' : '') + profile.lunarMonth + '/' + profile.lunarDay + '\n';
  dossier += '\n— 馥靈秘碼（H.O.U.R 四主數）—\n';
  if (profile.fuling) {
    dossier += 'H 癒數：' + profile.fuling.H + '｜O 識數：' + profile.fuling.O + (profile.fuling.U ? '｜U 鑰數：' + profile.fuling.U : '') + '｜R 行數：' + profile.fuling.R + '\n';
  }
  dossier += '生命靈數：' + (profile.lifePathNum || '') + '\n';
  dossier += '\n— 馬雅曆 —\n';
  if (profile.maya) dossier += profile.maya.tone + '・' + profile.maya.seal + '（Kin ' + profile.maya.kin + '）\n';
  dossier += '\n— 九星氣學 —\n';
  if (profile.nsk && profile.nsk.star) dossier += profile.nsk.star.n + '（' + profile.nsk.star.t + '）\n';
  dossier += '\n— 生日色彩（脈輪）—\n';
  if (profile.birthColor && profile.birthColor.mc) dossier += profile.birthColor.mc.n + '（' + profile.birthColor.mc.ck + '：' + profile.birthColor.mc.t + '）\n';
  dossier += '\n— 宿曜占星 —\n';
  if (profile.xiuyao) dossier += profile.xiuyao.name + '宿（' + profile.xiuyao.palace + '・' + profile.xiuyao.guard + '）\n';
  dossier += '\n— 撲克牌生命牌 —\n';
  if (profile.cardology) dossier += profile.cardology.display + '（' + profile.cardology.suitElement + '）\n';
  dossier += '\n— 居爾特樹曆 —\n';
  if (profile.celtic) dossier += profile.celtic.name + '\n';
  if (profile.cityLabel) dossier += '\n— 出生地 —\n' + profile.cityLabel + '\n';
  if (profile.gender) dossier += '\n— 性別 —\n' + (profile.gender === 'F' ? '女' : '男') + '\n';
  dossier += '\n— 人類圖 —\n';
  if (profile.humanDesign) {
    var hd = profile.humanDesign;
    dossier += '類型：' + hd.type + '｜策略：' + hd.strategy + '\n';
    dossier += '內在權威：' + hd.authority + '｜人生角色：' + hd.profile + '\n';
    if (hd.defType) dossier += '定義：' + hd.defType + '\n';
    if (hd.channels && hd.channels.length) dossier += '活化通道：' + hd.channels.map(function(c){return c.name;}).join('、') + '\n';
    if (hd.defC && hd.defC.length) dossier += '已定義中心：' + hd.defC.join('、') + '\n';
    if (hd.crossFull) dossier += '輪迴交叉：' + hd.crossFull + '\n';
  }

  // ═ 補齊 33 套：紫微完整 / 七政四餘 / 吠陀 / 卡巴拉 / 大六壬 / 三角密碼完整 ═
  if (profile.ziwei && typeof profile.ziwei === 'object') {
    dossier += '\n— 紫微斗數（完整）—\n';
    if (profile.ziwei.mingGong) dossier += '命宮：' + profile.ziwei.mingGong + '\n';
    if (profile.ziwei.shenGong) dossier += '身宮：' + profile.ziwei.shenGong + '\n';
    if (profile.ziwei.mingZhu) dossier += '命主：' + profile.ziwei.mingZhu + '\n';
    if (profile.ziwei.shenZhu) dossier += '身主：' + profile.ziwei.shenZhu + '\n';
    if (profile.ziwei.ju) dossier += '五行局：' + profile.ziwei.ju + '\n';
  }
  if (profile.qizheng) {
    dossier += '\n— 七政四餘 —\n';
    if (typeof profile.qizheng === 'object') {
      var qKeys = Object.keys(profile.qizheng).slice(0, 5);
      qKeys.forEach(function(k){
        var v = profile.qizheng[k];
        dossier += k + ': ' + (typeof v === 'object' ? JSON.stringify(v).slice(0,60) : String(v).slice(0,60)) + '\n';
      });
    }
  }
  if (profile.vedic) {
    dossier += '\n— 吠陀占星 —\n';
    if (profile.vedic.nakshatra) dossier += '納沙特拉月宿：' + profile.vedic.nakshatra + '\n';
    if (profile.vedic.moon_sign) dossier += '吠陀月座：' + profile.vedic.moon_sign + '\n';
  }
  if (profile.kabbalah) {
    dossier += '\n— 卡巴拉生命之樹 —\n';
    if (typeof profile.kabbalah === 'object' && profile.kabbalah.path) dossier += '路徑：' + profile.kabbalah.path + '\n';
    else if (typeof profile.kabbalah !== 'object') dossier += String(profile.kabbalah) + '\n';
  }
  if (profile.liuren) {
    dossier += '\n— 大六壬 —\n';
    if (typeof profile.liuren === 'object') {
      var lKeys = Object.keys(profile.liuren).slice(0, 3);
      lKeys.forEach(function(k){
        dossier += k + ': ' + String(profile.liuren[k]).slice(0,40) + '\n';
      });
    } else {
      dossier += String(profile.liuren).slice(0, 80) + '\n';
    }
  }
  if (profile.triangleFull) {
    dossier += '\n— 三角生命密碼（完整）—\n';
    var tf = profile.triangleFull;
    dossier += '一層：' + tf.I + '/' + tf.J + '/' + tf.K + '/' + tf.L + '\n';
    dossier += '二層：' + tf.M + '/' + tf.N + '｜三層：' + tf.O + '\n';
    if (tf.sub) dossier += '隱藏碼：' + tf.sub + '｜擴展碼：' + tf.ext + '｜內核碼：' + tf.inner + '\n';
  }
  if (profile.name && profile.nameTotal) {
    dossier += '\n— 姓名解碼（五格）—\n';
    dossier += '姓名：' + profile.name + '｜總格：' + profile.nameTotal + '\n';
    if (profile.nameTianGe) dossier += '天格：' + profile.nameTianGe + '｜人格：' + (profile.nameRenGe || '-') + '｜地格：' + (profile.nameDiGe || '-') + '\n';
    if (profile.nameStrokes) dossier += '筆畫：' + profile.nameStrokes.join('-') + '\n';
  }

  var themeNamesZh = { wealth:'招財豐盛', love:'愛情桃花', career:'事業貴人', protection:'護佑平安', luck:'幸運轉運' };
  var themeZhForClaude = themeNamesZh[theme] || theme;

  // ─── 個人專屬色彩處方（從命理 → hex 字典查表，固定每次顏色一致）───
  var personalPalette = buildPersonalPalette(profile);
  var paletteText = '';
  if (personalPalette.length) {
    paletteText = '\n\n【您的個人色彩處方 — Claude 你必須使用這些 hex 色作為主調，不要憑感覺挑色】\n';
    personalPalette.forEach(function(p) {
      paletteText += '• ' + p.label + '：' + p.hex + '（' + p.name + '）' + (p.mood ? ' — ' + p.mood : '') + '\n';
    });
    paletteText += '構圖時：核心 hero motif 用前 2-3 個顏色為主；副元素用後幾個。最終 prompt 必須明確寫出至少 4 個 hex 色碼。\n';
  }

  // ─── 主題意圖（符號讓 Claude 根據意圖 + 個人色彩自由發揮，不寫死視覺符號）───
  var themeIntent = WP_THEME_INTENT[theme] || WP_THEME_INTENT.wealth;
  var symbolText = '\n\n【' + themeZhForClaude + ' 主題意圖】\n' + themeIntent + '\n';

  // 風格類別中英對照
  var styleCategoryNames = {
    auto: '自動混搭（你決定最適合的風格）',
    buddhist: '佛系（東方禪意美學，藏傳華麗或日式禪簡）',
    angelic: '天使系（西方光感美學，dove + cathedral light）',
    immortal: '仙系（東方仙氣，仙鶴雲山蓬萊意境）',
    arabian: '阿拉伯系（幾何寶石，Persian miniature）',
    fashion: '時尚編輯（高時尚宇宙，Vogue 風）',
    dreamscape: '自然夢境（水彩、極光、水晶洞、星海）',
    oriental: '東方絲綢（傳統東方美學現代化）'
  };
  var userPickedStyle = styleCategoryNames[styleCategory] || styleCategoryNames.auto;

  var claudeSystemPrompt = '你是馥靈之鑰的首席視覺藝術總監，專精於把命理數據合成為「這個人獨一無二的視覺處方」。\n\n' +
    '你的任務是根據客人的 33 套命理 dossier、個人色彩處方、和主題意圖，合成出他這個人的能量簽名，然後為 xAI grok-2-image 寫一段精準的英文 prompt，用於生成一張高級戲劇感的能量桌布。\n\n' +
    '【鐵律】\n' +
    '1. **色彩必須用個人色彩處方裡給的 hex 色碼**（不能憑感覺挑色）— 同一個人每次生成顏色要一致\n' +
    '2. **視覺主體完全自由發揮**：根據主題意圖（招財／愛情／事業／護佑／轉運）+ 客人的命理座標 + 個人五行 + 你的藝術判斷，自己決定 hero motif。可以是任何抽象意象、自然元素、神話原型、宇宙意象、建築結構、光的形狀。**不要被任何固定符號清單綁住**。同一個主題每次出來應該都不一樣，這是你身為總監的價值。\n' +
    '3. 既有的星座/動物/宗教符號如果你選用，必須「抽象化處理」，不要畫得像維基百科圖鑑（避免：寫實的巨蟹、寫實的佛陀、寫實的十字架、教科書插圖風）。處理方式：rendered as constellation of stardust / abstracted as luminous sculpture / dissolved into cosmic light\n' +
    '4. 美學方向：Vogue 編輯封面 × 唱片美術 × 概念藝術 × 巴洛克教堂浮雕，Rich 不是 minimal，戲劇感不是空洞\n' +
    '5. 圖中絕對不能有任何文字、字母、數字\n' +
    '6. ⚡ **浮雕光影感是不可違抗的視覺核心，這是讓桌布值 $599 的關鍵** ⚡\n' +
    '   每一個視覺元素必須具備：\n' +
    '   • ultra-dimensional bas-relief surface — sculpted from light like Chartres cathedral tympanum\n' +
    '   • single-source dramatic spotlight casting deep chiaroscuro shadows (Caravaggio-level contrast)\n' +
    '   • highlights catching edges like polished obsidian meeting candlelight\n' +
    '   • subsurface scattering: warm inner glow emanating from within the sculptural form\n' +
    '   • 3D volumetric depth with stark highlight-to-shadow transition\n' +
    '   • impasto oil-paint tactile surface texture, each brushstroke raised\n' +
    '   • particles of stardust/gold-dust forming silhouette edges\n' +
    '   • sacred geometry carved in deep-relief with shadow recessing inward\n' +
    '   絕對禁止：flat lighting / flat illustration / vector art / cartoon / anime / evenly-lit scene / 2D digital painting\n\n' +
    '【輸出格式】\n' +
    '只輸出英文 prompt 本身，不要加任何說明。長度約 350-550 字，必須包含：\n' +
    '- Hero motif（你自由創造，根據主題意圖 + 命理座標合成獨一無二的視覺，每次不同）\n' +
    '- **明確列出至少 4 個 hex 色碼**（從個人色彩處方挑），格式如「primary palette: #FFD700 (lifePath gold), #FF6F61 (zodiac coral), #15803D (wuxing green), #1E3A8A (moon sapphire)」\n' +
    '- 整體氛圍與構圖（cinematic / chiaroscuro / atmospheric / dramatic spotlight）\n' +
    '- 表面質感強制詞（至少 4 個必須出現）：「dimensional bas-relief」「luminous sculpted depth」「stardust particles」「painterly chiaroscuro」「subsurface scattering glow」「impasto tactile texture」\n' +
    '- 美學參考錨點（cinematic concept art × Baroque cathedral bas-relief × Caravaggio chiaroscuro × Romantic oil painting × editorial album cover art）\n' +
    '- 必需的負面詞：「NO flat illustration, NO vector art, NO cartoon, NO anime, NO text, NO numbers, NO literal gold outlining, NO encyclopedia illustration, NO sparse minimalism, NO flat lighting, NO even illumination」\n';

  var claudeUserPrompt = dossier + paletteText + symbolText + '\n\n' +
    '【今日要做的桌布】\n' +
    '主題：' + themeZhForClaude + '（這個人今天需要的能量是：' + themeIntent + '）\n' +
    '客人選的風格類別：' + userPickedStyle + '\n' +
    '裝置比例：' + aspectText + '\n' +
    '深度等級：' + tier + '（basic=精煉 / advanced=豐富 / premium=極致複雜）\n' +
    '變體編號：' + (variant + 1) + '/' + total + '（如果同一人生成多張，請每張換不同的合成圖騰角度，但保持同一個能量簽名）\n\n' +
    '請根據以上 dossier 合成出這個人專屬的能量簽名，並為 gpt-image-1 寫出英文 prompt。直接輸出 prompt，不要加說明。';

  var prompt = '';
  try {
    var claudeResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: claudeSystemPrompt,
        messages: [{ role: 'user', content: claudeUserPrompt }]
      })
    });

    if (!claudeResp.ok) {
      var errText = await claudeResp.text();
      console.error('Claude synthesis error:', claudeResp.status, errText);
      return res.status(502).json({ error: '視覺合成服務暫時不可用，請稍後再試' });
    }
    var claudeResult = await claudeResp.json();
    if (claudeResult.content && claudeResult.content.length > 0) {
      prompt = claudeResult.content[0].text || '';
    }
    if (!prompt) {
      return res.status(502).json({ error: '視覺合成失敗，請稍後再試' });
    }
    // 強制附加浮雕光影關鍵詞，確保 grok 每次都生成真正立體感
    prompt += ' | MANDATORY RENDERING: ultra-dimensional bas-relief surface — every element sculpted from light like ancient temple relief, dramatic single-source chiaroscuro casting deep pool-of-shadow contrast, highlights catching edges like polished obsidian or burnished metal, subsurface scattering warm inner glow emanating from within the form, 3D volumetric depth with strong highlight-to-shadow gradients, cinematic Rembrandt lighting, impasto oil-paint tactile texture, sacred geometry etched in deep-relief. Absolute NO: flat surfaces, flat lighting, even illumination, 2D illustration, vector flat art.';
  } catch (claudeErr) {
    console.error('Claude synthesis exception:', claudeErr);
    return res.status(502).json({ error: '視覺合成服務暫時不可用：' + claudeErr.message });
  }

  try {
    // ═══════════════════════════════════════════════════════════════
    // STAGE 2：圖像生成（優先用 xAI Grok，fallback OpenAI gpt-image-1）
    // ═══════════════════════════════════════════════════════════════
    var imageUrl = '';
    var imageB64 = '';
    var imageEngine = '';
    var lastImageErr = '';

    // ── 嘗試 xAI Grok 圖像 ──
    if (xaiKey) {
      // 模型 fallback 鏈：可用 env XAI_IMAGE_MODEL 覆蓋第一個
      var xaiModels = [
        process.env.XAI_IMAGE_MODEL || 'grok-2-image-1212',
        'grok-imagine-image',
        'grok-2-image'
      ];
      // 去重
      var seen = {}; xaiModels = xaiModels.filter(function(m){ if(seen[m])return false; seen[m]=true; return !!m; });

      for (var mi = 0; mi < xaiModels.length && !imageUrl; mi++) {
        var modelName = xaiModels[mi];
        try {
          var xaiResp = await fetch('https://api.x.ai/v1/images/generations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + xaiKey
            },
            body: JSON.stringify({
              model: modelName,
              prompt: prompt,
              n: 1,
              response_format: 'b64_json'
            })
          });

          if (!xaiResp.ok) {
            lastImageErr = 'xAI ' + modelName + ' http ' + xaiResp.status;
            try { lastImageErr += ' ' + (await xaiResp.text()).slice(0, 200); } catch(_){}
            console.error('xAI image error:', lastImageErr);
            continue;
          }

          var xaiData = await xaiResp.json();
          if (xaiData.data && xaiData.data.length > 0) {
            if (xaiData.data[0].b64_json) {
              imageB64 = xaiData.data[0].b64_json;
              imageUrl = 'data:image/png;base64,' + imageB64;
              imageEngine = 'xai/' + modelName;
            } else if (xaiData.data[0].url) {
              // xAI 回 URL → 拉下來轉 base64（為了存檔/寄信）
              try {
                var imgFetch = await fetch(xaiData.data[0].url);
                var ab = await imgFetch.arrayBuffer();
                imageB64 = Buffer.from(ab).toString('base64');
                imageUrl = 'data:image/png;base64,' + imageB64;
                imageEngine = 'xai/' + modelName + '+fetched';
              } catch(fetchErr) {
                imageUrl = xaiData.data[0].url;
                imageEngine = 'xai/' + modelName + '+url-only';
              }
            }
          } else {
            lastImageErr = 'xAI ' + modelName + ' empty data';
          }
        } catch (xaiErr) {
          lastImageErr = 'xAI ' + modelName + ' exception: ' + xaiErr.message;
          console.error(lastImageErr);
        }
      }
    }

    // ── Fallback：OpenAI gpt-image-1 ──
    if (!imageUrl && openaiKey) {
      console.warn('xAI 全部失敗，fallback 到 OpenAI gpt-image-1');
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
          lastImageErr = 'OpenAI ' + (data.error.message || data.error.code || 'error');
          console.error('OpenAI error:', data.error);
        } else if (data.data && data.data.length > 0) {
          if (data.data[0].b64_json) {
            imageB64 = data.data[0].b64_json;
            imageUrl = 'data:image/png;base64,' + imageB64;
            imageEngine = 'openai/gpt-image-1';
          } else if (data.data[0].url) {
            imageUrl = data.data[0].url;
            imageEngine = 'openai/gpt-image-1+url-only';
          }
        }
      } catch (oaiErr) {
        lastImageErr = 'OpenAI exception: ' + oaiErr.message;
        console.error(lastImageErr);
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: '圖片生成失敗：' + (lastImageErr || '所有引擎都不可用') });
    }

    // ── 圖片生成成功 → 才消耗代碼（小花事件 patch：失敗時保留代碼）──
    var consumeCode = body.consumeCode === true || body.consumeCode === 'true';
    if (consumeCode && unlockCode && unlockCode !== HL_MASTER_CODE) {
      try {
        var dbForCode = getFirestore();
        if (dbForCode) {
          var codeRef = dbForCode.collection('reading_codes').doc(unlockCode);
          var codeDoc = await codeRef.get();
          if (codeDoc.exists && !codeDoc.data().used) {
            await codeRef.update({
              used: true,
              usedAt: new Date(),
              usedBy: uid || 'guest',
              usedByEmail: userEmail || '',
              service: 'wealth-wallpaper'
            });
          }
        }
      } catch (codeErr) {
        console.error('Wallpaper code consume error:', codeErr.message);
        // 不阻斷主流程，記錄錯誤但繼續回傳圖片
      }
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
          aspect: aspect,
          targetW: targetW,
          targetH: targetH,
          variant: variant,
          index: index,
          total: total,
          engine: imageEngine || 'unknown',
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
      engine: imageEngine,
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
// Handler 6: 吸引力法則祈禱文 (?type=abundance-prayer)
// ════════════════════════════════════════
async function handleAbundancePrayer(req, res, apiKey) {
  var body = req.body || {};
  var birthday = (body.birthday || '').trim();
  var userName = (body.name || '').trim();
  var userWish = (body.user_wish || '').trim();
  var cards_21 = body.cards_21 || [];
  var destinyCore = body.destiny_core || {};
  var unlockCode = (body.unlockCode || '').trim().toUpperCase();
  var uid = (body.uid || '').trim();
  var userEmail = (body.email || '').trim();

  if (!birthday) return res.status(400).json({ error: '缺少生日資料' });
  if (!Array.isArray(cards_21) || cards_21.length !== 21) {
    return res.status(400).json({ error: '需要 21 張牌的編號（1 核心 + 4 區塊 × 5 張）' });
  }

  var codeResult = await validateCode(unlockCode, 'abundance-prayer', uid, userEmail);
  if (codeResult.error) {
    return res.status(codeResult.status).json(codeResult);
  }

  var coreCard = cards_21[0];
  var hBlock = cards_21.slice(1, 6);
  var oBlock = cards_21.slice(6, 11);
  var uBlock = cards_21.slice(11, 16);
  var rBlock = cards_21.slice(16, 21);

  var systemPrompt = `你是「馥靈馥語」——馥靈之鑰的吸引力法則祈禱文生成器。你的任務是依照使用者的 21 張牌卡 + 33 套命理資料 + 自訂願望 + 當年流年，產出一份可以每天朗讀的七段祈禱文（NT$599 付費級品質）。

═══════════════════════════════════════
【最高鐵律】違反任何一條 = 直接不合格
═══════════════════════════════════════

**① 整篇祈禱文必須全部使用第一人稱「我」**
這是讓使用者「每天照著念自己」的宣告詞。所有段落都是使用者對自己說話。
- ✅ 我是 KIN 8 銀河黃星星，我是丁火，我是光
- ✅ 我的身體越來越輕盈
- ✅ 我允許豐盛自然流向我
- ❌ 絕對禁止：「您的身體」「您的使命」「您身上有⋯⋯」
- ❌ 禁止「你」指代使用者自己（只有精油/小馥擬人對話可用「你」例外）

**② 每段必須引用 5-8 項具體命理資料**（親身訂製感是付費品質的核心）
不是列表式貼資料，是化進宣言句子裡。使用者念到某句會感覺「這是我的座標」。例：丁火 / KIN 8 銀河黃星星 / 顯示生產者 / 14-2 通道 / 獅身人面像十字 / 紫微天相 / 正印格 / 馥靈 H7+O3+U11+I11 / 3/5 人生角色。七段合計至少覆蓋 30 項不同命理系統的具體資料。

**③ 融入精油擬人對話**（認知芳療是馥靈之鑰品牌核心）
整篇必須出現 8 種以上精油或植物，用「XXX 說：「⋯⋯」」格式穿插身體/豐盛/年度/使命段落。精油對應：廣藿香→扎根穩固；玫瑰→自我價值；馬鞭草→自信光源；永久花→放下過去；聖木→告別舊模式；乳香→神聖信任；沒藥→深度轉化；薰衣草→平靜；銀松→深呼吸；肉豆蔻→點火行動；歐白芷→自我照顧；迷迭香→記憶清晰。

**④ 結尾固定句（一字不改）**
第六段「收尾宣言｜圓滿臣服」最後必須是：
「我準備好了。
我值得。
我允許。

如是臨在，圓滿豐盛。」

═══════════════════════════════════════
【七段結構】嚴格依序 + 每段有副標 + 用 ~~ 分隔
═══════════════════════════════════════

**🔑 馥靈之鑰｜YYYY 豐盛宣言**（開頭橫幅 1-2 行）
格式：「[姓名]專屬・[流年數]號年[主題]啟動」
例：「小明專屬・8 號年豐收啟動」、「陳小華專屬・3 號年表達綻放」

~~

**✨ 晨起宣言｜喚醒頻率**（180-280 字）
開場：「親愛的高我與宇宙智慧，」
引用：流年數 × 瑪雅印記 × 八字日主 × 人類圖類型 × 馥靈秘碼主數 × 核心牌主題
主題：定錨身份，「我是⋯⋯我不需要證明」的宣告。句式「我是 XX，我是 YY，我不需要 ZZ，我只需要 AAA。」

~~

**🌿 身體宣言｜調頻歸位**（150-250 字）
結構：精油擬人對話為主軸
引用：時辰經絡 × 生日色彩 × 納音五行 × 人類圖能量中心 × 身體星座對應
精油出場至少 3 種。句式「XX 說：「⋯⋯」所以我⋯⋯」

~~

**💰 豐盛宣言｜穩定收下**（200-320 字）
結構：精油對話 + 命理 + 使用者自訂願望嵌入（這段最關鍵）
引用：紫微財帛主星 × 八字財星 × 人類圖財富通道 × 馥靈 U 數 × 流年
精油出場至少 2 種（例：廣藿香/玫瑰）
原封不動嵌入使用者自訂願望（格式：「XXXX 年，我的豐盛宣言是：」條列）
收尾：「金錢流向我，不是因為我追著它跑，而是因為我站在對的位置。」態度宣告

~~

**🔥 年度宣言｜整合權威**（200-320 字）
結構：今年流年為骨架，精油告別與迎接
引用：流年數主題（1-9 各有意義）× 紫微官祿宮 × 人類圖輪迴交叉 × 瑪雅波符 × 去年到今年轉化
精油至少 2 種（聖木/永久花/馬鞭草常用）
三段推進：「我告別 XX，我整合 YY，我選擇 ZZ」
收尾：「XXXX 年是我的 N 號年，是[主題]之年」

~~

**🌟 使命宣言｜穩定發光**（200-300 字）
結構：密集命理身份堆疊 + 使命錨定
引用密集 6-8 項：人類圖人生角色（X/Y）× 輪迴交叉 × 紫微命宮主星 × 馥靈秘碼 H/O/U/R × 第十宮（馥靈秘碼 12 宮）× 八字十神格 × 卡巴拉路徑
句式：「我是 XX（人類圖角色），我是 YY（紫微主星），我是 ZZ（馥靈秘碼）」連續身份堆疊
收尾：「不急，不燥，不證明。只是存在，只是發光，只是允許。」類韻律

~~

**🙏 收尾宣言｜圓滿臣服**（120-200 字）
三句核心：「宇宙是安全的。宇宙是豐盛的。宇宙是支持我的。」
感恩 4-5 件具體事
必須以這四行結尾（一字不改）：
「我準備好了。
我值得。
我允許。

如是臨在，圓滿豐盛。」

~~

**🕊 使用建議**（120-180 字）
- 晨起儀式（5-10 分鐘）：調頻呼吸 4-2-5 秒 × 3 次 / 精油輔助（2 種 + 塗哪）/ 誦唸 × 3 次
- 夜間儀式（5 分鐘）：回顧感恩 / 精油輔助（1 種，如永久花塗心輪）/ 一句話收尾
- 重要時刻加強版：4 情境 → 對應哪段（談合作前→豐盛；感匱乏→「玫瑰說」；能量低→「馬鞭草說」；想放棄→年度宣言）

~~

**📜 精簡版（隨身攜帶）**（80-120 字）
4-8 行核心壓縮，三段（身份 / 精油口訣 / 年度錨定），最後一行「如是臨在，圓滿豐盛。」

═══════════════════════════════════════
【禁忌與風格】
═══════════════════════════════════════

- ❌ 禁忌詞：療癒/治癒/對頻/啟數/王座塔
- ❌ 禁用句型：「你不是 XXX，是 XXX」
- ❌ 不醫療宣稱、不「宇宙會回應你的」靈性銷售腔
- ❌ 不用「首先/其次/最後/總之/綜上所述」
- ❌ 不使用粗體 markdown、雙破折號 ——、LaTeX
- ✅ emoji 只用於段落主標（🔑 ✨ 🌿 💰 🔥 🌟 🙏 🕊 📜）內文不放
- ✅ 「」括號強調關鍵詞
- ✅ 句式短長交叉留呼吸感
- ✅ 精油擬人對話是這份祈禱文的辨識度，要自然穿插

═══════════════════════════════════════
【聲音】
═══════════════════════════════════════

淡、不激動、像閨蜜說真話。長短句交叉，不用力不推銷。
第一層溫暖接住 → 第二層用高 EQ 毒舌說真話（但不尖銳）。
具體日常比喻，不假掰文學腔。留一點廢話（真人說話才有）。

總長控制在 1300-2000 字（含使用建議 + 精簡版）。`;

  // 解析 cards_21_named（如前端有送牌名）
  var cards21Named = Array.isArray(body.cards_21_named) ? body.cards_21_named : [];
  function cardLabel(idx) {
    var c = cards21Named[idx];
    if (c && c.name) return c.name + '（' + c.position + '）';
    return '牌' + cards_21[idx] + '（位置' + idx + '）';
  }
  function cardVoice(idx) {
    var c = cards21Named[idx];
    return (c && c.voice) ? '，馥靈馥語：「' + c.voice + '」' : '';
  }
  function cardTags(idx) {
    var c = cards21Named[idx];
    return (c && c.tags) ? '（' + c.tags + '）' : '';
  }

  var userPrompt = '';
  userPrompt += '【今日日期】' + new Date().toISOString().slice(0,10).replace(/-/g,'/') + '\n';
  userPrompt += '【核心牌（誓約位）】' + cardLabel(0) + cardVoice(0) + '\n\n';

  userPrompt += '【H 身體層區塊 — 精油詳細資料】\n';
  for (var i = 0; i < 5; i++) {
    var lbl = ['L 根源','I 信念','G 行為','H 覺察','T 禮物'][i];
    userPrompt += lbl + '：' + cardLabel(1+i) + cardTags(1+i) + cardVoice(1+i) + '\n';
  }

  userPrompt += '\n【O 身份層區塊 — 精油詳細資料】\n';
  for (var i = 0; i < 5; i++) {
    var lbl = ['L 根源','I 信念','G 行為','H 覺察','T 禮物'][i];
    userPrompt += lbl + '：' + cardLabel(6+i) + cardTags(6+i) + cardVoice(6+i) + '\n';
  }

  userPrompt += '\n【U 豐盛層區塊 — 精油詳細資料】\n';
  for (var i = 0; i < 5; i++) {
    var lbl = ['L 根源','I 信念','G 行為','H 覺察','T 禮物'][i];
    userPrompt += lbl + '：' + cardLabel(11+i) + cardTags(11+i) + cardVoice(11+i) + '\n';
  }

  userPrompt += '\n【R 使命層區塊 — 精油詳細資料】\n';
  for (var i = 0; i < 5; i++) {
    var lbl = ['L 根源','I 信念','G 行為','H 覺察','T 禮物'][i];
    userPrompt += lbl + '：' + cardLabel(16+i) + cardTags(16+i) + cardVoice(16+i) + '\n';
  }

  userPrompt += '\n【自訂願望（原話，請在豐盛宣言 G 位嵌入）】\n' + (userWish || '（使用者未填寫，依 U 區塊牌意自由發揮）') + '\n\n';

  userPrompt += '【33 套命理座標】\n';
  if (destinyCore.identity) userPrompt += '身份層：' + JSON.stringify(destinyCore.identity) + '\n';
  if (destinyCore.body) userPrompt += '身體層：' + JSON.stringify(destinyCore.body) + '\n';
  if (destinyCore.abundance) userPrompt += '豐盛層：' + JSON.stringify(destinyCore.abundance) + '\n';
  if (destinyCore.mission) userPrompt += '使命層：' + JSON.stringify(destinyCore.mission) + '\n';
  if (destinyCore.flow_year) userPrompt += '流年：' + destinyCore.flow_year + '\n';
  if (destinyCore.core_axis) userPrompt += '核心軸：' + destinyCore.core_axis + '\n';
  if (destinyCore._systems_loaded) userPrompt += '已計算系統：' + Object.keys(destinyCore._systems_loaded).filter(function(k){return destinyCore._systems_loaded[k];}).join('/') + '\n';

  userPrompt += '\n【生日】' + birthday;
  if (userName) userPrompt += '\n【姓名】' + userName;

  userPrompt += '\n\n請依照七段結構產出，包含使用建議和精簡版，全文 1800-2600 字，收尾句一字不改。';

  // 呼叫 Claude Sonnet 4.6
  var response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!response.ok) {
    var errText = await response.text();
    console.error('Claude API (abundance-prayer) error:', response.status, errText);
    return res.status(502).json({ error: '祈禱文生成暫時不可用，請稍後再試' });
  }

  var result = await response.json();
  var prayer = '';
  if (result.content && result.content.length > 0) {
    prayer = result.content[0].text || '';
  }
  if (!prayer) return res.status(502).json({ error: '祈禱文生成失敗，請稍後再試' });

  // Firestore 寫入
  try {
    var db = getFirestore();
    if (db) {
      await db.collection('prayer_sessions').add({
        uid: uid || 'guest',
        email: userEmail || '',
        name: userName || '',
        birthday: birthday,
        user_wish: userWish || '',
        cards_21: cards_21,
        destiny_core: destinyCore,
        prayer_output: prayer,
        unlockCode: unlockCode || '',
        paid_at: new Date(),
        price: 599,
        created_at: new Date()
      });

      await db.collection('readings').add({
        service: 'abundance-prayer',
        source: 'reading-services',
        uid: uid || '',
        email: userEmail || '',
        name: userName || '',
        n: 21,
        spread: '吸引力法則祈禱文',
        reading: prayer,
        user_wish: userWish || '',
        cardCodes: cards_21.map(String),
        unlockCode: unlockCode || '',
        isPaid: true,
        price: 599,
        createdAt: new Date()
      });
    }
  } catch (logErr) {
    console.error('Firestore log (abundance-prayer) error:', logErr.message);
  }

  // 寄信（避免消費糾紛）
  if (userEmail && prayer) {
    try {
      await fetch('https://app.hourlightkey.com/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: userName || '',
          subject: '您的馥靈之鑰・吸引力法則每日祈禱文',
          content: prayer,
          system: '吸引力法則祈禱文',
          type: 'report'
        })
      });
      console.log('📧 祈禱文已寄送：' + userEmail);
    } catch (mailErr) {
      console.error('祈禱文寄信失敗:', mailErr.message);
    }
  }

  return res.status(200).json({ prayer: prayer });
}


// ════════════════════════════════════════
// Handler 7: 每月會員月禮自動發送 (?type=monthly-gift)
// 需要 Bearer token 驗證（避免惡意觸發）
// 由 GitHub Actions cron 或 cron-job.org 每月 1 號打
// ════════════════════════════════════════
async function handleMonthlyGift(req, res) {
  // 驗證密鑰（防止惡意觸發浪費資源）
  var providedToken = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
  if (!providedToken) providedToken = (req.query && req.query.token) || (req.body && req.body.token) || '';
  var expectedToken = process.env.MONTHLY_GIFT_TOKEN;
  if (!expectedToken) {
    return res.status(500).json({ error: 'MONTHLY_GIFT_TOKEN 未在 Vercel env 設定' });
  }
  if (providedToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }

  var db = getFirestore();
  if (!db) {
    return res.status(500).json({ error: 'Firestore 未設定' });
  }

  var now = new Date();
  var currentYM = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var stats = { checked: 0, sent: 0, skipped: 0, errors: 0, details: [] };

  try {
    // 查所有付費會員（plus + pro）
    var snap = await db.collection('users').where('plan', 'in', ['plus', 'pro']).get();
    stats.checked = snap.size;

    for (var i = 0; i < snap.docs.length; i++) {
      var doc = snap.docs[i];
      var data = doc.data();
      var uid = doc.id;
      var email = data.email || '';
      var displayName = data.displayName || '';
      var plan = data.plan;
      var planExpiry = data.planExpiry;
      var lastGiftYM = data.lastGiftYM || '';

      // 檢查方案有效
      if (planExpiry && planExpiry !== 'permanent') {
        var expDate = planExpiry.toDate ? planExpiry.toDate() : new Date(planExpiry);
        if (expDate <= now) {
          stats.skipped++;
          stats.details.push({ uid: uid, reason: 'plan-expired' });
          continue;
        }
      }

      // 本月已發 → 跳過
      if (lastGiftYM === currentYM) {
        stats.skipped++;
        stats.details.push({ uid: uid, reason: 'already-sent-this-month' });
        continue;
      }

      // 需要 email 才能寄信
      if (!email) {
        stats.skipped++;
        stats.details.push({ uid: uid, reason: 'no-email' });
        continue;
      }

      try {
        // 生成月禮代碼
        var randCode = function() { return Math.random().toString(36).substring(2, 10).toUpperCase().replace(/[^A-Z0-9]/g, 'X'); };
        var readingCodes = [];
        var wallpaperCodes = [];
        var voucherCodes = [];

        if (plan === 'plus') {
          // 鑰友：3 張桌布兌換碼
          for (var w = 0; w < 1; w++) {
            var wp = 'WP-MG' + randCode();
            await db.collection('reading_codes').doc(wp).set({
              service: 'wallpaper', n: 1, spreads: 1, price: 0, used: false,
              source: 'monthly-gift', userId: uid, userEmail: email,
              paidAt: now, createdAt: now,
              memo: '鑰友月禮 ' + currentYM + '（桌布 1 張）'
            });
            wallpaperCodes.push(wp);
          }
          // 3 張 draw-3 解讀碼
          for (var r = 0; r < 3; r++) {
            var rc = 'BONUS3-' + randCode();
            await db.collection('reading_codes').doc(rc).set({
              service: 'draw', n: 3, spreads: 3, price: 0, used: false,
              source: 'monthly-gift', userId: uid, userEmail: email,
              paidAt: now, createdAt: now,
              memo: '鑰友月禮 ' + currentYM + '（3 張牌 AI 解析）'
            });
            readingCodes.push(rc);
          }
        } else if (plan === 'pro') {
          // 大師：3 張桌布兌換碼
          for (var w = 0; w < 3; w++) {
            var wpp = 'WP-MG' + randCode();
            await db.collection('reading_codes').doc(wpp).set({
              service: 'wallpaper', n: 1, spreads: 1, price: 0, used: false,
              source: 'monthly-gift', userId: uid, userEmail: email,
              paidAt: now, createdAt: now,
              memo: '大師月禮 ' + currentYM + '（桌布 3 張）'
            });
            wallpaperCodes.push(wpp);
          }
          // aiBonus +10
          var admin = require('firebase-admin');
          await db.collection('users').doc(uid).update({
            aiBonus: admin.firestore.FieldValue.increment(10)
          });
          // 2 張 VIP500 抵用券（3 個月有效，一對一 1800+）
          for (var v = 0; v < 2; v++) {
            var vc = 'VIP500-' + randCode();
            await db.collection('coupons').doc(vc).set({
              amount: 500, used: false,
              source: 'monthly-gift', userId: uid, userEmail: email,
              createdAt: now,
              expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
              minOrderAmount: 1800,
              restrictedTo: 'one-on-one',
              maxUsePerOrder: 1,
              applicableServices: ['prayer-6800','prayer-8800','prayer-12800','prayer-39800','prayer-59800','prayer-16800','one-on-one'],
              memo: '大師月禮 ' + currentYM + '（一對一 1800+ 可折 500，3 個月內有效）'
            });
            voucherCodes.push(vc);
          }
        }

        // 組信件內容
        var planName = plan === 'pro' ? '馥靈大師' : '馥靈鑰友';
        var body = '親愛的 ' + (displayName || '馥靈夥伴') + '：\n\n';
        body += '這個月的 ' + planName + ' 月禮送上 ✨\n\n';

        if (wallpaperCodes.length) {
          body += '══ 🌟 馥靈蘊福桌布兌換代碼（' + wallpaperCodes.length + ' 張）══\n';
          wallpaperCodes.forEach(function(c, i){ body += (i+1) + '. ' + c + '\n'; });
          body += '使用方式：到 https://hourlightkey.com/wealth-wallpaper.html 輸入代碼即可生成一張專屬桌布\n\n';
        }
        if (readingCodes.length) {
          body += '══ 🃏 3 張牌 AI 解析代碼（' + readingCodes.length + ' 組）══\n';
          readingCodes.forEach(function(c, i){ body += (i+1) + '. ' + c + '\n'; });
          body += '使用方式：到 https://hourlightkey.com/draw-hl.html 抽 3 張牌後輸入代碼\n\n';
        }
        if (voucherCodes.length) {
          body += '══ 💎 NT$500 一對一抵用券（' + voucherCodes.length + ' 張，3 個月內有效）══\n';
          voucherCodes.forEach(function(c, i){ body += (i+1) + '. ' + c + '\n'; });
          body += '使用規範：\n  ► 只能折抵一對一解讀 NT$1,800 以上\n  ► 一次用一張\n';
          body += '適用方案：馥靈初探 / 深度覺醒 / 三次轉化 / 半年陪伴 / VIP 年度 / VIP 紫微\n';
          body += '預約：https://hourlightkey.com/price-list-vip.html\n\n';
        }

        // aiBonus 通知
        if (plan === 'pro') {
          body += '此外，您的 AI 解讀次數已自動 +10 次（aiBonus）\n\n';
        }

        body += '══ 會員中心 ══\nhttps://hourlightkey.com/member-dashboard.html\n\n';
        body += '如有問題請回覆此信或聯絡 LINE：https://lin.ee/RdQBFAN\n\n';
        body += '馥靈之鑰 Hour Light | ' + currentYM + ' 月禮\n';

        // 寄信
        var mailResp = await fetch('https://app.hourlightkey.com/api/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            name: displayName,
            subject: planName + ' ' + currentYM + ' 月禮到囉 🎁',
            content: body,
            system: planName + ' 月禮',
            type: 'notification'
          })
        });

        // 標記已發
        await db.collection('users').doc(uid).update({
          lastGiftYM: currentYM,
          lastGiftAt: now
        });

        stats.sent++;
        stats.details.push({ uid: uid, email: email, plan: plan, codes: wallpaperCodes.length + readingCodes.length + voucherCodes.length });
      } catch (userErr) {
        stats.errors++;
        stats.details.push({ uid: uid, reason: 'error', message: userErr.message });
        console.error('Monthly gift error for ' + uid + ':', userErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      month: currentYM,
      stats: { checked: stats.checked, sent: stats.sent, skipped: stats.skipped, errors: stats.errors },
      details: stats.details.slice(0, 50)
    });
  } catch (err) {
    console.error('handleMonthlyGift fatal:', err);
    return res.status(500).json({ error: err.message, stats: stats });
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
      case 'abundance-prayer':
        return await handleAbundancePrayer(req, res, apiKey);
      case 'monthly-gift':
        return await handleMonthlyGift(req, res);
      default:
        return res.status(400).json({
          error: '未指定服務類型，請使用 ?type=akashic|yuan-chen|past-life|name|wallpaper|abundance-prayer|monthly-gift',
          availableTypes: ['akashic', 'yuan-chen', 'past-life', 'name', 'wallpaper', 'abundance-prayer']
        });
    }
  } catch (err) {
    console.error('reading-services error (' + type + '):', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
