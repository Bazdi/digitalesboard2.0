const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Erweitere Datenbank-Schema für Urlaub/Krankheit-Tage...');

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('❌ Fehler beim Öffnen der Datenbank:', err.message);
    process.exit(1);
  }
  console.log('✅ Datenbank-Verbindung hergestellt');
});

// Prüfe ob Spalten bereits existieren
db.all("PRAGMA table_info(employees)", (err, columns) => {
  if (err) {
    console.error('❌ Fehler beim Abrufen der Tabellen-Info:', err.message);
    db.close();
    return;
  }
  
  const columnNames = columns.map(col => col.name);
  console.log('📋 Vorhandene Spalten:', columnNames);
  
  const hasVacationDaysLeft = columnNames.includes('vacation_days_left');
  const hasSicknessDaysLeft = columnNames.includes('sickness_days_left');
  
  if (hasVacationDaysLeft && hasSicknessDaysLeft) {
    console.log('✅ Alle benötigten Spalten sind bereits vorhanden');
    db.close();
    return;
  }
  
  // Füge fehlende Spalten hinzu
  const alterQueries = [];
  
  if (!hasVacationDaysLeft) {
    alterQueries.push("ALTER TABLE employees ADD COLUMN vacation_days_left INTEGER DEFAULT NULL");
    console.log('➕ Füge vacation_days_left Spalte hinzu...');
  }
  
  if (!hasSicknessDaysLeft) {
    alterQueries.push("ALTER TABLE employees ADD COLUMN sickness_days_left INTEGER DEFAULT NULL");
    console.log('➕ Füge sickness_days_left Spalte hinzu...');
  }
  
  // Führe ALTER TABLE Befehle aus
  let completed = 0;
  alterQueries.forEach((query, index) => {
    db.run(query, (err) => {
      if (err) {
        console.error(`❌ Fehler bei Query ${index + 1}:`, err.message);
      } else {
        console.log(`✅ Query ${index + 1} erfolgreich ausgeführt`);
      }
      
      completed++;
      if (completed === alterQueries.length) {
        console.log('\n📊 Schema-Erweiterung abgeschlossen!');
        console.log('🔍 Neue Spalten:');
        console.log('   - vacation_days_left: Anzahl verbleibender Urlaubstage');
        console.log('   - sickness_days_left: Anzahl verbleibender Krankheitstage');
        console.log('\n💡 Diese Spalten werden automatisch von der work4all-Synchronisation befüllt');
        
        db.close((err) => {
          if (err) {
            console.error('❌ Fehler beim Schließen der Datenbank:', err.message);
          } else {
            console.log('✅ Datenbank-Verbindung geschlossen');
          }
        });
      }
    });
  });
}); 