# Hour Light SPA 預約系統｜設置與使用教學

版本：v0.1 MVP（2026-04-09）
對應檔案：
- `booking-admin.html` — 管理後台
- `booking/hourlight-spa.html` — 客戶預約頁（下一步建立）
- `firestore.rules` — 資料庫安全規則

---

## 快速上手（你第一次操作）

1. 瀏覽器打開 https://hourlightkey.com/booking-admin.html
2. 用你的 Google 帳號登入（必須是 ADMIN_EMAILS 裡的 email）
3. 照以下順序操作：
   1. **「服務」分頁** → 點「➕ 新增服務」把你要提供的服務一個一個填進去
   2. **「技師」分頁** → 先把自己加進去，填名字、角色、簡介
   3. **「技師」分頁** → 點你自己，勾選你能做的服務
   4. **「班表」分頁** → 點「➕ 新增時段」開放第一個可預約的時段
   5. **「設定」分頁** → 填店家資訊、LINE 連結等
4. 拿「設定」分頁最下方的公開預約頁網址分享給客戶即可

---

## 資料結構（Firestore）

```
businesses/hourlight-spa            ← 店家資料（單一文件）
  name, tagline, desc, address, phone, lineUrl, lineToken, deposit, owner

businesses/hourlight-spa/services/{serviceId}
  name, category, desc, price, duration, color, order, active

businesses/hourlight-spa/staff/{staffId}
  name, role, bio, avatar, services[], hours{0..6}, active, order

businesses/hourlight-spa/slots/{slotId}     ← 班表（開放時段）
  date, startTime, endTime, staffId, serviceIds[], status, notes, bookedBy

businesses/hourlight-spa/bookings/{bookingId}
  serviceId, serviceName, servicePrice, serviceDuration
  staffId, staffName
  customerName, customerPhone, customerLine, customerNotes
  bookingDate, startTime, endTime
  status: pending | confirmed | cancelled | completed
  createdAt, createdBy
```

---

## 班表邏輯（重要）

**只有在「班表」分頁手動開出來的時段，客戶才能預約。**
沒有開放的日子 = 完全休息，客戶看不到可選時段。

這比「每週固定幾點到幾點」的做法更精準——你隨時可以：
- 今天不想接預約 → 不開就好
- 某個下午想多開一個時段 → 單筆新增
- 未來一個月的每週二四下午都想開 → 用「📆 批次開放」

### 批次開放怎麼用
1. 點「📆 批次開放」按鈕
2. 選起始日 ~ 結束日（例如 2026-04-15 ~ 2026-05-15）
3. 勾星期幾（例如週二、週四）
4. 設定時間（例如 14:00 ~ 17:00）
5. 選技師（你自己）
6. 點「🚀 批次開放」→ 系統會一次建立所有符合條件的時段

### 時段狀態
- 🟢 **可預約**（open）：客戶可以看到並選擇
- 🔵 **已預約**（booked）：已被某位客戶預約，從客戶頁面隱藏
- 關閉（刪除）：時段被移除（已被預約的不能直接刪除）

---

## LINE Channel Access Token 取得步驟（電腦版）

你說等用電腦再教，這裡先放步驟方便你到時候照著做：

1. 前往 https://developers.line.biz/console/
2. 用你的 LINE 官方帳號 email 登入（或 LINE 帳號）
3. 點右上角「Create a new provider」（第一次用才需要）
   - Provider name 填：`Hour Light SPA`
4. 進入 provider 後，點「Create a Messaging API channel」
   - Channel name: `Hour Light SPA 預約通知`
   - Channel description: `預約自動通知`
   - Category / Subcategory: 隨便選接近的（例：健康 → 美容）
   - 同意條款 → Create
5. 進入剛建立的 channel，切到「Messaging API」分頁
6. 最下方 **Channel access token** → 點「Issue」產生一個長字串
7. 複製那串 token
8. 回到 `booking-admin.html`「設定」分頁 → 貼到「LINE Channel Access Token」欄位 → 儲存

**備注**：
- 如果要繼續用既有的 @hourlight 官方帳號，要把這個 channel 連結到現有帳號
- 預約成功的通知是走 Messaging API 的 push message
- 每月前 500 則免費，之後每則約 NT$0.2

---

## 下一步（我這邊要做的）

- [ ] **booking/hourlight-spa.html** 客戶預約頁（淺色主題、選服務 → 選時段 → 填資料 → 送出）
- [ ] **api/booking-create.js** 建立預約 + 推 LINE 通知
- [ ] **api/booking-cancel.js** 取消預約
- [ ] **LINE 通知整合**（等你拿到 Token）
- [ ] **「我的預約」tab** 加到 member-dashboard.html
- [ ] **從首頁/services.html 加入口**到預約頁

---

## 部署 Firestore Rules

改了 `firestore.rules` 後要在 Firebase Console 重新貼上發布：

1. 打開 https://console.firebase.google.com/project/hourlight-key/firestore/rules
2. 把 `firestore.rules` 全部內容貼上
3. 按 **Publish**

或用 CLI（如果裝了 firebase-tools）：
```bash
firebase deploy --only firestore:rules
```

**注意**：新的 businesses/ 規則沒部署的話，booking-admin 的寫入會失敗（拒絕存取）。

---

## 疑難排解

**Q：我登入了但看到「此帳號不在管理員名單中」**
A：booking-admin.html 頂部的 `ADMIN_EMAILS` 陣列要加你的 email。
預設是：`judyanee@gmail.com`、`info@hourlightkey.com`、`judyanee@hotmail.com`

**Q：我新增服務時顯示「儲存失敗：Missing or insufficient permissions」**
A：Firestore Rules 還沒更新。照上面「部署 Firestore Rules」步驟操作。

**Q：客戶預約頁網址點進去 404**
A：`booking/hourlight-spa.html` 還沒建立，下一步我會做。

---

© 2026 馥靈之鑰 Hour Light｜預約系統 v0.1 MVP
