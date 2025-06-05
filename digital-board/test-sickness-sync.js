const axios = require('axios');

console.log('🤒 Teste Krankheits-Synchronisation über lokalen Server...');

async function testSicknessSync() {
  try {
    // 1. Admin-Login
    console.log('🔐 Authentifiziere als Admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin-Authentifizierung erfolgreich');
    
    // 2. Krankheits-Synchronisation starten
    console.log('🤒 Starte Krankheits-Synchronisation...');
    const syncResponse = await axios.post('http://localhost:5000/api/work4all/sync-sickness', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Krankheits-Synchronisation erfolgreich:', syncResponse.data);
    
    // 3. Mitarbeiter-Daten abrufen um Ergebnis zu prüfen
    console.log('👥 Lade Mitarbeiter-Daten...');
    const employeesResponse = await axios.get('http://localhost:5000/api/employees', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const employees = employeesResponse.data;
    const sickEmployees = employees.filter(e => e.employment_status === 'krank');
    
    console.log(`🤒 ${sickEmployees.length} kranke Mitarbeiter gefunden:`);
    
    sickEmployees.forEach(employee => {
      const daysInfo = employee.sickness_days_left > 0 ? ` (noch ${employee.sickness_days_left} weitere Tage)` : '';
      console.log(`   - ${employee.name}${daysInfo}`);
    });
    
    if (sickEmployees.length === 0) {
      console.log('   Niemand ist aktuell krank');
    }
    
  } catch (error) {
    console.error('❌ Fehler beim Testen der Krankheits-Synchronisation:', error.message);
    if (error.response) {
      console.error('📄 Response Status:', error.response.status);
      console.error('📄 Response Data:', error.response.data);
    }
  }
}

testSicknessSync(); 