---
description: 更新 130 張牌卡 DNA（Base64 解碼 → 改欄位 → 重編碼 → 一致性檢查）
---

# 更新牌卡 DNA

逸君要改 `js/cardData-protected.js` 裡的牌卡資料。這個檔案是 Base64 編碼、前端要秒讀，所以流程比較嚴格。

## ⚠️ 鐵則先講（CLAUDE.md 鎖定規則）

1. **130 張牌卡名稱永遠不可竄改**（部分已印刷，含禁用詞照用不改）
2. 不動 `draw-hl.html` 的抽牌規則（鎖定規則 #2）
3. 家族版 `familyCardDNA.js` / 寵物版 `petCardDNA.js` 結構不同，改哪個要問清楚

## Step 1：確認要改什麼

跟逸君問清楚：
- **哪張牌**（編號 + 名稱，例：`055 玫瑰`）
- **改哪個欄位**（例：精油對應、紫微星曜、陰影面文案）
- **新值是什麼**（完整貼過來，不要靠猜）

## Step 2：解碼讀取

`js/cardData-protected.js` 是 Base64 編碼。用 Python 解：

```python
import re, base64, json
content = open('js/cardData-protected.js', encoding='utf-8').read()
# 找出 base64 字串（通常在變數賦值裡）
match = re.search(r'"([A-Za-z0-9+/=]{200,})"', content)
encoded = match.group(1)
decoded = base64.b64decode(encoded).decode('utf-8')
data = json.loads(decoded)
# 找出目標牌卡
target = next(c for c in data if c['code'] == '055')
print(target)
```

## Step 3：改欄位（只改指定的，不要連帶動其他）

- 逸君只要你改 A 欄位，不要「順便」改其他（CLAUDE.md 鐵則：不做 reframe）
- 牌卡名稱 (`name` / `zh_name`) 絕對不能動
- 改完記錄原值 + 新值，產出 diff 給她看

## Step 4：重編碼 + 寫回

```python
new_encoded = base64.b64encode(json.dumps(data, ensure_ascii=False).encode('utf-8')).decode()
# 把原本的 base64 字串替換掉
new_content = content.replace(encoded, new_encoded)
open('js/cardData-protected.js', 'w', encoding='utf-8').write(new_content)
```

## Step 5：全站一致性檢查

改了某張牌的欄位，要檢查前端有沒有硬寫的地方：

```bash
cd "/d/OneDrive/桌面/HourLight.github.io"
# 搜牌卡名稱是否其他頁面有硬寫
grep -rln "玫瑰" --include="*.html" --include="*.js" | head -10
# 特別關注 draw-hl.html / draw-hl-guide.html / cardData-*
```

如果有多處硬寫同一資料 → 告訴逸君有哪幾個檔案需要跟著改，等她確認再動。

## Step 6：AI 解讀框架同步（如果改到命理對應）

- 單人解讀 → `js/ai-frameworks.js`（v97-v99 框架升級後很大，用 Read offset/limit 分段讀）
- 合盤 → `js/ai-match-frameworks.js`（已改按需載入）

## Step 7：驗證 + 提交

```bash
# JS 語法檢查
node --check js/cardData-protected.js
# 前端載入測試（在瀏覽器 console 確認）
# git 提交
git add js/cardData-protected.js
git commit -m "🎴 更新牌卡 XXX 的 XXX 欄位"
git push origin main
```

## Step 8：Discord 通知

Discord reply 到 `1488487050557653032`：
- 改了哪張牌
- 改了哪個欄位
- 原值 → 新值
- commit hash

---

**不要做的事：**
- ❌ 不動牌卡名稱
- ❌ 不重編碼整個陣列順序（影響抽牌機率）
- ❌ 不擅自補充「你覺得該加的欄位」— 逸君要什麼就做什麼
