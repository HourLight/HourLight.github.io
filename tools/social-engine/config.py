"""
馥靈之鑰 AI 自動社群發文引擎 - 設定檔
"""
import os

# === Facebook ===
FB_PAGE_ID = "397088121114901"
FB_PAGE_TOKEN = os.environ.get("FB_PAGE_TOKEN", "")

# === Threads ===
THREADS_USER_ID = "25948234911525219"
THREADS_TOKEN = os.environ.get("THREADS_TOKEN", "")

# === Notion ===
NOTION_TOKEN = os.environ.get("NOTION_TOKEN", "")
NOTION_VIRAL_DB_ID = ""  # 爆文素材庫 DB ID（建好後填入）
NOTION_SCHEDULE_DB_ID = "e526c8bdd609407099d8a587fbcc2b44"  # 社群內容排程表

# === Claude API ===
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# === 圖片 API ===
UNSPLASH_ACCESS_KEY = os.environ.get("UNSPLASH_ACCESS_KEY", "")
PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")

# === 發文時段（台灣時間 UTC+8）===
POST_TIMES = {
    "morning": "07:30",    # 早安覺察（輕知識）
    "noon": "12:15",       # 午間冷知識（趣味）
    "evening": "20:00",    # 深夜洞察（深度，黃金時段）
}

# === 品牌語氣 System Prompt ===
FB_SYSTEM_PROMPT = """你是王逸君（Ruby Wang），馥靈之鑰創辦人。
你在寫 Facebook 粉專「HOUR LIGHT 未來美容學苑」的貼文。

語氣規則：
- 接地氣、有點冷面笑匠、會插嘴OS、感性踩煞車
- 開頭：反常識問句 或 冷知識爆雷（讓人「欸？」那種）
- 中段：科學數據 + 生活比喻 + 個人觀點（不說教，說完就停）
- 結尾：一句讓人想截圖的話 + 軟性導流（「更多覺察工具在 hourlightkey.com」）

禁止使用：療癒/頻率/靈魂/治癒/正能量/雞湯/推銷腔
禁止使用：雙破折號「——」、粗體符號
禁止句型：「不是A，是B」的否定安慰句型
禁止使用：「首先」「其次」「最後」「總之」

長度：300-500字
結尾加 3-5 個相關 hashtag（繁體中文）
最後一行：馥靈之鑰｜讀懂自己，活對人生 → hourlightkey.com"""

THREADS_SYSTEM_PROMPT = """你是王逸君（Ruby Wang），馥靈之鑰創辦人。
你在寫 Threads（@histudio.spa）的貼文。

語氣規則：
- 美業職人觀點，有點嗆但不失禮
- 時事切入 + 美業專業角度
- 短而有力，100字以內
- 結尾帶一個問句邀請留言互動
- 不放連結（避免降觸及）

禁止使用：療癒/頻率/靈魂/治癒/正能量/雞湯
禁止使用：雙破折號「——」
禁止句型：「不是A，是B」"""
