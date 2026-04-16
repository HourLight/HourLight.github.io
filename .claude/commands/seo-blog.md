---
description: 寫一篇 SEO 文章（Firecrawl 查外鏈 → 馥靈馥語改寫 → 繁簡雙版 → 註冊 sitemap）
---

# 寫 SEO 文章

逸君要寫一篇 SEO 文章進 blog/。遵守品牌雙層轉譯原則（科學 + 馥靈馥語），目標是東南亞華人搜尋流量。

## Step 0：收集需求

跟逸君問：
1. **主題**（例：「MBTI 職業選擇怎麼看」「生命靈數 7 的人適合什麼工作」）
2. **主關鍵字**（要排上 Google 第一頁的那個詞）
3. **目標讀者**（對內 / 對外 / 美業人 → 決定語氣）
4. **要不要也出簡體版**（預設要）

## Step 1：查外鏈（用 Firecrawl MCP）

抓 2-3 篇權威來源當引用基礎（不要直接抄，只取事實 + 數據）：

```
mcp__firecrawl scrape URL
```

優先找：
- 學術論文、諾貝爾獎研究、黃帝內經、認知科學期刊（CLAUDE.md 第五部分的科學骨架）
- NAHA / IFA 官網（芳療類）
- APA / 哈佛心理學頁面（心理測驗類）

**不要用：** 內容農場、Wikipedia（當作起點 OK 但不要引用）、競品命理網站

## Step 2：結構（固定模板）

這個 blog 格式是她現有 29 篇 SEO 文章的標準版：

```
H1：[主關鍵字] + [戳心副標]
├── 導論段（鉤子 + 一個問題）
├── H2：為什麼會這樣（科學解釋，1-2 段）
├── H2：怎麼看 / 怎麼做（具體方法，3-5 個小點）
├── H2：常見誤區（破除迷思）
├── H2：[馥靈之鑰的角度]（自然導流到工具頁，例：destiny-engine.html / draw-hl.html）
├── H2：FAQ（5-8 題，加 FAQPage schema）
└── CTA（去抽牌 / 升級鑰友 / 加 LINE）
```

## Step 3：品牌語感（CLAUDE.md 第一部分必讀）

- 不要條列、不要「首先/其次/最後」、不要「綜上所述」
- 長短句交叉，廢話留一點
- 比喻用生活情境（手機當機 / Google Maps 帶錯路 / 做臉躺著突然想哭）
- **雙層結構**：第一層溫暖接住，第二層高 EQ 毒舌說真話
- 對外大眾用「您」，品牌感用「你」（判斷：這篇是 SEO 引流 → 用「你」）
- 禁忌詞掃：療癒/治癒/頻率/調頻/宿命論斷/你不是 X 是 X
- 謹慎詞：宇宙/能量場/顯化（科學語境保留、銷售語境改寫）
- 脈輪 → 大眾文案改「身體區域對應」

## Step 4：SEO 技術件

必加：
- `<meta name="description">` 150-160 字含主關鍵字
- `<meta property="og:title"/og:description/og:image>`
- FAQ 區用 JSON-LD FAQPage schema
- 內部連結：3-5 個連到 destiny-engine / draw-hl / quiz-* / services
- 外部連結：2-3 個連到 Step 1 查的權威來源（rel="noopener")

## Step 5：繁簡雙版

1. 繁體版存 `blog/{slug}.html`
2. 簡體版存 `sc/blog/{slug}.html`（用 OpenCC 或手動改，注意繁簡差異詞彙如 軟體→軟件）
3. 兩版互連 canonical / hreflang

## Step 6：註冊到系統

1. **sitemap.xml** — 加繁簡兩筆（priority 0.6 / changefreq monthly）
2. **blog/index.html** — 加新卡片（如果有 blog index）
3. 確認載入鏈：`hourlight-global.css` → `hl-topnav` → `hl-bottomnav` → `hl-gate` → `hl-email` → `hl-music` → `hl-tracker`

## Step 7：驗證 + 提交

```bash
cd "/d/OneDrive/桌面/HourLight.github.io"
# 禁忌詞掃
grep -nE '療癒|治癒|調頻|對頻|首先|其次|綜上所述|你不是' blog/{slug}.html && echo '⚠️ 有禁忌詞'
# 標籤平衡
python -c "from html.parser import HTMLParser; p=HTMLParser(); p.feed(open('blog/{slug}.html',encoding='utf-8').read()); print('OK')"
# git
git add blog/{slug}.html sc/blog/{slug}.html sitemap.xml
git commit -m "📝 新 SEO 文：[主題]（繁簡雙版）"
git push origin main
```

## Step 8：完成

Discord reply 到 `1488487050557653032`：主題 + URL + 主關鍵字 + 字數。

---

**不要做的事：**
- ❌ 不寫假客戶見證 / 假評價 / 編造數據（memory feedback）
- ❌ 不抄 Step 1 查到的外部內容（只取事實 + 數據，文字必須自己寫）
- ❌ 不放盛行 AI 套路：「在這個快節奏的時代」「在現代社會中」「值得一提的是」
- ❌ 高端品牌 UI 規則：文章裡 block 標題可以克制使用 emoji，nav/footer/按鈕不放
