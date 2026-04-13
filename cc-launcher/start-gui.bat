@echo off
chcp 65001 >nul
title CC系統 GUI 介面啟動器

echo.
echo ═══════════════════════════════════════
echo     🚀 CC系統 GUI 介面啟動中...
echo     馥靈之鑰 Claude Code 圖形介面
echo ═══════════════════════════════════════
echo.

echo [1/3] 🔍 檢查系統環境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Node.js！請先安裝 Node.js
    echo 💡 請執行 install-cc.bat 進行一鍵安裝
    pause
    exit /b 1
)

echo ✅ Node.js 環境就緒

echo.
echo [2/3] 🔍 檢查 GUI 檔案...
if not exist "cc-gui.html" (
    echo ❌ GUI 檔案不存在
    echo 💡 請重新執行安裝程式
    pause
    exit /b 1
)

echo ✅ GUI 檔案檢查完成

echo.
echo [3/3] 🚀 啟動 GUI 介面...
echo.
echo 🌐 GUI 介面將在預設瀏覽器中開啟
echo 💡 如未自動開啟，請手動開啟 cc-gui.html
echo.
echo 🎯 可用功能：
echo    • 系統狀態檢查
echo    • SEO 問題掃描
echo    • 社群工具管理
echo    • 內容創作工具
echo    • 管理後台操作
echo    • 資料同步功能
echo.

start "" "cc-gui.html"

echo ✅ GUI 介面啟動完成！
echo.
echo 💡 使用方法：
echo    1. 在瀏覽器中點擊功能按鈕
echo    2. 查看執行結果
echo    3. 關閉此視窗不影響 GUI 使用
echo.
echo 🔄 若要重新啟動，請再次執行此檔案
echo.
pause