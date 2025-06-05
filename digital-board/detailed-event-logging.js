// detailed-event-logging.js - Detailliertes Logging für Event-Synchronisation
const Work4AllSyncService = require('./work4all-sync');

async function runDetailedEventLogging() {
  const syncService = new Work4AllSyncService();
  
  try {
    console.log('📊 DETAILLIERTES EVENT-LOGGING GESTARTET');
    console.log('=====================================\n');
    
    // Schema erweitern falls nötig
    console.log('🗄️ Erweitere Datenbank-Schema...');
    await syncService.extendDatabaseSchema();
    console.log('✅ Schema-Erweiterung abgeschlossen\n');
    
    // Authentifizierung
    console.log('🔐 AUTHENTIFIZIERUNG');
    console.log('==================');
    const authSuccess = await syncService.authenticate();
    if (!authSuccess) {
      throw new Error('Authentifizierung fehlgeschlagen');
    }
    console.log('✅ Authentifizierung erfolgreich\n');
    
    // 1. Projektgruppen laden und detailliert anzeigen
    console.log('📊 SCHRITT 1: PROJEKTGRUPPEN LADEN');
    console.log('==================================');
    const projectGroups = await syncService.fetchProjectGroupsFromWork4All();
    
    console.log(`📦 Alle ${projectGroups.length} gefundenen Projektgruppen:`);
    projectGroups.forEach((group, index) => {
      console.log(`   ${index + 1}. "${group.name}" (Code: ${group.code})`);
    });
    console.log('');
    
    // 2. Event-Gruppen filtern und detailliert anzeigen
    console.log('🎯 SCHRITT 2: EVENT-GRUPPEN FILTERN');
    console.log('===================================');
    const eventGroups = projectGroups.filter(group => syncService.isEventGroup(group));
    
    console.log(`✅ ${eventGroups.length} echte Veranstaltungsgruppen identifiziert:`);
    eventGroups.forEach((group, index) => {
      console.log(`   ${index + 1}. "${group.name}" (Code: ${group.code})`);
    });
    
    if (eventGroups.length === 0) {
      console.log('❌ Keine Veranstaltungsgruppen gefunden!');
      return;
    }
    console.log('');
    
    // 3. Für jede Event-Gruppe die Projekte laden und detailliert verarbeiten
    let totalEventsCreated = 0;
    let totalEventsUpdated = 0;
    let totalEventsIgnored = 0;
    let totalErrors = 0;
    let grandTotalProjects = 0;
    
    for (let i = 0; i < eventGroups.length; i++) {
      const eventGroup = eventGroups[i];
      console.log(`🔍 SCHRITT 3.${i + 1}: GRUPPE "${eventGroup.name}" VERARBEITEN`);
      console.log('='.repeat(50 + eventGroup.name.length));
      
      try {
        // Projekte der Gruppe laden
        console.log(`📥 Lade Projekte von Gruppe: ${eventGroup.name} (Code: ${eventGroup.code})`);
        const groupProjects = await syncService.fetchProjectsFromGroup(eventGroup.code);
        grandTotalProjects += groupProjects.length;
        
        console.log(`📊 ${groupProjects.length} Projekte in Gruppe "${eventGroup.name}" gefunden\n`);
        
        if (groupProjects.length === 0) {
          console.log('⚠️ Keine Projekte in dieser Gruppe gefunden\n');
          continue;
        }
        
        // Erste 10 Projekte zur Übersicht anzeigen
        console.log('📋 Erste 10 Projekte zur Übersicht:');
        for (let j = 0; j < Math.min(10, groupProjects.length); j++) {
          const project = groupProjects[j];
          console.log(`   ${j + 1}. "${project.name}" (${project.anfangDatum} - ${project.endeDatum})`);
        }
        if (groupProjects.length > 10) {
          console.log(`   ... und ${groupProjects.length - 10} weitere Projekte`);
        }
        console.log('');
        
        // Alle Projekte verarbeiten mit detailliertem Logging
        let groupEventsCreated = 0;
        let groupEventsUpdated = 0;
        let groupEventsIgnored = 0;
        let groupErrors = 0;
        
        console.log('🎪 PROJEKT-VERARBEITUNG STARTET:');
        console.log('-'.repeat(40));
        
        for (let k = 0; k < groupProjects.length; k++) {
          const project = groupProjects[k];
          
          try {
            // Validierung mit detailliertem Logging
            if (!syncService.isValidEvent(project)) {
              groupEventsIgnored++;
              continue;
            }
            
            // Event konvertieren und speichern
            console.log(`   🎪 Verarbeite: "${project.name}"`);
            const localTradeShow = syncService.convertWork4AllProjectToTradeShow(project);
            const result = await syncService.syncTradeShowToDatabase(localTradeShow);
            
            if (result.action === 'created') {
              groupEventsCreated++;
              console.log(`      ✅ NEU ERSTELLT: ${localTradeShow.name} (${localTradeShow.start_date} - ${localTradeShow.end_date})`);
              console.log(`         📍 Standort: ${localTradeShow.location}`);
              console.log(`         🆔 work4all Code: ${localTradeShow.work4all_project_code}`);
            } else if (result.action === 'updated' && result.changes > 0) {
              groupEventsUpdated++;
              console.log(`      🔄 AKTUALISIERT: ${localTradeShow.name}`);
            } else {
              console.log(`      ⏸️ Keine Änderungen: ${localTradeShow.name}`);
            }
            
          } catch (error) {
            groupErrors++;
            console.error(`      ❌ FEHLER bei "${project.name}": ${error.message}`);
          }
        }
        
        // Gruppen-Zusammenfassung
        console.log(`\n📊 ZUSAMMENFASSUNG GRUPPE "${eventGroup.name}":`);
        console.log(`   📦 Projekte gesamt: ${groupProjects.length}`);
        console.log(`   ✅ Events erstellt: ${groupEventsCreated}`);
        console.log(`   🔄 Events aktualisiert: ${groupEventsUpdated}`);
        console.log(`   ⏭️ Events ignoriert: ${groupEventsIgnored}`);
        console.log(`   ❌ Fehler: ${groupErrors}`);
        console.log('');
        
        // Zu Gesamtsumme addieren
        totalEventsCreated += groupEventsCreated;
        totalEventsUpdated += groupEventsUpdated;
        totalEventsIgnored += groupEventsIgnored;
        totalErrors += groupErrors;
        
      } catch (error) {
        console.error(`❌ FEHLER bei Gruppe "${eventGroup.name}": ${error.message}\n`);
        totalErrors++;
      }
    }
    
    // FINALE GESAMTZUSAMMENFASSUNG
    console.log('🎯 FINALE GESAMTZUSAMMENFASSUNG');
    console.log('==============================');
    console.log(`📊 Projektgruppen gefunden: ${projectGroups.length}`);
    console.log(`🎪 Event-Gruppen identifiziert: ${eventGroups.length}`);
    console.log(`📦 Projekte gesamt verarbeitet: ${grandTotalProjects}`);
    console.log(`✅ Events erstellt: ${totalEventsCreated}`);
    console.log(`🔄 Events aktualisiert: ${totalEventsUpdated}`);
    console.log(`⏭️ Events ignoriert: ${totalEventsIgnored}`);
    console.log(`❌ Fehler: ${totalErrors}`);
    
    // Erfolgsrate berechnen
    const totalProcessed = totalEventsCreated + totalEventsUpdated + totalEventsIgnored + totalErrors;
    const successRate = totalProcessed > 0 ? ((totalEventsCreated + totalEventsUpdated) / totalProcessed * 100).toFixed(1) : 0;
    const filterRate = grandTotalProjects > 0 ? (totalEventsIgnored / grandTotalProjects * 100).toFixed(1) : 0;
    
    console.log(`📊 Erfolgsrate: ${successRate}%`);
    console.log(`🔽 Filterungsrate: ${filterRate}% (erfolgreich herausgefiltert)`);
    console.log('\n✅ DETAILLIERTE EVENT-SYNCHRONISATION ABGESCHLOSSEN');
    
  } catch (error) {
    console.error('\n❌ KRITISCHER FEHLER bei detaillierter Event-Synchronisation:');
    console.error(error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  } finally {
    syncService.close();
  }
}

// Script ausführen
runDetailedEventLogging().catch(console.error); 