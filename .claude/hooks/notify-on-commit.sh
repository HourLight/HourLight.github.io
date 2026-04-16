#!/bin/bash
# ─────────────────────────────────────────────────────────
# Stop Hook：有新 git commit 才發 Discord 通知
# 馥靈之鑰國際有限公司｜專案：HourLight.github.io
# ─────────────────────────────────────────────────────────
# 設計：只在 git HEAD 變動時發訊息，避免每次 AI 停下來都推播
# Token：從 ~/.claude/channels/discord-hourlight/.env 讀（同 Discord plugin）
# Channel：1488487050557653032（逸君 CLAUDE.md 指定）
# ─────────────────────────────────────────────────────────

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
STATE_FILE="$HOME/.claude/hourlight-last-commit.txt"
ENV_FILE="$HOME/.claude/channels/discord-hourlight/.env"
CHANNEL_ID="1488487050557653032"

# 沒 Discord plugin 設定就安靜跳過（讓 repo 可以被其他人 clone 不炸）
[ ! -f "$ENV_FILE" ] && exit 0

# 載入 bot token
DISCORD_BOT_TOKEN=$(grep -E '^DISCORD_BOT_TOKEN=' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '\r')
[ -z "$DISCORD_BOT_TOKEN" ] && exit 0

# 拿當前 HEAD
current=$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null)
[ -z "$current" ] && exit 0

# 讀上次 state；第一次只記錄不發
last=$(cat "$STATE_FILE" 2>/dev/null)
if [ -z "$last" ]; then
    echo "$current" > "$STATE_FILE"
    exit 0
fi

# HEAD 沒變 → 沒新 commit，安靜結束
[ "$current" = "$last" ] && exit 0

# 有新 commit → 抓 commit 訊息（最多 10 條，避免爆）
commits=$(git -C "$PROJECT_DIR" log "$last..$current" --pretty=format:"• %s" 2>/dev/null | head -10)
count=$(git -C "$PROJECT_DIR" rev-list "$last..$current" --count 2>/dev/null)

if [ -z "$commits" ] || [ -z "$count" ]; then
    echo "$current" > "$STATE_FILE"
    exit 0
fi

# 組訊息（第一行摘要 + commits 條列）
message=$(printf "✅ HourLight 新 commit ×%s\n\n%s\n\n🌐 %s/commit/%s" "$count" "$commits" "https://github.com/HourLight/hourlight.github.io" "$(echo "$current" | cut -c1-7)")

# 用 Python 安全 escape JSON（中文、換行、emoji 都處理好）
payload=$(python -c "
import json, sys
msg = sys.stdin.read()
# Discord 訊息上限 2000 字
if len(msg) > 1900:
    msg = msg[:1900] + '...'
print(json.dumps({'content': msg}, ensure_ascii=False))
" <<< "$message")

# 發 Discord（10 秒超時）
curl -s -X POST "https://discord.com/api/v10/channels/${CHANNEL_ID}/messages" \
     -H "Authorization: Bot ${DISCORD_BOT_TOKEN}" \
     -H "Content-Type: application/json; charset=utf-8" \
     --max-time 10 \
     -d "$payload" > /dev/null 2>&1

# 更新 state（不管發送成功與否，避免重複轟炸）
echo "$current" > "$STATE_FILE"
exit 0
