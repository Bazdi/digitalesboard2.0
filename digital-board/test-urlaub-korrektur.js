const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

async function testUrlaubKorrektur() {
    console.log('🔧 Test: Urlaubstyp-Korrektur');
    
    const data = JSON.parse(fs.readFileSync('urlaub-full-debug.json', 'utf8'));
    const employees = data.employees;
    const urlaub = data.urlaub;
    
    console.log(`👥 ${employees.length} Mitarbeiter geladen`);
    console.log(`📅 ${urlaub.length} Urlaubseinträge geladen`);
    
    // Korrigiertes Mapping
    const vacationTypeMapping = {
        0: 'Urlaub',
        132060795: 'Überstundenausgleich', // KORRIGIERT
        82343268: 'Freier Tag',
        25035878: 'Sonderurlaub', // KORRIGIERT  
        561036427: 'Elternzeit',
        1308322071: 'Krankheit',
        221180205: 'Fortbildung',
        1478672732: 'Betriebsausflug',
        64072822: 'Feiertag',
        56431314: 'Homeoffice'
    };
    
    // Finde Urlaubseinträge für 2025-06-06
    const todayVacations = urlaub.filter(u => {
        const vonDate = new Date(u.von);
        const bisDate = new Date(u.bis);
        const today = new Date('2025-06-06');
        return vonDate <= today && bisDate >= today;
    });
    
    console.log(`\n🏖️ ${todayVacations.length} Urlaubseinträge für 2025-06-06 gefunden`);
    
    // Gruppiere nach Urlaubstyp
    const vacationsByType = {};
    
    todayVacations.forEach(vacation => {
        const employee = employees.find(e => e.mitarbeiterCode === vacation.mitarbeiterCode);
        if (!employee) return;
        
        const code = vacation.urlaubsArtCode;
        const type = vacationTypeMapping[code] || `Unbekannt (${code})`;
        
        if (!vacationsByType[type]) {
            vacationsByType[type] = [];
        }
        
        vacationsByType[type].push({
            name: `${employee.vorname} ${employee.nachname}`,
            code: code,
            von: vacation.von,
            bis: vacation.bis
        });
    });
    
    // Ausgabe der Gruppierung
    console.log('\n📊 Urlaubstypen (KORRIGIERT):');
    Object.keys(vacationsByType).sort().forEach(type => {
        const employees = vacationsByType[type];
        console.log(`\n${getEmoji(type)} ${type} (${employees.length}):`);
        employees.forEach(emp => {
            console.log(`👤 ${emp.name} - Code: ${emp.code}`);
        });
    });
    
    // Spezielle Überprüfung der korrigierten Zuordnungen
    console.log('\n🔍 Überprüfung der Korrekturen:');
    const armin = todayVacations.find(v => {
        const emp = employees.find(e => e.mitarbeiterCode === v.mitarbeiterCode);
        return emp && emp.nachname === 'Hollensteiner';
    });
    if (armin) {
        const emp = employees.find(e => e.mitarbeiterCode === armin.mitarbeiterCode);
        console.log(`✅ Armin Hollensteiner: Code ${armin.urlaubsArtCode} = ${vacationTypeMapping[armin.urlaubsArtCode]}`);
    }
    
    const bjorn = todayVacations.find(v => {
        const emp = employees.find(e => e.mitarbeiterCode === v.mitarbeiterCode);
        return emp && emp.nachname === 'Meise';
    });
    if (bjorn) {
        const emp = employees.find(e => e.mitarbeiterCode === bjorn.mitarbeiterCode);
        console.log(`✅ Björn Meise: Code ${bjorn.urlaubsArtCode} = ${vacationTypeMapping[bjorn.urlaubsArtCode]}`);
    }
}

function getEmoji(type) {
    const emojiMap = {
        'Elternzeit': '👶',
        'Freier Tag': '🌟',
        'Sonderurlaub': '🎯',
        'Urlaub': '🏖️',
        'Überstundenausgleich': '⏰'
    };
    return emojiMap[type] || '❓';
}

testUrlaubKorrektur().catch(console.error); 