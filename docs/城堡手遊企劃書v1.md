# 內在城堡手遊版技術方案 v1.0

> 2026-04-05
> 目標：城堡在手機上玩起來像原生 App，但技術上還是網頁

## 框架選擇：Phaser 4

為什麼選 Phaser 4：
- 2D 房間探索+裝飾的完美框架
- 2025 全面改寫，bundle 小 40%
- iOS Safari 優化過
- 內建場景管理、粒子效果、輸入處理
- 搭配 Konva.js 做傢具拖拽

## 改造優先順序（10 週）

Phase 1（1-2週）：原生體感
- viewport/notch/safe area 優化
- 底部抽屜手勢改進
- 載入速度 < 2 秒

Phase 2（3-4週）：遊戲感
- 盲盒開箱粒子動畫升級
- Konva.js 傢具拖拽（碰撞+吸附+撤銷）
- 音效（Web Audio API）

Phase 3（5-6週）：離線優先
- IndexedDB 取代 localStorage
- Service Worker 資源緩存
- Firebase 離線同步+衝突處理

Phase 4（7-8週）：效能
- WebP 圖片 + 懶載入
- Sprite Sheets 傢具
- 放置型掛機機制升級

Phase 5（9-10週）：打磨
- A/B 測試開箱動畫
- 記憶體洩漏測試
- 無障礙審計

## iOS Safari 注意事項

可用：Service Worker / IndexedDB / Canvas / Touch Events / localStorage
不可用：Web Push（需加到桌面才有）/ Vibration API / 背景同步 / 7天儲存限制

## 快速開始路徑

Week 1-2：WebP 圖片 + Firebase 離線（最速效果）
Week 3-4：Phaser 4 遷移
Week 5：Konva.js 拖拽
Week 6：上線 v2.0
