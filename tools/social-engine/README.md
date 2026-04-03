# 馥靈之鑰 AI 自動社群發文引擎

## 架構
```
tools/social-engine/
├── config.py           # 設定檔（API Keys、品牌語氣）
├── daily_engine.py     # 每日主控腳本
├── viral_crawler.py    # 爆文素材海巡器
├── content_generator.py # AI 文案生成器
├── poster.py           # FB + Threads 發文模組
├── data/               # 每日素材和文案暫存
└── README.md
```

## 使用方式

### 設定環境變數
```bash
export FB_PAGE_TOKEN="你的FB Page Token"
export THREADS_TOKEN="你的Threads Token"
export ANTHROPIC_API_KEY="你的Claude API Key"
```

### 執行
```bash
# 全流程（巡邏→生成→等審閱）
python daily_engine.py all

# 分步驟
python daily_engine.py crawl      # 巡邏素材
python daily_engine.py generate   # 生成文案
python daily_engine.py post       # 發文（審閱後）
python daily_engine.py post morning  # 只發早上的
```

### 每日排程（台灣時間）
- 07:00 → crawl + generate
- 07:30 → post morning（早安覺察）
- 12:15 → post noon（午間冷知識）
- 20:00 → post evening（深夜洞察，黃金時段）

## 發文平台
- FB「HOUR LIGHT 未來美容學苑」→ 多元知識性內容
- Threads「@histudio.spa」→ 美業時事、職人觀點

## 人工審閱機制
文案生成後先存到 data/ 和 Notion，逸君審閱後才發出。
不是全自動，而是「AI 準備 + 人工把關」。
