# 馥靈之鑰官網 SEO + 效能優化報告

> 更新日期：2026年1月
> 版本：v3.0（含深化 SEO：FAQ/HowTo Schema + 關鍵字策略）

---

## 📊 優化摘要

| 項目 | 優化前 | 優化後 | 狀態 |
|-----|-------|-------|------|
| meta description | 43 頁 | 73 頁 | ✅ 100% |
| Open Graph 標籤 | 2 頁 | 73 頁 | ✅ 100% |
| Twitter Card | 0 頁 | 73 頁 | ✅ 100% |
| sitemap.xml | 無 | 有（73 頁） | ✅ 新增 |
| robots.txt | 無 | 有 | ✅ 新增 |
| 圖片 lazy loading | 3 頁 | 全站 | ✅ 100% |
| Schema.org 結構化資料 | 0 頁 | 71 頁 | ✅ 新增 |
| **Canonical URL** | 0 頁 | **72 頁** | ✅ **深化** |
| **Keywords meta** | 1 頁 | **56 頁** | ✅ **深化** |
| **FAQ Schema** | 0 頁 | **11 頁** | ✅ **深化** |
| **HowTo Schema** | 0 頁 | **5 頁** | ✅ **深化** |

---

## 📁 新增檔案清單

### SEO 檔案
| 檔案 | 說明 |
|-----|------|
| `sitemap.xml` | 網站地圖，包含 73 個頁面，已設定優先順序 |
| `robots.txt` | 搜尋引擎爬蟲指引 |

### 效能優化檔案
| 檔案 | 說明 |
|-----|------|
| `assets/js/hl-performance.js` | 效能優化模組（延遲載入、動畫觸發） |

---

## 🖼️ OG 圖片設定

### 重要提醒
所有頁面的 OG 圖片目前設定為：
```
https://hourlight.github.io/og-image.jpg
```

**請準備一張 OG 預設圖片：**
- 檔名：`og-image.jpg`
- 尺寸：1200 × 630 像素（FB/LINE 最佳顯示）
- 內容建議：品牌 Logo + 標語 + 黑金風格背景
- 檔案大小：< 300KB

上傳至 GitHub Pages 根目錄即可。

### 各頁面專屬 OG 圖片（進階）
如需為特定頁面設定專屬圖片，可修改該頁面的：
```html
<meta property="og:image" content="https://hourlight.github.io/YOUR-IMAGE.jpg">
<meta name="twitter:image" content="https://hourlight.github.io/YOUR-IMAGE.jpg">
```

---

## 🏷️ Schema.org 結構化資料

### 已加入的 Schema 類型

| Schema 類型 | 頁面數 | 用途 |
|------------|-------|------|
| **Organization** | 71 頁 | 公司/品牌資訊，全站通用 |
| **BreadcrumbList** | 23 頁 | 麵包屑導覽，改善搜尋結果顯示 |
| **WebApplication** | 7 頁 | 免費工具（計算器、抽牌等） |
| **Service** | 7 頁 | 服務項目說明 |
| **Course** | 3 頁 | 課程資訊 |
| **ItemList** | 3 頁 | 列表頁面（課程總覽、書籍等） |
| **Book** | 2 頁 | 書籍著作 |
| **Person** | 2 頁 | 創辦人資訊 |
| **WebSite** | 1 頁 | 網站搜尋功能（首頁） |
| **PodcastSeries** | 1 頁 | Podcast 節目 |
| **VideoGallery** | 1 頁 | YouTube 頻道 |
| **HealthAndBeautyBusiness** | 1 頁 | SPA 服務 |
| **ProfessionalService** | 1 頁 | 顧問服務 |

### Schema 帶來的好處

1. **豐富搜尋結果（Rich Snippets）**
   - Google 可能顯示評分、價格、課程資訊等
   - 提高點擊率 (CTR)

2. **知識圖譜收錄**
   - Organization schema 幫助 Google 理解品牌
   - 可能出現在搜尋結果右側知識面板

3. **麵包屑導覽**
   - 搜尋結果顯示頁面層級
   - 例如：首頁 > 課程 > 調頻培訓

4. **免費工具標記**
   - WebApplication schema 標示這是免費工具
   - 可能在 Google 搜尋「生命靈數計算器」時獲得較好排名

### 驗證 Schema

使用 Google 結構化資料測試工具驗證：
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)

輸入網址即可檢查 Schema 是否正確。

---

## 🎯 深化 SEO 優化

### Canonical URL（72 頁）

每個頁面都加入了 Canonical 標籤，防止重複內容問題：
```html
<link rel="canonical" href="https://hourlight.github.io/fuling-mima.html">
```

**好處：**
- 告訴 Google 這是頁面的「正式版本」
- 避免參數變體（?utm_source=...）造成重複內容
- 集中 SEO 權重到單一 URL

### Keywords Meta（56 頁）

為主要頁面設定了目標關鍵字：
```html
<meta name="keywords" content="馥靈秘碼, 生命數字, 農曆生日算命, 免費算命, 生命靈數">
```

**關鍵字策略：**
| 頁面類型 | 關鍵字策略 |
|---------|----------|
| 免費工具 | 「免費」「計算器」「線上」+ 功能名 |
| 服務頁面 | 服務名 + 「費用」「價格」 |
| 課程頁面 | 「課程」「培訓」「證照」 |
| 品牌頁面 | 品牌名 + 創辦人名 |

### FAQ Schema（11 頁）

在服務、課程、工具頁面加入常見問題結構化資料：

**已加入 FAQ 的頁面：**
- services.html（3 題）
- pricing.html（3 題）
- courses.html（3 題）
- hour-training.html（3 題）
- fuling-mima.html（3 題）
- draw-hl.html（3 題）
- lifepath-calculator.html（2 題）
- tarot.html（2 題）
- pet-energy.html（2 題）
- rainbow-bridge.html（2 題）
- enterprise.html（2 題）

**Google 搜尋可能顯示：**
```
馥靈秘碼 - 免費生命數字計算
hourlight.github.io

▼ 常見問題
• 馥靈秘碼是什麼？
  馥靈秘碼是根據農曆生日計算的生命數字系統...
• 馥靈秘碼準確嗎？
  馥靈秘碼結合東方農曆智慧與數字能量學...
```

### HowTo Schema（5 頁）

在工具頁面加入操作步驟結構化資料：

**已加入 HowTo 的頁面：**
- fuling-mima.html — 如何使用馥靈秘碼計算生命數字
- draw-hl.html — 如何使用馥靈之鑰線上抽牌
- lifepath-calculator.html — 如何計算生命靈數
- maya-calculator.html — 如何查詢瑪雅星系印記
- tarot-draw.html — 如何使用線上塔羅抽牌

**Google 搜尋可能顯示：**
```
如何使用馥靈秘碼
hourlight.github.io

步驟 1: 輸入農曆生日
步驟 2: 點擊計算按鈕
步驟 3: 查看解讀結果
```

---

## 🔍 SEO 優化詳情

### sitemap.xml 優先順序設定

| 優先級 | 頁面類型 | 更新頻率 |
|-------|---------|---------|
| 1.0 | 首頁 | daily |
| 0.9 | 核心服務、免費工具 | weekly |
| 0.8 | 品牌介紹、課程、重要功能 | weekly |
| 0.7 | 次要服務、計算器 | monthly |
| 0.6 | 子頁面、預覽頁 | monthly |
| 0.3~0.5 | 法律頁面、特殊用途 | yearly |

### robots.txt 設定

**允許爬取：**
- 所有公開頁面

**禁止爬取：**
- `/admin-dashboard.html`（後台管理）
- `/tarot-widget.html`（嵌入元件）
- `/js/`（JavaScript 檔案目錄）

---

## ⚡ 效能優化詳情

### 1. 圖片延遲載入
所有 `<img>` 標籤已加入 `loading="lazy"` 屬性：
```html
<img loading="lazy" src="image.jpg" alt="描述">
```

### 2. 效能優化模組
新增 `assets/js/hl-performance.js`，提供：
- Intersection Observer 延遲載入（舊瀏覽器 fallback）
- 動畫觸發觀察器
- 平滑滾動連結
- 字型載入狀態偵測

使用方式（在需要的頁面引入）：
```html
<script src="assets/js/hl-performance.js" defer></script>
```

### 3. 資源載入優化建議

在 `<head>` 中加入（大部分頁面已有）：
```html
<!-- DNS 預連線 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- 關鍵資源預載入 -->
<link rel="preload" href="assets/css/hourlight-global.css" as="style">
```

---

## 📋 後續建議

### 🔴 高優先（建議立即執行）

1. **上傳 OG 圖片**
   - 製作 `og-image.jpg`（1200×630px）
   - 上傳至 GitHub Pages 根目錄

2. **提交 Sitemap 至 Google**
   - 前往 [Google Search Console](https://search.google.com/search-console)
   - 新增網站：`https://hourlight.github.io`
   - 提交 Sitemap：`https://hourlight.github.io/sitemap.xml`

3. **驗證 OG 標籤**
   - [Facebook 分享偵錯工具](https://developers.facebook.com/tools/debug/)
   - [Twitter Card 驗證器](https://cards-dev.twitter.com/validator)
   - [LINE 社群分享測試](https://poker.line.naver.jp/debugger)

### 🟡 中優先

4. **壓縮 CSS/JS**
   - 建議使用 GitHub Actions 自動壓縮
   - 或使用線上工具壓縮後上傳

5. **圖片格式優化**
   - 將 JPG/PNG 轉為 WebP 格式
   - 可減少 30-50% 檔案大小

### 🟢 低優先

6. **結構化資料（Schema.org）**
   - 加入組織資訊
   - 加入 FAQ 結構化資料
   - 加入 Breadcrumb 導覽

---

## 🧪 測試清單

完成後請測試以下項目：

- [ ] 在 Facebook 分享首頁，檢查預覽圖片和文字
- [ ] 在 LINE 分享馥靈秘碼頁面，檢查預覽
- [ ] 使用 Google PageSpeed Insights 測試效能分數
- [ ] 確認 Google Search Console 已收到 Sitemap
- [ ] 搜尋「馥靈之鑰」確認 Google 索引狀態

---

## 📞 技術支援

如有任何問題，請在 Claude AI 對話中提供：
1. 問題頁面的完整 URL
2. 問題截圖或錯誤訊息
3. 使用的瀏覽器版本

---

*報告產生時間：2026年1月*
