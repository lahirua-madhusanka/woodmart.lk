@echo off
cd /d "%~dp0frontend-admin"
call npm.cmd run dev -- --port 5174
