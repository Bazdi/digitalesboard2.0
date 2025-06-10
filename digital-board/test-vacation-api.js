const sqlite3 = require('sqlite3').verbose();

async function testVacationAPI() {
  const db = new sqlite3.Database('./database.db');
  
  try {
    console.log('🏖️ Teste Vacation API Abfrage...');
    
    // Teste die exacte Abfrage aus der server.js
    const result = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          e.id, e.name, e.department, e.position_title, e.email, e.work_location,
          ev.start_date, ev.end_date, ev.vacation_days, ev.vacation_type,
          ev.vacation_art_code, ev.vacation_art_description
        FROM employees e
        JOIN employee_vacation ev ON e.id = ev.employee_id
        WHERE ev.start_date <= date('now') AND ev.end_date >= date('now')
        AND e.is_active_employee = 1
        AND e.department != 'Sonstige'
        ORDER BY ev.vacation_art_description, e.name
      `, [], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
    
    console.log('===========================================');
    
    // Gruppiere nach Urlaubsart
    const grouped = {};
    result.forEach(row => {
      if (!grouped[row.vacation_art_description]) {
        grouped[row.vacation_art_description] = [];
      }
      grouped[row.vacation_art_description].push(row);
    });
    
    Object.keys(grouped).sort().forEach(type => {
      console.log(`\n📋 ${type}: ${grouped[type].length} Personen`);
      grouped[type].forEach(person => {
        console.log(`  - ${person.name} (${person.department || 'Unbekannt'})`);
      });
    });
    
    console.log(`\n📊 Gesamt: ${result.length} Mitarbeiter im Urlaub`);
    
    // Teste auch die Rückgabe für das Frontend
    console.log('\n🌐 Frontend Format:');
    console.log('===================');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

testVacationAPI(); 