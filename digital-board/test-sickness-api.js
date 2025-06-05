const axios = require('axios');

console.log('🤒 Teste work4all Krankheits-API...');

async function testSicknessAPI() {
  try {
    // 1. Authentifizierung
    console.log('🔐 Authentifiziere bei work4all...');
    const authResponse = await axios.post('http://192.168.112.18:4713/api/auth/login', {
      benutzername: 'sander.kesting@kesting-online.de',
      passwort: 'Kesting2024!'
    });
    
    const token = authResponse.data.token;
    console.log('✅ Authentifizierung erfolgreich');
    
    // 2. Krankheitsdaten abrufen
    console.log('🤒 Lade Krankheitsdaten...');
    const sicknessResponse = await axios.post('http://192.168.112.18:4713/api/Krankheit/query', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const allSickness = sicknessResponse.data;
    console.log(`📅 ${allSickness.length} Krankheitseinträge erhalten`);
    
    // 3. Heutiges Datum
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    console.log(`📅 Heutiges Datum: ${todayString}`);
    
    // 4. Filtere für heute
    const todaySickness = allSickness.filter(sickness => {
      const sicknessDateString = sickness.datum.split('T')[0];
      const isToday = sicknessDateString === todayString;
      const hasValidAmount = sickness.menge && sickness.menge > 0;
      return isToday && hasValidAmount;
    });
    
    console.log(`🤒 ${todaySickness.length} Krankheitseinträge für heute:`);
    
    if (todaySickness.length > 0) {
      todaySickness.forEach(sickness => {
        console.log(`   - BenutzerCode: ${sickness.benutzerCode}, Menge: ${sickness.menge}, Datum: ${sickness.datum}`);
      });
    } else {
      console.log('   Niemand ist heute krank');
    }
    
    // 5. Analysiere alle Daten
    console.log('\n📊 Krankheits-Analyse:');
    
    // Gruppiere nach BenutzerCode
    const sicknessGrouped = {};
    allSickness.forEach(sickness => {
      if (!sicknessGrouped[sickness.benutzerCode]) {
        sicknessGrouped[sickness.benutzerCode] = [];
      }
      sicknessGrouped[sickness.benutzerCode].push(sickness);
    });
    
    console.log(`👥 ${Object.keys(sicknessGrouped).length} verschiedene Personen haben Krankheitseinträge`);
    
    // Zeige die ersten 5 Personen mit Krankheitseinträgen
    const userCodes = Object.keys(sicknessGrouped).slice(0, 5);
    userCodes.forEach(userCode => {
      const entries = sicknessGrouped[userCode];
      console.log(`   BenutzerCode ${userCode}: ${entries.length} Einträge`);
      
      // Zeige die letzten 3 Einträge
      const recentEntries = entries.slice(-3);
      recentEntries.forEach(entry => {
        const dateString = entry.datum.split('T')[0];
        console.log(`     - ${dateString}: ${entry.menge} Tage`);
      });
    });
    
    // 6. Prüfe auf aufeinanderfolgende Tage
    console.log('\n🔍 Prüfe auf aufeinanderfolgende Krankheitstage...');
    
    const checkConsecutiveDays = (userCode) => {
      const entries = sicknessGrouped[userCode] || [];
      const dates = entries
        .filter(e => e.menge > 0)
        .map(e => e.datum.split('T')[0])
        .sort();
      
      let consecutiveGroups = [];
      let currentGroup = [];
      
      dates.forEach((date, index) => {
        if (index === 0) {
          currentGroup = [date];
        } else {
          const prevDate = new Date(dates[index - 1]);
          const currentDate = new Date(date);
          const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24);
          
          if (dayDiff === 1) {
            currentGroup.push(date);
          } else {
            if (currentGroup.length > 1) {
              consecutiveGroups.push([...currentGroup]);
            }
            currentGroup = [date];
          }
        }
      });
      
      if (currentGroup.length > 1) {
        consecutiveGroups.push(currentGroup);
      }
      
      return consecutiveGroups;
    };
    
    // Teste mit den ersten 3 BenutzerCodes
    userCodes.slice(0, 3).forEach(userCode => {
      const consecutiveGroups = checkConsecutiveDays(userCode);
      if (consecutiveGroups.length > 0) {
        console.log(`   BenutzerCode ${userCode}:`);
        consecutiveGroups.forEach((group, index) => {
          console.log(`     Gruppe ${index + 1}: ${group[0]} bis ${group[group.length - 1]} (${group.length} Tage)`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Fehler beim Testen der Krankheits-API:', error.message);
    if (error.response) {
      console.error('📄 Response Status:', error.response.status);
      console.error('📄 Response Data:', error.response.data);
    }
  }
}

testSicknessAPI(); 