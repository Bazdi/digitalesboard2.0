const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

async function debugUrlaubSyncDirect() {
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);

  try {
    console.log('🔧 Direkte Debug: Urlaub-Synchronisation');
    
    // 1. Authentifizierung
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
    
    console.log('✅ Authentifizierung erfolgreich');
    
    // 2. Führe die Urlaub-Synchronisation durch und debug jeden Schritt
    console.log('\n🔄 Führe Urlaub-Sync durch...');
    
    // Führe die syncVacationData direkt aus mit detailliertem Logging
    const vacationResult = await syncService.syncVacationData();
    console.log('\n✅ Urlaub-Sync Result:', JSON.stringify(vacationResult, null, 2));
    
    // 3. Prüfe die finalen Werte
    const results = await new Promise((resolve, reject) => {
      db.all(`
        SELECT name, employment_status, vacation_days_left, sickness_days_left 
        FROM employees 
        WHERE employment_status IN ('urlaub', 'krank')
        ORDER BY employment_status, name
      `, [], (err, rows) => err ? reject(err) : resolve(rows));
    });
    
    console.log('\n📊 Finale Werte:');
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

debugUrlaubSyncDirect(); 