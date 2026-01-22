# 馥靈之鑰核心機密保護系統

## 系統架構

本系統將核心機密內容從 HTML 原始碼中分離，採用模組化設計保護商業機密。

```
js/
├── hl-core-data.js      # 核心數據模組（數字解讀、宮位、流年）
├── hl-calc-engine.js    # 計算引擎（H.O.U.R.、L.I.G.H.T. 演算法）
├── hl-card-system.js    # 牌卡系統（130張牌卡管理）
└── hl-system.js         # 統一初始化腳本
```

---

## 保護機制

### 1. 金鑰驗證
每個模組都需要正確的金鑰才能啟動，防止未授權存取。

### 2. 變數混淆
核心數據使用縮寫變數名稱，降低可讀性：
- `_ND` = Number Data（數字數據）
- `_PD` = Palace Data（宮位數據）
- `_YT` = Year Themes（流年主題）
- `_FT` = Fortune Themes（大運主題）

### 3. 物件凍結
使用 `Object.freeze()` 防止運行時被修改。

### 4. 動態載入
牌卡詳細解讀從外部加密 JSON 載入，不直接寫在 JS 中。

---

## 使用方式

### 基本初始化

```html
<!-- 載入模組 -->
<script src="js/hl-core-data.js"></script>
<script src="js/hl-calc-engine.js"></script>
<script src="js/hl-card-system.js"></script>
<script src="js/hl-system.js"></script>

<script>
// 初始化系統
HLSystem.init({
  loadCards: true  // 是否載入牌卡模組
}, function(status) {
  console.log('系統狀態:', status);
  
  if (status.ready) {
    // 系統就緒，可以開始使用
  }
});
</script>
```

### 計算命盤

```javascript
// 準備出生資料
const birthData = {
  year: 1990,
  month: 5,
  day: 15,
  lunarMonth: 4,
  lunarDay: 22,
  hourId: 'chen'  // 辰時
};

// 計算完整命盤
const chart = HLSystem.calculateChart(birthData);

// 取得結果
console.log('H.O.U.R.:', chart.hour);
console.log('L.I.G.H.T.:', chart.light);
console.log('12宮位:', chart.palaces);
console.log('橋接數:', chart.bridges);
console.log('數字分析:', chart.analysis);
```

### 流年計算

```javascript
// R 數和目標年份
const fortune = HLSystem.calculateYearFortune(5, 2026);
console.log('2026年流年:', fortune);
```

### 大運計算

```javascript
// R 數和出生年份
const lifeFortunes = HLSystem.calculateLifeFortunes(5, 1990);
console.log('大運時間軸:', lifeFortunes);
```

### 抽牌

```javascript
// 抽單張牌
const card = HLSystem.drawCard();

// 抽多張牌
const cards = HLSystem.drawCard({ count: 3 });

// 三牌陣
const spread = HLSystem.drawCard({ spread: 'three' });

// 根據數字抽牌
const cardByNumber = HLSystem.drawCard({ number: 5 });
```

---

## 數據結構說明

### 數字解讀 (NumberData)

| 欄位 | 說明 |
|------|------|
| title | 數字名稱（如「領航者」） |
| essence | 核心特質 |
| meridian | 對應經絡 |
| emotionSpectrum | 情緒光譜 |
| light | 光明面特質 |
| dark | 陰暗面特質 |
| health | 健康關注部位 |
| oils | 建議精油 |
| soulLesson | 靈魂功課 |
| work | 工作特質 |
| intimacy | 親密關係特質 |
| isMaster | 是否為大師數 |
| masterMission | 大師使命（僅大師數） |

### 宮位解讀 (PalaceData)

| 欄位 | 說明 |
|------|------|
| name | 宮位名稱 |
| meridian | 對應經絡 |
| time | 時辰 |
| theme | 主題問句 |
| darkEmotion | 陰暗情緒 |
| lightEmotion | 光明情緒 |
| stuckPattern | 卡住模式 |
| soulQuestions | 靈魂提問 |
| oils | 建議精油 |

### 流年主題 (YearTheme)

| 欄位 | 說明 |
|------|------|
| keyword | 關鍵字 |
| theme | 主題 |
| advice | 建議 |
| palace | 對應宮位 |
| focus | 宇宙提問 |

---

## 安全注意事項

### ⚠️ 不要做的事

1. **不要**將金鑰外洩或寫在公開的程式碼中
2. **不要**直接在 HTML 中嵌入完整的解讀內容
3. **不要**將 `hl-core-data.js` 的原始碼公開到 GitHub issues 或論壇
4. **不要**修改 `Object.freeze()` 保護機制

### ✅ 建議做的事

1. 定期更換金鑰
2. 使用 HTTPS 傳輸
3. 考慮將敏感 API 移至後端
4. 監控異常存取行為
5. 備份原始未混淆的版本（私人保存）

---

## 進階保護（建議未來實作）

### 後端 API 方案

將核心數據存放於後端伺服器，前端只負責顯示：

```javascript
// 前端請求
fetch('/api/numerology/reading', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + userToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    number: 5,
    type: 'full'
  })
})
.then(res => res.json())
.then(data => {
  // 顯示解讀結果
});
```

### 付費牆保護

對於完整解讀內容，可設定：
- 免費用戶：只能看基本資訊
- 付費用戶：可看完整解讀
- VIP用戶：可看進階分析

---

## 版本歷史

| 版本 | 日期 | 變更 |
|------|------|------|
| 2.0.0 | 2025-01 | 初始模組化版本 |

---

© 2026 馥靈之鑰國際有限公司 Hour Light International Co., Ltd.
本文件內容為商業機密，未經授權不得複製或散布。
