// work4all-sync.js - Service für work4all API Integration
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

class Work4AllSyncService {
  constructor(db = null) {
    this.baseUrl = 'http://192.168.112.18:4713/api';
    this.token = null;
    this.db = db || new sqlite3.Database('./database.db');
    
    // Authentifizierungsdaten für work4all
    this.credentials = {
      username: "API Service",
      passwordHash: "3461E6540B1A3C3FBB46E56201CA0A21",
      application: "service.api"
    };
  }

  // work4all Token abrufen
  async authenticate() {
    try {
      console.log('🔐 Authentifizierung bei work4all...');
      
      const response = await axios.post(`${this.baseUrl}/Auth/login`, this.credentials, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        console.log('✅ work4all Authentifizierung erfolgreich');
        return true;
      } else {
        console.error('❌ Keine Token-Antwort erhalten');
        return false;
      }
    } catch (error) {
      console.error('❌ work4all Authentifizierung fehlgeschlagen:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      return false;
    }
  }

  // Allgemeine API-Request-Methode
  async makeApiRequest(method, endpoint, data = null) {
    try {
      if (!this.token) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
      }

      const config = {
        method: method.toLowerCase(),
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      };

      if (data && (method.toLowerCase() === 'post' || method.toLowerCase() === 'put')) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`❌ API Request Fehler (${method} ${endpoint}):`, error.message);
      
      // Token erneuern und nochmal versuchen bei 401
      if (error.response && error.response.status === 401) {
        console.log('🔄 Token abgelaufen, erneuere Authentifizierung...');
        this.token = null;
        const authSuccess = await this.authenticate();
        if (authSuccess) {
          return await this.makeApiRequest(method, endpoint, data);
        }
      }
      
      throw error;
    }
  }

  // Mitarbeiterdaten von work4all abrufen
  async fetchEmployeesFromWork4All() {
    try {
      if (!this.token) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
      }

      console.log('📥 Lade Mitarbeiterdaten von work4all...');
      
      const response = await axios.get(`${this.baseUrl}/work4all/benutzer`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log(`✅ ${response.data.length} Mitarbeiter von work4all erhalten`);
      return response.data;
    } catch (error) {
      console.error('❌ Fehler beim Abrufen der work4all Daten:', error.message);
      
      // Token erneuern und nochmal versuchen
      if (error.response && error.response.status === 401) {
        console.log('🔄 Token abgelaufen, erneuere Authentifizierung...');
        this.token = null;
        const authSuccess = await this.authenticate();
        if (authSuccess) {
          return await this.fetchEmployeesFromWork4All();
        }
      }
      
      throw error;
    }
  }

  // work4all Mitarbeiter/Ressource prüfen ob es ein Fahrzeug ist
  isVehicleResource(employee) {
    // userType ist in licenseInformation.userType verschachtelt
    const userType = employee.licenseInformation?.userType;
    
    // Nur userType "Ressource" behandeln, nicht "Benutzer" oder "Mitarbeiter"
    if (userType && userType.toLowerCase() === 'ressource') {
      const name = (employee.anzeigename || employee.name || '').toLowerCase();
      
      // Prüfen ob es PKW oder LKW enthält
      const vehicleKeywords = ['pkw', 'lkw', 'transporter', 'sprinter', 'van', 'auto', 'fahrzeug'];
      const roomKeywords = ['besprechung', 'raum', 'meetingraum', 'konferenz', 'büro'];
      
      console.log(`🔍 Prüfe Ressource: ${employee.anzeigename} (userType: ${userType})`);
      
      // Erst prüfen ob es explizit ein Besprechungsraum ist
      if (roomKeywords.some(keyword => name.includes(keyword))) {
        console.log(`   ⏭️ Ignoriert als Besprechungsraum`);
        return false;
      }
      
      // Dann prüfen ob es ein Fahrzeug ist
      if (vehicleKeywords.some(keyword => name.includes(keyword))) {
        console.log(`   ✅ Erkannt als Fahrzeug`);
        return true;
      }
      
      // Falls userType "Ressource" aber keine eindeutigen Keywords, trotzdem als Fahrzeug behandeln
      // (außer es ist explizit ein Raum)
      console.log(`   🤔 Unbekannte Ressource, behandle als Fahrzeug`);
      return true;
    }
    
    // Für normale Mitarbeiter oder andere userTypes
    return false;
  }

  // work4all Mitarbeiter/Ressource in lokales Fahrzeug-Format konvertieren
  convertWork4AllResourceToVehicle(work4allEmployee) {
    const name = work4allEmployee.anzeigename || work4allEmployee.name || 'Unbekanntes Fahrzeug';
    
    // Fahrzeugtyp aus Name ableiten
    const determineVehicleType = (name) => {
      const nameLower = name.toLowerCase();
      if (nameLower.includes('lkw')) return 'LKW';
      if (nameLower.includes('sprinter')) return 'Transporter';
      if (nameLower.includes('transporter') || nameLower.includes('van')) return 'Transporter';
      return 'PKW';
    };

    // Kennzeichen aus Name extrahieren (z.B. "PKW / BI FD 1111" -> "BI FD 1111")
    const extractLicensePlate = (name) => {
      const parts = name.split('/');
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
      return `W4A-${work4allEmployee.code || Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    };

    // Marke und Modell aus Name extrahieren
    const extractBrandModel = (name) => {
      const vehicleType = determineVehicleType(name);
      const nameParts = name.split('/')[0].trim();
      
      return {
        brand: vehicleType,
        model: nameParts.includes(vehicleType) ? nameParts.replace(vehicleType, '').trim() || 'Standard' : 'Standard'
      };
    };

    const { brand, model } = extractBrandModel(name);
    const licensePlate = extractLicensePlate(name);
    
    return {
      brand: brand,
      model: model,
      license_plate: licensePlate,
      vehicle_type: determineVehicleType(name),
      color: null, // Nicht in work4all verfügbar
      year: null,
      fuel_type: 'Unbekannt',
      seats: determineVehicleType(name) === 'LKW' ? 3 : 5,
      status: 'verfügbar',
      mileage: 0,
      notes: `Importiert aus work4all - ${name}`.trim(),
      work4all_resource_code: work4allEmployee.code,
      work4all_resource_name: work4allEmployee.anzeigename || work4allEmployee.name,
      work4all_last_update: work4allEmployee.updateTime || new Date().toISOString()
    };
  }

  // Fahrzeug in lokaler Datenbank speichern oder aktualisieren
  async syncVehicleToDatabase(vehicleData) {
    return new Promise((resolve, reject) => {
      // Prüfen ob Fahrzeug bereits existiert (anhand work4all_resource_code)
      this.db.get(
        'SELECT id FROM vehicles WHERE work4all_resource_code = ?',
        [vehicleData.work4all_resource_code],
        (err, row) => {
          if (err) {
            return reject(err);
          }

          if (row) {
            // Update bestehendes Fahrzeug
            this.db.run(
              `UPDATE vehicles SET 
               brand = ?, model = ?, license_plate = ?, vehicle_type = ?, 
               notes = ?, work4all_resource_name = ?, work4all_last_update = ?
               WHERE work4all_resource_code = ?`,
              [
                vehicleData.brand, vehicleData.model, vehicleData.license_plate,
                vehicleData.vehicle_type, vehicleData.notes, vehicleData.work4all_resource_name,
                vehicleData.work4all_last_update, vehicleData.work4all_resource_code
              ],
              function(updateErr) {
                if (updateErr) {
                  reject(updateErr);
                } else {
                  resolve({ action: 'updated', id: row.id, changes: this.changes });
                }
              }
            );
          } else {
            // Neues Fahrzeug erstellen
            this.db.run(
              `INSERT INTO vehicles 
               (brand, model, license_plate, vehicle_type, color, year, fuel_type, seats,
                status, mileage, notes, work4all_resource_code, work4all_resource_name, work4all_last_update) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                vehicleData.brand, vehicleData.model, vehicleData.license_plate, vehicleData.vehicle_type,
                vehicleData.color, vehicleData.year, vehicleData.fuel_type, vehicleData.seats,
                vehicleData.status, vehicleData.mileage, vehicleData.notes,
                vehicleData.work4all_resource_code, vehicleData.work4all_resource_name, vehicleData.work4all_last_update
              ],
              function(insertErr) {
                if (insertErr) {
                  reject(insertErr);
                } else {
                  resolve({ action: 'created', id: this.lastID });
                }
              }
            );
          }
        }
      );
    });
  }

  // Ressourcen-Synchronisation aus Mitarbeiterdaten durchführen
  async performResourceSync() {
    try {
      console.log('🚗 Starte work4all Fahrzeug-Synchronisation aus Mitarbeiterdaten...');
      
      // Verwende die bereits geladenen Mitarbeiterdaten
      const work4allEmployees = await this.fetchEmployeesFromWork4All();
      
      let vehiclesCreated = 0;
      let vehiclesUpdated = 0;
      let vehiclesIgnored = 0;
      let errors = 0;

      for (const work4allEmployee of work4allEmployees) {
        try {
          // Prüfen ob es ein Fahrzeug ist
          if (!this.isVehicleResource(work4allEmployee)) {
            vehiclesIgnored++;
            continue;
          }

          console.log(`🚗 Verarbeite Fahrzeug: ${work4allEmployee.anzeigename}`);
          
          const localVehicle = this.convertWork4AllResourceToVehicle(work4allEmployee);
          const result = await this.syncVehicleToDatabase(localVehicle);
          
          if (result.action === 'created') {
            vehiclesCreated++;
            console.log(`✅ Fahrzeug erstellt: ${localVehicle.brand} ${localVehicle.model} (${localVehicle.license_plate})`);
          } else if (result.action === 'updated' && result.changes > 0) {
            vehiclesUpdated++;
            console.log(`🔄 Fahrzeug aktualisiert: ${localVehicle.brand} ${localVehicle.model} (${localVehicle.license_plate})`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Fehler bei Fahrzeug ${work4allEmployee.anzeigename}:`, error.message);
        }
      }

      console.log('\n📊 Fahrzeug-Synchronisation abgeschlossen:');
      console.log(`✅ Fahrzeuge erstellt: ${vehiclesCreated}`);
      console.log(`🔄 Fahrzeuge aktualisiert: ${vehiclesUpdated}`);
      console.log(`⏭️ Nicht-Fahrzeuge ignoriert: ${vehiclesIgnored}`);
      console.log(`❌ Fehler: ${errors}`);
      
      return {
        success: true,
        total: work4allEmployees.length,
        vehiclesCreated,
        vehiclesUpdated,
        vehiclesIgnored,
        errors
      };

    } catch (error) {
      console.error('❌ Fahrzeug-Synchronisation fehlgeschlagen:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // work4all Daten in lokales Format konvertieren
  convertWork4AllToLocal(work4allEmployee) {

    // Abteilung zuordnen
    const mapDepartment = (abteilung) => {
      const departmentMap = {
        'Vertrieb / CAD': 'Vertrieb',
        'Geschäftsführung': 'Management', 
        'Planung / Vertrieb': 'Vertrieb',
        'IT': 'IT',
        'Marketing': 'Marketing',
        'Personal': 'HR',
        'Finanzen': 'Finanzen',
        'Buchhaltung': 'Buchhaltung',
        'Lager': 'Produktion',
        'Produktion': 'Produktion'
      };
      return departmentMap[abteilung] || abteilung || 'Sonstige';
    };

    // Arbeitsort basierend auf Funktion/Abteilung ermitteln
    const determineWorkLocation = (funktion, abteilung) => {
      if (funktion && funktion.toLowerCase().includes('außen')) return 'außendienst';
      if (abteilung && abteilung.toLowerCase().includes('lager')) return 'lager';
      if (abteilung && abteilung.toLowerCase().includes('produktion')) return 'lager';
      return 'büro';
    };

    // Geburtstag formatieren
    const formatBirthday = (geburtsdatum) => {
      if (!geburtsdatum || geburtsdatum === '0001-01-01T00:00:00') return null;
      try {
        return new Date(geburtsdatum).toISOString().split('T')[0];
      } catch {
        return null;
      }
    };

    // Bestimme Arbeitsort
    const workLocation = determineWorkLocation(work4allEmployee.funktion, work4allEmployee.abteilung);
    
    // Bestimme ob Mitarbeiter das digitale Brett nutzen soll
    // NUR LAGER-MITARBEITER nutzen das Brett standardmäßig
    const isActiveInternalEmployee = !work4allEmployee.ausgeschieden && 
                                   !work4allEmployee.extern && 
                                   work4allEmployee.licenseInformation?.userType !== 'ressource';
    
    // Brett nur für Lager-Mitarbeiter voreingestellt
    const usesBulletinBoard = isActiveInternalEmployee && workLocation === 'lager';

    return {
      // Basis-Informationen
      name: work4allEmployee.anzeigename || `${work4allEmployee.vorname} ${work4allEmployee.nachname}`,
      email: work4allEmployee.eMail || null,
      birthday: formatBirthday(work4allEmployee.geburtsdatum),
      
      // Arbeitsplatz-Informationen
      department: mapDepartment(work4allEmployee.abteilung),
      position_title: work4allEmployee.funktion || 'Mitarbeiter',
      phone: work4allEmployee.telefon || null,
      mobile: work4allEmployee.mobil || null,
      extension: work4allEmployee.zeichen || null, // Kürzel als Durchwahl
      
      // Status und Typen
      employee_type: work4allEmployee.extern ? 'extern' : 'intern',
      is_active_employee: !work4allEmployee.ausgeschieden,
      uses_bulletin_board: usesBulletinBoard, // NUR Lager-Mitarbeiter
      work_location: workLocation,
      employment_status: work4allEmployee.ausgeschieden ? 'gekündigt' : 'aktiv',
      
      // Berechtigungen (Standard-Werte, müssen manuell gesetzt werden)
      driving_license_classes: null, // Muss manuell gepflegt werden
      license_expires: null, // Muss manuell gepflegt werden
      can_drive_company_vehicles: false, // Muss manuell gesetzt werden
      has_key_access: false, // Sicherheitsrelevant, muss manuell gesetzt werden
      security_clearance_level: 1,
      
      // Metadaten
      hire_date: null, // Nicht in work4all API verfügbar
      work4all_code: work4allEmployee.code, // Für Synchronisation
      work4all_nummer: work4allEmployee.nummer,
      work4all_last_update: work4allEmployee.updateTime
    };
  }

  // Mitarbeiter in lokaler Datenbank speichern oder aktualisieren
  async syncEmployeeToDatabase(employeeData) {
    return new Promise((resolve, reject) => {
      // Prüfen ob Mitarbeiter bereits existiert (anhand work4all_code)
      this.db.get(
        'SELECT id FROM employees WHERE work4all_code = ?',
        [employeeData.work4all_code],
        (err, row) => {
          if (err) {
            return reject(err);
          }

          if (row) {
            // Update bestehender Mitarbeiter (ohne Brett/Fahren/Führerschein zu überschreiben)
            this.db.run(
              `UPDATE employees SET 
               name = ?, email = ?, birthday = ?, department = ?, position_title = ?, 
               phone = ?, mobile = ?, extension = ?, employee_type = ?, is_active_employee = ?,
               work_location = ?, employment_status = ?,
               work4all_nummer = ?, work4all_last_update = ?, updated_at = CURRENT_TIMESTAMP
               WHERE work4all_code = ?`,
              [
                employeeData.name, employeeData.email, employeeData.birthday,
                employeeData.department, employeeData.position_title, employeeData.phone,
                employeeData.mobile, employeeData.extension, employeeData.employee_type,
                employeeData.is_active_employee ? 1 : 0,
                employeeData.work_location, employeeData.employment_status,
                employeeData.work4all_nummer, employeeData.work4all_last_update,
                employeeData.work4all_code
              ],
              function(updateErr) {
                if (updateErr) {
                  reject(updateErr);
                } else {
                  resolve({ action: 'updated', id: row.id, changes: this.changes });
                }
              }
            );
          } else {
            // Neuer Mitarbeiter erstellen
            this.db.run(
              `INSERT INTO employees 
               (name, email, birthday, department, position_title, phone, mobile, extension,
                employee_type, is_active_employee, uses_bulletin_board, work_location,
                employment_status, driving_license_classes, license_expires, 
                can_drive_company_vehicles, has_key_access, security_clearance_level,
                work4all_code, work4all_nummer, work4all_last_update) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                employeeData.name, employeeData.email, employeeData.birthday,
                employeeData.department, employeeData.position_title, employeeData.phone,
                employeeData.mobile, employeeData.extension, employeeData.employee_type,
                employeeData.is_active_employee ? 1 : 0, employeeData.uses_bulletin_board ? 1 : 0,
                employeeData.work_location, employeeData.employment_status,
                employeeData.driving_license_classes, employeeData.license_expires,
                employeeData.can_drive_company_vehicles ? 1 : 0, employeeData.has_key_access ? 1 : 0,
                employeeData.security_clearance_level, employeeData.work4all_code,
                employeeData.work4all_nummer, employeeData.work4all_last_update
              ],
              function(insertErr) {
                if (insertErr) {
                  reject(insertErr);
                } else {
                  resolve({ action: 'created', id: this.lastID });
                }
              }
            );
          }
        }
      );
    });
  }

  // Vollständige Synchronisation durchführen
  async performFullSync() {
    try {
      console.log('🔄 Starte vollständige work4all Synchronisation...');
      
      // 1. Mitarbeiter synchronisieren
      const work4allEmployees = await this.fetchEmployeesFromWork4All();
      
      let empCreated = 0;
      let empUpdated = 0;
      let empErrors = 0;

      for (const work4allEmp of work4allEmployees) {
        try {
          // Nur echte Mitarbeiter, keine Ressourcen
          const userType = work4allEmp.licenseInformation?.userType;
          if (userType && userType.toLowerCase() === 'ressource') {
            continue; // Ressourcen werden separat als Fahrzeuge behandelt
          }

          const localEmployee = this.convertWork4AllToLocal(work4allEmp);
          const result = await this.syncEmployeeToDatabase(localEmployee);
          
          if (result.action === 'created') {
            empCreated++;
            console.log(`✅ Erstellt: ${localEmployee.name}`);
          } else if (result.action === 'updated' && result.changes > 0) {
            empUpdated++;
            console.log(`🔄 Aktualisiert: ${localEmployee.name}`);
          }
        } catch (error) {
          empErrors++;
          console.error(`❌ Fehler bei ${work4allEmp.anzeigename}:`, error.message);
        }
      }

      // 2. Ressourcen (Fahrzeuge) synchronisieren
      const resourceResult = await this.performResourceSync();

      // 3. Veranstaltungen synchronisieren
      const eventResult = await this.performEventSync();

      console.log('\n📊 Vollständige Synchronisation abgeschlossen:');
      console.log('\n👥 MITARBEITER:');
      console.log(`✅ Erstellt: ${empCreated} Mitarbeiter`);
      console.log(`🔄 Aktualisiert: ${empUpdated} Mitarbeiter`);
      console.log(`❌ Fehler: ${empErrors} Mitarbeiter`);
      
      console.log('\n🚗 FAHRZEUGE:');
      if (resourceResult.success) {
        console.log(`✅ Erstellt: ${resourceResult.vehiclesCreated} Fahrzeuge`);
        console.log(`🔄 Aktualisiert: ${resourceResult.vehiclesUpdated} Fahrzeuge`);
        console.log(`⏭️ Ignoriert: ${resourceResult.vehiclesIgnored} Nicht-Fahrzeuge`);
        console.log(`❌ Fehler: ${resourceResult.errors} Fahrzeuge`);
      } else {
        console.log(`❌ Fahrzeug-Sync fehlgeschlagen: ${resourceResult.error}`);
      }

      console.log('\n🎪 VERANSTALTUNGEN:');
      if (eventResult.success) {
        console.log(`✅ Erstellt: ${eventResult.eventsCreated} Veranstaltungen`);
        console.log(`🔄 Aktualisiert: ${eventResult.eventsUpdated} Veranstaltungen`);
        console.log(`⏭️ Ignoriert: ${eventResult.eventsIgnored} ohne Datum`);
        console.log(`❌ Fehler: ${eventResult.errors} Veranstaltungen`);
      } else {
        console.log(`❌ Veranstaltungs-Sync fehlgeschlagen: ${eventResult.error}`);
      }
      
      return {
        success: true,
        employees: {
          total: work4allEmployees.length,
          created: empCreated,
          updated: empUpdated,
          errors: empErrors
        },
        resources: resourceResult.success ? {
          total: resourceResult.total,
          vehiclesCreated: resourceResult.vehiclesCreated,
          vehiclesUpdated: resourceResult.vehiclesUpdated,
          vehiclesIgnored: resourceResult.vehiclesIgnored,
          errors: resourceResult.errors
        } : {
          error: resourceResult.error
        },
        events: eventResult.success ? {
          total: eventResult.total,
          eventsCreated: eventResult.eventsCreated,
          eventsUpdated: eventResult.eventsUpdated,
          eventsIgnored: eventResult.eventsIgnored,
          errors: eventResult.errors
        } : {
          error: eventResult.error
        }
      };

    } catch (error) {
      console.error('❌ Vollständige Synchronisation fehlgeschlagen:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Datenbank-Schema um work4all Felder erweitern
  async extendDatabaseSchema() {
    return new Promise((resolve, reject) => {
      console.log('🗄️ Erweitere Datenbank-Schema für work4all...');
      
      this.db.serialize(() => {
        // work4all spezifische Spalten für Mitarbeiter hinzufügen
        this.db.run(`ALTER TABLE employees ADD COLUMN work4all_code INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_code:', err.message);
          }
        });

        this.db.run(`ALTER TABLE employees ADD COLUMN work4all_nummer INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_nummer:', err.message);
          }
        });

        this.db.run(`ALTER TABLE employees ADD COLUMN work4all_last_update TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_last_update:', err.message);
          }
        });

        // work4all spezifische Spalten für Fahrzeuge hinzufügen
        this.db.run(`ALTER TABLE vehicles ADD COLUMN work4all_resource_code INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_resource_code:', err.message);
          }
        });

        this.db.run(`ALTER TABLE vehicles ADD COLUMN work4all_resource_name TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_resource_name:', err.message);
          }
        });

        this.db.run(`ALTER TABLE vehicles ADD COLUMN work4all_last_update TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_last_update:', err.message);
          }
        });

        // work4all spezifische Spalten für Trade Shows hinzufügen
        this.db.run(`ALTER TABLE tradeshows ADD COLUMN work4all_project_code INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_project_code:', err.message);
          }
        });

        this.db.run(`ALTER TABLE tradeshows ADD COLUMN work4all_project_number TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_project_number:', err.message);
          }
        });

        this.db.run(`ALTER TABLE tradeshows ADD COLUMN work4all_group_code INTEGER`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_group_code:', err.message);
          }
        });

        this.db.run(`ALTER TABLE tradeshows ADD COLUMN work4all_last_update TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.error('Fehler bei work4all_last_update:', err.message);
          }
        });

        // Indizes für bessere Performance erstellen
        this.db.run(`CREATE INDEX IF NOT EXISTS idx_work4all_emp_code ON employees(work4all_code)`, (err) => {
          if (err) {
            console.error('Fehler bei Employee Index:', err.message);
          }
        });

        this.db.run(`CREATE INDEX IF NOT EXISTS idx_work4all_resource_code ON vehicles(work4all_resource_code)`, (err) => {
          if (err) {
            console.error('Fehler bei Vehicle Index:', err.message);
          }
        });

        this.db.run(`CREATE INDEX IF NOT EXISTS idx_work4all_project_code ON tradeshows(work4all_project_code)`, (err) => {
          if (err) {
            console.error('Fehler bei TradeShow Index:', err.message);
          } else {
            console.log('✅ Datenbank-Schema für work4all erweitert (inkl. Veranstaltungen)');
          }
          resolve();
        });
      });
    });
  }

  // Automatische Synchronisation im Hintergrund
  startAutoSync(intervalMinutes = 60) {
    console.log(`⏰ Automatische Synchronisation alle ${intervalMinutes} Minuten gestartet`);
    
    // Erste Synchronisation sofort
    this.performFullSync();
    
    // Dann regelmäßig wiederholen
    setInterval(() => {
      console.log('⏰ Automatische work4all Synchronisation...');
      this.performFullSync();
    }, intervalMinutes * 60 * 1000);
  }

  // Connection schließen
  close() {
    if (this.db) {
      this.db.close();
    }
  }

  // work4all Projekt-Gruppen von work4all API abrufen
  async fetchProjectGroupsFromWork4All() {
    try {
      if (!this.token) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
      }

      const response = await axios.get(`${this.baseUrl}/Projekt/gruppen`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📊 ${response.data.length} Projektgruppen von work4all geladen`);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Laden der Projektgruppen:', error.message);
      throw error;
    }
  }

  // work4all Projekte einer bestimmten Gruppe abrufen (via POST mit grCode)
  async fetchProjectsFromGroup(grCode) {
    try {
      if (!this.token) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) throw new Error('Authentifizierung fehlgeschlagen');
      }

      const response = await axios.post(`${this.baseUrl}/Projekt/query`, {
        grCode: grCode  // Nur Projekte dieser Gruppe abrufen
      }, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📊 ${response.data.length} Projekte von Gruppe ${grCode} geladen`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Laden der Projekte von Gruppe ${grCode}:`, error.message);
      throw error;
    }
  }

  // Prüfe ob eine Projektgruppe eine echte Veranstaltungsgruppe ist
  isEventGroup(group) {
    const groupName = group.name.toLowerCase();
    
    // NUR Gruppen die EXAKT mit "veranstaltungen" beginnen
    // z.B. "Veranstaltungen", "Veranstaltungen 2024", "Veranstaltungen 2025" etc.
    // ABER NICHT "Kundenprojekte", "interne Projekte", etc.
    if (groupName.startsWith('veranstaltungen')) {
      console.log(`   ✅ Echte Veranstaltungsgruppe: ${group.name} (Code: ${group.code})`);
      return true;
    }
    
    console.log(`   ❌ Keine Veranstaltungsgruppe: ${group.name} (Code: ${group.code})`);
    return false;
  }

  // Prüfe ob ein work4all Projekt ein echtes Event/Veranstaltung ist
  isValidEvent(project) {
    const name = project.name.toLowerCase();
    const notiz = (project.notiz || '').toLowerCase();
    
    // UMFASSENDE AUSSCHLUSSLISTE für interne Projekte
    const exclusionPatterns = [
      // === LACKIERARBEITEN ALLER ART ===
      'lackierung',
      'lackier',
      'pulverbeschichtung',
      'galvanisierung',
      'eloxierung',
      'beschichtung',
      'oberflächenbehandlung',
      'anodisierung',
      
      // === INTERNE FERTIGUNG & PRODUKTION ===
      'anfertigung',
      'herstellung',
      'produktion',
      'fertigung',
      'bearbeitung',
      'überarbeitung',
      'reparatur',
      'instandsetzung',
      'wartung',
      'montage',
      'demontage',
      'umbau',
      
      // === TRANSPORT & LOGISTIK ===
      'transport',
      'auslieferung',
      'lieferung',
      'abhol',
      'versand',
      'umzug',
      'einlagerung',
      'lagerung',
      'materialeinlagerung',
      
      // === VERMIETUNG & DIENSTLEISTUNGEN ===
      'vermietung',
      'miete',
      'dienstleist',
      'service',
      'beratung',
      'schulung',
      'training',
      'workshop', // wenn nicht als Veranstaltung erkennbar
      
      // === BÜRO & VERWALTUNG ===
      'büro',
      'office',
      'verwaltung',
      'akten',
      'archiv',
      'dokumentation',
      'organisation',
      'besprechung',
      'meeting',
      'termin',
      
      // === IMMOBILIEN & FACILITY ===
      'immobilie',
      'gebäude',
      'räum',
      'umbau',
      'sanierung',
      'renovation',
      'facility',
      'reinigung',
      'sicherheit',
      
      // === IT & TECHNIK (außer Messen) ===
      'software',
      'hardware',
      'it-projekt',
      'system',
      'netzwerk',
      'server',
      'backup',
      'update',
      'upgrade',
      'installation',
      'konfiguration',
      
      // === SPEZIFISCHE BUSINESS BEGRIFFE ===
      'geschäfts',
      'vertrags',
      'lizenz',
      'rechts',
      'steuer',
      'buchhalt',
      'controlling',
      'finanzen',
      'budget',
      'kosten',
      'kalkulation',
      'angebot',
      'auftrag',
      'bestellung',
      'einkauf',
      'beschaffung',
      
      // === PERSONALWESEN ===
      'personal',
      'mitarbeiter',
      'bewerbung',
      'einstellung',
      'kündigung',
      'urlaub',
      'kranken',
      'gesundheit',
      'arbeitsschutz',
      
      // === BILDUNG (außer echten Bildungsmessen) ===
      'azubi',
      'ausbildung',
      'praktikum',
      'studium',
      'prüfung',
      'zertifikat',
      'qualifikation',
      
      // === MARKETING & WERBUNG (außer Messen) ===
      'werbe',
      'marketing',
      'promotion',
      'kampagne',
      'prospekt',
      'katalog',
      'broschüre',
      'flyer',
      'banner',
      'plakat',
      'display',
      'werbemittel'
    ];
    
    // Prüfe auf Ausschlussmuster
    for (const pattern of exclusionPatterns) {
      if (name.includes(pattern) || notiz.includes(pattern)) {
        console.log(`   ⏭️ Ignoriert (internes Projekt - ${pattern}): ${project.name}`);
        return false;
      }
    }
    
    // Aussteller-Projekte erkennen (enthalten "/" im Namen)
    if (name.includes('/')) {
      console.log(`   ⏭️ Ignoriert (Aussteller-Projekt): ${project.name}`);
      return false;
    }
    
    // Projekte ohne gültiges Datum
    const startDate = project.anfangDatum;
    const endDate = project.endeDatum;
    
    if (!startDate || startDate === '0001-01-01T00:00:00' || 
        !endDate || endDate === '0001-01-01T00:00:00') {
      console.log(`   ⏭️ Ignoriert (kein gültiges Datum): ${project.name}`);
      return false;
    }
    
    // Nur zukünftige oder sehr aktuelle Events (nicht älter als 2 Jahre)
    const start = new Date(startDate);
    const now = new Date();
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    
    if (start < twoYearsAgo) {
      console.log(`   ⏭️ Ignoriert (zu alte Veranstaltung): ${project.name}`);
      return false;
    }
    
    console.log(`   ✅ Gültiges Event: ${project.name}`);
    return true;
  }

  // work4all Projekt in lokales Trade Show Format konvertieren
  convertWork4AllProjectToTradeShow(work4allProject) {
    // Standort aus individualFieldData extrahieren (definitionCode: 59756772 = Standort)
    const getLocationFromFields = (fields) => {
      if (!fields || !Array.isArray(fields)) return 'Unbekannt';
      const locationField = fields.find(field => field.definitionCode === 59756772);
      return locationField?.value || 'Unbekannt';
    };

    // Beschreibung aus verschiedenen Feldern zusammenbauen
    const buildDescription = (project) => {
      let description = project.notiz || '';
      
      // Standort hinzufügen
      const location = getLocationFromFields(project.individualFieldData || []);
      if (location && location !== 'Unbekannt') {
        description += (description ? '\n' : '') + `Standort: ${location}`;
      }
      
      // Projekt-Nummer hinzufügen
      if (project.nummer) {
        description += (description ? '\n' : '') + `Projekt-Nr.: ${project.nummer}`;
      }
      
      // Projekt-Link hinzufügen
      if (project.projektLink0) {
        description += (description ? '\n' : '') + `Website: ${project.projektLink0}`;
      }
      
      return description || `Veranstaltung aus work4all Projekt ${project.name}`;
    };

    // Datum formatieren
    const formatDate = (dateString) => {
      if (!dateString || dateString === '0001-01-01T00:00:00') return null;
      try {
        return new Date(dateString).toISOString().split('T')[0];
      } catch {
        return null;
      }
    };

    const location = getLocationFromFields(work4allProject.individualFieldData || []);

    return {
      name: work4allProject.name || 'Unbekannte Veranstaltung',
      location: location,
      start_date: formatDate(work4allProject.anfangDatum),
      end_date: formatDate(work4allProject.endeDatum),
      description: buildDescription(work4allProject),
      work4all_project_code: work4allProject.code,
      work4all_project_number: work4allProject.nummer,
      work4all_group_code: work4allProject.grCode,
      work4all_last_update: work4allProject.updateTime || new Date().toISOString()
    };
  }

  // Trade Show in lokaler Datenbank speichern oder aktualisieren
  async syncTradeShowToDatabase(tradeShowData) {
    return new Promise((resolve, reject) => {
      // Prüfen ob Trade Show bereits existiert (anhand work4all_project_code)
      this.db.get(
        'SELECT id FROM tradeshows WHERE work4all_project_code = ?',
        [tradeShowData.work4all_project_code],
        (err, row) => {
          if (err) {
            return reject(err);
          }

          if (row) {
            // Update bestehende Trade Show
            this.db.run(
              `UPDATE tradeshows SET 
               name = ?, location = ?, start_date = ?, end_date = ?, description = ?,
               work4all_project_number = ?, work4all_group_code = ?, work4all_last_update = ?
               WHERE work4all_project_code = ?`,
              [
                tradeShowData.name, tradeShowData.location, tradeShowData.start_date,
                tradeShowData.end_date, tradeShowData.description, tradeShowData.work4all_project_number,
                tradeShowData.work4all_group_code, tradeShowData.work4all_last_update,
                tradeShowData.work4all_project_code
              ],
              function(updateErr) {
                if (updateErr) {
                  reject(updateErr);
                } else {
                  resolve({ action: 'updated', id: row.id, changes: this.changes });
                }
              }
            );
          } else {
            // Neue Trade Show erstellen
            this.db.run(
              `INSERT INTO tradeshows 
               (name, location, start_date, end_date, description, 
                work4all_project_code, work4all_project_number, work4all_group_code, work4all_last_update) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                tradeShowData.name, tradeShowData.location, tradeShowData.start_date,
                tradeShowData.end_date, tradeShowData.description, tradeShowData.work4all_project_code,
                tradeShowData.work4all_project_number, tradeShowData.work4all_group_code, tradeShowData.work4all_last_update
              ],
              function(insertErr) {
                if (insertErr) {
                  reject(insertErr);
                } else {
                  resolve({ action: 'created', id: this.lastID });
                }
              }
            );
          }
        }
      );
    });
  }

  // Veranstaltungen-Synchronisation durchführen
  async performEventSync() {
    try {
      console.log('🎪 Starte work4all Veranstaltungs-Synchronisation...');
      
      // 1. Projektgruppen laden
      const projectGroups = await this.fetchProjectGroupsFromWork4All();
      
      // 2. Nur Veranstaltungsgruppen filtern (Gruppen mit "Veranstaltung" im Namen)
      const eventGroups = projectGroups.filter(group => this.isEventGroup(group));
      
      console.log(`📊 ${eventGroups.length} echte Veranstaltungsgruppen gefunden von ${projectGroups.length} Gruppen`);
      eventGroups.forEach(group => console.log(`   📋 ${group.name} (Code: ${group.code})`));
      
      let eventsCreated = 0;
      let eventsUpdated = 0;
      let eventsIgnored = 0;
      let errors = 0;
      let totalProjectsProcessed = 0;

      // 3. Für jede Veranstaltungsgruppe separat die Projekte laden und verarbeiten
      for (const eventGroup of eventGroups) {
        try {
          console.log(`\n🔍 Verarbeite Veranstaltungsgruppe: ${eventGroup.name} (Code: ${eventGroup.code})`);
          
          // Projekte dieser Gruppe laden
          const groupProjects = await this.fetchProjectsFromGroup(eventGroup.code);
          totalProjectsProcessed += groupProjects.length;
          
          console.log(`   📦 ${groupProjects.length} Projekte in dieser Gruppe gefunden`);

          // Projekte der Gruppe verarbeiten
          for (const project of groupProjects) {
            try {
              // Nur Projekte mit gültigem Datum verarbeiten
              if (!this.isValidEvent(project)) {
                eventsIgnored++;
                console.log(`   ⏭️ Ignoriert (kein gültiges Event): ${project.name}`);
                continue;
              }

              console.log(`   🎪 Verarbeite Veranstaltung: ${project.name}`);
              
              const localTradeShow = this.convertWork4AllProjectToTradeShow(project);
              const result = await this.syncTradeShowToDatabase(localTradeShow);
              
              if (result.action === 'created') {
                eventsCreated++;
                console.log(`   ✅ Veranstaltung erstellt: ${localTradeShow.name} (${localTradeShow.start_date})`);
              } else if (result.action === 'updated' && result.changes > 0) {
                eventsUpdated++;
                console.log(`   🔄 Veranstaltung aktualisiert: ${localTradeShow.name}`);
              }
            } catch (error) {
              errors++;
              console.error(`   ❌ Fehler bei Projekt ${project.name}:`, error.message);
            }
          }
        } catch (error) {
          errors++;
          console.error(`❌ Fehler bei Gruppe ${eventGroup.name}:`, error.message);
        }
      }

      console.log('\n📊 Veranstaltungs-Synchronisation abgeschlossen:');
      console.log(`📊 Veranstaltungsgruppen verarbeitet: ${eventGroups.length}`);
      console.log(`📊 Gesamte Projekte verarbeitet: ${totalProjectsProcessed}`);
      console.log(`✅ Veranstaltungen erstellt: ${eventsCreated}`);
      console.log(`🔄 Veranstaltungen aktualisiert: ${eventsUpdated}`);
      console.log(`⏭️ Ignoriert (ungültige Projekte): ${eventsIgnored}`);
      console.log(`❌ Fehler: ${errors}`);
      
      return {
        success: true,
        total: totalProjectsProcessed,
        eventsCreated,
        eventsUpdated,
        eventsIgnored,
        errors
      };

    } catch (error) {
      console.error('❌ Veranstaltungs-Synchronisation fehlgeschlagen:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // NEUE Methode: Urlaub-Synchronisation
  async syncVacationData() {
    try {
      console.log('🏖️ Synchronisiere Urlaub-Daten von work4all...');
      
      // 1. Authentifizierung sicherstellen
      if (!this.token) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
      }
      
      // 2. Alle work4all Benutzer laden
      console.log('👥 Lade alle work4all Benutzer...');
      const work4allUsers = await this.makeApiRequest('GET', '/work4all/benutzer');
      console.log(`📋 ${work4allUsers.length} work4all Benutzer erhalten`);
      
      // 3. Alle Urlaubsdaten laden (ein API-Call für alle)
      console.log('🏖️ Lade alle Urlaubsdaten...');
      const vacationResponse = await this.makeApiRequest('POST', '/Urlaub/query', {});
      
      // Stelle sicher, dass wir ein Array haben - Urlaub-API gibt direktes Array zurück
      const allVacations = Array.isArray(vacationResponse) ? vacationResponse : 
                          vacationResponse.items ? vacationResponse.items : 
                          vacationResponse.values ? vacationResponse.values : [];
      
      console.log(`📅 ${allVacations.length} Urlaubseinträge erhalten`);
      
      // 4. Lokale Mitarbeiter mit work4all_code laden (OHNE "Sonstige")
      const localEmployees = await new Promise((resolve, reject) => {
        this.db.all(
          'SELECT id, name, work4all_code FROM employees WHERE work4all_code IS NOT NULL AND is_active_employee = 1 AND department != "Sonstige"',
          [],
          (err, rows) => err ? reject(err) : resolve(rows)
        );
      });
      
      console.log(`🔍 ${localEmployees.length} lokale Mitarbeiter mit work4all_code gefunden (ohne Sonstige)`);
      
      if (localEmployees.length === 0) {
        console.log('⚠️ Keine lokalen Mitarbeiter mit work4all_code - führen Sie zuerst eine Mitarbeiter-Synchronisation durch');
        return {
          success: false,
          message: 'Keine Mitarbeiter mit work4all_code gefunden'
        };
      }
      
      // 5. Heutiges Datum für Vergleich
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD Format
      console.log(`📅 Prüfe Urlaub für heutiges Datum: ${todayString}`);
      
      // 6. Filtere Urlaubseinträge für heute
      const todayVacations = allVacations.filter(vacation => {
        // WICHTIG: Direkte String-Extraktion um Zeitzone-Probleme zu vermeiden
        const vacationDateString = vacation.datum.split('T')[0]; // "2025-06-06T00:00:00" -> "2025-06-06"
        
        // Prüfe Datum
        const isToday = vacationDateString === todayString;
        
        // Prüfe ob Menge > 0 (Genehmigung wird NICHT mehr geprüft, da auch nicht-genehmigte Urlaube gültig sind)
        const hasValidAmount = vacation.menge && vacation.menge > 0;
        
        return isToday && hasValidAmount;
      });
      
      // 6b. Hilfsfunktionen für Datum-Prüfung
      const isWeekend = (date) => {
        const dayOfWeek = date.getDay(); // 0 = Sonntag, 6 = Samstag
        return dayOfWeek === 0 || dayOfWeek === 6;
      };
      
      const isGermanHoliday = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        const day = date.getDate();
        
        // Feste Feiertage
        const fixedHolidays = [
          { month: 1, day: 1 },   // Neujahr
          { month: 5, day: 1 },   // Tag der Arbeit
          { month: 10, day: 3 },  // Tag der Deutschen Einheit
          { month: 12, day: 25 }, // 1. Weihnachtsfeiertag
          { month: 12, day: 26 }  // 2. Weihnachtsfeiertag
        ];
        
        for (const holiday of fixedHolidays) {
          if (month === holiday.month && day === holiday.day) {
            return true;
          }
        }
        
        // Bewegliche Feiertage (Oster-abhängig) - vereinfachte Prüfung für häufige Feiertage
        // Hier könnte man eine vollständige Oster-Berechnung implementieren
        // Für jetzt prüfen wir nur die wichtigsten bekannten Daten
        const knownHolidays2025 = [
          '2025-04-18', // Karfreitag
          '2025-04-21', // Ostermontag
          '2025-05-29', // Christi Himmelfahrt
          '2025-06-09'  // Pfingstmontag
        ];
        
        const dateString = date.toISOString().split('T')[0];
        return knownHolidays2025.includes(dateString);
      };
      
      const isWorkingDay = (date) => {
        return !isWeekend(date) && !isGermanHoliday(date);
      };
      
      // 6c. Funktion: Zähle aufeinanderfolgende Urlaubstage ab heute und finde Enddatum (überspringt Wochenenden/Feiertage)
      const countConsecutiveVacationDays = (employeeCode) => {
        let count = 0;
        let currentDate = new Date(today);
        let lastVacationDate = null;
        
        while (count < 30) { // Max 30 Tage voraus prüfen
          const dateString = currentDate.toISOString().split('T')[0];
          
          // Prüfe ob aktuelles Datum ein Arbeitstag ist
          if (isWorkingDay(currentDate)) {
            // Nur an Arbeitstagen nach Urlaub suchen
            const hasVacationOnDate = allVacations.some(vacation => {
              const vacationDateString = vacation.datum.split('T')[0];
              return vacationDateString === dateString && 
                     vacation.benutzerCode == employeeCode && 
                     vacation.menge && vacation.menge > 0;
            });
            
            if (hasVacationOnDate) {
              count++;
              lastVacationDate = dateString; // Merke letztes Urlaubsdatum
            } else {
              // Kein Urlaub an diesem Arbeitstag - Kette unterbrochen
              break;
            }
          }
          // Wochenenden/Feiertage werden einfach übersprungen (count nicht erhöht)
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return { count, endDate: lastVacationDate };
      };
      
      console.log(`🏖️ ${todayVacations.length} work4all Urlaubseinträge für heute gefunden`);
      
      let currentVacations = 0;
      let processedEmployees = 0;
      let errors = 0;
      
      // 7. Für jeden lokalen Mitarbeiter prüfen
      for (const employee of localEmployees) {
        try {
          // Prüfe ob dieser Mitarbeiter heute im Urlaub ist
          const employeeVacation = todayVacations.find(vacation => vacation.benutzerCode == employee.work4all_code);
          
          if (employeeVacation) {
            // Mitarbeiter ist im Urlaub
            const vacationAmount = employeeVacation.menge;
            const vacationType = vacationAmount === 1.0 ? 'ganzer Tag' : vacationAmount === 0.5 ? 'halber Tag' : `${vacationAmount} Tage`;
            
            // Zähle aufeinanderfolgende Urlaubstage
            const vacationResult = countConsecutiveVacationDays(employee.work4all_code);
            const consecutiveDays = vacationResult.count;
            const endDate = vacationResult.endDate;
            
            // Formatiere Enddatum zu deutschem Format (DD-MM-YYYY)
            const formattedEndDate = endDate ? endDate.split('-').reverse().join('-') : null;
            const daysInfo = consecutiveDays > 1 ? ` (noch ${consecutiveDays - 1} weitere Werktage bis einschließlich ${formattedEndDate})` : '';
            
            console.log(`🏖️ URLAUB: ${employee.name} (${vacationType}${daysInfo})`);
            
            // Berechne Start- und Enddatum für den Urlaub
            const startDate = todayString;
            const endDateFormatted = endDate || startDate;
            
            // Speichere in employee_vacation Tabelle (lösche zuerst alte Einträge für diesen Mitarbeiter)
            await new Promise((resolve, reject) => {
              this.db.run(
                'DELETE FROM employee_vacation WHERE employee_id = ?',
                [employee.id],
                (err) => err ? reject(err) : resolve()
              );
            });
            
            // Bestimme Urlaubstyp basierend auf urlaubsArtCode (KORRIGIERT)
            const vacationTypeMapping = {
              0: 'Urlaub',
              132060795: 'Überstundenausgleich', // KORRIGIERT: war vorher 'Sonderurlaub'
              82343268: 'Freier Tag',
              25035878: 'Sonderurlaub', // KORRIGIERT: war vorher 'Überstundenausgleich'
              561036427: 'Elternzeit',
              1308322071: 'Krankheit',
              221180205: 'Fortbildung',
              1478672732: 'Betriebsausflug',
              64072822: 'Feiertag',
              56431314: 'Homeoffice'
            };
            
            const vacationTypeDescription = vacationTypeMapping[employeeVacation.urlaubsArtCode] || `Code ${employeeVacation.urlaubsArtCode}`;
            
            await new Promise((resolve, reject) => {
              this.db.run(
                `INSERT INTO employee_vacation 
                 (employee_id, employee_name, work4all_code, work4all_vacation_code, start_date, end_date, vacation_days, vacation_type, work4all_sync_date, vacation_art_code, vacation_art_description) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)`,
                [employee.id, employee.name, employee.work4all_code, employeeVacation.code, startDate, endDateFormatted, consecutiveDays, 'urlaub', employeeVacation.urlaubsArtCode, vacationTypeDescription],
                (err) => err ? reject(err) : resolve()
              );
            });
            
            // Setze employment_status auf 'urlaub'
            await new Promise((resolve, reject) => {
              this.db.run(
                'UPDATE employees SET employment_status = ? WHERE id = ?',
                ['urlaub', employee.id],
                (err) => err ? reject(err) : resolve()
              );
            });
            
            currentVacations++;
          } else {
            // Mitarbeiter ist nicht im Urlaub - lösche aus Urlaubstabelle und setze Status zurück
            await new Promise((resolve, reject) => {
              this.db.run(
                'DELETE FROM employee_vacation WHERE employee_id = ? AND start_date <= ? AND end_date >= ?',
                [employee.id, todayString, todayString],
                (err) => err ? reject(err) : resolve()
              );
            });
            
            await new Promise((resolve, reject) => {
              this.db.run(
                'UPDATE employees SET employment_status = ? WHERE id = ? AND employment_status = ?',
                ['aktiv', employee.id, 'urlaub'],
                (err) => err ? reject(err) : resolve()
              );
            });
          }
          
          processedEmployees++;
          
        } catch (empError) {
          errors++;
          console.error(`❌ Fehler bei Mitarbeiter ${employee.name}:`, empError.message);
        }
      }
      
      console.log('\n📊 Urlaub-Synchronisation abgeschlossen:');
      console.log(`👥 Lokale Mitarbeiter verarbeitet: ${processedEmployees}/${localEmployees.length}`);
      console.log(`🏖️ Heute im Urlaub: ${currentVacations}`);
      console.log(`📅 work4all Urlaubseinträge gesamt: ${allVacations.length}`);
      console.log(`❌ Fehler: ${errors}`);
      
      return {
        success: true,
        processedEmployees,
        currentVacations,
        totalVacationDays: allVacations.length,
        errors,
        message: `${currentVacations} Mitarbeiter sind heute im Urlaub`
      };
      
    } catch (error) {
      console.error('❌ Fehler bei Urlaub-Synchronisation:', error);
      throw error;
    }
  }

  // NEUE Methode: Krankheits-Synchronisation
  async syncSicknessData() {
    try {
      console.log('🤒 Synchronisiere Krankheits-Daten von work4all...');
      
      // 1. Authentifizierung sicherstellen
      if (!this.token) {
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
      }
      
      // 2. Alle work4all Benutzer laden
      console.log('👥 Lade alle work4all Benutzer...');
      const work4allUsers = await this.makeApiRequest('GET', '/work4all/benutzer');
      console.log(`📋 ${work4allUsers.length} work4all Benutzer erhalten`);
      
      // 3. Alle Krankheitsdaten laden (ein API-Call für alle)
      console.log('🤒 Lade alle Krankheitsdaten...');
      const sicknessResponse = await this.makeApiRequest('POST', '/Krankheit/query', {});
      
      // Stelle sicher, dass wir ein Array haben - Krankheit-API gibt direktes Array zurück
      const allSickness = Array.isArray(sicknessResponse) ? sicknessResponse : 
                         sicknessResponse.items ? sicknessResponse.items : 
                         sicknessResponse.values ? sicknessResponse.values : [];
      
      console.log(`📅 ${allSickness.length} Krankheitseinträge erhalten`);
      
      // 4. Lokale Mitarbeiter mit work4all_code laden (OHNE "Sonstige")
      const localEmployees = await new Promise((resolve, reject) => {
        this.db.all(
          'SELECT id, name, work4all_code FROM employees WHERE work4all_code IS NOT NULL AND is_active_employee = 1 AND department != "Sonstige"',
          [],
          (err, rows) => err ? reject(err) : resolve(rows)
        );
      });
      
      console.log(`🔍 ${localEmployees.length} lokale Mitarbeiter mit work4all_code gefunden (ohne Sonstige)`);
      
      if (localEmployees.length === 0) {
        console.log('⚠️ Keine lokalen Mitarbeiter mit work4all_code - führen Sie zuerst eine Mitarbeiter-Synchronisation durch');
        return {
          success: false,
          message: 'Keine Mitarbeiter mit work4all_code gefunden'
        };
      }
      
      // 5. Heutiges Datum für Vergleich
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD Format
      console.log(`📅 Prüfe Krankheit für heutiges Datum: ${todayString}`);
      
      // 6. Filtere Krankheitseinträge für heute
      const todaySickness = allSickness.filter(sickness => {
        // WICHTIG: Direkte String-Extraktion um Zeitzone-Probleme zu vermeiden
        const sicknessDateString = sickness.datum.split('T')[0]; // "2025-06-06T00:00:00" -> "2025-06-06"
        
        // Prüfe Datum
        const isToday = sicknessDateString === todayString;
        
        // Prüfe ob Menge > 0 (keine Genehmigung nötig bei Krankheit)
        const hasValidAmount = sickness.menge && sickness.menge > 0;
        
        return isToday && hasValidAmount;
      });
      
      // 6b. Hilfsfunktionen für Datum-Prüfung (wiederverwendet)
      const isWeekend = (date) => {
        const dayOfWeek = date.getDay(); // 0 = Sonntag, 6 = Samstag
        return dayOfWeek === 0 || dayOfWeek === 6;
      };
      
      const isGermanHoliday = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JavaScript months are 0-indexed
        const day = date.getDate();
        
        // Feste Feiertage
        const fixedHolidays = [
          { month: 1, day: 1 },   // Neujahr
          { month: 5, day: 1 },   // Tag der Arbeit
          { month: 10, day: 3 },  // Tag der Deutschen Einheit
          { month: 12, day: 25 }, // 1. Weihnachtsfeiertag
          { month: 12, day: 26 }  // 2. Weihnachtsfeiertag
        ];
        
        for (const holiday of fixedHolidays) {
          if (month === holiday.month && day === holiday.day) {
            return true;
          }
        }
        
        // Bewegliche Feiertage (Oster-abhängig) - vereinfachte Prüfung für häufige Feiertage
        // Hier könnte man eine vollständige Oster-Berechnung implementieren
        // Für jetzt prüfen wir nur die wichtigsten bekannten Daten
        const knownHolidays2025 = [
          '2025-04-18', // Karfreitag
          '2025-04-21', // Ostermontag
          '2025-05-29', // Christi Himmelfahrt
          '2025-06-09'  // Pfingstmontag
        ];
        
        const dateString = date.toISOString().split('T')[0];
        return knownHolidays2025.includes(dateString);
      };
      
      const isWorkingDay = (date) => {
        return !isWeekend(date) && !isGermanHoliday(date);
      };
      
      // 6c. Funktion: Zähle aufeinanderfolgende Krankheitstage ab heute und finde Enddatum (überspringt Wochenenden/Feiertage)
      const countConsecutiveSicknessDays = (employeeCode) => {
        let count = 0;
        let currentDate = new Date(today);
        let lastSicknessDate = null;
        
        while (count < 30) { // Max 30 Tage voraus prüfen
          const dateString = currentDate.toISOString().split('T')[0];
          
          // Prüfe ob aktuelles Datum ein Arbeitstag ist
          if (isWorkingDay(currentDate)) {
            // Nur an Arbeitstagen nach Krankheit suchen
            const hasSicknessOnDate = allSickness.some(sickness => {
              const sicknessDateString = sickness.datum.split('T')[0];
              return sicknessDateString === dateString && 
                     sickness.benutzerCode == employeeCode && 
                     sickness.menge && sickness.menge > 0;
            });
            
            if (hasSicknessOnDate) {
              count++;
              lastSicknessDate = dateString; // Merke letztes Krankheitsdatum
            } else {
              // Keine Krankheit an diesem Arbeitstag - Kette unterbrochen
              break;
            }
          }
          // Wochenenden/Feiertage werden einfach übersprungen (count nicht erhöht)
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return { count, endDate: lastSicknessDate };
      };
      
      console.log(`🤒 ${todaySickness.length} work4all Krankheitseinträge für heute gefunden`);
      
      let currentSickness = 0;
      let processedEmployees = 0;
      let errors = 0;
      
      // 7. Für jeden lokalen Mitarbeiter prüfen
      for (const employee of localEmployees) {
        try {
          // Prüfe ob dieser Mitarbeiter heute krank ist
          const employeeSickness = todaySickness.find(sickness => sickness.benutzerCode == employee.work4all_code);
          
          if (employeeSickness) {
            // Mitarbeiter ist krank
            const sicknessAmount = employeeSickness.menge;
            const sicknessType = sicknessAmount === 1.0 ? 'ganzer Tag' : sicknessAmount === 0.5 ? 'halber Tag' : `${sicknessAmount} Tage`;
            
            // Zähle aufeinanderfolgende Krankheitstage
            const sicknessResult = countConsecutiveSicknessDays(employee.work4all_code);
            const consecutiveDays = sicknessResult.count;
            const endDate = sicknessResult.endDate;
            
            // Formatiere Enddatum zu deutschem Format (DD-MM-YYYY)
            const formattedEndDate = endDate ? endDate.split('-').reverse().join('-') : null;
            const daysInfo = consecutiveDays > 1 ? ` (noch ${consecutiveDays - 1} weitere Werktage bis einschließlich ${formattedEndDate})` : '';
            
            console.log(`🤒 KRANK: ${employee.name} (${sicknessType}${daysInfo})`);
            
            // Berechne Start- und Enddatum für die Krankheit
            const startDate = todayString;
            const endDateFormatted = endDate || startDate;
            
            // Speichere in employee_sickness Tabelle (lösche zuerst alte Einträge für diesen Mitarbeiter)
            await new Promise((resolve, reject) => {
              this.db.run(
                'DELETE FROM employee_sickness WHERE employee_id = ?',
                [employee.id],
                (err) => err ? reject(err) : resolve()
              );
            });
            
            await new Promise((resolve, reject) => {
              this.db.run(
                `INSERT INTO employee_sickness 
                 (employee_id, employee_name, work4all_code, work4all_sickness_code, start_date, end_date, sickness_days, sickness_type, work4all_sync_date) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
                [employee.id, employee.name, employee.work4all_code, employeeSickness.code, startDate, endDateFormatted, consecutiveDays, 'krankheit'],
                (err) => err ? reject(err) : resolve()
              );
            });
            
            // Setze employment_status auf 'krank' 
            await new Promise((resolve, reject) => {
              this.db.run(
                'UPDATE employees SET employment_status = ? WHERE id = ?',
                ['krank', employee.id],
                (err) => err ? reject(err) : resolve()
              );
            });
            
            currentSickness++;
          } else {
            // Mitarbeiter ist nicht krank - lösche aus Krankheitstabelle und setze Status zurück
            await new Promise((resolve, reject) => {
              this.db.run(
                'DELETE FROM employee_sickness WHERE employee_id = ? AND start_date <= ? AND end_date >= ?',
                [employee.id, todayString, todayString],
                (err) => err ? reject(err) : resolve()
              );
            });
            
            await new Promise((resolve, reject) => {
              this.db.run(
                'UPDATE employees SET employment_status = ? WHERE id = ? AND employment_status = ?',
                ['aktiv', employee.id, 'krank'],
                (err) => err ? reject(err) : resolve()
              );
            });
          }
          
          processedEmployees++;
          
        } catch (empError) {
          errors++;
          console.error(`❌ Fehler bei Mitarbeiter ${employee.name}:`, empError.message);
        }
      }
      
      console.log('\n📊 Krankheits-Synchronisation abgeschlossen:');
      console.log(`👥 Lokale Mitarbeiter verarbeitet: ${processedEmployees}/${localEmployees.length}`);
      console.log(`🤒 Heute krank: ${currentSickness}`);
      console.log(`📅 work4all Krankheitseinträge gesamt: ${allSickness.length}`);
      console.log(`❌ Fehler: ${errors}`);
      
      return {
        success: true,
        processedEmployees,
        currentSickness,
        totalSicknessDays: allSickness.length,
        errors,
        message: `${currentSickness} Mitarbeiter sind heute krank`
      };
      
    } catch (error) {
      console.error('❌ Fehler bei Krankheits-Synchronisation:', error);
      throw error;
    }
  }
}

module.exports = Work4AllSyncService; 