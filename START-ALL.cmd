@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "Faeton website" "%ComSpec%" /c ""%~dp0START-SITE.cmd""
start "Faeton bot" "%ComSpec%" /c ""%~dp0START-BOT.cmd""
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:4173/"
