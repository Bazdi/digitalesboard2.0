const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

async function debugConsecutiveDays() {
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);

  try {
    console.log('🔍 Debug: Aufeinanderfolgende Krankheitstage');
    
    // 1. Authentifizierung
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
    
    // 2. Alle Krankheitsdaten laden
    const sicknessResponse = await syncService.makeApiRequest('POST', '/Krankheit/query', {});
    const allSickness = sicknessResponse.values || [];
    console.log(`📅 ${allSickness.length} Krankheitseinträge total`);
    
    // 3. Bilal Kina's work4all_code finden
    const employee = await new Promise((resolve, reject) => {
      db.get('SELECT name, work4all_code FROM employees WHERE name LIKE "%Bilal%"', [], (err, row) => {
        err ? reject(err) : resolve(row);
      });
    });
    
    if (!employee) {
      console.log('❌ Bilal Kina nicht gefunden');
      return;
    }
    
    console.log(`👤 Gefunden: ${employee.name} (work4all_code: ${employee.work4all_code})`);
    
    // 4. Alle Krankheitstage von Bilal Kina
    const bilalSickness = allSickness.filter(s => s.benutzerCode == employee.work4all_code)
      .map(s => s.datum.split('T')[0])
      .sort();
    
    console.log(`🤒 Bilal's Krankheitstage insgesamt: ${bilalSickness.length}`);
    console.log('📅 Letzte 10 Krankheitstage:', bilalSickness.slice(-10));
    
    // 5. Teste aufeinanderfolgende Tage ab heute
    const today = new Date();
    console.log(`📅 Heute: ${today.toISOString().split('T')[0]}`);
    
    for (let i = 0; i < 10; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      const hasSickness = bilalSickness.includes(dateString);
      console.log(`${hasSickness ? '🤒' : '✅'} ${dateString}: ${hasSickness ? 'KRANK' : 'gesund'}`);
    }
    
    // 6. Manuelle Berechnung aufeinanderfolgender Tage
    let consecutiveDays = 0;
    let currentDate = new Date(today);
    
    console.log('\n🔍 Manuelle Berechnung aufeinanderfolgender Tage:');
    for (let i = 0; i < 30; i++) {
      const dateString = currentDate.toISOString().split('T')[0];
      const hasSickness = bilalSickness.includes(dateString);
      
      console.log(`Tag ${i + 1} (${dateString}): ${hasSickness ? 'KRANK' : 'gesund'}`);
      
      if (hasSickness) {
        consecutiveDays++;
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        break;
      }
    }
    
    console.log(`\n📊 Resultat: ${consecutiveDays} aufeinanderfolgende Krankheitstage`);
    console.log(`📊 Verbleibende Tage: ${Math.max(0, consecutiveDays - 1)}`);
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

debugConsecutiveDays(); 