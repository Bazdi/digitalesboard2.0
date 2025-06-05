const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

db.all(`
  SELECT name, employment_status, vacation_days_left, vacation_end_date, sickness_days_left, sickness_end_date 
  FROM employees 
  WHERE employment_status IN ('urlaub', 'krank') 
  ORDER BY employment_status, name
`, [], (err, rows) => {
  if (err) {
    console.error('❌ Fehler:', err);
  } else {
    console.log('📊 Mitarbeiter mit Urlaub/Krankheit:');
    
    if (rows.length === 0) {
      console.log('❌ Keine Mitarbeiter mit Urlaub oder Krankheit gefunden');
    } else {
      rows.forEach(emp => {
        if (emp.employment_status === 'urlaub') {
          const endInfo = emp.vacation_end_date ? ` (bis einschließlich ${emp.vacation_end_date})` : '';
          console.log(`🏖️ ${emp.name}: ${emp.vacation_days_left} weitere Werktage${endInfo}`);
        } else {
          const endInfo = emp.sickness_end_date ? ` (bis einschließlich ${emp.sickness_end_date})` : '';
          console.log(`🤒 ${emp.name}: ${emp.sickness_days_left} weitere Werktage${endInfo}`);
        }
      });
    }
  }
  db.close();
}); 