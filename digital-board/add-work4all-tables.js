// add-work4all-tables.js - Erweitert bestehende Datenbank um work4all Tabellen
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🔄 Erweitere bestehende Datenbank um work4all Tabellen...');

db.serialize(() => {
  // Füge work4all_code Spalten zu employees hinzu (falls nicht vorhanden)
  db.run(`ALTER TABLE employees ADD COLUMN work4all_code INTEGER UNIQUE`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Fehler beim Hinzufügen von work4all_code:', err.message);
    } else {
      console.log('✅ work4all_code Spalte hinzugefügt (oder bereits vorhanden)');
    }
  });

  db.run(`ALTER TABLE employees ADD COLUMN work4all_nummer INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Fehler beim Hinzufügen von work4all_nummer:', err.message);
    } else {
      console.log('✅ work4all_nummer Spalte hinzugefügt (oder bereits vorhanden)');
    }
  });

  db.run(`ALTER TABLE employees ADD COLUMN work4all_last_update DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Fehler beim Hinzufügen von work4all_last_update:', err.message);
    } else {
      console.log('✅ work4all_last_update Spalte hinzugefügt (oder bereits vorhanden)');
    }
  });

  // Employee Vacation Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS employee_vacation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    work4all_code INTEGER,
    work4all_vacation_code INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    vacation_days INTEGER NOT NULL,
    vacation_type TEXT DEFAULT 'urlaub',
    work4all_sync_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id)
  )`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen der employee_vacation Tabelle:', err.message);
    } else {
      console.log('✅ employee_vacation Tabelle erstellt');
    }
  });

  // Employee Sickness Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS employee_sickness (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    work4all_code INTEGER,
    work4all_sickness_code INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sickness_days INTEGER NOT NULL,
    sickness_type TEXT DEFAULT 'krankheit',
    work4all_sync_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id)
  )`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen der employee_sickness Tabelle:', err.message);
    } else {
      console.log('✅ employee_sickness Tabelle erstellt');
    }
  });

  // work4all Synchronisation Log Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS work4all_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,
    sync_status TEXT NOT NULL,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_errors INTEGER DEFAULT 0,
    error_message TEXT,
    sync_duration_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen der work4all_sync_log Tabelle:', err.message);
    } else {
      console.log('✅ work4all_sync_log Tabelle erstellt');
    }
  });

  console.log('🔄 Prüfe und erstelle Indizes für bessere Performance...');
  
  // Indizes für bessere Performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_employees_work4all_code ON employees(work4all_code)`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen des work4all_code Index:', err.message);
    } else {
      console.log('✅ Index für work4all_code erstellt');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_vacation_dates ON employee_vacation(start_date, end_date)`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen des vacation_dates Index:', err.message);
    } else {
      console.log('✅ Index für Urlaubsdaten erstellt');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_sickness_dates ON employee_sickness(start_date, end_date)`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen des sickness_dates Index:', err.message);
    } else {
      console.log('✅ Index für Krankheitsdaten erstellt');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_vacation_employee ON employee_vacation(employee_id)`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen des vacation_employee Index:', err.message);
    } else {
      console.log('✅ Index für Urlaub nach Mitarbeiter erstellt');
    }
  });

  db.run(`CREATE INDEX IF NOT EXISTS idx_sickness_employee ON employee_sickness(employee_id)`, (err) => {
    if (err) {
      console.error('Fehler beim Erstellen des sickness_employee Index:', err.message);
    } else {
      console.log('✅ Index für Krankheit nach Mitarbeiter erstellt');
    }
  });

});

db.close((err) => {
  if (err) {
    console.error('Fehler beim Schließen der Datenbank:', err.message);
  } else {
    console.log('');
    console.log('🎉 work4all Tabellen erfolgreich hinzugefügt!');
    console.log('');
    console.log('📊 NEUE TABELLEN:');
    console.log('   📋 employee_vacation - Urlaubsdaten aus work4all');
    console.log('   🤒 employee_sickness - Krankheitsdaten aus work4all');
    console.log('   📝 work4all_sync_log - Synchronisations-Protokoll');
    console.log('');
    console.log('🔄 ERWEITERTE EMPLOYEES TABELLE:');
    console.log('   🔗 work4all_code - Verknüpfung zu work4all');
    console.log('   📊 work4all_nummer - work4all Mitarbeiternummer');
    console.log('   ⏰ work4all_last_update - Letzte Aktualisierung');
    console.log('');
    console.log('⚡ INDIZES für bessere Performance erstellt');
    console.log('');
    console.log('🚀 NÄCHSTE SCHRITTE:');
    console.log('   1. Server neu starten: node server.js');
    console.log('   2. work4all Synchronisation: node test-work4all.js --sync');
    console.log('   3. Dashboard prüfen - Urlaub/Krankheit sollten jetzt angezeigt werden');
  }
}); 