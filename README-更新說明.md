# 🔑 hourlightkey.com 完整網站更新包

## 📅 更新日期：2026-01-24

---

## ✅ 已更新內容

| 項目 | 數量 | 說明 |
|-----|------|------|
| HTML 檔案 | 68 個 | 所有網址已改成 hourlightkey.com |
| 更新處數 | 862 處 | canonical、og:url、og:image、Schema.org 等 |
| sitemap.xml | 1 個 | 網址已更新 |
| robots.txt | 1 個 | sitemap 路徑已更新 |
| CNAME | 1 個 | 新增（告訴 GitHub 你的域名） |

---

## 🔄 具體更新項目

| 標籤 | 舊值 | 新值 |
|-----|------|------|
| canonical | hourlight.github.io | hourlightkey.com |
| og:url | hourlight.github.io | hourlightkey.com |
| og:image | hourlight.github.io/og-image.jpg | hourlightkey.com/og-image.jpg |
| twitter:image | hourlight.github.io/og-image.jpg | hourlightkey.com/og-image.jpg |
| Schema.org URL | hourlight.github.io | hourlightkey.com |

---

## 📋 安裝步驟

### 方法一：覆蓋全部檔案（推薦）

1. 備份你的 GitHub repo（以防萬一）
2. 把這個 zip 裡面的**所有檔案**上傳到 GitHub
3. 選擇「覆蓋」現有檔案
4. Commit changes

### 方法二：只上傳有變動的檔案

如果你有其他自訂修改不想被覆蓋：
1. 只上傳這 3 個檔案到根目錄：
   - CNAME（新增）
   - sitemap.xml（覆蓋）
   - robots.txt（覆蓋）
2. 然後慢慢把 HTML 檔案一個一個覆蓋

---

## ⚠️ 重要提醒

1. **先確認 DNS 已生效**
   - 測試 https://hourlightkey.com 能否打開
   - 如果打不開，等 1-24 小時

2. **上傳後檢查**
   - 隨機開幾個頁面
   - 右鍵 → 檢視原始碼
   - 確認 canonical 是 hourlightkey.com

3. **重新提交 Sitemap**
   - 去 Google Search Console
   - 刪除舊的 sitemap
   - 重新提交 sitemap.xml

---

## 📂 檔案清單

```
├── CNAME                 ← 新增
├── sitemap.xml           ← 更新
├── robots.txt            ← 更新
├── index.html            ← 更新
├── fuling-mima.html      ← 更新
├── draw-hl.html          ← 更新
├── ... (共 68 個 HTML)
├── assets/
├── js/
└── hourlight/
    ├── index.html        ← 更新
    ├── about.html        ← 更新
    └── ...
```

---

## 🎉 完成後測試

這些網址都應該正常：
- https://hourlightkey.com ✅
- https://www.hourlightkey.com ✅
- https://hourlightkey.com/fuling-mima.html ✅
- https://hourlightkey.com/draw-hl.html ✅

舊網址會自動跳轉：
- https://hourlight.github.io → https://hourlightkey.com ✅

---

## 🔧 製作者
Claude AI 協助製作
