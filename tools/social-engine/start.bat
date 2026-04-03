@echo off
chcp 65001 >nul
echo ====================================
echo  馥靈之鑰 AI 自動社群發文引擎
echo ====================================
echo.

REM === 設定環境變數 ===
set FB_PAGE_TOKEN=EAAUA2yOPNv0BRNLgK4pNwaZCiE48ISNRFgu7f4P6FfqVevmtYtcVcNxEuL8tZCsE5DiGGLduQdfcwuO4tF9nL6XGj2Uv9AkKt9g2ot0gduuuuOYZB15AjwwTZCsab02f4zUZBASTLNAGK13dDMZB8caJN3oYYOfO3X6B0iM79wqAZBBOFfEx0QseUtZA1JOD3714Nj4UJ34xbbJiDpZCqnKbFjBCtpzQZAr6E4gFgI7mZBMwm0TO1XAwfaDvPrCZAXEZD
set THREADS_TOKEN=THAAcvPSJN7utBUVI0RmlxNkhLb0I2ZAW1Vb2d3OVgwREVkTzJOQjJHMkhFcEFOdm9VM2lZARVBBTEY0OWthdjktdEpTYjJPTFNYWEhDME9WeGFtUDdfZAVEtSUlQTUpuUmNLSFJPb0Iwb1VoQ1YwbjZA0YjM1WHhjQ0ZAFZAmRNb1BUaV9yQjlwam11ZAU1CUFF6ZAGRfTV82VkZAtQmdLOGxaekctbzV4SU54ZAwZDZD
set PEXELS_API_KEY=rzMBUQHb39qKQDSr8TsGce0prvFKCqdamqLUXNqbyQ20Stjbjd4d5c5H
REM set ANTHROPIC_API_KEY=你的Claude API Key（從Vercel環境變數複製）

REM === 執行 ===
cd /d "%~dp0"

if "%1"=="" (
    python daily_engine.py help
) else (
    python daily_engine.py %1 %2
)

pause
