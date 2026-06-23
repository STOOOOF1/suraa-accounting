@echo off
echo ===== نظام سفراء المحاسبي =====
echo جاري تشغيل الخادم والواجهة...
echo.

start "سفراء - الخادم" node server/server.js
timeout /t 3 /nobreak > nul
start "سفراء - الواجهة" cmd /c "cd client && npm run dev"

echo ✅ الخادم: http://localhost:3001
echo ✅ الواجهة المحلية: http://localhost:5173
echo ✅ واجهة الشبكة: http://192.168.100.16:5173
echo.
echo أطفئ النوافذ المفتوحة لإيقاف النظام
pause
