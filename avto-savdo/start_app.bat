@echo off
title Avto Savdo Pro - Dasturni ishga tushirish
echo ========================================================
echo       AVTO SAVDO PRO - ISHGA TUSHIRILMOQDA...
echo ========================================================
echo Brauzerda dastur ochilmoqda: http://localhost:8085/
start http://localhost:8085/
python -m http.server 8085
pause
