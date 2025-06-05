// test-events.js - Test erweiterte Event-Synchronisation
const Work4AllSyncService = require('./work4all-sync.js');

async function testEventSync() {
  console.log('🎪 Teste erweiterte Event-Synchronisation...');
  
  const service = new Work4AllSyncService();
  
  try {
    // Zuerst Projektgruppen laden
    const projectGroups = await service.fetchProjectGroupsFromWork4All();
    console.log(`📊 ${projectGroups.length} Projektgruppen geladen`);
    
    // Zeige alle verfügbaren Projektgruppen
    console.log('\n📋 Verfügbare Projektgruppen:');
    projectGroups.forEach((group, index) => {
      const isEvent = service.isEventGroup(group);
      console.log(`   ${index + 1}. ${group.name} ${isEvent ? '✅' : '❌'}`);
    });
    
    // Filtere Event-Gruppen
    const eventGroups = projectGroups.filter(group => service.isEventGroup(group));
    console.log(`\n🎯 ${eventGroups.length} Event-Gruppen gefunden:`);
    eventGroups.forEach((group, index) => {
      console.log(`   ${index + 1}. ${group.name} (Code: ${group.code})`);
    });
    
    // Führe vollständige Event-Synchronisation durch
    console.log('\n🔄 Starte Event-Synchronisation...');
    const result = await service.performEventSync();
    
    if (result.success) {
      console.log('\n✅ Event-Synchronisation erfolgreich!');
      console.log(`📊 Statistiken:`);
      console.log(`   ✅ Erstellt: ${result.eventsCreated}`);
      console.log(`   🔄 Aktualisiert: ${result.eventsUpdated}`);
      console.log(`   ⏭️ Ignoriert: ${result.eventsIgnored}`);
      console.log(`   ❌ Fehler: ${result.errors}`);
    } else {
      console.log('❌ Event-Synchronisation fehlgeschlagen:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error.message);
  } finally {
    service.close();
  }
}

testEventSync(); 