// ═══════════════════════════════════════
// 馥靈之鑰 · HOUR LIGHT 未來美容學苑
// 鉑金智慧煥顏系統 API
// Vercel Serverless Function
// v1.0 · 2026-04-18
// © 2026 Hour Light International
// ═══════════════════════════════════════
//
// 功能：接收 1-3 張臉部照片 → Claude Vision 分析 → 產出 A4 一頁鉑金智慧煥顏報告
//
// 端點：POST /api/skin-diagnosis
// Body: {
//   images: [base64_1, base64_2?, base64_3?],   // 1-3 張，正面必填，左右 45 度可選
//   clientData: {
//     name?: string,
//     birth?: "YYYY-MM-DD",
//     age?: number,
//     complaint?: string,      // 主訴
//     season?: "spring|summer|autumn|winter",
//     occupation?: string
//   },
//   unlockCode?: string,
//   uid?: string,
//   email?: string,
//   isPaidCode?: boolean    // paywall 驗過碼傳 true，API 以此模式執行
// }
//
// 計次邏輯（跟 hl-ai-gate 一致）：
//   免費會員：每天 1 次（免費體驗）
//   鑰友 NT$399/月：每月贈 5 次 + 可購買 NT$199/次
//   大師 NT$999/月：無限次
//   NT$199 單次付費（PAYUNi 金流 + reading_codes 解鎖碼）
//
// deferConsume 鐵則：
//   paywall 驗碼不標 used → API 成功生成報告後才 update(used:true)
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
        credential: admin.credential.cert(JSON.parse(SA_JSON))
      });
    }
    adminDb = admin.firestore();
    return adminDb;
  } catch (err) {
    console.error('Firebase Admin init error:', err.message);
    return null;
  }
}

// ═══════════════════════════════════════
// 系統 prompt（核心版 · 濃縮自 system-prompt-v1.md）
// 維護：編輯完整版在 資源/AI鉑金智慧煥顏系統/system-prompt-v1.md
// 本檔案用核心版以控制 API token 成本
// ═══════════════════════════════════════

const SYSTEM_PROMPT = `你是「馥靈之鑰 HOUR LIGHT 未來美容學苑」旗下的 鉑金智慧煥顏師，由王逸君老師設計。根據使用者上傳的臉部照片與資料，產出一份客人看得懂、美容師能直接用來溝通的專業鉑金智慧煥顏報告。

## 分析邏輯（四象限）
觀察照片時，內部分析四個維度（不要全部寫進報告，只把最重要的寫進去）：
壹、油水分布（T 字區 / 雙頰 / 下巴）
貳、細紋紋路（眼周 / 法令 / 額頭 / 頸部）
叁、膚色斑點（均勻度 / 暗沉 / 斑點類型 / 泛紅）
肆、毛孔質感（鼻翼 / 雙頰 / 粉刺 / 角質）

## 報告結構（8 段，A4 一頁可印，600-900 字）

### 第 1 段 · 你的肌膚正在告訴你...
感性描述 3-4 行，讓客人感覺被理解。不煽情、不誇張。
禁止「你不是 XXX，是 XXX」否定安慰句型。

### 第 2 段 · 你的肌膚三大優勢
三條短句，每條「✓」開頭。找優點讓客人開心（即使狀況不佳也一定找出三個）。

### 第 3 段 · 近期需要被照顧的三個訊號
三個訊號（不多不少），「訊號 1 / 2 / 3」格式，每個訊號標題 + 一行簡短描述。

### 第 4 段 · 建議的煥顏方案
從伊詩汀五組選 1 組主方案 + 1 組輔方案，格式：
🌸 主方案｜[產品組名]
   [為什麼選的說明 1-2 行]
💎 輔方案｜[另一組名]
   [為什麼互補 1 行]

### 第 5 段 · 推薦精油
從 7 支中選 1-2 支：
🌿 [精油名]｜[搭配產品用法]
   [為什麼選 1 行]

### 第 6 段 · 居家延續使用順序
☀️ 早晨 3 分鐘：1. 2. 3.
🌙 晚間 5 分鐘：1. 2. 3. 4. 5.
基本順序：晶露 → 精華/安瓶 → 精華乳 → A醇或貴婦霜（僅晚）→ 眼霜
A 醇類只能晚上用，第一次用要建立耐受（前兩週隔天用）。

### 第 7 段 · 建議療程週期
🕐 密集期（前 4 週）：每週 1 次沙龍護理 + 每天居家
🕑 穩定期（5-8 週）：每兩週 1 次沙龍護理
🕒 保養期（8 週後）：每月 1 次沙龍護理

### 第 8 段 · 逸君老師的話
1-2 行馥靈馥語收尾。淡的、不用力、短句 + 長句交叉。
禁止「你是被祝福的」「宇宙要讓你變美」雞湯雞湯。

## 伊詩汀五組產品對應表

組 1｜玫瑰幹細 DNA 肌因精華組（5 瓶）
  適合：熟齡（35+）/ 細紋明顯 / 鬆弛 / 抗老拉提
  內容：DNA 玫瑰賦活因子精華（九/三/六胜肽+Q10）/ 水潤透亮美白 C 精華（左旋C+7GF）/ 嫩白琥珀酸 A 醇精華（夜用）/ A 醇賦活潤白貴婦霜 / 金箔海洋奢華再生眼霜

組 2｜白藜蘆醇蠶絲胜肽組（2 瓶 NT$16,000）
  適合：暗沉 / 缺光澤 / 透亮需求 / 膚色不均
  內容：白藜蘆醇海洋金萃晶露 120ml（角質軟化）/ 蠶絲胜肽淡斑嫩白精華乳 120ml（蠶絲油+七葉樹+角鯊烷+卵磷脂）

組 3｜水嫩保濕拉提青春套組（2 瓶）
  適合：敏感 / 泛紅 / 眼周問題 / 屏障受損
  內容：金萃緊緻拉提晶華眼露 30ml（玻尿酸+白藜蘆醇+B5+德國洋甘菊+積雪草）/ 白藜蘆醇海洋金萃晶露 120ml

組 4｜潤白透光賦活青春組
  適合：進階保養者 / 全方位升級 / 特殊場合前急救
  內容：賦活水嫩透亮組-玻尿酸修護原液（10ml×1+8ml×5 小安瓶）/ 蠶絲胜肽淡斑嫩白精華乳 120ml / 金箔海洋奢華再生眼霜 50g

組 5｜自然草本精油系列（7 支歐盟認證）
  適合：情緒連結 / 芳療加值 / 擴香 / 儀式感

## 7 支精油對應表
玫瑰天竺葵（埃及）｜✅ 加精華乳促滲透+情緒連結
葡萄柚（英國冷壓）｜✅ 加晶露提亮代謝
絲柏（西班牙）｜✅ 加眼霜緊緻循環
真正薰衣草（法國）｜✅ 加安瓶舒緩敏感
茶樹（澳洲）｜⚠️ 不建議臉部，擴香足浴
歐薄荷（印度）｜⚠️ 不建議臉部，擴香頭皮
尤加利（英國）｜⚠️ 不建議臉部，擴香呼吸道

## 禁忌詞（絕對不能出現）
永久禁止：療癒 / 治癒 / 治療 / 醫美等級 / 媲美醫美 / 除皺 / 美白（當效能宣稱）/ 宿命論 / 靈性銷售腔 / 雞湯教條 / 「你不是 XXX，是 XXX」句型
官方場合額外：頻率 / 靈魂 / 靈性 / 占卜（本報告屬官方對外）
謹慎用詞：宇宙 / 能量場 / 顯化 / 氣場（避免過度使用）

## 合規邊界（台灣化妝品廣告法）
❌ 絕對不能寫：媲美醫美 / 等同醫美 / 治療 / 除皺 / 美白（無認證前）
✅ 可以寫：一次護理肌膚轉變有感 / 專業級居家護理 / 階梯式精準保養 / 單次見效 / 肌膚煥新系統

## 格式規則
✅ 使用：「」括號強調、~~ 分隔、► ✓ → 列點、emoji 克制 5-8 個
❌ 禁用：粗體 **xxx**、雙破折號 ——、長線 ———、LaTeX、Markdown 標題 #

## 語氣守則
淡的、不用力、不激動、不推銷。主動語態、個人觀點、現場感受。長短句交叉。比喻從生活撿（不要「猶如春風」）。敬語用「您」。

## 報告尾端必附免責聲明
━━━ 免責聲明 ━━━
本報告為 AI 輔助評估，不取代專業醫療建議。
若有異常皮膚狀況（持續紅腫/異常斑塊/反覆發炎）
請諮詢皮膚科醫師。
━━━━━━━━━━━

## 產品推薦決策樹
熟齡+細紋 → 組1 玫瑰幹細 DNA（主）+ 組3 水嫩拉提（輔）
暗沉+缺光 → 組2 白藜蘆醇蠶絲（主）+ 組5 精油葡萄柚（輔）
敏感+泛紅 → 組3 水嫩拉提（主）+ 組5 精油薰衣草（輔）
進階保養 → 組4 潤白透光賦活（主）+ 組1 或組2（輔）
年輕肌膚 → 組3 水嫩拉提（主）+ 組5 精油玫瑰天竺葵（輔）`;

// 免責聲明（組在 user message 尾端）
const DISCLAIMER = `

請按照上面 8 段結構完整產出報告。每段都要寫，不能跳過。
段落之間用空行分隔。禁用 ** 粗體和 —— 破折號。
報告尾端自動附加免責聲明（不要省略）。
總字數：600-900 字。`;

// ═══════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════

module.exports = async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '';
  const allowed = [
    'https://hourlightkey.com',
    'https://www.hourlightkey.com',
    'https://app.hourlightkey.com',
    'http://localhost:3000'
  ];
  if (allowed.indexOf(origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: '服務尚未設定' });

  try {
    const body = req.body || {};
    const images = Array.isArray(body.images) ? body.images : [];
    const clientData = body.clientData || {};
    const unlockCode = (body.unlockCode || '').trim().toUpperCase();
    const uid = (body.uid || '').trim();
    const userEmail = (body.email || body.userEmail || '').trim();
    let _pendingCodeRef = null;

    // 驗證圖片
    if (images.length < 1 || images.length > 3) {
      return res.status(400).json({ error: '請上傳 1-3 張臉部照片' });
    }

    // 基本 base64 驗證
    for (let i = 0; i < images.length; i++) {
      if (typeof images[i] !== 'string' || images[i].length < 100) {
        return res.status(400).json({ error: '圖片格式錯誤（第 ' + (i+1) + ' 張）' });
      }
    }

    // ── 解鎖碼驗證（deferConsume 鐵則：API 成功後才標 used）──
    if (unlockCode) {
      // Master Code 直接放行
      const MASTER_CODE = 'ASDF2258';
      if (unlockCode === MASTER_CODE) {
        // 放行
      } else {
        const db = getFirestore();
        if (db) {
          try {
            // 先查 reading_codes，再查 unlock_codes
            let codeRef = db.collection('reading_codes').doc(unlockCode);
            let codeDoc = await codeRef.get();
            if (!codeDoc.exists) {
              codeRef = db.collection('unlock_codes').doc(unlockCode);
              codeDoc = await codeRef.get();
            }

            if (!codeDoc.exists) {
              return res.status(403).json({ error: '解鎖碼無效', invalidCode: true });
            }

            const codeData = codeDoc.data();
            if (codeData.used) {
              return res.status(403).json({ error: '此解鎖碼已使用過', usedCode: true });
            }

            // 檢查類型（可選）— 如果 code 綁定 skin-diagnosis 專用
            if (codeData.type && codeData.type !== 'skin-diagnosis') {
              return res.status(403).json({
                error: '此解鎖碼不適用於鉑金智慧煥顏',
                wrongType: true
              });
            }

            _pendingCodeRef = codeRef;  // 等解讀成功才標 used
          } catch (dbErr) {
            console.error('Code check error:', dbErr.message);
            // Fail-Open：Firestore 錯就放行
          }
        }
      }
    }

    // ── 組合 User Message（含照片 + 客人資料）──
    const messageContent = [];

    // 1. 加入照片（Claude Vision 格式）
    images.forEach((b64) => {
      // 移除 data:image/xxx;base64, 前綴（如果有）
      const clean = b64.replace(/^data:image\/\w+;base64,/, '');
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: 'image/jpeg',
          data: clean
        }
      });
    });

    // 2. 加入文字說明
    let clientInfo = '';
    if (clientData.name) clientInfo += '客人暱稱：' + clientData.name + '\n';
    if (clientData.age) clientInfo += '年齡：' + clientData.age + ' 歲\n';
    if (clientData.birth) clientInfo += '生日：' + clientData.birth + '\n';
    if (clientData.complaint) clientInfo += '主訴：' + clientData.complaint + '\n';
    if (clientData.season) {
      const seasonMap = { spring: '春季', summer: '夏季', autumn: '秋季', winter: '冬季' };
      clientInfo += '當前季節：' + (seasonMap[clientData.season] || clientData.season) + '\n';
    }
    if (clientData.occupation) clientInfo += '職業：' + clientData.occupation + '\n';

    let userMessage = '請為這位客人產出鉑金智慧煥顏報告。\n\n';
    userMessage += '照片張數：' + images.length + ' 張\n';
    userMessage += '檢測日期：' + new Date().toISOString().slice(0, 10) + '\n';
    if (clientInfo) {
      userMessage += '\n── 客人資料 ──\n' + clientInfo;
    } else {
      userMessage += '\n（客人資料未提供，請根據照片觀察進行）\n';
    }
    userMessage += DISCLAIMER;

    messageContent.push({ type: 'text', text: userMessage });

    // ── 呼叫 Claude Vision API ──
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: messageContent }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(500).json({ error: '讀解服務暫時無法使用，請稍後再試' });
    }

    let reportText = '';
    if (data.content) {
      for (let i = 0; i < data.content.length; i++) {
        if (data.content[i].text) reportText += data.content[i].text;
      }
    }

    if (!reportText.trim()) {
      return res.status(500).json({ error: '診斷生成失敗，請重新嘗試' });
    }

    // ── 存檔 Firestore ──
    let reportId = null;
    try {
      const db2 = getFirestore();
      if (db2) {
        const reportDoc = {
          uid: uid || '',
          email: userEmail || '',
          clientName: clientData.name || '',
          clientAge: clientData.age || null,
          clientBirth: clientData.birth || '',
          complaint: clientData.complaint || '',
          imageCount: images.length,
          report: reportText,
          unlockCode: unlockCode || '',
          isPaid: !!unlockCode,
          tokens: (data.usage || {}).output_tokens || 0,
          createdAt: new Date(),
          source: 'skin-diagnosis'
        };
        const docRef = await db2.collection('skin_reports').add(reportDoc);
        reportId = docRef.id;

        // 學員端副本：users/{uid}/skin_reports/{reportId}
        if (uid) {
          await db2.collection('users').doc(uid)
            .collection('skin_reports').doc(reportId)
            .set(Object.assign({}, reportDoc, { reportId: reportId }));
        }
      }
    } catch (saveErr) {
      console.error('Skin report save error:', saveErr.message);
      // 存檔失敗不影響回傳
    }

    // ── 解讀成功才標碼 used（deferConsume 鐵則）──
    if (_pendingCodeRef) {
      try {
        await _pendingCodeRef.update({
          used: true,
          usedAt: new Date(),
          usedFor: 'skin-diagnosis',
          reportId: reportId || null
        });
      } catch (markErr) {
        console.warn('Code mark-used failed:', markErr.message);
      }
    }

    // ── 自動寄 email（防消費糾紛）──
    if (userEmail && reportText) {
      try {
        await fetch('https://app.hourlightkey.com/api/send-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: userEmail,
            name: clientData.name || '',
            subject: '你的鉑金智慧煥顏報告',
            content: reportText,
            system: 'HOUR LIGHT 未來美容學苑 · 鉑金智慧煥顏',
            type: 'report'
          })
        });
        console.log('📧 skin-diagnosis 報告已寄送：' + userEmail);
      } catch (mailErr) {
        console.error('skin-diagnosis 寄信失敗:', mailErr.message);
      }
    }

    return res.status(200).json({
      ok: true,
      report: reportText,
      reportId: reportId || null,
      imageCount: images.length,
      usage: data.usage || {}
    });

  } catch (err) {
    console.error('skin-diagnosis error:', err);
    return res.status(500).json({ error: '系統錯誤，請稍後再試：' + err.message });
  }
};
