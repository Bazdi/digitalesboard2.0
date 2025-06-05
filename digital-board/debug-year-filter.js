// debug-year-filter.js - Debug Jahresfilter Problem
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db');

console.log('🔍 Debug: Warum werden 2018er Events in 2025 angezeigt?');

// 1. Schaue 2018er Events
console.log('\n1. 2018er Events in der Datenbank:');
db.all(`SELECT name, start_date, strftime("%Y", start_date) as jahr 
        FROM tradeshows 
        WHERE name LIKE "%2018%" 
        LIMIT 5`, (err, rows) => {
  if (err) {
    console.error('Fehler:', err);
  } else {
    rows.forEach(r => {
      console.log(`   📅 ${r.name}: start_date="${r.start_date}", Jahr="${r.jahr}"`);
    });
  }
  
  // 2. Test API-Filter für 2025
  console.log('\n2. Test API-Filter für Jahr 2025:');
  db.all(`SELECT name, start_date, strftime("%Y", start_date) as jahr 
          FROM tradeshows 
          WHERE strftime("%Y", start_date) = "2025" 
          AND name LIKE "%2018%" 
          LIMIT 5`, (err, rows) => {
    if (err) {
      console.error('Fehler:', err);
    } else {
      console.log(`   🎯 Gefunden: ${rows.length} 2018er Events mit Jahr-Filter 2025`);
      rows.forEach(r => {
        console.log(`   ❌ ${r.name}: start_date="${r.start_date}", Jahr="${r.jahr}"`);
      });
    }
    
    // 3. Zähle Events pro Jahr  
    console.log('\n3. Events pro Jahr:');
    db.all(`SELECT strftime("%Y", start_date) as jahr, COUNT(*) as anzahl 
            FROM tradeshows 
            GROUP BY strftime("%Y", start_date) 
            ORDER BY jahr`, (err, rows) => {
      if (err) {
        console.error('Fehler:', err);
      } else {
        rows.forEach(r => {
          console.log(`   📊 Jahr ${r.jahr}: ${r.anzahl} Events`);
        });
      }
      
      db.close();
    });
  });
}); 