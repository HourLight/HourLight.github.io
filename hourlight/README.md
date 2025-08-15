
# Hour Light — 靜態官網（GitHub Pages）

這個資料夾是一套可直接上線的靜態網站，包含：首頁、服務內容、豐碩計畫（HOUR × LIGHT）、關於、聯絡。

## 快速上線（兩種方式）

### A. 組織首頁（建議）
1. 在 GitHub 組織 `HourLight` 底下建立倉庫 **`hourlight.github.io`**（名稱必須完全相同）。
2. 把本專案所有檔案上傳到該倉庫的根目錄。
3. 進入 **Settings → Pages**，確認來源為 `Deploy from a branch: main / (root)`。
4. 稍待部署完成後，網站位址為：`https://hourlight.github.io`。

### B. 專案頁（如果不想佔用組織首頁）
1. 建立任意倉庫（例如 `site`）。
2. 上傳整包檔案到根目錄。
3. **Settings → Pages** 指定 `Deploy from a branch: main / (root)`。
4. 網址會是 `https://hourlight.github.io/<repo-name>`。

## 調整品牌文案
- 主要頁面：`index.html`, `services.html`, `blueprint.html`, `about.html`, `contact.html`
- 樣式：`assets/css/style.css`
- 腳本：`assets/js/main.js`
- Logo：`assets/img/logo.svg`（可用你自己的）

## 自訂網域（可選）
1. 購買網域，新增 CNAME 指向 `hourlight.github.io`。
2. 在倉庫根目錄新增 `CNAME` 檔，內容填你的網域，例如 `www.hourlight.tw`。
3. 到 **Settings → Pages** 勾選 Enforce HTTPS。

## 文案合規提醒
本網站所有內容已避開敏感醫療用語，並在頁尾加入法規提醒：
> 本系統與相關課程僅提供身心放鬆、能量調頻、情緒紓解、壓力管理、氣血循環調理等服務，絕非醫療行為，若有嚴重生理或心理問題，務必尋求合格醫療人員或心理專業人士協助。

## 設計說明
- 風格：黑／金／白，簡潔沉穩，企業級質感。
- 模型：**HOUR × LIGHT 成長閉環**（Highlight, Optimize, Unleash, Reinforce × Leverage, Identity, Growth, High‑value, Trust）
- 響應式支援手機與桌機。

---

Made with ❤️ by Hour Light.
