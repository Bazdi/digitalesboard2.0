const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

async function debugVacationTypes() {
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);

  try {
    console.log('🔍 Analysiere verschiedene Urlaubstypen in work4all...');
    
    // 1. Authentifizierung
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
    
    console.log('✅ Authentifizierung erfolgreich');
    
    // 2. Alle Urlaubsdaten laden
    console.log('📅 Lade alle Urlaubsdaten...');
    const vacationResponse = await syncService.makeApiRequest('POST', '/Urlaub/query', {});
    const allVacations = Array.isArray(vacationResponse) ? vacationResponse : 
                        vacationResponse.items ? vacationResponse.items : 
                        vacationResponse.values ? vacationResponse.values : [];
    
    console.log(`📊 ${allVacations.length} Urlaubseinträge total gefunden`);
    
    // 3. Analysiere alle möglichen Urlaubsart-Werte
    console.log('\n🔍 Analysiere Urlaubsart-Felder...');
    
    const urlaubsArtValues = new Set();
    const urlaubsArtCodeValues = new Set();
    const urlaubtagsArtValues = new Set();
    const datevArtLookUpCodeValues = new Set();
    
    allVacations.forEach(vacation => {
      if (vacation.urlaubsArt !== undefined) urlaubsArtValues.add(vacation.urlaubsArt);
      if (vacation.urlaubsArtCode !== undefined) urlaubsArtCodeValues.add(vacation.urlaubsArtCode);
      if (vacation.urlaubtagsArt !== undefined) urlaubtagsArtValues.add(vacation.urlaubtagsArt);
      if (vacation.datevArtLookUpCode !== undefined) datevArtLookUpCodeValues.add(vacation.datevArtLookUpCode);
    });
    
    console.log(`📊 urlaubsArt Werte: ${Array.from(urlaubsArtValues).sort().join(', ')}`);
    console.log(`📊 urlaubsArtCode Werte: ${Array.from(urlaubsArtCodeValues).sort().join(', ')}`);
    console.log(`📊 urlaubtagsArt Werte: ${Array.from(urlaubtagsArtValues).sort().join(', ')}`);
    console.log(`📊 datevArtLookUpCode Werte: ${Array.from(datevArtLookUpCodeValues).sort().join(', ')}`);
    
    // 4. Analysiere heutige Einträge nach Typ
    const today = new Date().toISOString().split('T')[0];
    const todayVacations = allVacations.filter(vacation => {
      const vacationDateString = vacation.datum.split('T')[0];
      return vacationDateString === today && vacation.menge && vacation.menge > 0;
    });
    
    console.log(`\n📅 ${todayVacations.length} Urlaubseinträge für heute (${today}):`);
    
    // Lade Mitarbeiter für Namen-Zuordnung
    const employees = await new Promise((resolve, reject) => {
      db.all('SELECT work4all_code, name FROM employees WHERE work4all_code IS NOT NULL', [], (err, rows) => {
        err ? reject(err) : resolve(rows);
      });
    });
    
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp.work4all_code] = emp.name;
    });
    
    // Gruppiere heutige Einträge nach urlaubsArt
    console.log('\n📊 Heutige Einträge gruppiert nach urlaubsArt:');
    const todayByType = {};
    
    todayVacations.forEach(vacation => {
      const type = vacation.urlaubsArt || 'Unbekannt';
      if (!todayByType[type]) {
        todayByType[type] = [];
      }
      
      const employeeName = employeeMap[vacation.benutzerCode] || `Code: ${vacation.benutzerCode}`;
      todayByType[type].push({
        name: employeeName,
        amount: vacation.menge,
        urlaubsArtCode: vacation.urlaubsArtCode,
        urlaubtagsArt: vacation.urlaubtagsArt,
        datevArtLookUpCode: vacation.datevArtLookUpCode,
        notiz: vacation.notiz
      });
    });
    
    Object.keys(todayByType).sort().forEach(type => {
      console.log(`\n🏷️ Typ ${type}: ${todayByType[type].length} Einträge`);
      todayByType[type].forEach(entry => {
        console.log(`   👤 ${entry.name}: ${entry.amount} Tag(e)`);
        console.log(`      - urlaubsArtCode: ${entry.urlaubsArtCode}`);
        console.log(`      - urlaubtagsArt: ${entry.urlaubtagsArt}`);
        console.log(`      - datevArtLookUpCode: ${entry.datevArtLookUpCode}`);
        if (entry.notiz) {
          console.log(`      - Notiz: "${entry.notiz}"`);
        }
      });
    });
    
    // 5. Schaue nach Beispielen für verschiedene Typen
    console.log('\n🔍 Suche Beispiele für verschiedene Typen...');
    
    Array.from(urlaubsArtValues).sort().forEach(artValue => {
      if (artValue !== 0) { // Nicht nur Standard-Urlaub
        const examples = allVacations.filter(v => v.urlaubsArt === artValue).slice(0, 3);
        if (examples.length > 0) {
          console.log(`\n📝 Beispiele für urlaubsArt ${artValue}:`);
          examples.forEach((example, index) => {
            const employeeName = employeeMap[example.benutzerCode] || `Code: ${example.benutzerCode}`;
            console.log(`   ${index + 1}. ${employeeName} - ${example.datum.split('T')[0]} (${example.menge} Tag(e))`);
            console.log(`      Codes: Art=${example.urlaubsArtCode}, TagArt=${example.urlaubtagsArt}, Datev=${example.datevArtLookUpCode}`);
            if (example.notiz) {
              console.log(`      Notiz: "${example.notiz}"`);
            }
          });
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

debugVacationTypes(); 