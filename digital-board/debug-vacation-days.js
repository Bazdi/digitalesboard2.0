const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

async function debugVacationDays() {
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);

  try {
    console.log('🔍 Debug: Aufeinanderfolgende Urlaubstage');
    
    // 1. Authentifizierung
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
    
    // 2. Alle Urlaubsdaten laden
    const vacationResponse = await syncService.makeApiRequest('POST', '/Urlaub/query', {});
    const allVacations = vacationResponse.items || [];
    console.log(`🏖️ ${allVacations.length} Urlaubseinträge total`);
    
    // 3. Mitarbeiter im Urlaub finden
    const vacationEmployees = await new Promise((resolve, reject) => {
      db.all('SELECT name, work4all_code, vacation_days_left FROM employees WHERE employment_status = "urlaub"', [], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
    
    console.log(`👥 ${vacationEmployees.length} Mitarbeiter im Urlaub gefunden:`);
    
    for (const employee of vacationEmployees) {
      console.log(`\n👤 ${employee.name} (work4all_code: ${employee.work4all_code})`);
      console.log(`📊 Gespeicherte vacation_days_left: ${employee.vacation_days_left}`);
      
      // Alle Urlaubstage dieses Mitarbeiters
      const employeeVacations = allVacations.filter(v => v.benutzerCode == employee.work4all_code)
        .map(v => ({
          date: v.datum.split('T')[0],
          approved: v.genehmigt
        }))
        .filter(v => v.approved) // Nur genehmigte
        .map(v => v.date)
        .sort();
      
      console.log(`🏖️ Urlaubstage insgesamt: ${employeeVacations.length}`);
      console.log('📅 Letzte 10 Urlaubstage:', employeeVacations.slice(-10));
      
      // Teste aufeinanderfolgende Tage ab heute
      const today = new Date();
      console.log(`📅 Heute: ${today.toISOString().split('T')[0]}`);
      
      // Zeige nächste 10 Tage
      for (let i = 0; i < 10; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        const hasVacation = employeeVacations.includes(dateString);
        console.log(`${hasVacation ? '🏖️' : '✅'} ${dateString}: ${hasVacation ? 'URLAUB' : 'arbeiten'}`);
      }
      
      // Manuelle Berechnung aufeinanderfolgender Tage
      let consecutiveDays = 0;
      let currentDate = new Date(today);
      
      console.log('\n🔍 Manuelle Berechnung aufeinanderfolgender Urlaubstage:');
      for (let i = 0; i < 30; i++) {
        const dateString = currentDate.toISOString().split('T')[0];
        const hasVacation = employeeVacations.includes(dateString);
        
        if (i < 5) console.log(`Tag ${i + 1} (${dateString}): ${hasVacation ? 'URLAUB' : 'arbeiten'}`);
        
        if (hasVacation) {
          consecutiveDays++;
          currentDate.setDate(currentDate.getDate() + 1);
        } else {
          break;
        }
      }
      
      console.log(`📊 Berechnet: ${consecutiveDays} aufeinanderfolgende Urlaubstage`);
      console.log(`📊 Verbleibende Tage: ${Math.max(0, consecutiveDays - 1)}`);
      console.log(`📊 Gespeichert in DB: ${employee.vacation_days_left}`);
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

debugVacationDays(); 