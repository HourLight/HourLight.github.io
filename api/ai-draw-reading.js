// ═══════════════════════════════════════
// 馥靈之鑰 · 馥靈智慧牌 AI 即時解讀 API
// Vercel Serverless Function
// v1.0 · 2026-03-23
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// 功能：接收抽牌結果 → 組合 prompt → 呼叫 Claude → 回傳解讀文字
//
// 端點：POST /api/ai-draw-reading
// Body: { n, cards: [{code, position, title, description}], question, unlockCode? }
//
// 解鎖碼驗證：
//   n=1 → 免費，不需要碼
//   n=3-7 → 需要解鎖碼（Firestore: unlock_codes/{code}）
//   n≥9 → 不走此 API（覺察師服務）
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
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(SA_JSON)),
      });
    }
    adminDb = admin.firestore();
    return adminDb;
  } catch (err) {
    console.error('Firebase Admin init error:', err.message);
    return null;
  }
}

// ── 鑰盤框架（依張數）──
const SPREAD_FRAMEWORKS = {
  1: {
    title: '城門銘牌｜今日一語',
    positions: ['✨ 今日一語'],
    framework: `這是「城門銘牌」，130張牌中被選中的那一張。
解讀要求：
壹、這張牌在對「此刻的你」說什麼？不是通用牌義，是對當下這個人、這個時間點的訊息。
貳、牌中的精油（或覺察指引）對應到日常生活中的哪個具體場景？
叁、一個今天就能做的小行動（具體到「打開冰箱拿出XXX」「晚上洗澡時XXX」的程度）。
肆、結尾用一句帶有香氣意象的文字收尾。`
  },
  3: {
    title: '城堡三塔｜浮出水面 × 水面之下 × 那把鑰匙',
    positions: ['①浮出水面｜你以為的自己', '②水面之下｜沒說出口的真相', '③那把鑰匙｜轉機藏在哪裡'],
    framework: `三張牌構成「城堡三塔」：你看見的（表層）→ 你沒看見的（深層）→ 鑰匙在哪裡（行動）。
解讀要求：
壹、第一張和第二張之間的落差 = 你內外不一致的地方。這個落差越大，代表什麼？
貳、第三張是解方。它給出的不是安慰，是具體的方向和動作。
叁、三張牌串成一句話的故事（用案主的日常語言）。
肆、如果案主有提問，三張牌合起來怎麼回答這個問題？要給明確方向。
伍、一個今天就能做的行動建議。`
  },
  5: {
    title: 'L.I.G.H.T. 五力巡房',
    positions: [
      '① L 愛之殿｜自我疼惜狀態',
      '② I 直覺閣｜內在智慧在說什麼',
      '③ G 磐石廳｜安全感根基',
      '④ H 和諧苑｜關係平衡狀態',
      '⑤ T 蛻變室｜正在經歷的突破'
    ],
    framework: `五張牌 = L.I.G.H.T. 品牌方法論的最小完整單元。
五個房間逐一巡視，找到「最重」的那個房間 = 近期最大趨勢變動點（導航位）。
解讀要求：
壹、五個房間逐一解讀（每個房間150-200字）。
貳、找出「最重」的房間（能量最強烈、最需要注意的）→ 標記為「導航位」。
叁、五個房間之間的關係：哪兩個在互相拉扯？哪兩個在互相支持？
肆、如果案主有提問，用五力巡房的結果明確回答。
伍、結合 H.O.U.R. 給出行動建議：靜下來做什麼 → 覺察什麼 → 做什麼小事 → 持續方向。`
  },
  7: {
    title: 'H.O.U.R. 完整啟鑰',
    positions: [
      '① H 身心校準｜身心狀態卡在哪',
      '② O 智慧辨識｜核心課題是什麼',
      '③ U 潛能解鎖｜手上有什麼鑰匙可用',
      '④ R 行動進化｜該怎麼動',
      '⑤ 阻力位｜前方最大阻礙',
      '⑥ 助力位｜沒注意到的支持力量',
      '⑦ 趨勢匯流｜照這個方向走30天後的走向 ★導航位'
    ],
    framework: `七張牌 = H.O.U.R. 完整啟鑰，馥靈之鑰的主力鑰盤。
先走完 H.O.U.R. 四階段 → 看阻力/助力對照 → 看趨勢匯流（導航位）。
解讀要求：
壹、H.O.U.R. 四階段逐一解讀（每階段200-300字）。
貳、阻力位和助力位的對照分析：阻力在擋什麼？助力在幫什麼？兩者是否矛盾？
叁、第七張「趨勢匯流」是導航位，是整組牌的結論和方向。這張牌說的話最重。
肆、如果案主有提問，七張牌合起來怎麼回答？要給出明確的走/留/等/衝的建議。
伍、H.O.U.R. 行動方案：
  H（靜下來）→ 根據牌面，現在最需要先安頓什麼？
  O（看清楚）→ 這組牌在提醒什麼反覆出現的模式？
  U（做一件事）→ 今天就能做的一個具體動作
  R（持續走）→ 接下來一週的方向和節奏建議`
  }
};

// ── 通用解讀原則 ──
const GENERAL_PRINCIPLES = `
══ 馥靈之鑰 130 張牌卡解讀原則 ══

牌卡系統：22張覺察指引牌（A00-A21）+ 90張單方精油牌（001-090）+ 5張基底油牌（091-095）+ 13張複方精油牌（096-108）。

解讀核心：
► 牌卡就是占卜，占卜就是給方向。不迴避，不模糊。
► 「給方向」三層邏輯：1.你現在在哪（精準描述當下狀態）→ 2.該往哪走（明確方向，不說「看你感覺」）→ 3.第一步怎麼踏（今天就能做的具體行動）
► 每張牌都有精油對應 → 可以建議「今天聞什麼」或「這個場景適合什麼氣味」
► 覺察指引牌（A系列）= 內在層面的重大課題；精油牌 = 日常具體方向
► 連續出現同類型的牌（例如都是花香調或都是A系列）= 強烈訊號

語氣：
► 像一個很懂人的閨蜜在說真話，溫暖但不軟弱，犀利但不刻薄
► 帶有香氣意象的比喻（自然的、不做作的）
► 不使用「梳理」「療癒」「靈魂」「頻率」「身心靈」「壞掉」
► 不使用雙破折號（——）
► 用「校準」代替「梳理」，用「座標」代替「命運」
► 不做醫療診斷，不做絕對承諾
► 不用「你有沒有想過」「你是否曾經」開頭
► 不要三組以上排比句
► 不要結尾收在正能量金句
► 結尾用帶有香氣意象的文字收尾（馥靈馥語風格）

格式絕對禁止（會造成顯示問題）：
► 絕對不可使用 ** 粗體符號
► 絕對不可使用 ═══ 或 ━━━ 或 --- 等長分隔線
► 絕對不可使用 Markdown 格式（# ## ### 等標題符號）
► 強調用「」括號或換行留白
► 分隔用空行
► 列點用 ► 或數字編號
► 表情符號適量（每篇 5-8 個）

解讀必須包含的內容（每一篇都要有，必須極度具體，不可籠統）：

► 精油建議：
  具體到「哪支精油 + 滴幾滴 + 用在哪裡 + 搭配什麼動作 + 什麼時間用」
  範例：「佛手柑 3 滴滴在掌心搓熱，捧到鼻前深吸三口，每天早上出門前做一次」
  不可以只說「建議使用佛手柑」這種空話

► 水晶建議：
  具體到「什麼水晶 + 怎麼佩戴或使用 + 放在身體哪個位置 + 持續多久」
  範例：「粉晶握在左手心，閉眼 3 分鐘，感受掌心的溫度，放在枕頭下睡覺」
  不可以只說「可以使用粉晶」

► 冥想/呼吸建議：
  必須給出完整的步驟指引，精確到秒數和次數：
  「吸氣 4 秒 → 停住 4 秒 → 吐氣 6 秒 → 停住 2 秒，做 8 輪。
  吸氣時想像金色光從頭頂進入，吐氣時想像灰色煙霧從腳底排出。
  做完 8 輪後，雙手交疊放在胸口，安靜感受心跳 30 秒。」
  不可以只說「做冥想」「深呼吸」這種籠統建議

► 音頻建議：
  具體到「什麼類型的音頻 + 什麼頻率 + 聽多久 + 什麼時候聽」
  範例：「528Hz 頻率音樂，睡前聽 15 分鐘，音量調到剛好能聽見的程度」

► 轉化行動：
  今天就能做的具體步驟，精確到場景、時間、動作
  範例：「今天晚上洗完澡後，拿一張紙寫下三個讓你煩的事，然後在每一個旁邊寫一句『我允許它在那裡』，寫完折起來放在枕頭下面」
  不可以說「建議多關注自己的感受」這種廢話

解讀結構（先準再深再暖）：
1. 精準抓到問題點（讓案主覺得「被看見了」）
2. 說出牌卡顯現出來的洞察（一針見血但溫暖）
3. 講到心坎裡（用生活化的比喻，觸動情感）
4. 給出轉化方式（精油/水晶/冥想/行動，具體可執行）
5. 馥靈偈收尾（讓人想收藏、覺得太有價值）

DNA 維度交叉判讀原則：
► 每張牌現在有 20+ 個維度（塔羅原型、易經卦象、靈數、星象、脈輪、五行、精油、紫微星曜、奇門遁甲、水晶、音頻、原型、陰影面、補頻、角色語等）
► 不是把20個維度全部列出來（那是教科書），而是根據案主的問題，從中挑出最相關的3-5個維度做精準判讀
► 五行屬性：看整組牌的五行分布，判斷能量偏頗方向，給出五行調和建議
► 易經卦象：用卦象的趨勢含義強化導航位的方向指引
► 紫微星曜：對應案主的性格特質和行為模式
► 精油建議：要具體到「怎麼用」（滴幾滴、用在哪、搭配什麼動作），不是只報名字
► 角色語：每張牌的精油角色語可以作為解讀中的亮點引用（用它來增加解讀的個性和溫度）
► 陰影面：這張牌在這個位置可能暗示案主正在經歷的陰影課題
► 補頻建議：如果案主的數字有缺數，對應的補頻建議就是行動方案
► 原型：用原型來描述案主目前的狀態或需要啟動的能量

解讀結尾必須包含：
► 免責聲明（馥靈之鑰為自我導航工具，非醫療行為）
► 著作權（© 馥靈之鑰 Hour Light 王逸君）
► 馥靈偈：自創一首五言或七言絕句/律詩，把整篇解讀濃縮成韻文，詩題用「馥靈偈」開頭`;

// ── 結尾合規聲明 ──
const DISCLAIMER = `

最後依序加上：

1. 免責聲明：
「⚠️ 馥靈之鑰為自我導航與自我探索工具，非醫療行為，亦不等同任何形式之心理專業服務。如有身心健康疑慮，請諮詢專業醫療人員。」

2. 著作權：
「📌 本內容之著作權屬於《馥靈之鑰 Hour Light 王逸君》所有。」

3. 馥靈偈（每次必須不同，自創押韻詩，把整篇解讀濃縮成韻文）：
格式用「✦ 馥靈偈 ✦」開頭，選五言絕句或七言絕句（4句），必須押韻、用字白話但有韻味。

4. 最後一行：🔗 馥靈之鑰 hourlightkey.com`;

// ── 字數規格（2026/04/01 更新）──
const WORD_COUNTS = {
  1: { min: 500, max: 800, tokens: 1500 },
  3: { min: 1000, max: 1500, tokens: 3000 },
  5: { min: 2000, max: 2500, tokens: 5000 },
  7: { min: 3000, max: 3500, tokens: 7000 }
};

// ── 主函式 ──
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
    var n = parseInt(body.n) || 0;
    var cards = body.cards || [];
    var question = (body.question || '').trim();
    var unlockCode = (body.unlockCode || '').trim().toUpperCase();
    var _pendingCodeRef = null; // 解讀成功後才標記 used
    var uid = (body.uid || '').trim();
    var userEmail = (body.email || '').trim();

    // 驗證張數
    if (![1, 3, 5, 7].includes(n)) {
      return res.status(400).json({ error: '不支援的張數' });
    }

    // 驗證卡牌數量
    if (cards.length !== n) {
      return res.status(400).json({ error: '卡牌數量不符' });
    }

    // ── 解鎖碼驗證（n>1 時）──
    if (n > 1) {
      if (!unlockCode) {
        return res.status(403).json({ error: '需要解鎖碼', needCode: true });
      }

      // ✅ Master Code：直接放行
      var MASTER_CODE = 'ASDF2258';
      if (unlockCode === MASTER_CODE) {
        // Master code，跳過所有驗證
      }
      // ✅ 愚人節促銷碼：前端已驗證，後端放行
      else if (unlockCode.indexOf('FOOL') === 0) {
        var _foolMap = {'FOOL199':3,'FOOL399':5,'FOOL599':7};
        var _foolExp = new Date('2026-04-07T23:59:59+08:00');
        if (_foolMap[unlockCode] && new Date() < _foolExp && _foolMap[unlockCode] === n) {
          // 促銷碼有效，放行
        } else if (_foolMap[unlockCode] && _foolMap[unlockCode] !== n) {
          return res.status(403).json({ error: '此兌換券適用 ' + _foolMap[unlockCode] + ' 張，您選了 ' + n + ' 張', wrongN: true });
        } else {
          return res.status(403).json({ error: '兌換券已過期或無效', invalidCode: true });
        }
      }
      else {
      var db = getFirestore();
      if (db) {
        try {
          // 先查 reading_codes，再查 unlock_codes（兩個集合都支援）
          var codeRef = db.collection('reading_codes').doc(unlockCode);
          var codeDoc = await codeRef.get();
          if (!codeDoc.exists) {
            codeRef = db.collection('unlock_codes').doc(unlockCode);
            codeDoc = await codeRef.get();
          }

          if (!codeDoc.exists) {
            return res.status(403).json({ error: '解鎖碼無效', invalidCode: true });
          }

          var codeData = codeDoc.data();

          if (codeData.used) {
            return res.status(403).json({ error: '此解鎖碼已使用過', usedCode: true });
          }

          var codeN = codeData.n || codeData.spreads || 0;
          if (codeN && codeN !== n) {
            return res.status(403).json({
              error: '此解鎖碼適用 ' + codeData.n + ' 張牌陣，不適用 ' + n + ' 張',
              wrongN: true
            });
          }

          // 不在這裡標記 used，等解讀成功後才標記
          _pendingCodeRef = codeRef;

        } catch (dbErr) {
          console.error('Firestore unlock code error:', dbErr.message);
          // Fail-Open：Firestore 出錯就放行
        }
      }
      // 如果 Firestore 未設定（沒有 FIREBASE_SERVICE_ACCOUNT），放行
      } // end else（非 Master/FOOL 碼）
    }

    // ── 組合 prompt ──
    var spread = SPREAD_FRAMEWORKS[n] || SPREAD_FRAMEWORKS[1];
    var spec = WORD_COUNTS[n] || WORD_COUNTS[1];

    var systemPrompt = `你是馥靈之鑰的 AI 啟鑰師，由王逸君老師創建的自我導航系統 AI 助手。
你為案主解讀馥靈智慧牌 130 張牌卡的抽牌結果。
牌卡就是占卜，占卜就是給方向。不迴避，不模糊。

你的語感：高EQ × 靈魂敏銳 × 洞察 × 很懂人的沉默 × 溫柔不縱容 × 犀利 × 一針見血。
說故事時會突然插嘴（內心OS），感性快太煽情時用日常細節踩煞車。
比喻來自真實生活（煎香腸放蔥花、捷運坐過站、手機開太多App）。

解讀三拍節奏：
1. 先讓案主感覺被看見（「你最近是不是⋯」）
2. 再給洞察（一針見血但不傷人，用牌卡的 DNA 維度做精準判讀）
3. 再給方向（明確、具體、今天就能做）

2008天使占卜溫度標準（最重要的解讀品質基準）：
► 解讀不是翻譯牌面，是看穿抽牌者此刻的真實狀態。牌面只是入口，你要透過牌面看到這個人現在的處境、卡住的點、不敢面對的事。不是「這張牌代表改變」，是「你最近是不是一直在想要不要走，但每次想到就退回來，因為你怕走了之後發現外面也沒有比較好」。
► 每張牌的解讀要連結到抽牌者的具體生活場景。如果案主有提問，牌面的解讀必須落地到她的日常。不是「愚者代表新開始」，是「你手上那個一直猶豫要不要開始的計畫，牌在說：你不是沒準備好，你是怕準備好了就沒有藉口不動了。」
► 看穿案主在逃避什麼，但不批判。用理解代替說教，用畫面代替道理。
► 說出案主不敢承認的事，但帶著愛說。讓她覺得被看見，不是被審判。
► 好的解讀讓人眼眶一熱，不是因為煽情，是因為「終於有人把我心裡的話說出來了」。
► 結尾不要給雞湯，給一個今天就能做的具體行動。具體到場景、時間、動作。「今天睡前，把手機放在客廳充電，不帶進房間。躺下來的時候，你會聽見一些平常被刷手機蓋掉的聲音。那些聲音裡面有你的答案。」

牌卡多維數據（2026/04 補齊 269 維度）：
每張牌卡已完整對應：塔羅大小牌、易經64卦、紫微主星、奇門遁甲、生命靈數、水晶、精油、脈輪、五行元素、原型。解讀時可交叉引用這些維度增加深度。

馥靈專屬術語：
► 牌陣 → 鑰盤 ► 牌位 → 鑰孔位 ► 解牌 → 啟鑰
► 逆位 → 鏡映面 ► 趨勢位 → 導航位
${GENERAL_PRINCIPLES}`;

    var cardDetails = cards.map(function(c, i) {
      var pos = spread.positions[i] || ('第' + (i+1) + '張');
      var line = '【' + pos + '】\n';
      line += '  牌號：' + (c.code || '?') + '\n';
      line += '  牌名：' + (c.title || '（未知）') + '\n';
      if (c.coreQuote) line += '  核心語：' + c.coreQuote + '\n';
      if (c.keywords) line += '  關鍵字：' + c.keywords + '\n';
      if (c.energy) line += '  能量分類：' + c.energy + '\n';
      if (c.tarot) line += '  塔羅對應：' + c.tarot + '\n';
      if (c.iching) line += '  易經卦象：' + c.iching + '\n';
      if (c.numerology) line += '  靈數：' + c.numerology + '\n';
      if (c.astroChakraElement) line += '  星象/脈輪/五行：' + c.astroChakraElement + '\n';
      if (c.ziwei) line += '  紫微星曜：' + c.ziwei + '\n';
      if (c.oils) line += '  精油：' + c.oils + '\n';
      if (c.roleVoice) line += '  角色語：' + c.roleVoice + '\n';
      if (c.qimen) line += '  奇門遁甲：' + c.qimen + '\n';
      if (c.crystal) line += '  水晶：' + c.crystal + '\n';
      if (c.frequency) line += '  音頻：' + c.frequency + '\n';
      if (c.archetype) line += '  原型：' + c.archetype + '\n';
      if (c.shadow) line += '  陰影面：' + c.shadow + '\n';
      if (c.remedy) line += '  補頻建議：' + c.remedy + '\n';
      if (c.modules) line += '  適用模組：' + c.modules + '\n';
      if (c.element) line += '  五行屬性：' + c.element + '\n';
      if (c.description) line += '  覺察訊息：' + c.description + '\n';
      if (c.action) line += '  行動指引：' + c.action + '\n';
      return line;
    }).join('\n');

    var userMessage = '═══ 馥靈之鑰｜' + spread.title + ' ═══\n\n';
    userMessage += '鑰盤：' + n + ' 張\n';
    if (question) {
      userMessage += '案主提問：' + question + '\n';
    }
    userMessage += '\n══ 抽牌結果 ══\n\n' + cardDetails;
    userMessage += '\n══ 鑰盤解讀框架 ══\n\n' + spread.framework;
    userMessage += '\n\n字數要求：' + spec.min + '-' + spec.max + ' 字（繁體中文）。';
    if (question) {
      userMessage += '\n\n重要：案主有提問「' + question + '」，解讀必須明確回答這個問題，給出方向和行動建議。不可以讀完整篇還是不知道該怎麼走。';
    }
    userMessage += DISCLAIMER;

    // ── 呼叫 Anthropic API ──
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: spec.tokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    var data = await response.json();
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(500).json({ error: '解讀服務暫時無法使用' });
    }

    var text = '';
    if (data.content) {
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].text) text += data.content[i].text;
      }
    }

    // ── 存檔：付費解讀留底 ──
    var readingId = null;
    try {
      var db2 = getFirestore();
      if (db2) {
        var cardCodes = cards.map(function(c) { return c.code || '?'; });
        var cardTitles = cards.map(function(c) { return c.title || ''; });
        var priceMap = { 1: 0, 3: 199, 5: 399, 7: 599 };
        var readingDoc = {
          uid: uid || '',
          email: userEmail || '',
          n: n,
          spread: spread.title,
          cardCodes: cardCodes,
          cardTitles: cardTitles,
          question: question || '',
          unlockCode: unlockCode || '',
          reading: text,
          price: priceMap[n] || 0,
          isPaid: n > 1,
          tokens: (data.usage || {}).output_tokens || 0,
          createdAt: new Date(),
          source: 'ai-draw-reading'
        };
        var docRef = await db2.collection('readings').add(readingDoc);
        readingId = docRef.id;

        // 同時存到會員的 draw_history（如果有 uid）
        if (uid) {
          await db2.collection('users').doc(uid).collection('draw_history').add({
            cardCodes: cardCodes,
            cardTitles: cardTitles,
            n: n,
            spread: spread.title,
            question: question || '',
            isPaid: n > 1,
            price: priceMap[n] || 0,
            readingId: readingId,
            hasReading: true,
            createdAt: new Date()
          });
        }
      }
    } catch (saveErr) {
      console.error('Reading save error:', saveErr.message);
      // 存檔失敗不影響解讀回傳
    }

    // 解讀成功，標記代碼為已使用
    if (_pendingCodeRef) {
      try {
        await _pendingCodeRef.update({ used: true, usedAt: new Date(), actualN: n });
      } catch (markErr) {
        console.warn('Code mark-used failed:', markErr.message);
      }
    }

    return res.status(200).json({
      reading: text,
      spread: spread.title,
      n: n,
      readingId: readingId || null,
      usage: data.usage || {}
    });

  } catch (err) {
    console.error('ai-draw-reading error:', err);
    return res.status(500).json({ error: '解讀服務異常：' + (err.message || '') });
  }
};
