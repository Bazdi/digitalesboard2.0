# Digital Board - Linux Setup Anleitung

## 🚀 Automatisches Setup (Empfohlen)

### Schritt 1: Setup-Script ausführen
```bash
# Script ausführbar machen
chmod +x setup-linux.sh

# Setup starten
./setup-linux.sh
```

Das Script führt automatisch folgende Schritte aus:
1. ✅ Abhängigkeiten prüfen (Node.js, npm, pm2, sqlite3)
2. ✅ Backend Dependencies installieren
3. ✅ Datenbank initialisieren und Schema erweitern
4. ✅ Frontend Dependencies installieren und bauen
5. ✅ Work4all Synchronisation durchführen
6. ✅ pm2 Prozesse starten

---

## 🛠️ Manuelles Setup (falls automatisches Setup nicht funktioniert)

### Voraussetzungen installieren
```bash
# Node.js 18+ (falls nicht vorhanden)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# pm2 global installieren
npm install -g pm2

# sqlite3 installieren
sudo apt-get install sqlite3
```

### Backend Setup
```bash
# Backend Dependencies
npm install

# Alte Datenbank löschen (falls vorhanden)
rm -f database.db

# Neue Datenbank initialisieren
node init-database.js

# Datenbank-Schema für work4all erweitern
sqlite3 database.db << 'EOF'
-- work4all Erweiterungen
ALTER TABLE employees ADD COLUMN work4all_code INTEGER;
ALTER TABLE employees ADD COLUMN work4all_nummer INTEGER;
ALTER TABLE employees ADD COLUMN work4all_last_update TEXT;

-- Urlaubstabelle
CREATE TABLE IF NOT EXISTS employee_vacation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    work4all_code INTEGER,
    work4all_vacation_code INTEGER,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    vacation_days INTEGER DEFAULT 1,
    vacation_type TEXT DEFAULT 'urlaub',
    work4all_sync_date TEXT DEFAULT CURRENT_TIMESTAMP,
    vacation_art_code INTEGER DEFAULT 0,
    vacation_art_description TEXT DEFAULT 'Urlaub',
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Krankheitstabelle
CREATE TABLE IF NOT EXISTS employee_sickness (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    work4all_code INTEGER,
    work4all_sickness_code INTEGER,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    sickness_days INTEGER DEFAULT 1,
    sickness_type TEXT DEFAULT 'krankheit',
    work4all_sync_date TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- work4all Erweiterungen für vehicles/tradeshows
ALTER TABLE vehicles ADD COLUMN work4all_resource_code INTEGER;
ALTER TABLE vehicles ADD COLUMN work4all_resource_name TEXT;
ALTER TABLE vehicles ADD COLUMN work4all_last_update TEXT;
ALTER TABLE tradeshows ADD COLUMN work4all_project_code INTEGER;
ALTER TABLE tradeshows ADD COLUMN work4all_project_number TEXT;
ALTER TABLE tradeshows ADD COLUMN work4all_group_code INTEGER;
ALTER TABLE tradeshows ADD COLUMN work4all_last_update TEXT;

-- Indizes
CREATE INDEX IF NOT EXISTS idx_work4all_emp_code ON employees(work4all_code);
CREATE INDEX IF NOT EXISTS idx_work4all_resource_code ON vehicles(work4all_resource_code);
CREATE INDEX IF NOT EXISTS idx_work4all_project_code ON tradeshows(work4all_project_code);
CREATE INDEX IF NOT EXISTS idx_employee_vacation_dates ON employee_vacation(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_sickness_dates ON employee_sickness(start_date, end_date);
EOF
```

### Frontend Setup
```bash
# Frontend Dependencies und Build
cd client
npm install
npm run build
cd ..
```

### Work4all Synchronisation
```bash
# Server temporär starten
pm2 start server.js --name temp-sync

# Warten bis Server bereit ist
sleep 5

# Mitarbeiter synchronisieren
curl -X POST http://localhost:5000/api/work4all/sync-employees \
     -H "Content-Type: application/json" \
     -d '{}'

# Fahrzeuge synchronisieren
curl -X POST http://localhost:5000/api/work4all/sync-vehicles \
     -H "Content-Type: application/json" \
     -d '{}'

# Urlaub synchronisieren
curl -X POST http://localhost:5000/api/work4all/sync-vacation \
     -H "Content-Type: application/json" \
     -d '{}'

# Events synchronisieren
curl -X POST http://localhost:5000/api/work4all/sync-events \
     -H "Content-Type: application/json" \
     -d '{}'

# Temp-Server stoppen
pm2 delete temp-sync
```

### pm2 Prozesse starten
```bash
# Existierende Prozesse stoppen
pm2 delete digital-board-backend 2>/dev/null || true
pm2 delete digital-board-frontend 2>/dev/null || true

# Backend starten
pm2 start server.js --name "digital-board-backend"

# Frontend starten (falls client vorhanden)
cd client
pm2 start npm --name "digital-board-frontend" -- start
cd ..

# pm2 Konfiguration speichern
pm2 save

# pm2 Auto-Start aktivieren
pm2 startup
```

---

## 📊 Status und Verwaltung

### Status überprüfen
```bash
pm2 status
pm2 logs
```

### Prozesse verwalten
```bash
# Neustart
pm2 restart all

# Stoppen
pm2 stop all

# Monitoring
pm2 monit
```

### URLs
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000
- **Admin-Panel:** http://localhost:3000/admin

### Standard-Login
- **Benutzername:** admin
- **Passwort:** admin123

---

## 🔧 Fehlerbehebung

### Port bereits in Verwendung
```bash
# Prozesse finden und stoppen
sudo lsof -i :5000
sudo lsof -i :3000
pm2 kill
```

### Datenbank-Probleme
```bash
# Datenbank-Schema prüfen
sqlite3 database.db ".schema"

# Datenbank-Inhalt prüfen
sqlite3 database.db "SELECT COUNT(*) FROM employees;"
```

### work4all Verbindung testen
```bash
curl http://localhost:5000/api/work4all/test
```

### Logs überprüfen
```bash
# Backend-Logs
pm2 logs digital-board-backend

# Frontend-Logs
pm2 logs digital-board-frontend

# Alle Logs
pm2 logs
```

---

## 🔄 Regelmäßige Synchronisation

### Crontab einrichten (Optional)
```bash
# Crontab bearbeiten
crontab -e

# Alle 30 Minuten synchronisieren
*/30 * * * * curl -X POST http://localhost:5000/api/work4all/sync-vacation >/dev/null 2>&1

# Täglich um 6 Uhr vollständige Synchronisation
0 6 * * * curl -X POST http://localhost:5000/api/work4all/sync-employees >/dev/null 2>&1
``` 