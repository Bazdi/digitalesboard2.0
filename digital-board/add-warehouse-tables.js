// add-warehouse-tables.js - Add warehouse management tables and sample data
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('Adding warehouse management tables and sample data...');

db.serialize(() => {
  // Create warehouse tables
  console.log('Creating warehouse_areas table...');
  db.run(`CREATE TABLE IF NOT EXISTS warehouse_areas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    x_position REAL NOT NULL,
    y_position REAL NOT NULL,
    width REAL NOT NULL,
    height REAL NOT NULL,
    color TEXT DEFAULT '#3498db',
    area_type TEXT DEFAULT 'storage',
    capacity INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('Creating warehouse_items table...');
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

  console.log('Creating warehouse_movements table...');
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

  // Add sample warehouse areas
  console.log('Adding sample warehouse areas...');
  db.run(`INSERT OR IGNORE INTO warehouse_areas (id, name, description, x_position, y_position, width, height, color, area_type, capacity) VALUES 
    (1, 'Hauptlager A', 'Großes Hauptlager für Fertigwaren', 50, 50, 200, 150, '#3498db', 'storage', 1000),
    (2, 'Rohstofflager B', 'Lager für Rohstoffe und Materialien', 300, 50, 150, 100, '#27ae60', 'storage', 500),
    (3, 'Verladezone', 'Be- und Entladung von LKW', 500, 200, 200, 100, '#e74c3c', 'loading', 0),
    (4, 'Büro Lagerleitung', 'Büro des Lagerleiters', 150, 250, 100, 80, '#9b59b6', 'office', 0),
    (5, 'Hauptgang', 'Zentraler Transportweg', 200, 150, 300, 50, '#95a5a6', 'aisle', 0),
    (6, 'Kühlbereich', 'Temperaturkontrolliertes Lager', 600, 50, 120, 120, '#3498db', 'special', 200)`);

  // Add sample warehouse items
  console.log('Adding sample warehouse items...');
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

  // Add sample movements
  console.log('Adding sample warehouse movements...');
  db.run(`INSERT OR IGNORE INTO warehouse_movements (id, item_id, area_id, movement_type, quantity, reference_number, reason, user_id, created_at) VALUES 
    (1, 1, 1, 'in', 1000, 'LF-2024-001', 'Wareneingang vom Lieferanten', 1, datetime('now', '-7 days')),
    (2, 2, 2, 'in', 50, 'LF-2024-002', 'Materiallieferung', 1, datetime('now', '-5 days')),
    (3, 3, 1, 'out', 25, 'AU-2024-015', 'Kundenauftrag KD-2024-015', 1, datetime('now', '-3 days')),
    (4, 1, 1, 'out', 500, 'AU-2024-016', 'Große Kundenbestellung', 1, datetime('now', '-2 days')),
    (5, 4, 2, 'in', 200, 'LF-2024-003', 'Kabellieferung', 1, datetime('now', '-1 day')),
    (6, 5, 1, 'adjust', 20, 'INV-2024-05', 'Inventur Korrektur - Schwund', 1, datetime('now')),
    (7, 6, 6, 'move', 50, 'UM-001', 'Umlagerung in Kühlbereich', 1, datetime('now'))`);
});

db.close((err) => {
  if (err) {
    console.error('Fehler beim Schließen der Datenbank:', err.message);
  } else {
    console.log('✅ Warehouse Management Tabellen und Beispieldaten erfolgreich hinzugefügt!');
    console.log('');
    console.log('📦 WAREHOUSE SYSTEM READY:');
    console.log('   🏢 6 Lagerbereiche (Hauptlager, Rohstoffe, Verladung, Büro, Gang, Kühlbereich)');
    console.log('   📋 10 Artikel in verschiedenen Kategorien');
    console.log('   📊 7 Beispiel-Bewegungen (Ein-/Ausgang, Umlagerung, Korrektur)');
    console.log('');
    console.log('🔧 API Endpoints verfügbar:');
    console.log('   GET  /api/warehouse/areas');
    console.log('   GET  /api/warehouse/items'); 
    console.log('   GET  /api/warehouse/movements');
    console.log('   GET  /api/warehouse/stats');
    console.log('');
    console.log('🎯 System bereit für Frontend-Test!');
  }
}); 