@echo off
echo 🔧 Behebe die work4all Datenbank-Spalten...
echo.

echo 🛑 Stoppe den Backend-Server...
pm2 stop backend

echo 📋 Füge fehlende work4all-Spalten hinzu...
node add-missing-columns.js

echo 🚀 Starte den Backend-Server neu...
pm2 start backend

echo ✅ Fertig! Die Datenbank sollte jetzt alle benötigten work4all-Spalten haben.
echo.
echo 🔍 Prüfe die Logs mit: pm2 logs backend
pause 