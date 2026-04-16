---
description: 任務完成後同步到 Notion 官網工程父頁面 + Discord 通知（雙寫）
---

# 同步 Notion + Discord 通知

逸君規定：完成任何工程任務後要到 Notion「官網工程」父頁面（id `32a57a42-1621-810a-963a-f0a37dda21ce`）下建立或更新交接文，並在 Discord 頻道 `1488487050557653032` 發訊息通知手機推播。

## Step 1：摘要本 session 做了什麼

讀取最近的 git commits（這個 session 產生的）：

```bash
cd "/d/OneDrive/桌面/HourLight.github.io"
# 抓最近 30 分鐘內的 commit
git log --since="30 minutes ago" --pretty=format:"%h|%s|%ai" origin/main..HEAD 2>/dev/null || \
git log --since="30 minutes ago" --pretty=format:"%h|%s|%ai"
```

如果沒 commit（還沒推上去）→ 跟逸君確認：「這次 session 要不要先 commit 再同步？」

## Step 2：整理交接內容

產出這份結構的 Notion 頁面內容：

```
# [今天日期] [主題] 交接

## 改了什麼
- 改了 X 檔案
- 新增 Y 檔案
- 刪了 Z 檔案

## 為什麼
（簡述逸君的需求，不是你的判斷。例：「4/16 逸君要修 xxx，因為 xxx」）

## 怎麼驗證
- 部署時間：GitHub Pages 1-2 分鐘 / Vercel XX 分鐘
- 測試步驟：
  1. 開 https://hourlightkey.com/XXX
  2. 檢查 XXX

## commit 紀錄
- `hash` commit message
- `hash` commit message

## 已知待辦（如果有）
- [ ] XX
```

## Step 3：建 Notion 子頁

用 `mcp__notion__API-post-page` 建立子頁面：

```
parent: { type: "page_id", page_id: "32a57a42-1621-810a-963a-f0a37dda21ce" }
properties: { title: [{ text: { content: "YYYY-MM-DD [主題]" } }] }
children: [Step 2 的內容轉成 Notion blocks]
```

標題格式：`2026-04-16 [主題]`（日期必須是當下日期，不要用相對日期）

## Step 4：Discord 發訊息

用 `mcp__plugin_discord_discord__reply` 到 `1488487050557653032`：

訊息格式（簡短、帶推播價值）：
```
✅ [主題] 完成

改了 N 檔：
- XXX
- XXX

Notion: [剛才建的子頁 URL]
部署: GitHub Pages / Vercel
```

不要寫「Co-Authored-By: Claude」之類（Discord 訊息是給人看的，不是 commit message）。

## Step 5：如果有任何一步失敗

- Notion 失敗 → 告訴逸君哪個 step 壞了，不要假裝成功
- Discord 失敗 → 同上，並手動貼出完整摘要給她看（至少她能手動轉發）

---

**觸發時機建議：**
- 重大工程完成（新功能 / 修重要 bug / 大規模改動）→ 一定要做
- 小改動（改一行文案 / 調個顏色）→ 看逸君要不要做，不強制

**不要做的事：**
- ❌ 不編造 commit 內容（要真實讀 git log）
- ❌ 不寫「已自動部署」如果實際沒 push
- ❌ 不重複建 Notion 頁（先用 `mcp__notion__API-post-search` 查當天是否已有同主題頁）
