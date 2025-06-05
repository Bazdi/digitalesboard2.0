# work4all Integration - Dokumentation

## 🔄 Automatische Mitarbeiter- und Fahrzeug-Synchronisation

Diese Integration ermöglicht die automatische Synchronisation von Mitarbeiter- und Fahrzeugdaten zwischen work4all und dem digitalen Schwarzen Brett.

## 📋 Funktionen

### ✅ Automatische Synchronisation
- **Mitarbeiter**: Alle 4 Stunden automatisch
- **Fahrzeuge**: Alle 4 Stunden automatisch  
- **Manuelle Auslösung**: Über das Frontend möglich (vollständig oder getrennt)
- **Fehlerbehandlung**: Robuste Wiederholung bei Netzwerkfehlern

### 🔍 Mitarbeiter-Daten-Mapping
```
work4all Feld          → Lokales Feld
─────────────────────────────────────────────
anzeigename            → name
eMail                  → email
geburtsdatum          → birthday
abteilung             → department (gemappt)
funktion              → position_title
telefon               → phone
mobil                 → mobile
zeichen               → extension
ausgeschieden         → employment_status
code                  → work4all_code
nummer                → work4all_nummer
```

### 🚗 Fahrzeug-Ressourcen-Filtering
```
work4all Ressource     → Aktion
─────────────────────────────────────────────
Name enthält "PKW"     → Als Fahrzeug importieren
Name enthält "LKW"     → Als Fahrzeug importieren  
Name enthält "Sprinter"→ Als Fahrzeug importieren
userType = "sonstige"  → Ignorieren (Besprechungsraum)
Name enthält "Raum"    → Ignorieren (Besprechungsraum)
Name enthält "Meeting" → Ignorieren (Besprechungsraum)
```

### 🔄 Fahrzeug-Daten-Mapping
```
work4all Feld          → Lokales Feld
─────────────────────────────────────────────
name/bezeichnung       → brand + model (extrahiert)
kennzeichen           → license_plate
code                  → work4all_resource_code
beschreibung          → notes
userType              → (für Filterung)
```

### 📊 Abteilungs-Mapping
```
work4all               → Lokale Abteilung
─────────────────────────────────────────────
"Vertrieb"            → "Vertrieb"
"Planung"             → "Planung"
"Verwaltung"          → "Verwaltung"
"Lager"               → "Lager"
"Außendienst"         → "Außendienst"
"IT"                  → "IT"
Sonstige              → "Allgemein"
```

## 🚀 API-Endpunkte

### Vollständige Synchronisation
```
POST /api/work4all/sync
- Synchronisiert Mitarbeiter UND Fahrzeuge
- Benötigt Admin-Token
```

### Nur Mitarbeiter synchronisieren  
```
POST /api/work4all/sync-employees
- Synchronisiert nur Mitarbeiter
- Benötigt Admin-Token
```

### Nur Fahrzeuge synchronisieren
```
POST /api/work4all/sync-vehicles  
- Synchronisiert nur Fahrzeug-Ressourcen
- Filtert automatisch Besprechungsräume heraus
- Benötigt Admin-Token
```

### Status abrufen
```
GET /api/work4all/status
- Zeigt Sync-Status für Mitarbeiter und Fahrzeuge
- Zeigt Prozentsätze und letzte Sync-Zeiten
```

### Verbindung testen
```
GET /api/work4all/test-connection
- Testet work4all API-Verbindung
- Prüft Authentifizierung
```

## 💾 Datenbank-Erweiterungen

### Neue Spalten für Mitarbeiter:
- `work4all_code` - work4all Mitarbeiter-Code
- `work4all_nummer` - work4all Mitarbeiter-Nummer  
- `work4all_last_update` - Letzte Synchronisation

### Neue Spalten für Fahrzeuge:
- `work4all_resource_code` - work4all Ressourcen-Code
- `work4all_resource_name` - Original work4all Name
- `work4all_last_update` - Letzte Synchronisation

## 🎯 Frontend-Integration

### work4all Sync-Dashboard
- **Status-Übersicht**: Separate Anzeige für Mitarbeiter und Fahrzeuge
- **Sync-Buttons**: Vollständige Sync oder getrennte Synchronisation
- **Fortschrittsanzeigen**: Prozentsatz der synchronisierten Daten
- **Verbindungstest**: Manuelle Prüfung der work4all-Verbindung

### Mitarbeiterverwaltung
- **Zentraler Tab**: "🔄 work4all Sync"  
- **Live-Status**: Anzeige aktueller Sync-Informationen
- **Manuelle Kontrolle**: Sync-Buttons für sofortige Aktualisierung

## 📝 Nutzung

### Manueller Test
```bash
# Test ohne Synchronisation
node test-work4all.js

# Test mit vollständiger Synchronisation  
node test-work4all.js --sync
```

### Server-Integration
```bash
# Server starten (work4all Service wird automatisch initialisiert)
node server.js
```

### Frontend-Zugriff
1. Als Admin anmelden
2. Zu "👥 Mitarbeiter" navigieren  
3. Tab "🔄 work4all Sync" öffnen
4. Gewünschte Synchronisation auswählen

## ⚡ Automatisierung

- **Auto-Sync**: Alle 4 Stunden (240 Minuten)
- **Service-Start**: Automatisch beim Server-Start
- **Fehler-Handling**: Automatische Wiederholung bei temporären Fehlern
- **Token-Management**: Automatische Erneuerung bei Ablauf

## 🔒 Sicherheit

- **Authentifizierung**: Bearer Token für work4all API
- **Admin-Rechte**: Nur Admins können Synchronisation auslösen
- **Fehler-Logging**: Detailliertes Logging für Debugging
- **Daten-Validierung**: Prüfung aller importierten Daten

## 🛠️ Konfiguration

### work4all API-Einstellungen (work4all-sync.js):
```javascript
baseUrl: 'http://192.168.112.18:4713/api'
credentials: {
  username: "API Service",
  passwordHash: "3461E6540B1A3C3FBB46E56201CA0A21", 
  application: "service.api"
}
```

### Auto-Sync Intervall ändern:
```javascript
// In server.js bei initializeWork4AllService()
work4allService.startAutoSync(240); // Minuten
```

## 🔧 Konfiguration

### API-Endpunkt anpassen
In `work4all-sync.js`:
```javascript
this.baseUrl = 'http://192.168.112.18:4713/api';
```

### Authentifizierung
```javascript
this.credentials = {
  username: "API Service",
  passwordHash: "3461E6540B1A3C3FBB46E56201CA0A21",
  application: "service.api"
};
```

### Sync-Intervall anpassen
In `server.js`:
```javascript
// Alle 4 Stunden (240 Minuten)
work4allService.startAutoSync(240);
```

## 📊 API-Endpunkte

### POST `/api/work4all/sync`
Manuelle Synchronisation auslösen
```json
{
  "success": true,
  "message": "Synchronisation erfolgreich",
  "data": {
    "total": 25,
    "created": 3,
    "updated": 5,
    "errors": 0
  }
}
```

### GET `/api/work4all/status`
Synchronisations-Status abrufen
```json
{
  "service_running": true,
  "total_employees": 25,
  "synced_employees": 22,
  "last_sync": "2025-01-15T10:30:00.000Z",
  "sync_percentage": 88
}
```

### GET `/api/work4all/test-connection`
Verbindung zu work4all testen
```json
{
  "success": true,
  "message": "Verbindung zu work4all erfolgreich"
}
```

## 🎯 Frontend-Integration

### Sync-Komponente einbinden
```jsx
import Work4AllSync from '../components/Work4AllSync';

// In der Mitarbeiterverwaltung als Tab
<Work4AllSync />
```

### Features im Frontend
- ✅ Live-Status-Anzeige
- 🔄 Manuelle Synchronisation
- 🔍 Verbindungstest
- 📊 Sync-Statistiken
- ⏰ Letzte Synchronisation
- 🎯 Fortschrittsbalken

## 🔄 Synchronisations-Logik

### 1. Identifikation
Mitarbeiter werden anhand der `work4all_code` identifiziert.

### 2. Update vs. Create
- **Existiert `work4all_code`**: Mitarbeiter wird aktualisiert
- **Neu**: Neuer Mitarbeiter wird erstellt

### 3. Daten-Schutz
Folgende Felder werden **NICHT** überschrieben:
- `driving_license_classes` (manuell gepflegt)
- `license_expires` (manuell gepflegt)
- `can_drive_company_vehicles` (manuell gesetzt)
- `has_key_access` (sicherheitsrelevant)
- `security_clearance_level` (sicherheitsrelevant)
- `hire_date` (nicht in work4all verfügbar)

### 4. Standard-Werte für neue Mitarbeiter
```javascript
{
  employee_type: 'intern',
  is_active_employee: !ausgeschieden,
  uses_bulletin_board: !ausgeschieden,
  can_drive_company_vehicles: !ausgeschieden,
  has_key_access: false,
  security_clearance_level: 1,
  driving_license_classes: 'B'
}
```

## 🛠️ Troubleshooting

### Häufige Probleme

#### 1. Verbindungsfehler
```
❌ work4all Authentifizierung fehlgeschlagen
```
**Lösung**: 
- Netzwerkverbindung prüfen
- IP-Adresse/Port prüfen
- Credentials überprüfen

#### 2. Token-Ablauf
```
❌ 401 Unauthorized
```
**Lösung**: Token wird automatisch erneuert

#### 3. Datenbank-Fehler
```
❌ SQLITE_ERROR: no such column: work4all_code
```
**Lösung**: Schema-Migration ausführen
```bash
node -e "
const service = require('./work4all-sync');
const s = new service();
s.extendDatabaseSchema().then(() => s.close());
"
```

### Debug-Modus
```bash
DEBUG=work4all node server.js
```

## 📈 Monitoring

### Log-Ausgaben
```
✅ work4all Service initialisiert
🔄 Automatische work4all Synchronisation...
📥 Lade Mitarbeiterdaten von work4all...
✅ 25 Mitarbeiter von work4all erhalten
🔄 Aktualisiert: Max Mustermann
✅ Erstellt: Neue Mitarbeiterin
📊 Synchronisation abgeschlossen:
   ✅ Erstellt: 2 Mitarbeiter
   🔄 Aktualisiert: 5 Mitarbeiter
   ❌ Fehler: 0 Mitarbeiter
```

### Datenbank-Queries
```sql
-- Synchronisations-Status
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN work4all_code IS NOT NULL THEN 1 END) as synced,
  MAX(work4all_last_update) as last_sync
FROM employees;

-- work4all Mitarbeiter
SELECT * FROM employees WHERE work4all_code IS NOT NULL;

-- Nicht synchronisierte Mitarbeiter
SELECT * FROM employees WHERE work4all_code IS NULL;
```

## 🎯 Best Practices

### 1. Regelmäßige Backups
```bash
# Vor Synchronisation
cp database.db database.db.backup
```

### 2. Test-Umgebung
```bash
# Test-Synchronisation
node test-work4all.js --sync
```

### 3. Monitoring einrichten
- Status-Dashboard überwachen
- Log-Files regelmäßig prüfen
- Fehler-Alerts konfigurieren

### 4. Wartung
- Regelmäßige Updates der Dependencies
- work4all API-Änderungen überwachen
- Performance-Optimierung bei großen Datenmengen

---

## 📞 Support

Bei Problemen oder Fragen zur work4all Integration:

1. **Log-Files prüfen**: Console-Ausgaben analysieren
2. **Test-Skript ausführen**: `node test-work4all.js`
3. **Verbindung testen**: Frontend → work4all Sync → Verbindung testen
4. **Datenbank prüfen**: Synchronisations-Status in der DB

**Letzte Aktualisierung**: Januar 2025 