#!/bin/bash

# Digital Board - Linux Setup Script
# Automatische Einrichtung für Frontend + Backend mit pm2

set -e  # Stoppe bei Fehlern

echo "🚀 Digital Board - Linux Setup"
echo "================================"

# Farben für bessere Lesbarkeit
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Hilfsfunktionen
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Prüfe Abhängigkeiten
check_dependencies() {
    log_info "Prüfe Abhängigkeiten..."
    
    # Node.js prüfen
    if ! command -v node &> /dev/null; then
        log_error "Node.js ist nicht installiert. Bitte installieren Sie Node.js 18+."
    fi
    
    # npm prüfen
    if ! command -v npm &> /dev/null; then
        log_error "npm ist nicht installiert."
    fi
    
    # pm2 prüfen und ggf. installieren
    if ! command -v pm2 &> /dev/null; then
        log_warning "pm2 ist nicht installiert. Installiere pm2..."
        npm install -g pm2
        log_success "pm2 installiert"
    fi
    
    # sqlite3 prüfen
    if ! command -v sqlite3 &> /dev/null; then
        log_warning "sqlite3 ist nicht installiert. Versuche Installation..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y sqlite3
        elif command -v yum &> /dev/null; then
            sudo yum install -y sqlite
        else
            log_error "Kann sqlite3 nicht automatisch installieren. Bitte manuell installieren."
        fi
        log_success "sqlite3 installiert"
    fi
    
    log_success "Alle Abhängigkeiten erfüllt"
}

# Backend Setup
setup_backend() {
    log_info "Backend Setup..."
    
    # npm dependencies installieren
    if [ ! -d "node_modules" ]; then
        log_info "Installiere Backend-Dependencies..."
        npm install
        log_success "Backend-Dependencies installiert"
    else
        log_info "Backend-Dependencies bereits vorhanden"
    fi
    
    # Datenbank Setup
    if [ -f "database.db" ]; then
        log_warning "Bestehende Datenbank gefunden. Erstelle Backup..."
        cp database.db "database.db.backup.$(date +%Y%m%d_%H%M%S)"
        rm database.db
        log_success "Backup erstellt und alte DB gelöscht"
    fi
    
    log_info "Initialisiere neue Datenbank..."
    node init-database.js
    log_success "Datenbank initialisiert"
    
    # Schema erweitern für work4all
    log_info "Erweitere Datenbank-Schema für work4all..."
    sqlite3 database.db << 'EOF'
-- work4all Erweiterungen für employees
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

-- work4all Erweiterungen für vehicles
ALTER TABLE vehicles ADD COLUMN work4all_resource_code INTEGER;
ALTER TABLE vehicles ADD COLUMN work4all_resource_name TEXT;
ALTER TABLE vehicles ADD COLUMN work4all_last_update TEXT;

-- work4all Erweiterungen für tradeshows
ALTER TABLE tradeshows ADD COLUMN work4all_project_code INTEGER;
ALTER TABLE tradeshows ADD COLUMN work4all_project_number TEXT;
ALTER TABLE tradeshows ADD COLUMN work4all_group_code INTEGER;
ALTER TABLE tradeshows ADD COLUMN work4all_last_update TEXT;

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_work4all_emp_code ON employees(work4all_code);
CREATE INDEX IF NOT EXISTS idx_work4all_resource_code ON vehicles(work4all_resource_code);
CREATE INDEX IF NOT EXISTS idx_work4all_project_code ON tradeshows(work4all_project_code);
CREATE INDEX IF NOT EXISTS idx_employee_vacation_dates ON employee_vacation(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_employee_sickness_dates ON employee_sickness(start_date, end_date);
EOF
    
    log_success "Datenbank-Schema erweitert"
}

# Frontend Setup
setup_frontend() {
    log_info "Frontend Setup..."
    
    if [ -d "client" ]; then
        cd client
        
        if [ ! -d "node_modules" ]; then
            log_info "Installiere Frontend-Dependencies..."
            npm install
            log_success "Frontend-Dependencies installiert"
        else
            log_info "Frontend-Dependencies bereits vorhanden"
        fi
        
        log_info "Baue Frontend..."
        npm run build
        log_success "Frontend gebaut"
        
        cd ..
    else
        log_error "Frontend-Verzeichnis 'client' nicht gefunden"
    fi
}

# Work4all Synchronisation
sync_work4all() {
    log_info "Starte initiale work4all Synchronisation..."
    
    # Server im Hintergrund starten für Sync
    pm2 start server.js --name "digital-board-temp" >/dev/null 2>&1 || true
    sleep 5
    
    # Vollständige Synchronisation
    log_info "Führe Mitarbeiter-Synchronisation durch..."
    curl -X POST http://localhost:5000/api/work4all/sync-employees \
         -H "Content-Type: application/json" \
         -d '{}' >/dev/null 2>&1 || log_warning "Mitarbeiter-Sync möglicherweise fehlgeschlagen"
    
    sleep 2
    
    log_info "Führe Fahrzeug-Synchronisation durch..."
    curl -X POST http://localhost:5000/api/work4all/sync-vehicles \
         -H "Content-Type: application/json" \
         -d '{}' >/dev/null 2>&1 || log_warning "Fahrzeug-Sync möglicherweise fehlgeschlagen"
    
    sleep 2
    
    log_info "Führe Urlaub-Synchronisation durch..."
    curl -X POST http://localhost:5000/api/work4all/sync-vacation \
         -H "Content-Type: application/json" \
         -d '{}' >/dev/null 2>&1 || log_warning "Urlaub-Sync möglicherweise fehlgeschlagen"
    
    sleep 2
    
    log_info "Führe Event-Synchronisation durch..."
    curl -X POST http://localhost:5000/api/work4all/sync-events \
         -H "Content-Type: application/json" \
         -d '{}' >/dev/null 2>&1 || log_warning "Event-Sync möglicherweise fehlgeschlagen"
    
    # Temp-Server stoppen
    pm2 delete digital-board-temp >/dev/null 2>&1 || true
    
    log_success "Initiale work4all Synchronisation abgeschlossen"
}

# pm2 Prozesse starten
start_pm2_processes() {
    log_info "Starte pm2 Prozesse..."
    
    # Stoppe existierende Prozesse
    pm2 delete digital-board-backend >/dev/null 2>&1 || true
    pm2 delete digital-board-frontend >/dev/null 2>&1 || true
    
    # Backend starten
    pm2 start server.js --name "digital-board-backend" --log-date-format "YYYY-MM-DD HH:mm:ss"
    
    # Frontend starten (wenn client-Verzeichnis existiert)
    if [ -d "client" ]; then
        cd client
        pm2 start npm --name "digital-board-frontend" -- start
        cd ..
    fi
    
    # pm2 speichern
    pm2 save
    
    log_success "pm2 Prozesse gestartet"
}

# Status anzeigen
show_status() {
    echo ""
    echo "🎉 Setup abgeschlossen!"
    echo "======================"
    echo ""
    echo "📊 pm2 Status:"
    pm2 status
    echo ""
    echo "🌐 URLs:"
    echo "   Backend:  http://localhost:5000"
    echo "   Frontend: http://localhost:3000"
    echo ""
    echo "🛠️ Nützliche Befehle:"
    echo "   pm2 status              - Status anzeigen"
    echo "   pm2 logs               - Logs anzeigen"
    echo "   pm2 restart all        - Alle Prozesse neustarten"
    echo "   pm2 stop all           - Alle Prozesse stoppen"
    echo "   pm2 monit              - Monitoring-Dashboard"
    echo ""
    echo "📱 Admin-Panel: http://localhost:3000/admin"
    echo "   Standard-Login: admin / admin123"
    echo ""
}

# Cleanup bei Fehlern
cleanup() {
    log_warning "Setup wurde unterbrochen. Räume auf..."
    pm2 delete digital-board-temp >/dev/null 2>&1 || true
}

# Hauptfunktion
main() {
    # Cleanup bei Ctrl+C
    trap cleanup EXIT
    
    echo "Dieses Script wird:"
    echo "1. Abhängigkeiten prüfen"
    echo "2. Backend setup (npm install, DB init)"
    echo "3. Frontend setup (npm install, build)"
    echo "4. work4all Synchronisation"
    echo "5. pm2 Prozesse starten"
    echo ""
    
    read -p "Fortfahren? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup abgebrochen."
        exit 0
    fi
    
    check_dependencies
    setup_backend
    setup_frontend
    sync_work4all
    start_pm2_processes
    show_status
}

# Script ausführen
main "$@" 