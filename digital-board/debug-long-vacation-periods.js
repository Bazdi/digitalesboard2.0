const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

async function debugLongVacationPeriods() {
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);

  try {
    console.log('🔍 Analysiere längere Urlaubsperioden...');
    
    // 1. Authentifizierung
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
    
    // 2. Alle Urlaubsdaten laden
    const vacationResponse = await syncService.makeApiRequest('POST', '/Urlaub/query', {});
    const allVacations = Array.isArray(vacationResponse) ? vacationResponse : 
                        vacationResponse.items ? vacationResponse.items : 
                        vacationResponse.values ? vacationResponse.values : [];
    
    console.log(`📅 ${allVacations.length} Urlaubseinträge total`);
    
    // 3. Mitarbeiter im Urlaub
    const vacationEmployees = await new Promise((resolve, reject) => {
      db.all('SELECT name, work4all_code, vacation_days_left FROM employees WHERE employment_status = "urlaub"', [], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
    
    console.log(`\n👥 ${vacationEmployees.length} Mitarbeiter im Urlaub:`);
    
    for (const employee of vacationEmployees) {
      console.log(`\n👤 === ${employee.name} (${employee.work4all_code}) ===`);
      console.log(`📊 Aktuelle vacation_days_left: ${employee.vacation_days_left}`);
      
      // Alle Urlaubstage dieses Mitarbeiters
      const employeeVacations = allVacations
        .filter(v => v.benutzerCode == employee.work4all_code)
        .map(v => ({
          date: v.datum.split('T')[0],
          amount: v.menge,
          approved: v.datumGenehmigung !== '0001-01-01T00:00:00'
        }))
        .filter(v => v.amount && v.amount > 0) // Nur gültige Urlaubstage
        .sort((a, b) => a.date.localeCompare(b.date));
      
      console.log(`🏖️ Urlaubstage insgesamt: ${employeeVacations.length}`);
      
      // Finde aktuelle Urlaubsperiode (ab heute)
      const today = new Date().toISOString().split('T')[0];
      
      // Finde alle Urlaubstage ab heute
      const futureVacations = employeeVacations.filter(v => v.date >= today);
      console.log(`📅 Urlaubstage ab heute: ${futureVacations.length}`);
      
      if (futureVacations.length > 0) {
        console.log('📋 Nächste 10 Urlaubstage:');
        futureVacations.slice(0, 10).forEach((v, index) => {
          const isToday = v.date === today;
          console.log(`   ${index + 1}. ${v.date} (${v.amount} Tag${v.amount === 1 ? '' : 'e'})${isToday ? ' ← HEUTE' : ''}`);
        });
        
        // Teste manuelle Berechnung aufeinanderfolgender Tage
        let consecutiveDays = 0;
        let currentDate = new Date(today);
        
        console.log('\n🔍 Manuelle Berechnung aufeinanderfolgender Tage:');
        for (let i = 0; i < 30; i++) {
          const dateString = currentDate.toISOString().split('T')[0];
          const hasVacation = futureVacations.some(v => v.date === dateString);
          
          if (i < 15) { // Zeige ersten 15 Tage
            console.log(`   Tag ${i + 1} (${dateString}): ${hasVacation ? '🏖️ URLAUB' : '⚠️ arbeiten'}`);
          }
          
          if (hasVacation) {
            consecutiveDays++;
            currentDate.setDate(currentDate.getDate() + 1);
          } else {
            break;
          }
        }
        
        console.log(`\n📊 Berechnet: ${consecutiveDays} aufeinanderfolgende Urlaubstage`);
        console.log(`📊 Verbleibende Tage nach heute: ${Math.max(0, consecutiveDays - 1)}`);
        console.log(`📊 Gespeichert in DB: ${employee.vacation_days_left}`);
        
        if (consecutiveDays - 1 !== employee.vacation_days_left) {
          console.log(`⚠️ DISKREPANZ! Berechnet: ${consecutiveDays - 1}, Gespeichert: ${employee.vacation_days_left}`);
        }
      } else {
        console.log('❌ Keine Urlaubstage ab heute gefunden!');
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

debugLongVacationPeriods(); 