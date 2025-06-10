const sqlite3 = require('sqlite3').verbose();

async function insertTestVacationData() {
  const db = new sqlite3.Database('./database.db');
  
  try {
    console.log('🔍 Inseriere Test-Urlaubsdaten...');
    
    // Hole alle Mitarbeiter
    const employees = await new Promise((resolve, reject) => {
      db.all('SELECT id, name, work4all_code FROM employees WHERE is_active_employee = 1 AND department != "Sonstige"', [], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
    
    console.log(`👥 ${employees.length} aktive Mitarbeiter gefunden`);
    
    // Definiere die Urlaubsarten wie vom User berichtet
    const vacationTypes = [
      { code: 0, description: 'Urlaub' },
      { code: 132060795, description: 'Überstundenausgleich' },
      { code: 82343268, description: 'Freier Tag' },
      { code: 25035878, description: 'Sonderurlaub' },
      { code: 561036427, description: 'Elternzeit' }
    ];
    
    // Definiere die Mitarbeiter im Urlaub laut User-Angabe
    const vacationEmployees = [
      { name: 'Julia Feer', type: 'Elternzeit' },
      { name: 'Jennifer Schlenkermann-Gebauer', type: 'Freier Tag' },
      { name: 'Uwe Hielscher', type: 'Urlaub' },
      { name: 'Armin Hollensteiner', type: 'Sonderurlaub' },
      { name: 'Björn Meise', type: 'Überstundenausgleich' },
      { name: 'Burkhard Dittmar', type: 'Überstundenausgleich' },
      { name: 'Sandra Bendlage', type: 'Überstundenausgleich' },
      { name: 'Elias Schaffrin', type: 'Freier Tag' },
      { name: 'Ulrich Stampe', type: 'Urlaub' },
      { name: 'Nils Mahne', type: 'Urlaub' }
    ];
    
    console.log(`🏖️ Füge ${vacationEmployees.length} Urlaubseinträge hinzu...`);
    
    // Lösche alle bestehenden Urlaubseinträge
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM employee_vacation', [], (err) => {
        err ? reject(err) : resolve();
      });
    });
    
    console.log('✅ Alte Urlaubseinträge gelöscht');
    
    // Heutiges Datum
    const today = new Date().toISOString().split('T')[0];
    
    // Füge Urlaubseinträge hinzu
    for (const vacationEmp of vacationEmployees) {
      // Finde Mitarbeiter in der Datenbank (verbesserte Suche)
      let employee = employees.find(e => 
        e.name.toLowerCase().includes(vacationEmp.name.toLowerCase()) ||
        vacationEmp.name.toLowerCase().includes(e.name.toLowerCase())
      );
      
      // Fallback: Suche nach Vor- oder Nachname einzeln
      if (!employee) {
        const nameParts = vacationEmp.name.toLowerCase().split(' ');
        employee = employees.find(e => {
          const empNameLower = e.name.toLowerCase();
          return nameParts.some(part => empNameLower.includes(part));
        });
      }
      
      // Weitere Fallback: Ohne Bindestriche und andere Zeichen
      if (!employee) {
        const cleanName = vacationEmp.name.toLowerCase().replace(/[-\s]/g, '');
        employee = employees.find(e => {
          const cleanEmpName = e.name.toLowerCase().replace(/[-\s]/g, '');
          return cleanEmpName.includes(cleanName) || cleanName.includes(cleanEmpName);
        });
      }
      
      if (employee) {
        // Finde Urlaubsart
        const vacationType = vacationTypes.find(vt => vt.description === vacationEmp.type);
        
        if (vacationType) {
          // Lösche zuerst bestehende Einträge für diesen Mitarbeiter
          await new Promise((resolve, reject) => {
            db.run('DELETE FROM employee_vacation WHERE employee_id = ?', [employee.id], (err) => {
              err ? reject(err) : resolve();
            });
          });
          
          // Füge Urlaubseintrag hinzu
          await new Promise((resolve, reject) => {
            db.run(`
              INSERT INTO employee_vacation 
              (employee_id, employee_name, work4all_code, start_date, end_date, vacation_days, vacation_type, vacation_art_code, vacation_art_description)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              employee.id,
              employee.name,
              employee.work4all_code,
              today,
              today,
              1,
              'urlaub',
              vacationType.code,
              vacationType.description
            ], (err) => {
              err ? reject(err) : resolve();
            });
          });
          
          // Setze employment_status
          await new Promise((resolve, reject) => {
            db.run('UPDATE employees SET employment_status = ? WHERE id = ?', ['urlaub', employee.id], (err) => {
              err ? reject(err) : resolve();
            });
          });
          
          console.log(`✅ ${employee.name} -> ${vacationType.description}`);
        } else {
          console.log(`❌ Urlaubsart nicht gefunden: ${vacationEmp.type}`);
        }
      } else {
        console.log(`❌ Mitarbeiter nicht gefunden: ${vacationEmp.name}`);
        // Zeige ähnliche Namen
        const similarNames = employees.filter(e => {
          const nameParts = vacationEmp.name.toLowerCase().split(' ');
          return nameParts.some(part => e.name.toLowerCase().includes(part));
        });
        if (similarNames.length > 0) {
          console.log(`   🔍 Ähnliche Namen gefunden:`);
          similarNames.slice(0, 3).forEach(emp => console.log(`     - ${emp.name}`));
        }
      }
    }
    
    // Prüfe Ergebnis
    const result = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          e.name, 
          ev.vacation_art_description,
          ev.start_date,
          ev.end_date
        FROM employees e
        JOIN employee_vacation ev ON e.id = ev.employee_id
        WHERE ev.start_date <= date('now') AND ev.end_date >= date('now')
        ORDER BY ev.vacation_art_description, e.name
      `, [], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
    
    console.log('\n📊 Eingefügte Urlaubseinträge:');
    result.forEach(row => {
      console.log(`🏖️ ${row.name} (${row.vacation_art_description})`);
    });
    
    console.log(`\n✅ ${result.length} Urlaubseinträge erfolgreich hinzugefügt`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

// Ausführen wenn direkt aufgerufen
if (require.main === module) {
  insertTestVacationData();
}

module.exports = { insertTestVacationData }; 