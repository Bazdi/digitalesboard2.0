const Work4AllSyncService = require('./work4all-sync');
const sqlite3 = require('sqlite3').verbose();

async function debugVacationLookup() {
  const db = new sqlite3.Database('./database.db');
  const syncService = new Work4AllSyncService(db);

  try {
    console.log('🔍 Suche nach Urlaubsarten-Lookup-Tabellen in work4all...');
    
    // 1. Authentifizierung
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
    
    console.log('✅ Authentifizierung erfolgreich');
    
    // 2. Versuche verschiedene Endpoints für Lookup-Tabellen
    const lookupEndpoints = [
      { name: 'Urlaubsarten', path: '/Urlaubsarten' },
      { name: 'UrlaubsArt', path: '/UrlaubsArt' },
      { name: 'VacationTypes', path: '/VacationTypes' },
      { name: 'AbwesenheitsArten', path: '/AbwesenheitsArten' },
      { name: 'AbsenceTypes', path: '/AbsenceTypes' },
      { name: 'LookUp/Urlaub', path: '/LookUp/Urlaub' },
      { name: 'LookUp/Vacation', path: '/LookUp/Vacation' },
      { name: 'LookUp/UrlaubsArt', path: '/LookUp/UrlaubsArt' },
      { name: 'Stammdaten/Urlaubsarten', path: '/Stammdaten/Urlaubsarten' },
      { name: 'Configuration/VacationTypes', path: '/Configuration/VacationTypes' }
    ];
    
    for (const endpoint of lookupEndpoints) {
      try {
        console.log(`\n🔍 Teste ${endpoint.name} (${endpoint.path})...`);
        
        const response = await syncService.makeApiRequest('GET', endpoint.path);
        
        console.log(`✅ ${endpoint.name} erfolgreich!`);
        console.log(`📊 Response-Typ:`, typeof response);
        
        if (Array.isArray(response)) {
          console.log(`📊 Array-Länge: ${response.length}`);
          if (response.length > 0) {
            console.log(`📊 Erstes Element:`, response[0]);
            if (response.length > 1) {
              console.log(`📊 Zweites Element:`, response[1]);
            }
          }
        } else if (response && typeof response === 'object') {
          console.log(`📊 Object-Keys:`, Object.keys(response));
          console.log(`📊 Response:`, response);
        } else {
          console.log(`📊 Response:`, response);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.name} Fehler: ${error.message}`);
      }
    }
    
    // 3. Versuche POST-Requests für Query-Endpoints
    const queryEndpoints = [
      { name: 'Urlaubsarten/query', path: '/Urlaubsarten/query' },
      { name: 'UrlaubsArt/query', path: '/UrlaubsArt/query' },
      { name: 'VacationTypes/query', path: '/VacationTypes/query' }
    ];
    
    for (const endpoint of queryEndpoints) {
      try {
        console.log(`\n🔍 Teste POST ${endpoint.name} (${endpoint.path})...`);
        
        const response = await syncService.makeApiRequest('POST', endpoint.path, {});
        
        console.log(`✅ ${endpoint.name} erfolgreich!`);
        console.log(`📊 Response-Typ:`, typeof response);
        
        if (Array.isArray(response)) {
          console.log(`📊 Array-Länge: ${response.length}`);
          if (response.length > 0) {
            console.log(`📊 Erstes Element:`, response[0]);
          }
        } else if (response && typeof response === 'object') {
          console.log(`📊 Object-Keys:`, Object.keys(response));
          console.log(`📊 Response:`, response);
        }
        
      } catch (error) {
        console.log(`❌ ${endpoint.name} Fehler: ${error.message}`);
      }
    }
    
    // 4. Versuche spezifische Codes zu resolven
    console.log('\n🔍 Versuche spezifische Codes zu resolven...');
    const testCodes = [132060795, 82343268, 25035878, 561036427];
    
    for (const code of testCodes) {
      try {
        const response = await syncService.makeApiRequest('GET', `/UrlaubsArt/${code}`);
        console.log(`✅ Code ${code}:`, response);
      } catch (error) {
        console.log(`❌ Code ${code} Fehler: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    db.close();
  }
}

debugVacationLookup(); 