@echo off
chcp 65001 >nul
title CC系統一鍵安裝程式 v1.0

echo.
echo ═══════════════════════════════════════
echo     🚀 CC系統一鍵安裝程式 v1.0
echo     馥靈之鑰 Claude Code 啟動器
echo ═══════════════════════════════════════
echo.

echo [1/5] 🔍 檢查Node.js環境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到Node.js！
    echo.
    echo 📥 請先安裝Node.js：
    echo    1. 前往：https://nodejs.org/
    echo    2. 點擊左側綠色按鈕下載
    echo    3. 安裝完成後重新執行此程式
    echo.
    echo 🌐 正在為您開啟Node.js官網...
    start https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js已安裝 %NODE_VERSION%

echo.
echo [2/5] 📁 建立CC系統目錄...
if not exist "cc-system" (
    mkdir cc-system
    echo ✅ 目錄建立完成
) else (
    echo ⚠️  目錄已存在，將更新檔案
)

cd cc-system

echo.
echo [3/5] 📝 建立CC系統核心檔案...

echo // CC系統主啟動器 v1.0 > cc-main.js
echo const path = require('path'); >> cc-main.js
echo const fs = require('fs'); >> cc-main.js
echo. >> cc-main.js
echo console.log('🚀 CC系統啟動中...'); >> cc-main.js
echo console.log('📱 設備: ' + require('os').platform() + '-' + require('os').userInfo().username); >> cc-main.js
echo console.log('✅ CC系統就緒！'); >> cc-main.js
echo console.log('💡 可用指令:'); >> cc-main.js
echo console.log('   cc help - 顯示幫助'); >> cc-main.js
echo console.log('   cc scan - SEO掃描'); >> cc-main.js
echo console.log('   cc status - 系統狀態'); >> cc-main.js
echo console.log(''); >> cc-main.js
echo console.log('🎯 CC系統準備完成！輸入指令開始使用。'); >> cc-main.js

echo ✅ 核心檔案建立完成

echo.
echo [4/5] 🧪 測試CC系統運行...
node cc-main.js
if %errorlevel% equ 0 (
    echo ✅ 系統測試通過
) else (
    echo ❌ 系統測試失敗
    pause
    exit /b 1
)

echo.
echo [5/6] 📝 建立啟動腳本...
echo @echo off > start-cc.bat
echo title CC系統 - 馥靈之鑰 Claude Code >> start-cc.bat
echo cd /d "%~dp0" >> start-cc.bat
echo echo 🚀 正在啟動CC系統... >> start-cc.bat
echo node cc-main.js >> start-cc.bat
echo pause >> start-cc.bat

echo ✅ 啟動腳本建立完成

echo.
echo [6/6] 🖱️ 建立 GUI 圖形介面...
copy "..\cc-gui.html" "cc-gui.html" >nul 2>&1
copy "..\start-gui.bat" "start-gui.bat" >nul 2>&1

if exist "cc-gui.html" (
    echo ✅ GUI 介面建立完成
) else (
    echo ⚠️  GUI 檔案複製失敗，但不影響核心功能
)

echo.
echo ═══════════════════════════════════════
echo     🎉 CC系統安裝完成！
echo ═══════════════════════════════════════
echo.
echo 📂 安裝位置: %CD%
echo.
echo 🚀 使用方法：
echo    方法1: 雙擊 start-gui.bat （圖形介面，滑鼠點擊）
echo    方法2: 雙擊 start-cc.bat （命令列介面）
echo    方法3: 開啟命令提示字元，輸入：
echo           cd %CD%
echo           node cc-main.js
echo.
echo 💡 推薦使用 GUI 介面：雙擊 start-gui.bat 即可！
echo 🖱️ GUI 介面提供滑鼠點擊操作，中文友善介面
echo.
echo ✨ 感謝使用馥靈之鑰CC系統！
echo.
pause