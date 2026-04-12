# Threads API 修復指南

## 問題診斷

從錯誤日誌分析：
```json
{
  "error": {
    "message": "The requested resource does not exist",
    "type": "OAuthException",
    "code": 24,
    "error_subcode": 4279009,
    "error_user_title": "Media Not Found",
    "error_user_msg": "The media with id 17878782003555532 cannot be found."
  }
}
```

## 錯誤原因分析

### 1. Token 過期 (最可能)
- Threads Long-lived Token 有效期：60天
- 需要定期更新

### 2. API 調用問題
- 可能是容器創建後立即發布造成的
- 需要增加等待時間

### 3. 權限問題
- App 可能缺少必要的權限

## 解決方案

### Step 1: 重新生成 Threads Token

1. 前往 [Meta for Developers](https://developers.facebook.com/)
2. 選擇你的 App
3. 左側選單：產品 > Threads API > 快速入門
4. 生成新的 Long-lived Token
5. 更新 Vercel 環境變數

### Step 2: 優化 API 調用邏輯

在 `api/cron-post.js` 中增加重試機制和更長的等待時間：

```javascript
// 修改 postToThreads 函數
async function postToThreads(text, accessToken, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const createUrl = `https://graph.threads.net/v1.0/me/threads`;
      const container = await httpPost(createUrl + `?access_token=${accessToken}`, {
        media_type: 'TEXT',
        text: text,
      });
      
      // 增加等待時間，確保容器準備完成
      await sleep(5000);
      
      const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
      const published = await httpPost(publishUrl + `?access_token=${accessToken}`, {
        creation_id: container.id,
      });
      
      return published.id;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(2000 * attempt); // 遞增等待時間
    }
  }
}
```

### Step 3: 增加錯誤處理和監控

1. 詳細記錄錯誤信息
2. 自動 fallback 機制
3. 錯誤通知系統

### Step 4: 環境變數檢查清單

確認 Vercel Dashboard 中以下變數已正確設定：

- ✅ `THREADS_ACCESS_TOKEN` (新生成的60天token)
- ✅ `FB_PAGE_ACCESS_TOKEN` (Facebook頁面token)
- ✅ `FB_PAGE_ID` (粉絲專頁ID)
- ✅ `CRON_SECRET` (Vercel自動生成)

## 測試方法

### 手動觸發測試
```bash
# 測試工具導流 (Tier C)
https://app.hourlightkey.com/api/cron-post?manual=1&tier=C

# 測試天使故事 (Tier A)  
https://app.hourlightkey.com/api/cron-post?manual=1&tier=A

# 測試知識學苑 (Tier B)
https://app.hourlightkey.com/api/cron-post?manual=1&tier=B
```

### 成功指標
- `results.threads.ok: true`
- `results.facebook.ok: true`
- 無錯誤訊息

## 預防措施

1. **定期更新Token** (設定月提醒)
2. **監控機制** (每日檢查發文狀態)
3. **Fallback策略** (Threads失敗時確保FB正常)
4. **錯誤通知** (失敗時自動通知)

## 緊急處理

如果 Threads 持續失敗：
1. 暫時關閉 Threads 發文
2. 確保 Facebook 發文正常
3. 修復後重新啟用

修改 `api/cron-post.js` 中的 Threads 處理：

```javascript
// 臨時禁用 Threads（緊急使用）
const THREADS_ENABLED = false;

if (THREADS_ENABLED && threadsToken) {
  // ... threads logic
}
```