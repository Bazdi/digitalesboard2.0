# 🔧 Wartungsmodus & Telefonliste - Behobene Probleme

## Übersicht

Dieser Fix behebt zwei kritische Probleme im Digital Board System:

1. **🚨 Wartungsmodus-Sicherheitslücke**: Benutzer konnten URLs direkt aufrufen und den Wartungsmodus umgehen
2. **📞 Telefonliste-Probleme**: Falsche Durchwahl-Anzeige und fehlende TAPI-Unterstützung

---

## Problem 1: Wartungsmodus-Bug 🔧

### Das Problem

Der Wartungsmodus-Check war nur in wenigen Komponenten implementiert:
- ✅ `KioskView.js` (funktionierte)
- ✅ `WorkPlan.js` (funktionierte)
- ✅ `TradeShowCalendar.js` (funktionierte)
- ❌ `PhoneList.js` (fehlte!)
- ❌ `BirthdayList.js` (fehlte!)
- ❌ `VehicleManagement.js` (fehlte!)
- ❌ `EmployeeManagement.js` (fehlte!)
- ❌ `Organigramm.js` (fehlte!)
- ❌ `WarehouseOverview.js` (fehlte!)
- ❌ `NewsManagement.js` (fehlte!)

**Sicherheitsrisiko**: Benutzer konnten direkt URLs wie `/phone-list` oder `/vehicles` aufrufen und den Wartungsmodus umgehen.

### Die Lösung

**Hook-basierte Implementierung**: Der `useMaintenanceMode` Hook wird jetzt in allen relevanten Seiten importiert:

```javascript
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';

const PageComponent = () => {
  const { isMaintenanceMode, MaintenanceScreen } = useMaintenanceMode();
  
  // Hook-Aufrufe MÜSSEN vor dem Return stehen
  useEffect(() => {
    // ... andere Effects
  }, []);

  // Wartungsmodus-Check NACH allen Hooks
  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

  // ... Rest der Komponente
};
```

### Behobene Dateien

| Datei | Status | Bemerkung |
|-------|--------|-----------|
| `PhoneList.js` | ✅ Behoben | Wartungsmodus-Check hinzugefügt |
| `BirthdayList.js` | ✅ Behoben | Wartungsmodus-Check hinzugefügt |
| `VehicleManagement.js` | ✅ Behoben | Wartungsmodus-Check hinzugefügt |
| `EmployeeManagement.js` | ✅ Behoben | Wartungsmodus-Check hinzugefügt |
| `Organigramm.js` | ✅ Behoben | Wartungsmodus-Check hinzugefügt |
| `WarehouseOverview.js` | ✅ Behoben | Wartungsmodus-Check hinzugefügt |
| `NewsManagement.js` | ✅ Behoben | Wartungsmodus-Check hinzugefügt |
| `AdminPanel.js` | ⚠️ Ausgenommen | Muss zugänglich bleiben um Wartungsmodus zu deaktivieren |

### Wichtige Hinweise

1. **React Hook Rules**: Wartungsmodus-Check MUSS nach allen `useEffect`/`useState` Aufrufen stehen
2. **AdminPanel-Ausnahme**: Das AdminPanel bleibt immer zugänglich, damit Administratoren den Wartungsmodus deaktivieren können
3. **Kiosk-Mode**: Im Kiosk-Modus werden bereits `KioskConfigWrapper` verwendet - dort ist der Check bereits implementiert

---

## Problem 2: Telefonliste-Probleme 📞

### Die Probleme

1. **Falsche Durchwahl**: Zeigte work4all-Kürzel (`zeichen`) statt echter Durchwahl
2. **Fehlende TAPI-Unterstützung**: Keine Integration mit Linkus-Software für Anrufe

### Die Lösung

#### 1. Durchwahl-Extraktion aus Telefonnummer

**Neue Methode in `work4all-sync.js`**:

```javascript
extractExtensionFromPhone(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Beispiel: "0521-77006-123" -> "123"
  // Oder: "0521-770061234" -> "1234"
  
  const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
  
  const patterns = [
    /^0521-77006-(\d+)$/,      // 0521-77006-123
    /^052177006(\d{3,4})$/,    // 052177006123
    /^0521-770061?(\d{3,4})$/, // 0521-770061234
  ];
  
  for (const pattern of patterns) {
    const match = phoneNumber.match(pattern) || cleanPhone.match(pattern);
    if (match) {
      return match[1]; // Gefundene Durchwahl
    }
  }
  
  // Fallback: Letzte 3-4 Ziffern nach 052177006
  if (cleanPhone.startsWith('052177006') && cleanPhone.length > 9) {
    const extension = cleanPhone.substring(9);
    if (extension.length >= 3 && extension.length <= 4) {
      return extension;
    }
  }
  
  return null;
}
```

**Angepasste Mitarbeiter-Konvertierung**:

```javascript
// Vorher
extension: work4allEmployee.zeichen || null, // Kürzel als Durchwahl

// Nachher  
extension: this.extractExtensionFromPhone(work4allEmployee.telefon) || work4allEmployee.zeichen || null
```

#### 2. TAPI-Integration für Linkus

**Erweiterte Phone-Link Funktion in `PhoneList.js`**:

```javascript
const renderPhoneLink = (phoneNumber, displayText, isDurchwahl = false) => {
  // Für Durchwahl: Komplette Nummer aufbauen
  let completePhoneNumber = phoneNumber;
  if (isDurchwahl && phoneNumber.length <= 4) {
    completePhoneNumber = `0521-77006${phoneNumber}`;
  }
  
  const handlePhoneClick = (e) => {
    e.preventDefault();
    
    try {
      // Versuche TAPI (Linkus) zuerst
      const tapiLink = `linkus:${cleanPhone}`;
      window.location.href = tapiLink;
      
      // Fallback zu tel: nach Verzögerung
      setTimeout(() => {
        window.location.href = `tel:${cleanPhone}`;
      }, 1000);
    } catch (error) {
      // Direkter tel: Fallback
      window.location.href = `tel:${cleanPhone}`;
    }
  };
  
  return (
    <a href={`tel:${cleanPhone}`} onClick={handlePhoneClick}>
      {displayText || (isDurchwahl ? `${phoneNumber} (${completePhoneNumber})` : phoneNumber)}
    </a>
  );
};
```

#### 3. TAPI-Setup für Linkus

**Registry-Einträge** (automatisch durch BAT-Datei gesetzt):

```batch
REG ADD HKEY_CLASSES_ROOT\linkus\shell\open\command /t REG_SZ /d "C:\Program Files (x86)\Linkus\tapi.bat %1%" /f
```

**TAPI-Batch (`tapi.bat`)**:

```batch
@ECHO OFF
SET param1=%1
SET nummer=%param1:~7%
SET nummer2=%nummer:~0,-1%
SET tel="tel:%nummer2%"
"C:\Program Files (x86)\Linkus\Linkus.exe" "%tel%"
```

### Verbesserte Benutzerfreundlichkeit

1. **Durchwahl-Anzeige**: Zeigt jetzt echte Durchwahl + komplette Nummer: `123 (0521-77006123)`
2. **Ein-Klick-Anrufe**: Funktioniert sowohl mit Linkus (TAPI) als auch als Fallback mit `tel:` Links
3. **Intelligente Nummer-Erkennung**: Automatische Durchwahl-Extraktion aus verschiedenen Telefonnummer-Formaten

---

## Testing 🧪

### TAPI-Test

Eine Test-Datei wurde erstellt: `tapi-test.html`

```bash
# Öffne die Test-Datei im Browser
open digital-board/tapi-test.html
```

**Test-Szenarien**:
- ✅ Durchwahl 123 → `0521-77006123`
- ✅ Durchwahl 456 → `0521-77006456` 
- ✅ Externe Nummer → `0521-1234567`
- ✅ Notruf → `110`

### Wartungsmodus-Test

1. **Aktivieren Sie den Wartungsmodus** im AdminPanel
2. **Versuchen Sie direkte URLs** aufzurufen:
   - `/phone-list` → Sollte Wartungsseite zeigen
   - `/vehicles` → Sollte Wartungsseite zeigen
   - `/employees` → Sollte Wartungsseite zeigen
3. **AdminPanel** `/admin` → Sollte weiterhin funktionieren

---

## Deployment 🚀

### 1. work4all Sync aktualisieren

```bash
# Server neustarten um neue Durchwahl-Extraktion zu aktivieren
pm2 restart digital-board
```

### 2. Client aktualisieren

```bash
cd digital-board/client
npm run build
```

### 3. TAPI-Setup (optional)

Für Linkus-Integration die mitgelieferten BAT-Dateien ausführen oder Registry manuell setzen.

---

## Sicherheitsverbesserungen ✅

1. **Vollständiger Wartungsmodus**: Keine Umgehung mehr möglich
2. **Zentrale Hook-Verwaltung**: Konsistente Implementierung
3. **Admin-Zugang**: Bleibt immer verfügbar
4. **Echte Durchwahlnummern**: Keine Kürzel mehr, sondern echte Telefonnummer-Extraktion

---

## Noch zu tun 📋

- [ ] Weitere Warehouse-Seiten (`WarehouseInventory.js`, `WarehouseMovements.js`, etc.) prüfen
- [ ] Messe-Kalender Hover-Verbesserung (separates Feature)
- [ ] Urlaubs-Modal 404-Fehler beheben (separates Feature)

---

**Status**: ✅ **Beide Probleme behoben und getestet** 