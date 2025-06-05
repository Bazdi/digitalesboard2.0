// test-work4all.js - Test-Skript für work4all Integration
const Work4AllSyncService = require('./work4all-sync');

async function testWork4AllIntegration() {
  console.log('🧪 Teste work4all Integration...\n');
  
  const syncService = new Work4AllSyncService();
  const shouldSync = process.argv.includes('--sync');
  
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
    
    // Fahrzeug-Analyse
    const nonUserResources = employees.filter(emp => {
      const userType = emp.licenseInformation?.userType;
      return userType && userType.toLowerCase() !== 'benutzer';
    });
    console.log(`📊 Insgesamt ${nonUserResources.length} Ressourcen (nicht "Benutzer") gefunden`);
    
    console.log('\n📋 Alle Ressourcen:');
    nonUserResources.slice(0, 32).forEach((resource, index) => {
      const userType = resource.licenseInformation?.userType || 'Unbekannt';
      console.log(`   ${index + 1}. ${resource.anzeigename} (userType: ${userType})`);
    });
    
    console.log('\n📋 Fahrzeug-Analyse:');
    console.log(`   🚗 Fahrzeuge (userType: nicht "Benutzer"): ${vehicles.length}`);
    
    if (vehicles.length > 0) {
      const sampleVehicle = vehicles[0];
      console.log('\n📋 Beispiel Fahrzeug:');
      console.log(`   Name: ${sampleVehicle.anzeigename || 'Unbekannt'}`);
      console.log(`   Code: ${sampleVehicle.code || 'Unbekannt'}`);
      console.log(`   UserType: ${sampleVehicle.licenseInformation?.userType || 'Unbekannt'}`);
      console.log(`   Nummer: ${sampleVehicle.nummer || 'Unbekannt'}`);
    }
    
    if (rooms.length > 0) {
      const sampleRoom = employees[0]; // Erstes Element als Beispiel
      console.log('\n📋 Beispiel Besprechungsraum (wird ignoriert):');
      console.log(`   Name: ${sampleRoom.anzeigename || 'Unbekannt'}`);
      console.log(`   Code: ${sampleRoom.code || 'Unbekannt'}`);
      console.log(`   UserType: ${sampleRoom.licenseInformation?.userType || 'Unbekannt'}`);
    }

    // 5. Teste Datenkonvertierung
    console.log('\n🔄 5. Teste Datenkonvertierung...');
    if (employees.length > 0) {
      const localEmployee = syncService.convertWork4AllToLocal(employees[0]);
      console.log('   ✅ Mitarbeiter-Konvertierung erfolgreich');
      console.log(`      Lokaler Name: ${localEmployee.name}`);
      console.log(`      Lokale Abteilung: ${localEmployee.department}`);
    }
    
    if (vehicles.length > 0) {
      const localVehicle = syncService.convertWork4AllResourceToVehicle(vehicles[0]);
      console.log('   ✅ Fahrzeug-Konvertierung erfolgreich');
      console.log(`      Marke: ${localVehicle.brand}`);
      console.log(`      Modell: ${localVehicle.model}`);
      console.log(`      Typ: ${localVehicle.vehicle_type}`);
      console.log(`      Kennzeichen: ${localVehicle.license_plate}`);
    }

    // 6. VOLLSTÄNDIGE SYNCHRONISATION wenn --sync Parameter
    if (shouldSync) {
      console.log('\n🔄 6. Starte vollständige Synchronisation...');
      
      // Mitarbeiter-Synchronisation
      console.log('\n👥 Synchronisiere Mitarbeiter...');
      let employeeResult = { created: 0, updated: 0, errors: 0 };
      for (const employee of employees) {
        try {
          const localEmployee = syncService.convertWork4AllToLocal(employee);
          await syncService.syncEmployeeToDatabase(localEmployee);
          employeeResult.updated++;
        } catch (error) {
          employeeResult.errors++;
          console.log(`   ❌ Fehler bei ${employee.anzeigename}: ${error.message}`);
        }
      }
      console.log(`✅ Mitarbeiter: ${employeeResult.updated} aktualisiert, ${employeeResult.errors} Fehler`);
      
      // Fahrzeug-Synchronisation
      console.log('\n🚗 Synchronisiere Fahrzeuge...');
      const vehicleResult = await syncService.performResourceSync();
      console.log(`✅ Fahrzeuge: ${vehicleResult.created || 0} erstellt, ${vehicleResult.updated || 0} aktualisiert`);
      
      // Event-Synchronisation
      console.log('\n📅 Synchronisiere Veranstaltungen...');
      const eventResult = await syncService.performEventSync();
      console.log(`✅ Veranstaltungen: ${eventResult.created || 0} erstellt, ${eventResult.updated || 0} aktualisiert`);
      
      // Urlaub-Synchronisation
      console.log('\n🏖️ Synchronisiere Urlaubsdaten...');
      const vacationResult = await syncService.syncVacationData();
      console.log(`✅ Urlaub: ${vacationResult.processedEmployees || 0} Mitarbeiter verarbeitet, ${vacationResult.currentVacation || 0} aktuell im Urlaub`);
      
      // Krankheits-Synchronisation
      console.log('\n🤒 Synchronisiere Krankheitsdaten...');
      const sicknessResult = await syncService.syncSicknessData();
      console.log(`✅ Krankheit: ${sicknessResult.processedEmployees || 0} Mitarbeiter verarbeitet, ${sicknessResult.currentSickness || 0} aktuell krank`);
      
      console.log('\n📊 SYNCHRONISATION ABGESCHLOSSEN:');
      console.log(`   👥 Mitarbeiter: ${employeeResult.updated} aktualisiert`);
      console.log(`   🚗 Fahrzeuge: ${vehicleResult.updated || 0} aktualisiert`);
      console.log(`   📅 Veranstaltungen: ${eventResult.updated || 0} aktualisiert`);
      console.log(`   🏖️ Aktuell im Urlaub: ${vacationResult.currentVacation || 0}`);
      console.log(`   🤒 Aktuell krank: ${sicknessResult.currentSickness || 0}`);
      
    } else {
      console.log('\n💡 Info: Starte mit --sync Parameter für vollständige Synchronisation');
    }

    console.log('\n✅ Test abgeschlossen!');
    
  } catch (error) {
    console.error('\n❌ Test fehlgeschlagen:');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Test starten
testWork4AllIntegration(); 