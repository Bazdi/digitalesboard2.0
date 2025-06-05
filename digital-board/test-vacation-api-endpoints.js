const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

async function testVacationEndpoints() {
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);

  try {
    console.log('🔍 Teste verschiedene Urlaub-API-Endpoints...');
    
    // 1. Authentifizierung
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
    
    console.log('✅ Authentifizierung erfolgreich');
    
    // 2. Teste verschiedene Endpoints
    const endpoints = [
      { name: 'Urlaub/query (POST)', method: 'POST', path: '/Urlaub/query', data: {} },
      { name: 'Urlaub (GET)', method: 'GET', path: '/Urlaub' },
      { name: 'urlaub/query (POST lowercase)', method: 'POST', path: '/urlaub/query', data: {} },
      { name: 'Urlaubsantraege (GET)', method: 'GET', path: '/Urlaubsantraege' },
      { name: 'Vacation/query (POST)', method: 'POST', path: '/Vacation/query', data: {} }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n🔍 Teste ${endpoint.name}...`);
        
        const response = await syncService.makeApiRequest(
          endpoint.method, 
          endpoint.path, 
          endpoint.data || null
        );
        
        console.log(`✅ ${endpoint.name} erfolgreich`);
        console.log(`📊 Response-Typ:`, typeof response);
        console.log(`📊 Response-Keys:`, Object.keys(response || {}));
        
        if (Array.isArray(response)) {
          console.log(`📊 Array-Länge: ${response.length}`);
          if (response.length > 0) {
            console.log(`📊 Erstes Element:`, response[0]);
          }
        } else if (response && response.items) {
          console.log(`📊 Items-Array-Länge: ${response.items.length}`);
          if (response.items.length > 0) {
            console.log(`📊 Erstes Item:`, response.items[0]);
          }
        } else if (response && response.values) {
          console.log(`📊 Values-Array-Länge: ${response.values.length}`);
          if (response.values.length > 0) {
            console.log(`📊 Erstes Value:`, response.values[0]);
          }
        } else {
          console.log(`📊 Response:`, response);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.name} Fehler:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

testVacationEndpoints(); 