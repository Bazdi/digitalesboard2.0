// add-missing-columns.js - Füge fehlende work4all Spalten hinzu
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🔧 Füge fehlende work4all-Spalten zu bestehenden Tabellen hinzu...');

db.serialize(() => {
  // Füge vacation_art_code und vacation_art_description zu employee_vacation hinzu
  console.log('📋 Füge vacation_art_code und vacation_art_description zu employee_vacation hinzu...');
  
  db.run(`ALTER TABLE employee_vacation ADD COLUMN vacation_art_code INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von vacation_art_code:', err.message);
    } else {
      console.log('✅ vacation_art_code hinzugefügt');
    }
  });
  
  db.run(`ALTER TABLE employee_vacation ADD COLUMN vacation_art_description TEXT DEFAULT 'Urlaub'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von vacation_art_description:', err.message);
    } else {
      console.log('✅ vacation_art_description hinzugefügt');
    }
  });

  // Füge sickness_art_code und sickness_art_description zu employee_sickness hinzu
  console.log('📋 Füge sickness_art_code und sickness_art_description zu employee_sickness hinzu...');
  
  db.run(`ALTER TABLE employee_sickness ADD COLUMN sickness_art_code INTEGER DEFAULT 0`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von sickness_art_code:', err.message);
    } else {
      console.log('✅ sickness_art_code hinzugefügt');
    }
  });
  
  db.run(`ALTER TABLE employee_sickness ADD COLUMN sickness_art_description TEXT DEFAULT 'Krankheit'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von sickness_art_description:', err.message);
    } else {
      console.log('✅ sickness_art_description hinzugefügt');
    }
  });

  // Füge work4all Spalten zu tradeshows hinzu
  console.log('📋 Füge work4all Spalten zu tradeshows hinzu...');
  
  db.run(`ALTER TABLE tradeshows ADD COLUMN work4all_project_code INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von work4all_project_code:', err.message);
    } else {
      console.log('✅ work4all_project_code hinzugefügt');
    }
  });
  
  db.run(`ALTER TABLE tradeshows ADD COLUMN work4all_project_number TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von work4all_project_number:', err.message);
    } else {
      console.log('✅ work4all_project_number hinzugefügt');
    }
  });
  
  db.run(`ALTER TABLE tradeshows ADD COLUMN work4all_group_code INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von work4all_group_code:', err.message);
    } else {
      console.log('✅ work4all_group_code hinzugefügt');
    }
  });
  
  db.run(`ALTER TABLE tradeshows ADD COLUMN work4all_last_update DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von work4all_last_update:', err.message);
    } else {
      console.log('✅ work4all_last_update hinzugefügt');
    }
  });

  // Füge work4all Spalten zu vehicles hinzu (falls nicht vorhanden)
  console.log('📋 Füge work4all Spalten zu vehicles hinzu...');
  
  db.run(`ALTER TABLE vehicles ADD COLUMN work4all_resource_code INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von work4all_resource_code:', err.message);
    } else {
      console.log('✅ work4all_resource_code hinzugefügt');
    }
  });
  
  db.run(`ALTER TABLE vehicles ADD COLUMN work4all_resource_name TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von work4all_resource_name:', err.message);
    } else {
      console.log('✅ work4all_resource_name hinzugefügt');
    }
  });
  
  db.run(`ALTER TABLE vehicles ADD COLUMN work4all_last_update DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.log('❌ Fehler beim Hinzufügen von work4all_last_update:', err.message);
    } else {
      console.log('✅ work4all_last_update hinzugefügt');
    }
  });

  // Erstelle Performance-Indizes
  console.log('📊 Erstelle Performance-Indizes...');
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_employee_vacation_art_code ON employee_vacation(vacation_art_code)`, (err) => {
    if (err) {
      console.log('❌ Fehler beim Erstellen von idx_employee_vacation_art_code:', err.message);
    } else {
      console.log('✅ Index idx_employee_vacation_art_code erstellt');
    }
  });
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_employee_sickness_art_code ON employee_sickness(sickness_art_code)`, (err) => {
    if (err) {
      console.log('❌ Fehler beim Erstellen von idx_employee_sickness_art_code:', err.message);
    } else {
      console.log('✅ Index idx_employee_sickness_art_code erstellt');
    }
  });
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_tradeshows_work4all_project_code ON tradeshows(work4all_project_code)`, (err) => {
    if (err) {
      console.log('❌ Fehler beim Erstellen von idx_tradeshows_work4all_project_code:', err.message);
    } else {
      console.log('✅ Index idx_tradeshows_work4all_project_code erstellt');
    }
  });
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_vehicles_work4all_resource_code ON vehicles(work4all_resource_code)`, (err) => {
    if (err) {
      console.log('❌ Fehler beim Erstellen von idx_vehicles_work4all_resource_code:', err.message);
    } else {
      console.log('✅ Index idx_vehicles_work4all_resource_code erstellt');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('❌ Fehler beim Schließen der Datenbank:', err.message);
  } else {
    console.log('✅ Alle fehlenden work4all-Spalten erfolgreich hinzugefügt!');
    console.log('');
    console.log('🚀 NÄCHSTE SCHRITTE:');
    console.log('   1. Server neu starten');
    console.log('   2. work4all Synchronisation testen');
    console.log('');
  }
}); 