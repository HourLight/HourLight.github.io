# 交接文件：abundance-prayer.html 祈禱文生成器

**日期**：2026-04-16
**交接原因**：逸君重開 Claude Code 讓今天新設定生效（Status Line / cc-h-o / Stop hook / Firecrawl / Playwright）
**建議下次開啟指令**：`cc-h-o`（Opus 4.6，深度工程 + 品牌語感最穩）

---

## 🎯 任務總覽

逸君要在 destiny-engine.html 下方加 **2 個 CTA**：

1. **桌布生成 CTA**（小）→ 連到現有的 wealth-wallpaper 系統
2. **吸引力法則 CTA**（大）→ 新建 `abundance-prayer.html` 祈禱文生成器頁

**決策 6：兩個一起規劃一起上線**。

---

## 📋 逸君確認的 6 個決策點

| # | 決策題 | 逸君答案 |
|---|---|---|
| 1 | Vercel 新 API 位置 | **B**：合併進現有 `api/reading-services.js` 當新 mode（不新增 function，避免超 Hobby 12 支上限） |
| 2 | 付費流程 | **全部走 PAYUNi 線上付**。**附加任務**：確認全站所有付費管道都已改成 PAYUNi，不能殘留自行轉帳 |
| 3 | 命盤資料來源 | 獨立輸入欄不碰 destiny-engine，**但必須 copy destiny-engine 的所有精準計算邏輯，不能自己亂編**（memory feedback：命理計算禁止寫近似版） |
| 4 | 21×33 mapping 表 | 「我只相信你」→ 逸君要我統合 docx 裡三套提案成最適合的一版 |
| 5 | MVP 範圍 | **A（21 張 + 六段 + 複製）+ 信箱寄送 + 自訂願望輸入欄**（使用者可輸入「我想要馥靈之鑰在最短時間內收入豐盛」這種個人化許願） |
| 6 | 上線順序 | **兩個一起規劃一起上線** |

---

## 🏗️ 規格書（下次 session 動工前要先確認這份 mapping）

### 頁面檔名
- 繁體：`abundance-prayer.html`（逸君指定）
- 簡體：`sc/abundance-prayer.html`
- 命盤運算邏輯**直接 copy `destiny-engine.html` 的 JS**，不重寫、不簡化

### 流程（6 步驟）

1. **輸入生日資料**（獨立欄位、不跨頁、不呼叫 destiny-engine.html）
2. **33 合 1 計算**（用 destiny-engine 同一份 `js/destiny-calc.js` + `ephemeris-1920-2060.json` + `lunar.min.js` + `kangxi-strokes.js`）
3. **自訂願望輸入**（文字框，使用者寫「我想要XXX」）
4. **抽 21 張牌**（H.O.U.R × L.I.G.H.T 第二軌，4 區塊 × 5 張 + 1 核心）
5. **付費 PAYUNi NT$999**（現有 hl-payment.js + payuni-create.js）
6. **AI 生成六段祈禱文**（Sonnet 4.6）+ **複製全文** + **信箱寄送**（send-report.js 或 MailerLite）

### Vercel API 架構（決策 1 = B）

**合併進 `api/reading-services.js`** 新增 mode：

```js
// api/reading-services.js 新增
case 'abundance-prayer':
  return generatePrayer({
    cards_21,           // 前端只傳牌卡編號
    birth_data,         // 前端只傳生日資料
    destiny_core,       // 前端已算好的 33 合 1 濃縮結果
    user_wish,          // 自訂願望一句話
    user_email,         // 信箱寄送用
    payment_token       // PAYUNi 驗證
  })
```

**安全鐵律（逸君原則）：**
- ❌ 130 張牌卡 DNA 絕不進前端（只傳編號）
- ❌ AI prompt 完整邏輯絕不進前端
- ❌ 系統指令絕不進前端
- ✅ 前端只收到最終祈禱文輸出（黑盒子）

### Firebase 結構

```
prayer_sessions/{uid}/{auto}
  ├── birth_data
  ├── destiny_core (33 合 1 濃縮)
  ├── cards_21 (只存編號)
  ├── user_wish
  ├── prayer_output (六段文字)
  ├── email_sent_at
  ├── paid_at
  ├── price: 999
  └── created_at
```

---

## 🎴 21×33 Mapping 設計（核心靈魂，動工前必對齊）

### 21 張牌結構（沿用既有矩陣定義）

```
第 0 張｜核心誓約位     → 整篇總主題 + 核心啟動句
第一區塊（H 身心校準）：1-5（L/I/G/H/T）→ 身體宣言
第二區塊（O 智慧辨識）：6-10（L/I/G/H/T）→ 晨起宣言（身份）
第三區塊（U 潛能解鎖）：11-15（L/I/G/H/T）→ 豐盛宣言
第四區塊（R 行動進化）：16-20（L/I/G/H/T）→ 使命宣言 + 年度宣言
```

### 33 命理 → 4 解碼層（餵入對應區塊）

| 解碼層 | 對應區塊 | 吃進去的命理系統 |
|---|---|---|
| 身份層 | 第一區塊（自我本質） | 八字 / 紫微 / 生命靈數 / 馥靈秘碼 / 人類圖 / 瑪雅曆 / 姓名解碼 / 卡巴拉 |
| 身體層 | 第二區塊（身體歸位） | 五運六氣 / 九星氣學 / 生日色彩 / 人類圖能量運作 / 五音五味 / 月亮星宿 / 馥靈秘碼經絡對應 |
| 豐盛層 | 第三區塊（豐盛承接） | 紫微財帛結構 / 八字財星 / BG5 商業 / 奇門遁甲 / 河洛理數 / 生命密碼 / 基因天命 |
| 使命層 | 第四區塊（使命發光） | 西洋占星 / 人類圖 / 紫微官祿／命宮 / 瑪雅曆 / 卡巴拉 / 前世今生 / 宿曜 / 七政四餘 |

### 六段祈禱文輸出（以逸君範本為骨架）

1. **今日主題標題**（來自核心牌 + 流年）
2. **晨起宣言**（來自 O 區塊 T 禮物位 + 命理身份層）
3. **身體宣言**（來自 H 區塊完整 5 張 + 身體層命理）
4. **豐盛宣言**（來自 U 區塊完整 5 張 + 豐盛層命理 + **自訂願望注入**）
5. **流年／年度宣言**（來自 R 區塊 L + T + 流年數）
6. **使命宣言 + 收尾**（來自 R 區塊 G + 核心牌 + 使命層命理）

固定收尾句：「我準備好了。我值得。我允許。如是臨在，圓滿豐盛。」

---

## ⚠️ 動工前必做的 3 件驗證

### ✅ 驗證 1：付費管道全站掃描（逸君附加任務）

Grep 已經跑過，**43 個檔案含「匯款 / ATM / 轉帳 / 人工確認 / LINE 截圖 / 銀行帳號」關鍵字**。下次 session **必須逐一分類**：

- A. 真殘留（當前有效自行轉帳流程）→ 改成 PAYUNi
- B. 舊文字殘留（FAQ 寫歷史、admin 金流後台）→ 保留或文字調整
- C. 誤傷（例如 pricing.html 寫「接受轉帳」但實際上已接 PAYUNi）→ 修正

43 個檔案清單：
```
app.html, akashic-reading.html, yuan-chen-reading.html, past-life.html, chiron-lilith.html,
draw-hl.html, pricing.html, nail-course.html, massage-guide.html, hourlight-philosophy.html,
hour-training.html, fuling-map.html, draw-hl-guide.html, birthday-gift.html,
ai-templates-prompt.html, ai-templates-operations.html, ai-guide-monthly.html, ai-guide-faq.html,
partner-dashboard.html, booking-admin.html, admin-yuan-chen-reading.html, admin-unlock.html,
admin-payments.html, admin-dashboard.html, admin-akashic-reading.html, runes-oracle.html,
course-slides\H4.html,
（以及 sc/ 目錄下 16 個對應簡體版）
```

下次 session 流程：
1. 一個一個 Read 看 context
2. 分類 A/B/C
3. 列 A 清單給逸君確認要改的
4. 改好才算完成「驗證」

### ✅ 驗證 2：21×33 mapping 表最終拍板

我上面給的 4 解碼層是 docx 文件整合出來的**初版建議**，動工前要：
- 產一版完整 mapping 表（每張牌對哪個命理欄位 / 用什麼語氣）
- Discord 丟給逸君審
- 她確認後才寫 AI prompt

### ✅ 驗證 3：命盤計算邏輯 copy 不能漏

逸君明確要求：**完全 copy destiny-engine，不能自己亂編**。

動工前要：
- Read `destiny-engine.html` 完整計算段落
- Read `js/destiny-calc.js`
- Read `js/ephemeris-1920-2060.json` 載入方式
- Read `js/lunar.min.js` + `js/kangxi-strokes.js`
- 確認在 `abundance-prayer.html` 引用**完全一樣的 JS 檔案**（不複製貼上、不修改邏輯）

鎖定規則（CLAUDE.md 第二部分 #1 + #4 + #5）：
- destiny-engine.html 命盤計算邏輯 → 不動
- 紫微命宮/身宮公式 → 不改
- 生命路徑數公式 → 不改

---

## 💰 付費流程（PAYUNi NT$999）

用現有：
- `api/payuni-create.js`（建單）
- `api/payuni-notify.js`（回呼）
- `assets/js/hl-payment.js`（前端）

流程：
1. 使用者填生日 + 願望 + Email
2. 按「產生我的祈禱文 NT$999」
3. 彈 PAYUNi 付款頁
4. 付款成功 → payuni-notify.js 觸發 → Firestore `prayer_sessions` 寫入 `paid_at`
5. 觸發 `api/reading-services.js` (mode=abundance-prayer) 呼叫 Sonnet 4.6
6. 生成六段祈禱文 → 寫 Firestore → 呼叫 send-report.js 寄信
7. 前端顯示結果 + 複製按鈕

---

## 📧 信箱寄送

用 `api/send-report.js` 或 MailerLite MCP。

郵件格式：
- 主旨：`🔑✨ 您的吸引力法則每日祈禱文 — YYYY-MM-DD`
- 內文：六段祈禱文 HTML 排版 + 儀式建議 + 自訂願望 + PDF 附件（可選）

---

## 🛠️ 今天（2026-04-16）已裝好的 Claude Code 設定（重開後生效）

| 設定 | 生效 |
|---|---|
| `cc` / `cc-h-o` / `cc-h-s` / `cc-s` 四個啟動指令 | ✅ |
| NO_FLICKER 畫面優化 | ✅ |
| 8 條危險指令黑名單 | ✅ |
| Accept Edits 權限模式 | ✅ |
| Firecrawl MCP（抓網頁） | ✅ |
| Playwright MCP（瀏覽器自動化） | ✅ |
| 雙行狀態列（🔑✨ + 模型 + Context + 5h/7d + Git + 時間戳） | ✅ |
| Stop hook → Discord 自動通知（HourLight / 潮欣分流） | ✅ |
| 四個專案 slash command（/new-quiz, /update-card, /sync-notion, /seo-blog） | ✅ |

### 重開流程
1. 關掉現在的 Claude Code
2. 打開 Windows Terminal / PowerShell / Git Bash
3. 輸入 `cc-h-o`（建議用 Opus 4.6 做這個大工程）
4. Claude Code 會啟動、自動 cd 到 `D:\OneDrive\桌面\HourLight.github.io`、顯示雙行狀態列
5. 叫下一個 session 先 Read 這份交接文件：
   ```
   Read D:\OneDrive\桌面\HourLight.github.io\.claude\handovers\20260416-abundance-prayer-spec.md
   ```

---

## 📝 下次 session 動工順序建議

**Phase 0：讀交接 + 對齊**
1. Read 這份交接文件
2. Read `CLAUDE.md`（第一部分品牌語感 + 第二部分工程規範）
3. 確認 Firecrawl + Playwright MCP 都載入（`/mcp`）

**Phase 1：桌布 CTA（小、快、先做）**
1. Read `destiny-engine.html` 找到結果區塊
2. Read `wealth-wallpaper.html`（如果檔名不同要 grep 找）
3. 在命盤結果下方加一張 CTA 卡片連過去
4. 繁 + 簡兩版同步
5. git commit + push

**Phase 2：付費管道驗證（逸君附加任務）**
1. 把 43 個檔案逐一分類 A/B/C
2. A 類清單 Discord 丟給逸君確認
3. 改完 A 類才算「已全面改 PAYUNi」

**Phase 3：祈禱文頁規格對齊**
1. 產完整 21×33 mapping 表（每張牌 → 哪個命理欄位 → 什麼語氣）
2. 產 AI prompt 完整草稿
3. Discord 丟給逸君審
4. 她確認後才寫代碼

**Phase 4：開發 abundance-prayer.html**
1. Read destiny-engine.html 完整計算邏輯
2. 建 abundance-prayer.html（獨立輸入 + copy 計算 JS）
3. 接抽牌 UI（21 張 × H.O.U.R × L.I.G.H.T 矩陣）
4. 接 PAYUNi 付費流程
5. 擴充 api/reading-services.js 加新 mode
6. 寫 AI prompt
7. 接 send-report.js 寄信
8. Firebase prayer_sessions 集合建
9. 繁簡雙版 + sitemap

**Phase 5：destiny-engine.html 加 2 個 CTA**
1. 桌布 CTA（Phase 1 已做）
2. 吸引力法則 CTA 指向新頁

**Phase 6：完成後**
1. git commit + push
2. Stop hook 自動發 Discord（已裝好）
3. 手動 `/sync-notion` 同步到 Notion 官網工程父頁面

---

## ⚠️ 絕對不能犯的錯（memory + CLAUDE.md 鐵則）

1. ❌ 不動 destiny-engine.html 的計算邏輯（鎖定規則 #1）
2. ❌ 不動 draw-hl.html 抽牌規則（鎖定規則 #2）
3. ❌ 命理計算禁止寫近似版（memory feedback）
4. ❌ 130 張牌卡名稱絕對不能改
5. ❌ 不寫假客戶見證/評價/數據（memory feedback）
6. ❌ nav / footer / 按鈕不放 emoji（高端品牌 UI）
7. ❌ 禁用句型「你不是 XXX，是 XXX」
8. ❌ 禁忌詞：療癒/治癒/調頻/對頻/啟數/王座塔
9. ❌ 秘密協議：對外內容絕不透露網站是 AI/Claude Code 建的
10. ❌ 「資源/」「圖片/」資料夾永遠不可上傳（.gitignore 已排除）

## ✅ 必做

1. ✅ 完成後 Discord reply 到 `1488487050557653032`（Stop hook 自動做）
2. ✅ 完成後同步到 Notion 官網工程父頁面 `32a57a42-1621-810a-963a-f0a37dda21ce`
3. ✅ 品牌語感：淡、不激動、像閨蜜說真話、長短句交叉、廢話留一點
4. ✅ 雙層結構：第一層溫暖接住，第二層高 EQ 毒舌
5. ✅ 對外用「您」、品牌文案用「你」
6. ✅ 繁體 + 簡體雙版同步
7. ✅ 完全 copy destiny-engine 的所有計算邏輯

---

**交接結束。下次 session 用 `cc-h-o` 開，先 Read 這份，再開始 Phase 0。**
