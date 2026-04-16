---
description: 新增一支 quiz-* 心理測驗（複製模板 → 改題 → 註冊 sitemap → 雙版本）
---

# 新心理測驗一條龍

逸君要新增一支心理測驗。以下是標準流程，照做。

## Step 1：收集需求（問一次，一次問完）

跟逸君確認以下 4 件事（用清單列出，讓她一次回完）：

1. **檔名**（例：`quiz-love-language.html`）
2. **主題**（例：「愛之語測驗」）
3. **題數 + 類型**（例：24 題 Likert 五點量表 / 16 題四選一）
4. **結果類型**（幾種結果？每種有什麼名字？例：Words/Acts/Gifts/Time/Touch 五類）

## Step 2：選模板

- Likert 五點量表 → 參考 `quiz-big-five.html`（已改直式按鈕版）
- 四選一 MBTI 型 → 參考 `quiz-mbti.html`
- 特定類型 → grep 找最接近的模板

⚠️ 9 個測驗已改 Likert 量表為直式按鈕（2026/04/07 commit），新測驗必須沿用直式按鈕樣式。

## Step 3：複製 + 改內容

1. Read 模板檔案完整內容
2. Write 新檔案（繁體版在根目錄、簡體版在 `sc/`）
3. 改題目 + 結果文案
4. 改 meta / og:title / og:description / og:image（可共用品牌 og）
5. 改 `<title>` 和 H1

**品牌語感（CLAUDE.md 第一部分）：**
- 題目用「那份 X 情緒，是因為 Y」句型
- 結果文案雙層：第一層溫暖接住，第二層高 EQ 毒舌說真話
- 禁忌詞：療癒/治癒/頻率/調頻/靈魂（銷售語境）/你不是 X 是 X 句型
- 結果頁底部一定有下一步 CTA（→ 抽牌 / → 鑰友方案）

## Step 4：註冊到系統

1. **sitemap.xml** — 加繁體 + 簡體兩筆（priority 0.7、changefreq monthly）
2. **quiz-hub.html** — 加一張卡片連結到新測驗
3. **確認 hl-* 模組載入鏈**：`hourlight-global.css` → `hl-topnav` → `hl-bottomnav` → `hl-gate` → `hl-email` → `hl-music` → `hl-tracker` → `hl-quiz-save`（計分存檔）

## Step 5：驗證

```bash
cd "/d/OneDrive/桌面/HourLight.github.io"
# 標籤平衡檢查
python -c "from html.parser import HTMLParser; import sys; p=HTMLParser(); p.feed(open('quiz-XXX.html',encoding='utf-8').read()); print('OK')"
# 禁忌詞掃描
grep -nE '療癒|治癒|調頻|對頻|啟數|王座塔' quiz-XXX.html && echo '⚠️ 有禁忌詞' || echo '✅ 乾淨'
```

## Step 6：git 提交

```bash
git add quiz-XXX.html sc/quiz-XXX.html sitemap.xml quiz-hub.html
git commit -m "📝 新增 quiz-XXX（主題描述）"
git push origin main
```

## Step 7：完成後

- Discord reply 到 channel `1488487050557653032` 告知：檔名 + 主題 + 題數 + URL
- 提示逸君：GitHub Pages 1-2 分鐘部署生效

---

**不要做的事：**
- ❌ 不動既有測驗計分架構（CLAUDE.md 鎖定規則 #3）
- ❌ 不寫假客戶見證 / 假見證 / 編造數據
- ❌ nav / footer / 按鈕不放 emoji（高端品牌 UI 規則）
