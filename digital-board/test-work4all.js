// test-work4all.js - Test-Skript für work4all Integration
const Work4AllSyncService = require('./work4all-sync');

async function testWork4AllIntegration() {
  console.log('🧪 Teste work4all Integration...\n');
  
  const syncService = new Work4AllSyncService();
  
  try {
    // 1. Datenbank-Schema erweitern
    console.log('📊 1. Erweitere Datenbank-Schema...');
    await syncService.extendDatabaseSchema();
    
    // 2. Verbindung testen
    console.log('\n🔍 2. Teste Verbindung zu work4all...');
    const authResult = await syncService.authenticate();
    
    if (!authResult) {
      console.error('❌ Authentifizierung fehlgeschlagen!');
      process.exit(1);
    }
    
    // 3. Mitarbeiterdaten abrufen
    console.log('\n📥 3. Rufe Mitarbeiterdaten ab...');
    const employees = await syncService.fetchEmployeesFromWork4All();
    console.log(`✅ ${employees.length} Mitarbeiter erhalten`);
    
    if (employees.length > 0) {
      console.log('\n📋 Beispiel Mitarbeiter:');
      const sampleEmployee = employees[0];
      console.log(`   Name: ${sampleEmployee.anzeigename || 'Unbekannt'}`);
      console.log(`   E-Mail: ${sampleEmployee.eMail || 'Keine E-Mail'}`);
      console.log(`   Abteilung: ${sampleEmployee.abteilung || 'Unbekannt'}`);
      console.log(`   Ausgeschieden: ${sampleEmployee.ausgeschieden ? 'Ja' : 'Nein'}`);
    }

    // 4. Ressourcen (Fahrzeuge) aus Mitarbeiterdaten analysieren
    console.log('\n🚗 4. Analysiere Ressourcen aus Mitarbeiterdaten...');
    
    // Fahrzeuge aus Mitarbeiterdaten filtern
    const vehicles = employees.filter(emp => syncService.isVehicleResource(emp));
    const rooms = employees.filter(emp => {
      const userType = emp.licenseInformation?.userType;
      return userType && userType.toLowerCase() !== 'benutzer' && !syncService.isVehicleResource(emp);
    });
    
    console.log(`✅ ${vehicles.length} Fahrzeuge gefunden`);
    console.log(`✅ ${rooms.length} Besprechungsräume gefunden`);
    
    // Alle Nicht-Benutzer anzeigen für Debugging
    const allResources = employees.filter(emp => {
      const userType = emp.licenseInformation?.userType;
      return userType && userType.toLowerCase() !== 'benutzer';
    });
    console.log(`📊 Insgesamt ${allResources.length} Ressourcen (nicht "Benutzer") gefunden`);
    
    if (allResources.length > 0) {
      console.log('\n📋 Alle Ressourcen:');
      allResources.forEach((resource, index) => {
        const userType = resource.licenseInformation?.userType;
        console.log(`   ${index + 1}. ${resource.anzeigename} (userType: ${userType})`);
      });
    }
    
    if (vehicles.length > 0) {
      console.log('\n📋 Fahrzeug-Analyse:');
      console.log(`   🚗 Fahrzeuge (userType: nicht "Benutzer"): ${vehicles.length}`);
      
      // Erstes Fahrzeug anzeigen
      const firstVehicle = vehicles[0];
      const userType = firstVehicle.licenseInformation?.userType;
      console.log('\n📋 Beispiel Fahrzeug:');
      console.log(`   Name: ${firstVehicle.anzeigename || 'Unbekannt'}`);
      console.log(`   Code: ${firstVehicle.code || 'Unbekannt'}`);
      console.log(`   UserType: ${userType || 'Unbekannt'}`);
      console.log(`   Nummer: ${firstVehicle.nummer || 'Unbekannt'}`);
    }
    
    if (rooms.length > 0) {
      // Ersten Besprechungsraum anzeigen
      const firstRoom = rooms[0];
      const userType = firstRoom.licenseInformation?.userType;
      console.log('\n📋 Beispiel Besprechungsraum (wird ignoriert):');
      console.log(`   Name: ${firstRoom.anzeigename || 'Unbekannt'}`);
      console.log(`   Code: ${firstRoom.code || 'Unbekannt'}`);
      console.log(`   UserType: ${userType || 'Unbekannt'}`);
    }

    // 5. Testkonvertierung
    console.log('\n🔄 5. Teste Datenkonvertierung...');
    
    if (employees.length > 0) {
      const regularEmployee = employees.find(emp => emp.userType !== 'ressource');
      if (regularEmployee) {
        const testEmployee = syncService.convertWork4AllToLocal(regularEmployee);
        console.log('   ✅ Mitarbeiter-Konvertierung erfolgreich');
        console.log(`      Lokaler Name: ${testEmployee.name}`);
        console.log(`      Lokale Abteilung: ${testEmployee.department}`);
      }
    }
    
    if (vehicles.length > 0) {
      const testVehicle = vehicles[0];
      const convertedVehicle = syncService.convertWork4AllResourceToVehicle(testVehicle);
      console.log('   ✅ Fahrzeug-Konvertierung erfolgreich');
      console.log(`      Marke: ${convertedVehicle.brand}`);
      console.log(`      Modell: ${convertedVehicle.model}`);
      console.log(`      Typ: ${convertedVehicle.vehicle_type}`);
      console.log(`      Kennzeichen: ${convertedVehicle.license_plate}`);
    }

    // 6. Vollständige Synchronisation testen (falls --sync Parameter)
    if (process.argv.includes('--sync')) {
      console.log('\n🔄 6. Starte vollständige Synchronisation...');
      const syncResult = await syncService.performFullSync();
      
      if (syncResult.success) {
        console.log('✅ Vollständige Synchronisation erfolgreich!');
        console.log(`   👥 Mitarbeiter: ${syncResult.employees.created} erstellt, ${syncResult.employees.updated} aktualisiert`);
        if (syncResult.resources.vehiclesCreated !== undefined) {
          console.log(`   🚗 Fahrzeuge: ${syncResult.resources.vehiclesCreated} erstellt, ${syncResult.resources.vehiclesUpdated} aktualisiert`);
          console.log(`   ⏭️ Besprechungsräume: ${syncResult.resources.vehiclesIgnored} ignoriert`);
        }
      } else {
        console.log('❌ Synchronisation fehlgeschlagen:', syncResult.error);
      }
    } else {
      console.log('\n💡 Info: Starte mit --sync Parameter für vollständige Synchronisation');
    }
    
    console.log('\n✅ Test abgeschlossen!');
    
  } catch (error) {
    console.error('\n❌ Test fehlgeschlagen:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  } finally {
    syncService.close();
  }
}

// Skript ausführen
if (require.main === module) {
  testWork4AllIntegration().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Unerwarteter Fehler:', error);
    process.exit(1);
  });
}

module.exports = testWork4AllIntegration; 