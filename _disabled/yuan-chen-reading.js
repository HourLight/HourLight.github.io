// ═══════════════════════════════════════
// 馥靈之鑰 · 元辰宮 AI 導覽解讀 API
// Vercel Serverless Function
// v1.0 · 2026-03-31
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// 功能：接收生日+問題+5張牌 → 組合 prompt → 呼叫 Claude → 回傳元辰宮導覽報告
//
// 端點：POST /api/yuan-chen-reading
// Body: { birthday, birthHour, question, cards: [{code, position, title}], unlockCode, uid?, email? }
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
    adminDb = admin.firestore();
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
    var birthHour = (body.birthHour || '').trim();
    var question = (body.question || '').trim();
    var cards = body.cards || [];
    var unlockCode = (body.unlockCode || '').trim().toUpperCase();
    var uid = (body.uid || '').trim();
    var userEmail = (body.email || '').trim();

    if (!birthday || cards.length < 5) {
      return res.status(400).json({ error: '缺少必要資料（生日或牌卡）' });
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

          var codeType = codeData.type || '';
          if (codeType && codeType !== 'yuan-chen-reading' && codeType !== 'universal') {
            return res.status(403).json({ error: '此代碼不適用於元辰宮服務', wrongType: true });
          }

          // 標記為已使用
          await codeRef.update({
            used: true,
            usedAt: new Date(),
            usedBy: uid || 'guest',
            usedByEmail: userEmail || '',
            service: 'yuan-chen-reading'
          });

        } catch (dbErr) {
          console.error('Firestore code validation error:', dbErr.message);
        }
      }
    }

    // ── 組合牌卡資訊 ──
    var cardText = cards.map(function(c, i) {
      return '牌卡 ' + (i + 1) + '（' + c.position + '）：' + c.code + (c.title ? ' ' + c.title : '') + (c.description ? '\n  牌卡涵義：' + c.description : '');
    }).join('\n');

    // ── 組合 Claude Prompt ──
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

    // ── 寫入 Firestore 紀錄 ──
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

  } catch (err) {
    console.error('yuan-chen-reading error:', err);
    return res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
};
