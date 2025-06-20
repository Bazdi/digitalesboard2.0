// init-database.js - DEUTSCHE VERSION mit übersetzten Werten - FIXED VERSION
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { spawn } = require('child_process');

const db = new sqlite3.Database('./database.db');

console.log('🚀 Initialisiere saubere Datenbank mit vollständiger work4all Integration...');

// Funktion für robuste Tabellenerstellung mit Fehlerbehandlung
function createTableWithCallback(sql, tableName, callback) {
  db.run(sql, (err) => {
    if (err) {
      console.log(`❌ Fehler bei Tabelle ${tableName}:`, err.message);
    } else {
      console.log(`✅ Tabelle ${tableName} erstellt`);
    }
    if (callback) callback(err);
  });
}

// Erstelle Tabellen sequenziell mit robuster Fehlerbehandlung
db.serialize(() => {
  console.log('📋 Erstelle alle Tabellen mit vollständigen work4all-Spalten...');

  // 1. Users Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, 'users');

  // 2. Posts Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id)
  )`, 'posts');

  // 3. News Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    image TEXT,
    category TEXT DEFAULT 'Allgemein',
    priority INTEGER DEFAULT 1,
    is_breaking BOOLEAN DEFAULT 0,
    expires_at DATETIME,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id)
  )`, 'news');

  // 4. Employees Tabelle - VOLLSTÄNDIG mit work4all
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    birthday DATE,
    department TEXT,
    position_title TEXT,
    phone TEXT,
    mobile TEXT,
    extension TEXT,
    employee_type TEXT DEFAULT 'intern',
    is_active_employee BOOLEAN DEFAULT 1,
    uses_bulletin_board BOOLEAN DEFAULT 1,
    work_location TEXT DEFAULT 'büro',
    employment_status TEXT DEFAULT 'aktiv',
    driving_license_classes TEXT,
    license_expires DATE,
    can_drive_company_vehicles BOOLEAN DEFAULT 0,
    has_key_access BOOLEAN DEFAULT 0,
    security_clearance_level INTEGER DEFAULT 1,
    hire_date DATE,
    termination_date DATE,
    work4all_code INTEGER UNIQUE,
    work4all_nummer INTEGER,
    work4all_last_update DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, 'employees');

  // 5. Contacts Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    department TEXT,
    position_title TEXT,
    phone TEXT,
    mobile TEXT,
    email TEXT,
    fax TEXT,
    address_street TEXT,
    address_city TEXT,
    address_zip TEXT,
    address_country TEXT DEFAULT 'Deutschland',
    contact_type TEXT DEFAULT 'extern',
    category TEXT,
    is_emergency_contact BOOLEAN DEFAULT 0,
    is_favorite BOOLEAN DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, 'contacts');

  // 6. Organization Chart Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS organization_chart (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER,
    name TEXT NOT NULL,
    position_title TEXT NOT NULL,
    department TEXT,
    level INTEGER DEFAULT 0,
    parent_id INTEGER,
    position INTEGER DEFAULT 0,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id),
    FOREIGN KEY (parent_id) REFERENCES organization_chart (id)
  )`, 'organization_chart');

  // 7. Vehicles Tabelle - VOLLSTÄNDIG mit work4all
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    license_plate TEXT UNIQUE NOT NULL,
    vehicle_type TEXT NOT NULL,
    color TEXT,
    year INTEGER,
    fuel_type TEXT DEFAULT 'Benzin',
    seats INTEGER DEFAULT 5,
    status TEXT DEFAULT 'verfügbar',
    mileage INTEGER DEFAULT 0,
    last_service_date DATE,
    next_service_due DATE,
    insurance_expires DATE,
    tuv_expires DATE,
    image TEXT,
    notes TEXT,
    work4all_resource_code INTEGER,
    work4all_resource_name TEXT,
    work4all_last_update DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, 'vehicles');

  // 8. Vehicle Bookings Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS vehicle_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id INTEGER NOT NULL,
    employee_id INTEGER,
    employee_name TEXT,
    purpose TEXT NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    actual_return_datetime DATETIME,
    start_mileage INTEGER,
    end_mileage INTEGER,
    status TEXT DEFAULT 'aktiv',
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles (id),
    FOREIGN KEY (employee_id) REFERENCES employees (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`, 'vehicle_bookings');

  // 9. Trade Shows Tabelle - VOLLSTÄNDIG mit work4all
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS tradeshows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    image TEXT,
    work4all_project_code INTEGER,
    work4all_project_number TEXT,
    work4all_group_code INTEGER,
    work4all_last_update DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, 'tradeshows');

  // 10. Work Plan Tasks Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS workplan_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    start_time TIME,
    end_time TIME,
    date DATE,
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, 'workplan_tasks');

  // 11. Employee Vacation Tabelle - VOLLSTÄNDIG mit work4all UND Urlaubsarten
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS employee_vacation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    work4all_code INTEGER,
    work4all_vacation_code INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    vacation_days INTEGER NOT NULL,
    vacation_type TEXT DEFAULT 'urlaub',
    vacation_art_code INTEGER DEFAULT 0,
    vacation_art_description TEXT DEFAULT 'Urlaub',
    work4all_sync_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id)
  )`, 'employee_vacation');

  // 12. Employee Sickness Tabelle - VOLLSTÄNDIG mit work4all UND Krankheitsarten
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS employee_sickness (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    employee_name TEXT NOT NULL,
    work4all_code INTEGER,
    work4all_sickness_code INTEGER,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sickness_days INTEGER NOT NULL,
    sickness_type TEXT DEFAULT 'krankheit',
    sickness_art_code INTEGER DEFAULT 0,
    sickness_art_description TEXT DEFAULT 'Krankheit',
    work4all_sync_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees (id)
  )`, 'employee_sickness');

  // 13. work4all Sync Log Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS work4all_sync_log (
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
  )`, 'work4all_sync_log');

  // 14. Warehouse Areas Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS warehouse_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    x_position REAL NOT NULL,
    y_position REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    color TEXT DEFAULT '#3498db',
    area_type TEXT DEFAULT 'lager',
    capacity INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, 'warehouse_areas');

  // 15. Warehouse Items Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS warehouse_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    area_id INTEGER,
    quantity INTEGER DEFAULT 0,
    unit TEXT DEFAULT 'Stück',
    category TEXT,
    min_stock INTEGER DEFAULT 0,
    max_stock INTEGER DEFAULT 0,
    weight REAL,
    dimensions TEXT,
    barcode TEXT,
    price REAL,
    supplier TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES warehouse_areas (id)
  )`, 'warehouse_items');

  // 16. Warehouse Movements Tabelle
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS warehouse_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    area_id INTEGER,
    movement_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    reference_number TEXT,
    reason TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES warehouse_items (id),
    FOREIGN KEY (area_id) REFERENCES warehouse_areas (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, 'warehouse_movements');

  // 17. Project Members Tabelle - FÜR WORK4ALL PROJEKTSYNCHRONISATION
  createTableWithCallback(`CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_code INTEGER NOT NULL,
    project_name TEXT NOT NULL,
    project_number TEXT,
    project_leader_code INTEGER,
    project_leader_name TEXT,
    employee_code INTEGER,
    employee_name TEXT,
    role TEXT DEFAULT 'Mitarbeiter',
    work4all_sync_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, 'project_members');

  console.log('✅ Alle Tabellen erstellt mit vollständigen work4all-Spalten');
  
  // Erstelle Indizes für work4all Performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_employees_work4all_code ON employees(work4all_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_vehicles_work4all_resource_code ON vehicles(work4all_resource_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tradeshows_work4all_project_code ON tradeshows(work4all_project_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_employee_vacation_dates ON employee_vacation(start_date, end_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_employee_vacation_art_code ON employee_vacation(vacation_art_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_employee_sickness_dates ON employee_sickness(start_date, end_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_employee_sickness_art_code ON employee_sickness(sickness_art_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_members_project_code ON project_members(project_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_project_members_employee_code ON project_members(employee_code)`);

  console.log('✅ work4all Performance-Indizes erstellt');

  // Standard-Admin erstellen
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`, 
    ['admin', adminPassword, 'admin']);

  // Beispiel Posts
  db.run(`INSERT OR IGNORE INTO posts (id, title, content, author_id) VALUES 
    (1, 'Willkommen zum Digitalen Schwarzen Brett', 'Dies ist unser neues digitales Schwarzes Brett für alle wichtigen Informationen und Ankündigungen.', 1),
    (2, 'Neue Kaffeemaschine im Aufenthaltsraum', 'Ab sofort steht eine neue Kaffeemaschine im Aufenthaltsraum zur Verfügung. Bitte behandelt sie pfleglich!', 1),
    (3, 'Parkplatz-Regelung', 'Bitte beachtet die neue Parkplatz-Regelung. Die Parkplätze 1-10 sind für Gäste reserviert.', 1)`);

  // Beispiel News
  db.run(`INSERT OR IGNORE INTO news (id, title, content, summary, category, priority, is_breaking, author_id) VALUES 
    (1, 'Quartalszahlen Q1 2025 veröffentlicht', 'Unsere Quartalszahlen für Q1 2025 zeigen ein starkes Wachstum von 15% gegenüber dem Vorjahresquartal.', 'Q1 2025: +15% Wachstum', 'Finanzen', 3, 1, 1),
    (2, 'Neue Partnerschaft mit TechCorp AG', 'Strategische Partnerschaft stärkt unsere Position im KI-Bereich.', 'Partnerschaft mit TechCorp AG', 'Unternehmen', 2, 0, 1)`);

  // Beispiel Trade Shows
  db.run(`INSERT OR IGNORE INTO tradeshows (id, name, location, start_date, end_date, description) VALUES 
    (1, 'CeBIT 2025', 'Hannover', '2025-06-15', '2025-06-19', 'Digitale Business Messe'),
    (2, 'IFA 2025', 'Berlin', '2025-09-01', '2025-09-06', 'Consumer Electronics Messe')`);

  console.log('🔄 Mitarbeiterdatenbank für work4all vorbereitet...');
  
  // Lösche alle Mitarbeiter - diese kommen jetzt aus work4all
  db.run(`DELETE FROM employees`);
  
  console.log('Erstelle externe Kontakte...');
  
  db.run(`INSERT INTO contacts (id, name, company, position_title, phone, mobile, email, contact_type, category, is_emergency_contact) VALUES 
    (1, 'Notarzt', 'Klinikum', 'Notdienst', '112', NULL, 'notarzt@klinikum.de', 'notfall', 'Notfall', 1),
    (2, 'Feuerwehr', 'Stadt', 'Einsatzleitung', '112', NULL, NULL, 'notfall', 'Notfall', 1),
    (3, 'Polizei', 'Polizeipräsidium', 'Notruf', '110', NULL, NULL, 'notfall', 'Notfall', 1)`);

  console.log('✅ Nur Notfall-Kontakte erstellt - externe Kontakte kommen aus work4all');

  // Organisation Chart - leeren, wird später mit work4all Daten gefüllt
  db.run(`DELETE FROM organization_chart`);

  // Fahrzeuge - leeren, kommen aus work4all
  console.log('🔄 Fahrzeugdatenbank für work4all vorbereitet...');
  db.run(`DELETE FROM vehicles`);
  console.log('✅ Fahrzeuge werden aus work4all importiert');

  console.log('Erstelle Fahrzeugbuchungen (ohne Mitarbeiterzuordnung)...');
  
  // Fahrzeugbuchungen leeren - werden später mit work4all Mitarbeitern erstellt
  db.run(`DELETE FROM vehicle_bookings`);

  // Arbeitsplan - leeren, wird später mit work4all Mitarbeitern gefüllt
  db.run(`DELETE FROM workplan_tasks`);

  // Warehouse Areas
  db.run(`INSERT OR IGNORE INTO warehouse_areas (id, name, description, x_position, y_position, width, height, color, area_type, capacity) VALUES 
    (1, 'Hauptlager A', 'Großes Hauptlager für Fertigwaren', 50, 50, 200, 150, '#3498db', 'lager', 1000),
    (2, 'Rohstofflager B', 'Lager für Rohstoffe und Materialien', 300, 50, 150, 100, '#27ae60', 'lager', 500),
    (3, 'Verladezone', 'Be- und Entladung von LKW', 500, 200, 200, 100, '#e74c3c', 'verladung', 0),
    (4, 'Büro Lagerleitung', 'Büro des Lagerleiters', 150, 250, 100, 80, '#9b59b6', 'büro', 0),
    (5, 'Hauptgang', 'Zentraler Transportweg', 200, 150, 300, 50, '#95a5a6', 'gang', 0),
    (6, 'Kühlbereich', 'Temperaturkontrolliertes Lager', 600, 50, 120, 120, '#3498db', 'kühlung', 200)`);

  // Warehouse Items
  db.run(`INSERT OR IGNORE INTO warehouse_items (id, name, description, sku, area_id, quantity, unit, category, min_stock, max_stock, supplier, notes) VALUES 
    (1, 'Schrauben M8x20', 'Sechskantschrauben verzinkt', 'SCH-M8-20', 1, 2500, 'Stück', 'Befestigung', 1000, 5000, 'Schrauben AG', 'Standard Befestigung'),
    (2, 'Aluminium Profil 40x40', 'Standard Konstruktionsprofil', 'ALU-40-40', 2, 45, 'Meter', 'Rohstoffe', 20, 100, 'Alu Works GmbH', '6m Stangen'),
    (3, 'Elektronikgehäuse Typ A', 'Kunststoffgehäuse schwarz', 'GEH-ELEK-A', 1, 127, 'Stück', 'Verpackung', 50, 300, 'Plastics Ltd', 'IP65 Schutzart'),
    (4, 'Kabel 3x1,5mm²', 'Installationskabel H07V-U', 'KAB-3X15', 2, 850, 'Meter', 'Elektro', 200, 1000, 'Elektro Express', 'Schwarz, 100m Rollen'),
    (5, 'Dichtung Gummi 5mm', 'EPDM Gummidichtung', 'DICHT-5', 1, 25, 'Meter', 'Ersatzteile', 10, 50, 'Rubber Solutions', 'Temperaturbeständig'),
    (6, 'Kühlpack Gel 200g', 'Wiederverwendbare Kühlpacks', 'KÜHL-200', 6, 150, 'Stück', 'Verpackung', 100, 500, 'Cool Logistics', 'Für Lebensmitteltransport'),
    (7, 'Transportbox 60L', 'Stapelbare Kunststoffbox', 'BOX-60L', 1, 35, 'Stück', 'Verpackung', 20, 100, 'Box Solutions', 'Mit Deckel'),
    (8, 'Hydrauliköl ISO 32', 'Hydraulikflüssigkeit', 'HYD-ISO32', 2, 12, 'Kanister', 'Chemie', 5, 30, 'Oil Technologies', '20L Kanister'),
    (9, 'Lager 6203-2RS', 'Kugellager geschlossen', 'LAG-6203', 1, 87, 'Stück', 'Ersatzteile', 50, 200, 'Bearing World', 'Standard Industrielager'),
    (10, 'Etiketten 50x30mm', 'Thermo-Transfer Etiketten', 'ETI-50-30', 1, 2800, 'Stück', 'Verpackung', 1000, 5000, 'Label Pro', '1000er Rolle')`);

  // Warehouse Movements
  db.run(`INSERT OR IGNORE INTO warehouse_movements (id, item_id, area_id, movement_type, quantity, reference_number, reason, user_id, created_at) VALUES 
    (1, 1, 1, 'zugang', 1000, 'LF-2024-001', 'Wareneingang vom Lieferanten', 1, datetime('now', '-7 days')),
    (2, 2, 2, 'zugang', 50, 'LF-2024-002', 'Materiallieferung', 1, datetime('now', '-5 days')),
    (3, 3, 1, 'abgang', 25, 'AU-2024-015', 'Kundenauftrag KD-2024-015', 1, datetime('now', '-3 days')),
    (4, 1, 1, 'abgang', 500, 'AU-2024-016', 'Große Kundenbestellung', 1, datetime('now', '-2 days')),
    (5, 4, 2, 'zugang', 200, 'LF-2024-003', 'Kabellieferung', 1, datetime('now', '-1 day')),
    (6, 5, 1, 'korrektur', 20, 'INV-2024-05', 'Inventur Korrektur - Schwund', 1, datetime('now')),
    (7, 6, 6, 'umlagerung', 50, 'UM-001', 'Umlagerung in Kühlbereich', 1, datetime('now'))`);
});

db.close((err) => {
  if (err) {
    console.error('Fehler beim Schließen der Datenbank:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Datenbank erfolgreich für work4all vorbereitet!');
    console.log('');
    console.log('🔄 WORK4ALL INTEGRATION:');
    console.log('📊 Mitarbeiterdatenbank bereit für work4all Synchronisation');
    console.log('   🔄 Mitarbeiter werden automatisch aus work4all importiert');
    console.log('   📋 Führe work4all Synchronisation aus für Mitarbeiterdaten');
    console.log('   🎯 Arbeitsplan und Fahrzeugbuchungen nutzen work4all Mitarbeiter');
    console.log('');
    console.log('📞 KONTAKT-SYSTEM:');
    console.log('   🆘 3 Externe Kontakte (Notfall-Kontakte)');
    console.log('   🏷️ Kategorisierung: extern/Notfall/Service/Partner');
    console.log('');
    console.log('🚗 FAHRZEUGVERWALTUNG:');
    console.log('   🚛 Fahrzeuge werden aus work4all importiert');
    console.log('   📋 Buchungen werden nach work4all Sync mit Mitarbeitern verknüpft');
    console.log('');
    console.log('📦 WAREHOUSE MANAGEMENT:');
    console.log('   🏢 6 Lagerbereiche (Hauptlager, Rohstoffe, Verladung, Büro, Gang, Kühlbereich)');
    console.log('   📋 10 Artikel in verschiedenen Kategorien');
    console.log('   📊 7 Beispiel-Bewegungen (Zugang/Abgang, Umlagerung, Korrektur)');
    console.log('');
    console.log('🚀 STARTE AUTOMATISCHE work4all SYNCHRONISATION...');
    console.log('');
    
    // 🚀 AUTOMATISCHE work4all SYNCHRONISATION
    console.log('⏰ Warte 2 Sekunden für Datenbankstabilität...');
    setTimeout(() => {
      console.log('🔄 Führe vollständige work4all Synchronisation aus...');
      
      const syncProcess = spawn('node', ['test-work4all.js', '--sync'], {
        stdio: 'inherit',
        cwd: __dirname
      });
      
      syncProcess.on('close', (code) => {
        if (code === 0) {
          console.log('');
          console.log('🎉 SETUP VOLLSTÄNDIG ABGESCHLOSSEN!');
          console.log('');
          console.log('✅ Datenbank erstellt und erweitert');
          console.log('✅ work4all Synchronisation erfolgreich');
          console.log('✅ Alle Mitarbeiter, Fahrzeuge und Events importiert');
          console.log('');
          console.log('🚀 NÄCHSTE SCHRITTE:');
          console.log('   1. Server starten: node server.js oder pm2 start server.js --name backend');
          console.log('   2. Frontend bauen: cd client && npm run build');
          console.log('   3. Web-Interface öffnen: http://localhost:3001');
    console.log('');
    console.log('Standard Admin-Login:');
    console.log('Benutzername: admin');
    console.log('Passwort: admin123');
        } else {
          console.log('');
          console.log('⚠️ work4all Synchronisation beendet mit Code:', code);
          console.log('Datenbank ist trotzdem bereit - Server kann gestartet werden');
          console.log('');
          console.log('Manual sync später möglich mit: node test-work4all.js --sync');
        }
      });
      
      syncProcess.on('error', (err) => {
        console.log('');
        console.log('❌ Fehler bei work4all Synchronisation:', err.message);
        console.log('Datenbank ist trotzdem bereit - Server kann gestartet werden');
        console.log('');
        console.log('Manual sync später möglich mit: node test-work4all.js --sync');
      });
      
    }, 2000);
  }
});