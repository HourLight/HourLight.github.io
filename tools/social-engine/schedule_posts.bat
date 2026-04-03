@echo off
chcp 65001 >nul
REM ====================================
REM  馥靈之鑰 - Windows 排程任務安裝器
REM  執行此檔案會在 Windows 工作排程器中建立三個發文任務
REM ====================================

set SCRIPT_DIR=%~dp0
set PYTHON=python

REM === 設定環境變數檔案路徑 ===
set ENV_FILE=%SCRIPT_DIR%start.bat

echo.
echo 正在建立 Windows 排程任務...
echo.

REM === 早上 7:00 - 巡邏素材 + 生成文案 ===
schtasks /create /tn "HourLight_SocialEngine_Prepare" /tr "cmd /c \"%SCRIPT_DIR%start.bat\" all" /sc daily /st 07:00 /f
echo ✅ 07:00 巡邏+生成 已設定

REM === 早上 7:30 - 發早安覺察 ===
schtasks /create /tn "HourLight_SocialEngine_Morning" /tr "cmd /c \"%SCRIPT_DIR%start.bat\" post morning" /sc daily /st 07:30 /f
echo ✅ 07:30 早安覺察 已設定

REM === 中午 12:15 - 發午間冷知識 ===
schtasks /create /tn "HourLight_SocialEngine_Noon" /tr "cmd /c \"%SCRIPT_DIR%start.bat\" post noon" /sc daily /st 12:15 /f
echo ✅ 12:15 午間冷知識 已設定

REM === 晚上 20:00 - 發深夜洞察 ===
schtasks /create /tn "HourLight_SocialEngine_Evening" /tr "cmd /c \"%SCRIPT_DIR%start.bat\" post evening" /sc daily /st 20:00 /f
echo ✅ 20:00 深夜洞察 已設定

echo.
echo ====================================
echo  全部設定完成！
echo  每天自動執行：
echo    07:00 巡邏素材 + AI生成文案
echo    07:30 發文「早安覺察」
echo    12:15 發文「午間冷知識」
echo    20:00 發文「深夜洞察」
echo ====================================
echo.
echo  查看排程：schtasks /query /tn "HourLight_SocialEngine_*"
echo  刪除排程：schtasks /delete /tn "HourLight_SocialEngine_Prepare" /f
echo.

pause
