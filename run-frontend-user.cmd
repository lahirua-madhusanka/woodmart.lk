@echo off
cd /d "%~dp0frontend-user"
call npm.cmd run dev -- --port 5173
