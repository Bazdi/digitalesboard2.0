const sqlite3 = require('sqlite3').verbose();
const Work4AllSyncService = require('./work4all-sync');

async function testArminVacationDays() {
  console.log('🔍 Teste Armin Hollensteiners Urlaubstage mit verbesserter Logik...\n');
  
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);
  
  try {
    // 1. Authentifizierung
    console.log('🔐 Authentifizierung...');
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) {
      throw new Error('Authentifizierung fehlgeschlagen');
    }
    console.log('✅ Erfolgreich authentifiziert\n');
    
    // 2. Lade alle Urlaubsdaten
    console.log('📅 Lade alle Urlaubsdaten...');
    const vacationResponse = await syncService.makeApiRequest('POST', '/Urlaub/query', {});
    const allVacations = Array.isArray(vacationResponse) ? vacationResponse : 
                        vacationResponse.data ? vacationResponse.data : 
                        vacationResponse.values ? vacationResponse.values : 
                        vacationResponse.items ? vacationResponse.items : [];
    
    console.log(`📊 ${allVacations.length} Urlaubseinträge geladen\n`);
    
    // 3. Finde Armin Hollensteiners work4all_code
    const arminQuery = new Promise((resolve, reject) => {
      db.get(
        'SELECT id, name, work4all_code FROM employees WHERE name LIKE ?',
        ['%Armin%Hollensteiner%'],
        (err, row) => err ? reject(err) : resolve(row)
      );
    });
    
    const armin = await arminQuery;
    if (!armin) {
      console.log('❌ Armin Hollensteiner nicht in der Datenbank gefunden');
      return;
    }
    
    console.log(`👤 Gefunden: ${armin.name} (work4all_code: ${armin.work4all_code})`);
    
    // 4. Analysiere seine Urlaubsdaten
    const arminVacations = allVacations.filter(vacation => 
      vacation.benutzerCode == armin.work4all_code && vacation.menge > 0
    );
    
    console.log(`🏖️ ${arminVacations.length} Urlaubseinträge für Armin gefunden\n`);
    
    // 5. Sortiere nach Datum
    arminVacations.sort((a, b) => new Date(a.datum) - new Date(b.datum));
    
    // 6. Zeige die nächsten Urlaubstage ab heute
    const today = new Date('2025-06-05T12:00:00');
    const todayString = today.toISOString().split('T')[0];
    
    console.log(`📅 Heutiges Datum: ${todayString}\n`);
    console.log('🗓️ Armins kommende Urlaubstage:');
    
    // Filter für zukünftige/aktuelle Urlaubstage
    const upcomingVacations = arminVacations.filter(vacation => {
      const vacationDate = vacation.datum.split('T')[0];
      return vacationDate >= todayString;
    }).slice(0, 15); // Zeige nur die nächsten 15 Tage
    
    upcomingVacations.forEach((vacation, index) => {
      const vacationDate = new Date(vacation.datum);
      const dateString = vacationDate.toISOString().split('T')[0];
      const dayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][vacationDate.getDay()];
      
      console.log(`  ${index + 1}. ${dateString} (${dayName}) - ${vacation.menge} Tag(e)`);
    });
    
    // 7. Teste die verbesserte Berechnungslogik
    console.log('\n🧮 Teste verbesserte aufeinanderfolgende Tage-Berechnung:');
    
    // Hilfsfunktionen (aus work4all-sync.js kopiert)
    const isWeekend = (date) => {
      const dayOfWeek = date.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6;
    };
    
    const isGermanHoliday = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      const fixedHolidays = [
        { month: 1, day: 1 },   // Neujahr
        { month: 5, day: 1 },   // Tag der Arbeit
        { month: 10, day: 3 },  // Tag der Deutschen Einheit
        { month: 12, day: 25 }, // 1. Weihnachtsfeiertag
        { month: 12, day: 26 }  // 2. Weihnachtsfeiertag
      ];
      
      for (const holiday of fixedHolidays) {
        if (month === holiday.month && day === holiday.day) {
          return true;
        }
      }
      
      const knownHolidays2025 = [
        '2025-04-18', // Karfreitag
        '2025-04-21', // Ostermontag
        '2025-05-29', // Christi Himmelfahrt
        '2025-06-09'  // Pfingstmontag
      ];
      
      const dateString = date.toISOString().split('T')[0];
      return knownHolidays2025.includes(dateString);
    };
    
    const isWorkingDay = (date) => {
      return !isWeekend(date) && !isGermanHoliday(date);
    };
    
    // Berechne aufeinanderfolgende Urlaubstage
    const countConsecutiveVacationDays = (employeeCode) => {
      let count = 0;
      let currentDate = new Date(today);
      
      console.log('\n📊 Detaillierte Berechnung:');
      
      while (count < 35) { // Max 35 Tage voraus prüfen
        const dateString = currentDate.toISOString().split('T')[0];
        const dayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][currentDate.getDay()];
        
        console.log(`  📅 ${dateString} (${dayName}): `, {
          isWeekend: isWeekend(currentDate),
          isHoliday: isGermanHoliday(currentDate),
          isWorking: isWorkingDay(currentDate)
        });
        
        // Prüfe ob aktuelles Datum ein Arbeitstag ist
        if (isWorkingDay(currentDate)) {
          // Nur an Arbeitstagen nach Urlaub suchen
          const hasVacationOnDate = allVacations.some(vacation => {
            const vacationDateString = vacation.datum.split('T')[0];
            return vacationDateString === dateString && 
                   vacation.benutzerCode == employeeCode && 
                   vacation.menge && vacation.menge > 0;
          });
          
          console.log(`    🏖️ Urlaub an diesem Arbeitstag: ${hasVacationOnDate ? 'JA' : 'NEIN'}`);
          
          if (hasVacationOnDate) {
            count++;
            console.log(`    ✅ Count erhöht auf: ${count}`);
          } else {
            // Kein Urlaub an diesem Arbeitstag - Kette unterbrochen
            console.log(`    ❌ Kette unterbrochen! Finale Anzahl: ${count}`);
            break;
          }
        } else {
          console.log(`    ⏭️ Übersprungen (Wochenende/Feiertag)`);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return count;
    };
    
    const consecutiveDays = countConsecutiveVacationDays(armin.work4all_code);
    console.log(`\n🎯 ERGEBNIS: Armin Hollensteiner hat ${consecutiveDays} aufeinanderfolgende Urlaubstage`);
    console.log(`📝 Im System wird angezeigt: "noch ${consecutiveDays - 1} weitere Tage"`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

testArminVacationDays().catch(console.error); 