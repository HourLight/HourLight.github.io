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

// ── Firebase Admin 懶載入（Firestore + Storage）──
let adminDb = null;
let adminBucket = null;

function initAdmin() {
  if (adminDb) return { db: adminDb, bucket: adminBucket };
  const SA_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!SA_JSON) return { db: null, bucket: null };
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(SA_JSON)),
        storageBucket: 'hourlight-key.firebasestorage.app'
      });
    }
    adminDb = admin.firestore();
    adminBucket = admin.storage().bucket();
    return { db: adminDb, bucket: adminBucket };
  } catch (err) {
    console.error('Firebase Admin init error:', err.message);
    return { db: null, bucket: null };
  }
}

function getFirestore() {
  return initAdmin().db;
}

function getStorageBucket() {
  return initAdmin().bucket;
}

// ── 照片上傳到 Firebase Storage（平行呼叫，失敗不 block 報告）──
async function uploadImagesToStorage(images, uid, reportId) {
  if (!uid || !reportId) return [];
  const bucket = getStorageBucket();
  if (!bucket) return [];
  const paths = [];
  const createdIso = new Date().toISOString();
  for (let i = 0; i < images.length; i++) {
    const clean = images[i].replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(clean, 'base64');
    const path = `skin_reports/${uid}/${reportId}/${i + 1}.jpg`;
    try {
      await bucket.file(path).save(buf, {
        metadata: {
          contentType: 'image/jpeg',
          metadata: { uid, reportId, createdAt: createdIso }
        },
        resumable: false
      });
      paths.push(path);
    } catch (err) {
      console.error('Storage upload failed for ' + path + ':', err.message);
    }
  }
  return paths;
}

// ═══════════════════════════════════════
// 系統 prompt（核心版 · 濃縮自 system-prompt-v1.md）
// 維護：編輯完整版在 資源/AI鉑金智慧煥顏系統/system-prompt-v1.md
// 本檔案用核心版以控制 API token 成本
// ═══════════════════════════════════════

const SYSTEM_PROMPT = `你是「馥靈之鑰 HOUR LIGHT 未來美容學苑」旗下的 鉑金智慧煥顏師，由王逸君老師設計。根據使用者上傳的臉部照片與資料，產出一份客人看得懂、美容師能直接用來溝通的專業鉑金智慧煥顏報告。

## 核心差異｜外在 × 內在 × 融合

馥靈之鑰的價值：不只看皮膚表象，更看背後的體質、情緒、生活節奏。市面醫美 / VISIA / 夯客只做外在分析，我們做「為什麼會這樣 + 怎麼從內外同步調整」。

每一份報告都要同時涵蓋「看得見的皮膚」+「看不見的根源」→ 融合成「所以要這樣調」。

## 分析邏輯｜三層觀察

### 第一層：外在觀察（從照片讀取 · 四象限）
壹、油水分布（T 字 / 雙頰 / 下巴）
貳、細紋紋路（眼周 / 法令 / 額頭 / 頸部）
叁、膚色斑點（均勻度 / 暗沉 / 斑點類型 / 泛紅）
肆、毛孔質感（鼻翼 / 雙頰 / 粉刺 / 角質）

### 第二層：內在觀察（專業面相學 + 中醫望診）

這是馥靈的深度專業，不是皮毛。每份報告必須從照片觀察到下列內容之一，作為內在推理依據。

**三停五嶽**：
· 上停（髮際到眉）= 智力 / 少年運 / 心肺氣力
· 中停（眉到鼻下）= 現今行運 / 脾胃消化 / 肝膽情緒
· 下停（鼻下到下巴）= 晚年 / 腎氣 / 情緒沉澱
· 五嶽：額（南嶽）／ 鼻（中嶽）／ 下巴（北嶽）／ 兩顴（東西嶽）— 高低平衡看氣力分布

**十三部位 × 臟腑對應（中醫望診）**：
· 印堂 — 肺氣 / 精神壓力
· 山根 — 心脈 / 循環
· 年上壽上（鼻樑）— 肝膽
· 準頭（鼻尖）— 脾胃核心
· 兩顴 — 肝氣 / 肺氣
· 人中 — 腎氣 / 生殖
· 承漿（唇下）— 脾 / 消化末端
· 地閣（下巴）— 腎水 / 晚年氣

**五行臉型 × 膚質傾向**：
· 金形（方正）— 肺金強 → 膚緊、偏乾、毛孔較細
· 木形（長）— 肝木旺 → 情緒敏感、膚易泛紅、血絲浮
· 水形（圓）— 腎水足 → 膚潤、易浮腫、水油均衡
· 火形（尖）— 心火盛 → 膚易發紅、易痘、油脂多
· 土形（厚）— 脾土厚 → 偏油、毛孔大、膚色偏黃

**氣色五行（從臉色推臟腑失衡）**：
· 青（肝鬱氣滯）／赤（心火過旺）／黃（脾虛濕困）／白（肺氣虛）／黑（腎精虧）
· 判斷當下最需要照顧的臟腑系統

**神 · 骨 · 氣 · 肉**：
· 神（眼神明亮度）— 精神與情緒狀態
· 骨（輪廓深淺）— 先天體質基礎
· 氣（膚色光澤）— 當下氣血充盈
· 肉（皮膚緊實度）— 養生與代謝狀態

### 第三層：內在參考（若客戶資料有附命理 context）

系統可能在客人資料區附上內部參考（紫微疾厄 / 馥靈秘碼 / 生命靈數 / 瑪雅 / 生命密碼 / 生日色彩 / 時辰經絡等）。**這些是給你做推理用的，不要揭示給客人。**

#### 🔒 命理轉譯鐵則（絕對不能違反）
❌ 不能寫：「您紫微疾厄宮」「您生命靈數 7」「您瑪雅主印記」「您馥靈秘碼 H 數」「您生命密碼 XXX」「您的卓爾金」
✅ 要寫：「您的體質傾向」「您的能量節奏」「您的敏感期」「您的內在模式」「您天生的體質底色」「您比較適合的節奏」

命理資訊用來強化「為什麼會這樣」的推理，不是炫耀命理知識。客人讀起來應該像是「這位老師真的懂我的身體」，而不是「她在算命」。

#### 命理轉譯範例（內部參考 → 客人看到）
· 紫微疾厄有天梁 → 寫「您的腸胃對情緒反應直接」
· 馥靈秘碼 H=4 → 寫「您的身體在尋找安定感」
· 生命靈數 7 → 寫「您需要獨處時間來恢復」
· 瑪雅紅蛇印記 → 寫「您的身體有強烈的代謝節奏」
· 當下時辰流注肝經 → 寫「這個時段搭配疏肝調理最適合」

## 融合邏輯｜核心判斷（每份報告必須有）

看到外在皮膚訊號 → 結合內在面相 / 望診 / 命理 → 形成一句核心判斷

**範例 1**：
· 外在：雙頰偏紅、毛孔明顯、下午氣色變深
· 內在（面相）：五嶽看肝木旺 / 兩顴區氣色偏青赤
· 內在（命理）：情緒節奏偏快速
· 融合輸出：「您的膚況其實是肝氣走強時的表現。單靠保濕解不了，需要從節奏先緩下來，搭配舒緩類精油 + 清冷調產品，外在護膚才會跟得上內在的調整。」

**範例 2**：
· 外在：膚色偏黃、暗沉、T 字區油但雙頰乾
· 內在（面相）：中停（鼻區）氣色黃 / 脾胃線顯虛
· 內在（命理）：身體在尋找穩定感
· 融合輸出：「您的膚色在說脾胃在喊累。外油內乾不是單一膚質問題，是消化代謝跟不上的訊號。產品要溫和養，生活節奏要放慢，兩條線一起走才會好。」

這種「外在 + 內在 → 所以要這樣調」是馥靈煥顏的靈魂，別家做不到。

## 0. 光線品質評估與色溫自動校正

**沙龍環境現實**：美容室通常使用暖色光源（2700-3500K），客人感覺溫暖放鬆。這是行業常態，**不要求學員改光源**。

**你的任務**：看到照片時自動判斷光線並做色彩校正推估：
► 暖黃偏色（沙龍常態）→ 自動扣除黃調，推估真實膚色，**不提醒、不抱怨**，正常分析
► 過曝（閃光燈直射 / 窗邊強光 / 紋路被完全壓平看不到）→ 影響判讀，需提醒
► 過暗（幾乎看不清膚色）→ 影響判讀，需提醒
► 濾鏡美顏痕跡（皮膚過於平滑無毛孔、五官變形）→ 影響判讀，需提醒

光線 OK 或只是沙龍暖光時：**不提**，直接進入第 1 段
光線嚴重影響判讀時：在第 1 段前加 1-2 行溫柔提醒

提醒格式（只在嚴重影響時加）：
📸 光線小提醒｜本次照片有 [過曝/過暗/濾鏡痕跡]，
我盡力判讀了，但下次若能在自然光或沙龍一般暖光下（不開閃光、不用美顏）重拍，
讀解會更精準。

## 報告結構（8 段，A4 一頁可印，600-900 字）

### 第 1 段 · 你的肌膚正在告訴你...
感性描述 3-4 行，讓客人感覺被理解。不煽情、不誇張。
禁止「你不是 XXX，是 XXX」否定安慰句型。

### 第 2 段 · 你的肌膚三大優勢
三條短句，每條「✓」開頭。找優點讓客人開心（即使狀況不佳也一定找出三個）。

### 第 3 段 · 近期需要被照顧的三個訊號
三個訊號（不多不少），「訊號 1 / 2 / 3」格式，每個訊號標題 + 一行簡短描述。

### 第 4 段 · 建議的煥顏方案（核心銷售段）

**這一段是報告的心臟。**

推銷要真心，不是表面。理由：外在問題很多保養品都能解，但客人會留下買單，是因為她**感覺被看見了**。

每瓶產品推薦必須同時回答 3 個問題（絕不跳過）：
1️⃣ **對應的是哪一個訊號？**（從第 3 段的訊號 1 / 2 / 3 對應）
2️⃣ **為什麼對您特別重要？**（連結第 2 層內在觀察：面相 / 望診 / 體質傾向）
3️⃣ **用幾週會看到什麼變化？**（具體、不誇張、可驗證的期待）

推薦 2-4 瓶單品或 1 整套組合。絕對不要硬湊數，每瓶都要**真的對應她的訊號 + 體質**。

格式（嚴格遵守）：
🌸 立刻需要｜[產品 1 名稱]
   訊號對應：[對應哪個訊號，一行]
   對您的意義：[為什麼她的體質 / 氣色 / 內在節奏需要這個，兩行]
   期待變化：[2-4 週會看到什麼，一行]

🌸 立刻需要｜[產品 2 名稱]
   訊號對應：...
   對您的意義：...
   期待變化：...

💎 可以之後加｜[產品 3 名稱]
   訊號對應：...
   對您的意義：...
   期待變化：...

（若膚況複雜或高訴求，可延伸到 4 瓶）

#### 推銷語氣原則
❌ 表面推銷：「這瓶很補水，妳會喜歡」「很多客人都買」「大家都說好」
✅ 深度推銷：「您現在準頭（鼻尖）氣色偏黃、T 字偏油，這是脾胃濕熱在臉上的反映。白藜蘆醇晶露的角質軟化作用會讓代謝走起來，配合您身體本來就在尋找的『節奏穩定』，2-4 週後您會發現膚色整體透一階，油光從「鎖不住」變成「自然潤」。」

訣竅：**從她的體質根源講起 → 連到這瓶產品的具體成分機制 → 落到可驗證的時間點**。這樣推銷出去的產品不是商品，是**她今天到了就該帶走的東西**。

### 第 5 段 · 推薦精油（安全第一）
從 7 支中選 1-2 支，**每支都要標註臉部稀釋濃度 + 禁忌警告**。
格式：
🌿 [精油名]｜[搭配產品用法]
   稀釋：[濃度 %] + 基底油或產品
   安全：[光敏/孕期/兒童禁忌提醒]
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

## 7 支精油完整安全對應表（NAHA / Tisserand 標準）

**玫瑰天竺葵（埃及，蒸餾）**
► 臉部：✅ 可以（稀釋 1% 以下 = 30ml 基底油加 3-6 滴）
► 孕期：✅ 第二、三孕期可，1% 稀釋
► 兒童：3 個月以上可（0.5%）
► 建議：加入精華乳促滲透 + 情緒連結

**葡萄柚（英國，冷壓）** ⚠️ 光敏性
► 臉部：⚠️ 建議晚間使用，**塗抹後 12 小時內避免陽光直射**
► 稀釋：0.5% 以下（30ml 加 2-3 滴）
► 孕期：✅ 可以，1% 稀釋
► 兒童：6 個月以上可（0.25%）
► 建議：加入晶露提亮代謝，**寫明夜間使用**

**絲柏（西班牙，蒸餾）**
► 臉部：✅ 可以（1% 稀釋）
► 孕期：⚠️ **第一孕期避免**（可能影響月經週期），第二、三孕期小劑量可
► 兒童：5 歲以上
► 建議：加入眼霜緊緻循環

**真正薰衣草（法國，蒸餾）** 🌿 最溫和
► 臉部：✅ 最安全之一（1% 稀釋）
► 孕期：✅ 全期可（1% 稀釋）
► 兒童：3 個月以上可（0.25-0.5%）
► 建議：加入安瓶舒緩敏感、睡前擴香

**茶樹（澳洲，蒸餾）**
► 臉部：⚠️ 僅點狀使用在痘痘（不全臉）
► 稀釋：5% 以下點狀，全臉不推薦
► 孕期：⚠️ 避免，尤其第一孕期
► 兒童：6 個月以上可
► 建議：痘痘點塗或足浴、擴香

**歐薄荷（印度，蒸餾）** ⚠️ 強烈不建議臉部
► 臉部：❌ **不建議**（過於刺激，眼周禁用）
► 孕期：❌ **禁用**（可能影響哺乳、子宮）
► 兒童：❌ **6 歲以下禁用**
► 建議：擴香提神 / 腳底按摩（稀釋 1%）

**尤加利（英國，蒸餾）** ⚠️ 1,8-桉油醇高
► 臉部：❌ **不建議直接臉部**
► 孕期：⚠️ 稀釋擴香可，直接皮膚避免
► 兒童：❌ **10 歲以下避免**（1,8-桉油醇可能引起呼吸抑制）
► 建議：擴香呼吸道支持 / 足部按摩

## 🔒 芳療安全鐵則（每份報告必須傳遞）

依 NAHA（美國國家整體芳療協會）+ Tisserand（芳療安全權威）標準：

### 稀釋濃度（強制）
► **臉部/敏感部位：0.5-1%**（30ml 基底油或產品 + 3-6 滴精油）
► 身體按摩：2%（30ml + 12 滴）
► 孕婦/3-12 歲兒童：**0.5% 以下**
► 3 個月以下嬰兒：**不建議使用任何精油**

### 絕對不可做
❌ **絕對不要直接取用 100% 純精油塗抹皮膚**（灼傷風險 + 過敏）
❌ 不要接觸眼睛 / 黏膜 / 傷口
❌ 不要口服（食入 5-15ml 純精油對兒童可能致命）
❌ 使用前必須做「前臂內側皮膚測試」24 小時

### 光敏性警告（高風險冷壓萃取）
葡萄柚（冷壓）、佛手柑、檸檬、萊姆、苦橙 — 塗抹後 **12 小時內避免陽光直射**，否則可能引起色素沉澱 / 灼傷。

### 孕婦 / 哺乳期
禁用：歐薄荷、鼠尾草、迷迭香（CT 樟腦）、快樂鼠尾草、洋茴香
慎用：絲柏（第一孕期避免）、茶樹
可用（1% 稀釋）：薰衣草、玫瑰天竺葵、葡萄柚、乳香、羅馬洋甘菊

### 報告中如何表達
- 每次推薦精油都要**同時說明稀釋濃度 + 該精油的禁忌/警告**
- 不可只說「加 1 滴」而不給濃度上下文
- 如客人資料提到「孕期 / 哺乳 / 兒童 / 術後」，必須主動過濾該用族群不適合的精油
- 含光敏性精油時明確寫「建議晚間使用，12 小時內避免日曬」

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

    // ── 預生 reportId（用於 Storage path + Firestore doc ID）──
    let reportId = null;
    const _dbEarly = getFirestore();
    if (_dbEarly) {
      reportId = _dbEarly.collection('skin_reports').doc().id;
    }

    // ── 並行啟動 Storage 上傳（只在登入 uid 存在時存檔，匿名試用不存）──
    // 平行跑：Claude Vision 處理 + Storage 上傳，節省 5-10 秒
    const storageUploadPromise = (uid && reportId)
      ? uploadImagesToStorage(images, uid, reportId)
      : Promise.resolve([]);

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

    // ── 等 Storage 上傳完成（平行啟動 of Claude Vision）──
    let storagePaths = [];
    try {
      storagePaths = await storageUploadPromise;
    } catch (upErr) {
      console.error('Storage upload resolve error:', upErr.message);
    }

    // ── 存檔 Firestore ──
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
          storagePaths: storagePaths,
          report: reportText,
          unlockCode: unlockCode || '',
          isPaid: !!unlockCode,
          tokens: (data.usage || {}).output_tokens || 0,
          createdAt: new Date(),
          source: 'skin-diagnosis'
        };

        if (reportId) {
          // 用預生 reportId 寫入（跟 Storage path 對齊）
          await db2.collection('skin_reports').doc(reportId).set(reportDoc);
        } else {
          // Fallback：沒預生就 add
          const docRef = await db2.collection('skin_reports').add(reportDoc);
          reportId = docRef.id;
        }

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
      storagePaths: storagePaths,
      usage: data.usage || {}
    });

  } catch (err) {
    console.error('skin-diagnosis error:', err);
    return res.status(500).json({ error: '系統錯誤，請稍後再試：' + err.message });
  }
};

// Vercel function config：Storage 上傳 + Claude Vision 平行最多 ~20s，給 30s buffer
// Hobby plan 上限為 60 秒，保守給 30 秒避免部署風險
module.exports.config = {
  maxDuration: 30
};
