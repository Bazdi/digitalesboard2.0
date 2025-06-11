const sqlite3 = require('sqlite3').verbose();

async function createProjectTables() {
  const db = new sqlite3.Database('./database.db');
  
  try {
    console.log('🗄️ Erstelle Projektmitarbeiter-Tabellen...');
    
    // 1. Projektmitarbeiter-Tabelle
    await new Promise((resolve, reject) => {
      db.run(`CREATE TABLE IF NOT EXISTS project_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_code INTEGER NOT NULL,
        project_name TEXT NOT NULL,
        employee_code INTEGER NOT NULL,
        employee_name TEXT NOT NULL,
        role TEXT DEFAULT 'Mitarbeiter',
        work4all_last_update TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_code, employee_code)
      )`, (err) => err ? reject(err) : resolve());
    });
    
    // 2. Indizes für bessere Performance
    await new Promise((resolve, reject) => {
      db.run(`CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_code)`, (err) => err ? reject(err) : resolve());
    });
    
    await new Promise((resolve, reject) => {
      db.run(`CREATE INDEX IF NOT EXISTS idx_project_members_employee ON project_members(employee_code)`, (err) => err ? reject(err) : resolve());
    });
    
    console.log('✅ Projektmitarbeiter-Tabellen erfolgreich erstellt');
    
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Tabellen:', error);
  } finally {
    db.close();
  }
}

createProjectTables(); 