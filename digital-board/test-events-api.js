// test-events-api.js - Test der korrigierten work4all Event API
const Work4AllSyncService = require('./work4all-sync.js');

async function testEventsAPI() {
  const service = new Work4AllSyncService();
  
  try {
    console.log('🧪 Teste korrigierte work4all Event-API...\n');
    
    // Schema erweitern
    await service.extendDatabaseSchema();
    
    // Event Synchronisation testen
    const result = await service.performEventSync();
    
    console.log('\n📊 Test Result:');
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    service.close();
  }
}

// Teste nur wenn direkt ausgeführt
if (require.main === module) {
  testEventsAPI();
}

module.exports = testEventsAPI; 