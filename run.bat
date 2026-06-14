@echo off
title AI-Driven Talent Dashboard Server
echo ========================================================
echo   AI-Driven Task & Learning Management Ecosystem Server
echo ========================================================
echo.
echo [1/2] กำลังเปิดเบราว์เซอร์ไปที่ http://localhost:3000...
start "" "http://localhost:3000"
echo.
echo [2/2] กำลังเริ่มต้นรันเว็บเซิร์ฟเวอร์ด้วย npx serve...
echo กด Ctrl+C เพื่อหยุดการทำงานของเซิร์ฟเวอร์
echo.
npx -y serve -l 3000
pause
