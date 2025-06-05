const sqlite3 = require('sqlite3').verbose();

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
  
  const hasVacationEndDate = columnNames.includes('vacation_end_date');
  const hasSicknessEndDate = columnNames.includes('sickness_end_date');
  
  if (hasVacationEndDate && hasSicknessEndDate) {
    console.log('✅ Alle benötigten Enddatum-Spalten sind bereits vorhanden');
    db.close();
    return;
  }
  
  // Füge fehlende Spalten hinzu
  const alterQueries = [];
  
  if (!hasVacationEndDate) {
    alterQueries.push("ALTER TABLE employees ADD COLUMN vacation_end_date TEXT DEFAULT NULL");
    console.log('➕ Füge vacation_end_date Spalte hinzu...');
  }
  
  if (!hasSicknessEndDate) {
    alterQueries.push("ALTER TABLE employees ADD COLUMN sickness_end_date TEXT DEFAULT NULL");
    console.log('➕ Füge sickness_end_date Spalte hinzu...');
  }
  
  // Führe ALTER TABLE Befehle aus
  let completed = 0;
  const totalQueries = alterQueries.length;
  
  if (totalQueries === 0) {
    console.log('✅ Keine neuen Spalten erforderlich');
    db.close();
    return;
  }
  
  alterQueries.forEach((query) => {
    db.run(query, (err) => {
      if (err) {
        console.error('❌ Fehler beim Ausführen der Abfrage:', err.message);
      } else {
        console.log('✅ Spalte erfolgreich hinzugefügt');
      }
      
      completed++;
      if (completed === totalQueries) {
        console.log('🎉 Alle Enddatum-Spalten erfolgreich hinzugefügt!');
        
        // Prüfe die finale Tabellenstruktur
        db.all("PRAGMA table_info(employees)", (err, finalColumns) => {
          if (err) {
            console.error('❌ Fehler beim Abrufen der finalen Tabellen-Info:', err.message);
          } else {
            const finalColumnNames = finalColumns.map(col => col.name);
            console.log('📋 Finale Spalten:', finalColumnNames);
          }
          db.close();
        });
      }
    });
  });
}); 