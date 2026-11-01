@echo off
chcp 65001 >nul
cd /d "%~dp0backend"
node --env-file-if-exists=.env start-bot.mjs
pause
