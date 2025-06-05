const sqlite3 = require('sqlite3').verbose();
const Work4AllSyncService = require('./work4all-sync');

// Test für Wochenend- und Feiertags-Logik
async function testWeekendHolidayLogic() {
  console.log('🧪 Teste Wochenend- und Feiertags-Logik für aufeinanderfolgende Tage...\n');
  
  // Hilfsfunktionen (kopiert aus work4all-sync.js)
  const isWeekend = (date) => {
    const dayOfWeek = date.getDay(); // 0 = Sonntag, 6 = Samstag
    return dayOfWeek === 0 || dayOfWeek === 6;
  };
  
  const isGermanHoliday = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-indexed
    const day = date.getDate();
    
    // Feste Feiertage
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
    
    // Bewegliche Feiertage (Oster-abhängig) - vereinfachte Prüfung für häufige Feiertage
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
  
  // Test verschiedene Datums-Szenarien
  const testDates = [
    '2025-06-05', // Donnerstag (heute)
    '2025-06-06', // Freitag
    '2025-06-07', // Samstag (Wochenende)
    '2025-06-08', // Sonntag (Wochenende)
    '2025-06-09', // Montag (Pfingstmontag - Feiertag!)
    '2025-06-10', // Dienstag
    '2025-05-01', // Tag der Arbeit (Feiertag)
    '2025-12-25', // Weihnachten (Feiertag)
  ];
  
  console.log('📅 Test einzelner Datumsangaben:');
  testDates.forEach(dateStr => {
    const date = new Date(dateStr + 'T12:00:00');
    const dayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][date.getDay()];
    
    console.log(`${dateStr} (${dayName}): Weekend=${isWeekend(date)}, Holiday=${isGermanHoliday(date)}, Working=${isWorkingDay(date)}`);
  });
  
  console.log('\n🔗 Test aufeinanderfolgende Tage-Berechnung:');
  
  // Simuliere Krankheits-/Urlaubsdaten für Armin Hollensteiner Szenario
  const mockSicknessData = [
    { datum: '2025-06-05T00:00:00', benutzerCode: 'ARMIN123', menge: 1.0 }, // Donnerstag
    { datum: '2025-06-06T00:00:00', benutzerCode: 'ARMIN123', menge: 1.0 }, // Freitag
    // Samstag/Sonntag = Wochenende (keine Krankheit nötig)
    { datum: '2025-06-09T00:00:00', benutzerCode: 'ARMIN123', menge: 1.0 }, // Montag (aber Pfingstmontag = Feiertag!)
    { datum: '2025-06-10T00:00:00', benutzerCode: 'ARMIN123', menge: 1.0 }, // Dienstag
    { datum: '2025-06-11T00:00:00', benutzerCode: 'ARMIN123', menge: 1.0 }, // Mittwoch
    // Donnerstag 12.06 = krank aber nicht in Daten = Unterbrechung
  ];
  
  // Teste Berechnung
  const countConsecutiveSicknessDays = (employeeCode, startDate = new Date('2025-06-05T12:00:00')) => {
    let count = 0;
    let currentDate = new Date(startDate);
    
    console.log(`\n🔍 Berechne aufeinanderfolgende Krankheitstage für ${employeeCode} ab ${currentDate.toISOString().split('T')[0]}:`);
    
    while (count < 30) { // Max 30 Tage voraus prüfen
      const dateString = currentDate.toISOString().split('T')[0];
      const dayName = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][currentDate.getDay()];
      
      console.log(`  📅 ${dateString} (${dayName}): `, {
        isWeekend: isWeekend(currentDate),
        isHoliday: isGermanHoliday(currentDate),
        isWorking: isWorkingDay(currentDate)
      });
      
      // Prüfe ob aktuelles Datum ein Arbeitstag ist
      if (isWorkingDay(currentDate)) {
        // Nur an Arbeitstagen nach Krankheit suchen
        const hasSicknessOnDate = mockSicknessData.some(sickness => {
          const sicknessDateString = sickness.datum.split('T')[0];
          return sicknessDateString === dateString && 
                 sickness.benutzerCode == employeeCode && 
                 sickness.menge && sickness.menge > 0;
        });
        
        console.log(`    🤒 Krankheit an diesem Arbeitstag: ${hasSicknessOnDate ? 'JA' : 'NEIN'}`);
        
        if (hasSicknessOnDate) {
          count++;
          console.log(`    ✅ Count erhöht auf: ${count}`);
        } else {
          // Keine Krankheit an diesem Arbeitstag - Kette unterbrochen
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
  
  const result = countConsecutiveSicknessDays('ARMIN123');
  console.log(`\n🎯 ERGEBNIS: Armin Hollensteiner hat ${result} aufeinanderfolgende Krankheitstage`);
  console.log(`📝 Erwartung: 4 Tage (Do, Fr, [Sa/So übersprungen], [Mo=Feiertag übersprungen], Di, Mi)`);
  
  // Test verschiedene Szenarien
  console.log('\n🧪 Weitere Test-Szenarien:');
  
  // Szenario 2: Nur Freitag krank
  const fridayOnlyData = [
    { datum: '2025-06-06T00:00:00', benutzerCode: 'TEST123', menge: 1.0 }, // Nur Freitag
  ];
  
  const countFridayOnly = (employeeCode, startDate = new Date('2025-06-06T12:00:00')) => {
    let count = 0;
    let currentDate = new Date(startDate);
    
    while (count < 30) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      if (isWorkingDay(currentDate)) {
        const hasSicknessOnDate = fridayOnlyData.some(sickness => {
          const sicknessDateString = sickness.datum.split('T')[0];
          return sicknessDateString === dateString && 
                 sickness.benutzerCode == employeeCode && 
                 sickness.menge && sickness.menge > 0;
        });
        
        if (hasSicknessOnDate) {
          count++;
        } else {
          break;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  };
  
  const fridayResult = countFridayOnly('TEST123');
  console.log(`📅 Nur Freitag krank: ${fridayResult} Tag(e) (erwartet: 1)`);
  
  // Szenario 3: Montag-Mittwoch krank (über Wochenende)
  const weekendSpanData = [
    { datum: '2025-06-02T00:00:00', benutzerCode: 'WEEKEND123', menge: 1.0 }, // Montag
    { datum: '2025-06-03T00:00:00', benutzerCode: 'WEEKEND123', menge: 1.0 }, // Dienstag
    { datum: '2025-06-04T00:00:00', benutzerCode: 'WEEKEND123', menge: 1.0 }, // Mittwoch
    // Do+Fr gesund, Sa/So Wochenende
    { datum: '2025-06-09T00:00:00', benutzerCode: 'WEEKEND123', menge: 1.0 }, // Montag (Pfingstmontag - Feiertag!)
    { datum: '2025-06-10T00:00:00', benutzerCode: 'WEEKEND123', menge: 1.0 }, // Dienstag
  ];
  
  const countWeekendSpan = (employeeCode, startDate = new Date('2025-06-02T12:00:00')) => {
    let count = 0;
    let currentDate = new Date(startDate);
    
    while (count < 30) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      if (isWorkingDay(currentDate)) {
        const hasSicknessOnDate = weekendSpanData.some(sickness => {
          const sicknessDateString = sickness.datum.split('T')[0];
          return sicknessDateString === dateString && 
                 sickness.benutzerCode == employeeCode && 
                 sickness.menge && sickness.menge > 0;
        });
        
        if (hasSicknessOnDate) {
          count++;
        } else {
          break;
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return count;
  };
  
  const weekendResult = countWeekendSpan('WEEKEND123');
  console.log(`📅 Mo-Mi krank, dann Unterbrechung: ${weekendResult} Tag(e) (erwartet: 3)`);
  
  console.log('\n✅ Test abgeschlossen!');
}

// Test ausführen
testWeekendHolidayLogic().catch(console.error); 