# MailerLite 自動化設定 SOP

> 逸君照著這份步驟做，就能讓歡迎信和測驗跟進信自動發送。
> 文案都在 docs/ 裡寫好了，只需要複製貼入。

~~

## 一、歡迎序列（5封）

文案來源：docs/MailerLite歡迎序列.md

### 設定步驟

1. 登入 app.mailerlite.com
2. 左邊選「Automations」→ 點「Create automation」
3. Trigger 選「When subscriber joins a group」→ 選你的主要訂閱群組
4. 加入第一封信：
   - 拖入「Email」元素
   - 主旨：從文案裡的「主旨選項」挑一個（建議用 A 選項）
   - 內容：複製 Email 1 的內文貼入
   - 寄件人名稱：馥靈之鑰 Hour Light
5. 加入延遲：拖入「Delay」元素 → 設 1 天
6. 重複步驟 4-5，依序加入 Email 2（延遲1天）、Email 3（延遲3天）、Email 4（延遲3天）、Email 5（延遲7天）
7. 點右上角「Activate」啟動

### 注意事項
- 每封信發送後加一個「Add tag」動作，標記 welcome_1_sent、welcome_2_sent 等
- 最後一封發完加 tag：welcome_complete

~~

## 二、測驗跟進序列（4封）

文案來源：docs/MailerLite測驗跟進信.md

### 設定步驟

1. 建新 Automation
2. Trigger 選「When subscriber gets tag」→ tag 名稱：quiz_complete
3. 加入條件檢查：「If/Else」→ 條件：subscriber has tag「welcome_complete」
   - Yes → 繼續序列
   - No → 等待（讓歡迎序列先跑完）
4. Email 1：立即發送（測驗結果延伸推薦）
5. Delay 3 天 → Email 2：命盤驗證
6. Delay 4 天 → Email 3：城堡邀請
7. Delay 7 天 → Email 4：課程推薦 AB 測試
   - 用 MailerLite 的「A/B split」功能
   - 50% 收到版本 A（故事型）
   - 50% 收到版本 B（數據型）
   - 勝出指標：點擊率
   - 記得加 UTM 標記（文案裡有寫）

### AB 測試的 UTM 標記
- 版本 A：?utm_source=mailerlite&utm_medium=email&utm_campaign=quiz_followup_course_a
- 版本 B：?utm_source=mailerlite&utm_medium=email&utm_campaign=quiz_followup_course_b

~~

## 三、tag 怎麼來的

網站已經設好了自動加 tag 的邏輯：
- 用戶透過 hl-email.js 訂閱 → MailerLite API 自動加入群組
- 用戶完成測驗 → hl-tracker.js 觸發 HL_track('quiz_complete') → 但目前沒有自動加 MailerLite tag

### 需要手動設定的部分
在 MailerLite 的 Automation 裡加一個：
- Trigger：When subscriber visits URL containing「quiz-」
- Action：Add tag「quiz_complete」

這樣只要訂閱者造訪任何測驗頁面，就會自動被標記。

~~

## 四、檢查清單

- [ ] 歡迎序列建好並啟動
- [ ] 測驗跟進序列建好並啟動
- [ ] AB 測試設定完成（50/50 分流）
- [ ] tag 自動化設定完成
- [ ] 測試：用自己的信箱訂閱，確認收到歡迎信
- [ ] 7天後確認：AB 測試有沒有數據進來

© 2026 馥靈之鑰
