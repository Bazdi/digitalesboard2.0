const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

async function fixVacationSicknessData() {
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);

  try {
    console.log('🔧 Korrigiere vacation_days_left und sickness_days_left Daten...');
    
    // 1. Reset alle falschen Werte
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE employees 
        SET vacation_days_left = NULL, 
            sickness_days_left = NULL 
        WHERE employment_status IN ('urlaub', 'krank')
      `, [], (err) => err ? reject(err) : resolve());
    });
    
    console.log('✅ Alle vacation_days_left und sickness_days_left Werte zurückgesetzt');
    
    // 2. Führe eine neue Synchronisation durch
    console.log('🔄 Führe neue Urlaub-Synchronisation durch...');
    const vacationResult = await syncService.syncVacationData();
    console.log('✅ Urlaub-Sync:', vacationResult);
    
    console.log('🔄 Führe neue Krankheit-Synchronisation durch...');
    const sicknessResult = await syncService.syncSicknessData();
    console.log('✅ Krankheit-Sync:', sicknessResult);
    
    // 3. Prüfe die Ergebnisse
    const results = await new Promise((resolve, reject) => {
      db.all(`
        SELECT name, employment_status, vacation_days_left, sickness_days_left 
        FROM employees 
        WHERE employment_status IN ('urlaub', 'krank')
        ORDER BY employment_status, name
      `, [], (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    console.log('\n📊 Korrigierte Werte:');
    results.forEach(emp => {
      const daysInfo = emp.employment_status === 'urlaub' 
        ? (emp.vacation_days_left !== null ? `${emp.vacation_days_left} weitere Tage` : 'keine Info')
        : (emp.sickness_days_left !== null ? `${emp.sickness_days_left} weitere Tage` : 'keine Info');
      
      console.log(`${emp.employment_status === 'urlaub' ? '🏖️' : '🤒'} ${emp.name}: ${daysInfo}`);
    });
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

fixVacationSicknessData(); 