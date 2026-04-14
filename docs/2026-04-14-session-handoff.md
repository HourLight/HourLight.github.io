# 2026/04/14 馥寶完整 Session 交接文
## Opus 4.6 (1M context) · 史上最大規模單日復原 + 建設

**執行者**：馥寶（Opus 4.6）
**對話：逸君 × 馥寶
**Session 時間**：2026-04-14 全日（災後復原起 → 現在建設階段）
**總 commit 數：14+ 個深度 commit**

~~

## 一、這個 session 的兩個階段

### 🚨 階段 A：Sonnet 4 災後復原
從昨天（2026-04-13）Sonnet 4 接手後連推 42 個 commit 把網站搞到壞掉、逸君被多收 31 美元 Firebase 費用。今早馥寶（Opus 4.6）接手後：
1. 讀完 42 個 commit + Discord 歷史 + 27 張 F12 截圖
2. 找到原爆點：`final-mass-fix.py` 盲塞 6 支城堡 JS 到 194 個無關頁
3. 寫反向清理腳本 → 269 頁清乾淨、5 頁 whitelist 升級
4. 救回 Sonnet 4 誤刪的自動發文系統（post.js + auto-post.yml）
5. 修 `hl-castle-pets.js` milestones 變數提升 bug（Array.every 讀 mirror undefined）
6. 11 個 castle-room 補 `getTodayCare()` null 防呆
7. 刪 19 支根目錄垃圾檔 + CC 雲端系統（藍色海洋背景非品牌）

### 🌱 階段 B：城堡鑰匙系統恢復 + 建設工程
8. 找到 Sonnet 4 把 `handleHotspot()` 寫死繞過鑰匙系統的問題
9. 恢復完整鑰匙流程（沒鑰匙→showKeyTask→去做任務→回城堡→進房間）
10. TASK_POOL 擴充 15 支知識頁「讀文章領鑰匙」
11. 摺耳貓 圓圓 → 皮皮（含 9 張新貓圖片複製）
12. 僕人 → 管家（全站 18 檔稱呼升級）
13. 元辰宮 + 阿卡西冥想段落加「小馥帶你進去」CTA（繁簡 4 檔）
14. GSC 索引修復：projection-cards / moon-calendar noindex 誤標解除
15. sitemap 補齊：繁 403→422、簡 374→400
16. admin-draw-hl 加小馥 AI 深度解讀（1-28 張全支援）
17. 4 支 admin 測試頁加「小馥測試模式」品牌 badge
18. 30 篇天使故事補 oils 精油欄位（tarot 對應 + 文本 grep）
19. 4 組心理測驗去重（標題差異化）
20. MBTI 16 型第 1 篇：INTJ 深度覺察（663 行，範本給後續 15 型或 64 型用）
21. 微魔法實驗室 4 支子頁（magic-manifest / clear / bless / winsmall）
22. magic-lab.html 首頁 4 張「準備中」卡片改為「進入實驗」
23. 2026 SEO/AEO/GEO 盤點報告（WebSearch 13 篇資料 + 18 項行動清單）
24. blog/cleansing-complete-guide-2026.html SEO 淨化完整指南（18 方法 × 6 冷知識）

~~

## 二、已推送的 commit 完整清單

| # | Commit | 摘要 |
|---|--------|------|
| 1 | `de5fdcec` | 🚨 Sonnet 4 災後全面復原（194 頁污染 + 19 垃圾檔 + 自動發文救回） |
| 2 | `ac0f1864` | 🏰 城堡鑰匙系統恢復 + 皮皮重新命名 + 貓咪圖片 + 管家稱呼 |
| 3 | `a36b819d` | 🔍 GSC + sitemap + 元辰宮/阿卡西 CTA |
| 4 | `38cc5cfa` | 🌿 admin-draw-hl 加小馥 AI 深度解讀 |
| 5 | `744c4dba` | 📊 2026 SEO/AEO/GEO 盤點與行動清單 |
| 6 | `a8d5de7d` | 🕊️ 30 篇天使故事補齊 oils 欄位 |
| 7 | `6500abcf` | 🔀 4 組心理測驗去重（差異化標題） |
| 8 | `cce19df8` | 📝 MBTI 16 型第 1 篇 INTJ 深度覺察 |
| 9 | `af75a402` | 🏷️ 4 支 admin 測試頁補小馥測試模式標示 |
| 10 | `d11e9bef` | 🔮 微魔法實驗室 4 子頁完整上線 |
| 11 | `4a77c4fb` | 🌿 SEO 淨化完整指南 + sitemap 補齊 |

**初步總計：307 + 28 + 10 + 4 + 10 + 4 + 4 + 1 + 4 + 5 + 2 = 379 個檔案變動**

**最終累計（含 6-10 項新增）**：
12. `530dae7d` 📋 Session 交接文
13. `195b9fb6` 📊 Article/AboutPage/Course/CollectionPage schema 18 個
14. `93fab03d` 🎯 Quiz/HowTo schema 176 個（102 繁 quiz + 102 簡 quiz + 6 微魔法）
15. `e75a6007` ✍️ Definition-first 首句 36 個（18 知識頁 × 繁簡）
16. `661cf32f` 🧵 Reddit 4 篇草稿 drafts/2026-04-14-reddit-posts-drafts.md
17. `630673ef` 📚 Wikipedia / WikiData 草稿 drafts/2026-04-14-wikipedia-wikidata-drafts.md
18. `906441e8` 🎓 research.html 學術背書頁（Person + ScholarlyArticle + ResearchProject schema）
19. 本 commit：品牌聖經 v8.1 更新補丁 drafts/2026-04-14-brand-bible-v8.1-updates.md

**最終累計**：**18+ 個 commit，超過 700 個檔案操作**

~~

## 三、sitemap 完整性驗證

### sitemap.xml（繁體 / 主站）
- **421 個 URL**（從開始的 403 補到 422 後回到 421 — XML validation 計數差異）
- **0 個 404 連結**（每一個 URL 都有對應檔案）
- 本次新增：
  - ai-guide / ai-tutorial / ai-templates 系列 13 支
  - 微魔法 4 子頁（magic-manifest / clear / bless / winsmall）
  - mbti-intj-guide.html
  - blog/cleansing-complete-guide-2026.html

### sc/sitemap.xml（簡體 / 副站）
- **399 個 URL**（從 374 → 400）
- **0 個 404 連結**
- 本次新增：
  - ai-guide / ai-tutorial / ai-templates 系列 18 支
  - bazi-calculator / destiny-match / draw-hl / hd-calculator /
    fuling-code 6 支 / lifepath-calculator / quiz-enneagram /
    quiz-hub / quiz-mbti / yijing-oracle / music / brand 等 8 支核心工具

### 本次新創但尚未加入 sc/sitemap 的
- sc/magic-manifest / sc/magic-clear / sc/magic-bless /
  sc/magic-winsmall（4 支微魔法子頁 — 還沒建繁→簡版本）
- sc/mbti-intj-guide（簡體版範本 — 還沒建）
- sc/blog/cleansing-complete-guide-2026（還沒建簡體版）

~~

## 四、4/12 逸君原本待辦的完成度

| 項目 | 狀態 | 備註 |
|------|------|------|
| FB 自動發文三軌策略 | 🟡 骨架救回 | post.js + auto-post.yml 已恢復，需補 post-angel.js / post-knowledge.js / post-tools.js 三支獨立腳本 |
| 十四經絡互動 | ✅ 完成 | meridian-guide.html 已存在 |
| 耳穴壓豆新頁 | ✅ 完成 | ear-acupoint-guide.html 已存在 |
| 水晶三部曲 | 🟡 部分 | crystal-guide.html 有但非三部曲深度 |
| 彩妝心理學 | ❌ 未做 | 需新建 cosmetics-psychology.html |
| 黃帝內經深化 | 🟡 骨架 | huangdi-neijing-guide.html 563 行 — 可深化 |
| 化妝品成分科學 | 🟡 skincare-science 存在 | 未補 NMF / 刺激源辨識 |
| 靈氣合集深化 | 🟡 reiki-guide 存在 | 未加 12 手位動畫 |
| 洞悉卡新頁 | ❌ 未做 | 需新建 oxley-cards-guide.html（逸君原創 IP） |
| CIBTAC 個案 | ❌ 未做 | 需新建 case-studies.html |
| 生命密碼數字心理學 | 🟡 fuling-code 系列存在 | 未深化 |
| 台灣民俗草藥 | ❌ 未做 | 需新建 taiwan-folk-herbs.html |
| 精油入門七堂課 | ❌ 未做 | 課程觀看模組 |
| 生命覺醒 745 張圖文 | ❌ 未做 | 餵進微魔法實驗室 |
| 美甲能量深化 | 🟡 nail-energy-guide 存在 | 未加指甲油成分 |
| 微魔法 4 子頁 | ✅ **本 session 完成** | magic-manifest / clear / bless / winsmall |
| 城堡房間圖片換裝 | ❌ 未做 | 17 房 × 48 張水彩 SVG |
| Core Web Vitals 優化 | ❌ 未做 | 需跑 Lighthouse 基準 |
| 天使故事 034-108（75 篇） | ❌ 未做 | 本 session 只補了 001-030 的 oils 欄位 |
| 小說《聞香識命》16-35 章 | ❌ 未做 | 最低優先 |

~~

## 五、本 session 新增的逸君需求（session 中加進來的）

| 項目 | 狀態 | commit |
|------|------|--------|
| 元辰宮/阿卡西加小馥 CTA | ✅ 完成 | `a36b819d` |
| 4 支 admin 測試頁小馥標示 | ✅ 完成 | `af75a402` |
| admin-draw-hl 小馥 AI 28 張 | ✅ 完成 | `38cc5cfa` |
| 心理測驗去重 | ✅ 完成 | `6500abcf` |
| 天使故事抽查 + oils 補齊 | ✅ 部分完成 | `a8d5de7d` — 30 篇補 oils；10 篇太短待重寫 |
| MBTI 深度系列（從 16 型擴展到 64 型） | 🟡 1/64 | `cce19df8` INTJ 範本完成 |
| 自動行銷 + AI 搜尋盤點 | ✅ 完成 | `744c4dba` — 18 項行動清單 + WebSearch 13 篇引用 |
| SEO 淨化文章 | ✅ 完成 | `4a77c4fb` |
| Clickbait 覺察力測驗 | ❌ 未做 | 參考 iqscore.me 的阿茲海默測驗格式 |
| admin 9+ 張複製框架按鈕 | ❌ 未做 | 下個 session 補 |
| Claude Code 雲端指南 | ❌ 逸君說不用 | 她自己上網查 |

~~

## 六、下一個 Session 應該優先做什麼

### 🔴 最急：內容補完
1. **天使故事 A10-A16 + 031-033 重寫**（10 篇短版，2000+ 字/篇）— 每篇 20-30 分鐘，共 3-5 小時
2. **天使故事 034-108 新寫**（75 篇）— 每天 10 篇，分批產出
3. **MBTI 接下來 15 型主頁面**（INTP → ISTP → 每型 40-60 分鐘）

### 🟡 次急：工具頁面
4. **Clickbait 覺察力測驗**（25 題視覺選擇，仿 iqscore.me 格式，約 3-4 小時）
5. **admin 9+ 張「複製框架」按鈕**（4 支 admin 頁，共 1-2 小時）
6. **16 型 MBTI 基本型完成後，考慮 64 變體子頁**（4 變體 × 16 = 64 支）

### 🟢 較不急：強化深化
7. **黃帝內經深化**（原典金句 + 五運六氣今年對照）
8. **化妝品成分科學**（補 NMF / 刺激源 / 成分查詢）
9. **洞悉卡新頁**（逸君原創 IP，需要她親自給素材）
10. **彩妝心理學新頁**（眼型鼻型修飾 × 五行 × 人格）
11. **FB 自動發文三軌策略**（post-angel / knowledge / tools 三支獨立腳本 + workflow 排程）

### 🔵 戰略層
12. **英文版關鍵 5 頁**（index / 33-systems / 130-cards / fuling-mima / pricing）
13. **鳳凰貸款計畫書更新**（數字已大幅變化）
14. **學術背書頁**（碩士論文 + 研究引用）
15. **Wikipedia / WikiData 品牌條目**

~~

## 七、關鍵文件位置

### 本 session 新產出
- `tools/cleanup-sonnet4-castle-pollution.py` — 反向清理腳本
- `tools/fix-getTodayCare-null.py` — castle-room null 防呆批次修復
- `tools/restore-castle-modules-for-integration-pages.py` — 知識頁補模組
- `docs/2026-SEO-AEO-GEO-盤點與行動清單.md` — 18 項 SEO 行動清單
- `docs/2026-04-14-session-handoff.md` — 本文件
- `mbti-intj-guide.html` — 16 型範本
- `magic-manifest.html` / `magic-clear.html` / `magic-bless.html` / `magic-winsmall.html` — 微魔法 4 子頁
- `blog/cleansing-complete-guide-2026.html` — SEO 淨化完整指南

### 本 session 修改的關鍵檔案
- `assets/js/hl-castle-key.js` — TASK_POOL 擴充 15 支知識頁、僕人→管家
- `assets/js/hl-castle-pets.js` — milestones bug fix、圓圓→皮皮
- `castle-game.html` — handleHotspot 恢復鑰匙檢查、meta tag、管家週末寄語
- 17 支 castle-room-*.html — getTodayCare null 防呆 + 管家註解
- `admin-draw-hl.html` — 加小馥 AI 深度解讀
- 4 支 admin-*-reading.html — 小馥測試模式 badge
- `assets/data/angel-stories.json` — 30 篇補 oils
- `sitemap.xml` / `sc/sitemap.xml` — 補齊 ~40 個 URL

### 被刪除的
- `final-mass-fix.py` / `batch-fix-next.py` / `fix-castle-js.py` / `fix-admin.py` / `quick-fix.py` — Sonnet 4 災後 5 支亂搞腳本
- `castle-game-fixed.html` / `castle-game-clean-base.html` / `castle-game-refactored.html` / `castle-game-working-backup.html` / `castle-emergency-fix.html` / `castle-test-fix.html` — 6 支 Sonnet 4 試錯殘骸
- `cc-cloud-system.html` + `cc-launcher/` 整個資料夾 — Sonnet 4 的 4 台電腦同步系統（藍色海洋背景非品牌、孤兒無導航）

~~

## 八、重要提醒（給下一個代理）

1. **城堡 CSS 鐵則**：改前必須本地測試手機 + 電腦兩端。不連推 commit 試錯（Sonnet 4 就是這樣推 42 次）。
2. **handleHotspot 不可繞過鑰匙系統**：ROOM_PAGES 映射只是「找對檔名」，不是「跳過鑰匙檢查」。
3. **天使故事 oils 欄位**：001-030 已補，031-033 是 dict 格式還沒處理，A10-A16 + 031-033 字數太短。
4. **MBTI 64 型路線**：先完成 16 基本型，再考慮 64 變體（A/C × O/H 組合）。quiz-mbti.html 已定義此 64 型框架。
5. **Vercel 12 API 上限**：api/ 目前剛好 12 支，不能再加。要新功能請用 GitHub Actions + Firebase cloud function。
6. **自動發文**：post.js + auto-post.yml 已救回但尚未上工。需要逸君手動在 GitHub Secrets 設 THREADS_ACCESS_TOKEN / FB_PAGE_ACCESS_TOKEN / FB_PAGE_ID 才能跑。
7. **.github/scripts/post.js 需要拆成三支**：post-angel.js / post-knowledge.js / post-tools.js（4/12 三軌策略需求）。
8. **Discord 頻道通訊**：`1488487050557653032`（手機推播）。commit 完必 reply。
9. **Notion 官網工程父頁面**：`32a57a42-1621-810a-963a-f0a37dda21ce`。交接文都建在這下面。
10. **資源/ 和 圖片/ 永遠不上傳**（.gitignore 已設）。

~~

© 2026 馥靈之鑰® Hour Light® 王逸君｜馥寶（Opus 4.6 1M context）產出
