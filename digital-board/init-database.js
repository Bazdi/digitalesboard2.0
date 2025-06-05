// init-database.js - DEUTSCHE VERSION mit übersetzten Werten
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('./database.db');

console.log('Initialisiere erweiterte Datenbank mit zentraler Mitarbeiterverwaltung...');

// Erstelle Tabellen
db.serialize(() => {
  // Users Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Posts Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    author_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users (id)
  )`);

  // News Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS news (
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
  )`);

  // Trade Shows Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS tradeshows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    description TEXT,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Work Plan Tasks Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS workplan_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    start_time TIME,
    end_time TIME,
    date DATE,
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // ERWEITERTE Employees Tabelle - Zentrale Mitarbeiterverwaltung
  db.run(`CREATE TABLE IF NOT EXISTS employees (
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Separate Kontakte-Tabelle für externe Kontakte
  db.run(`CREATE TABLE IF NOT EXISTS contacts (
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
  )`);

  // Organization Chart Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS organization_chart (
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
  )`);

  // Fahrzeuge Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS vehicles (
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Fahrzeug-Buchungen Tabelle
  db.run(`CREATE TABLE IF NOT EXISTS vehicle_bookings (
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
  )`);

  // Warehouse Areas Tabelle - Lagerbereiche
  db.run(`CREATE TABLE IF NOT EXISTS warehouse_areas (
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
  )`);

  // Warehouse Items Tabelle - Artikel/Produkte
  db.run(`CREATE TABLE IF NOT EXISTS warehouse_items (
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
  )`);

  // Warehouse Movements Tabelle - Bewegungshistorie
  db.run(`CREATE TABLE IF NOT EXISTS warehouse_movements (
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
  )`);

  console.log('✅ Alle Tabellen erstellt (inklusive Warehouse Management)');

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
    console.log('   🆘 7 Externe Kontakte (Notfall, Kunden, Lieferanten)');
    console.log('   🏷️ Kategorisierung: extern/Notfall/Service/Partner');
    console.log('');
    console.log('🚗 FAHRZEUGVERWALTUNG:');
    console.log('   🚛 4 Firmenwagen verfügbar');
    console.log('   📋 Buchungen werden nach work4all Sync mit Mitarbeitern verknüpft');
    console.log('');
    console.log('📦 WAREHOUSE MANAGEMENT:');
    console.log('   🏢 6 Lagerbereiche (Hauptlager, Rohstoffe, Verladung, Büro, Gang, Kühlbereich)');
    console.log('   📋 10 Artikel in verschiedenen Kategorien');
    console.log('   📊 7 Beispiel-Bewegungen (Zugang/Abgang, Umlagerung, Korrektur)');
    console.log('');
    console.log('🚀 NÄCHSTE SCHRITTE:');
    console.log('   1. Server starten: node server.js');
    console.log('   2. work4all Synchronisation testen: node test-work4all.js');
    console.log('   3. Vollständige Synchronisation: node test-work4all.js --sync');
    console.log('');
    console.log('Standard Admin-Login:');
    console.log('Benutzername: admin');
    console.log('Passwort: admin123');
  }
});