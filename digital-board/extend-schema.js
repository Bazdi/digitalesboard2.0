// extend-schema.js - Erweitere Datenbank-Schema für work4all
const Work4AllSyncService = require('./work4all-sync.js');

async function extendSchema() {
  const service = new Work4AllSyncService();
  
  try {
    console.log('🔄 Erweitere Datenbank-Schema für work4all...');
    await service.extendDatabaseSchema();
    console.log('✅ Schema erfolgreich erweitert!');
  } catch (error) {
    console.error('❌ Schema-Fehler:', error.message);
  } finally {
    service.close();
  }
}

extendSchema(); 