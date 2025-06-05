const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

console.log('🤒 Debug: Krankheits-Synchronisation direkt testen...');

async function debugSicknessSync() {
  try {
    // Datenbank öffnen
    const db = new sqlite3.Database('./database.db', (err) => {
      if (err) {
        console.error('❌ Datenbank-Fehler:', err.message);
        return;
      }
      console.log('✅ Datenbank verbunden');
    });

    // Work4All Service erstellen
    const work4allService = new Work4AllSyncService(db);
    console.log('✅ Work4AllSyncService erstellt');

    // Krankheits-Synchronisation starten
    console.log('🤒 Starte Krankheits-Synchronisation...');
    const result = await work4allService.syncSicknessData();
    
    console.log('✅ Krankheits-Synchronisation erfolgreich:');
    console.log(JSON.stringify(result, null, 2));

    db.close();
    
  } catch (error) {
    console.error('❌ Fehler bei Krankheits-Synchronisation:');
    console.error('📄 Error Message:', error.message);
    console.error('📄 Error Stack:', error.stack);
    
    if (error.response) {
      console.error('📄 Response Status:', error.response.status);
      console.error('📄 Response Data:', error.response.data);
    }
    
    if (error.config) {
      console.error('📄 Request URL:', error.config.url);
      console.error('📄 Request Method:', error.config.method);
    }
  }
}

debugSicknessSync(); 