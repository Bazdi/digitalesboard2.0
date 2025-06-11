// client/src/pages/VehicleManagement.js - VERBESSERTE VERSION mit Mitarbeiter-Dropdown
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import VehicleCard from '../components/VehicleCard';
import BookingCalendar from '../components/BookingCalendar';
import axios from 'axios';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';

const VehicleManagement = () => {
  const { isMaintenanceMode, MaintenanceScreen } = useMaintenanceMode();
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const [vehicleForm, setVehicleForm] = useState({
    brand: '',
    model: '',
    license_plate: '',
    vehicle_type: 'PKW',
    color: '',
    year: new Date().getFullYear(),
    fuel_type: 'Benzin',
    seats: 5,
    mileage: 0,
    image: null,
    notes: ''
  });

  const [bookingForm, setBookingForm] = useState({
    vehicle_id: '',
    employee_id: '', // NEU: Employee ID für bessere Verknüpfung
    employee_name: '', // Für Anzeige
    purpose: '',
    start_datetime: '',
    end_datetime: '',
    notes: ''
  });

  const [stats, setStats] = useState({
    total_vehicles: 0,
    verfügbar: 0,
    unterwegs: 0,
    wartung: 0,
    aktive_buchungen: 0
  });

  const vehicleTypes = ['PKW', 'Transporter', 'LKW', 'Anhänger', 'Sonstiges'];
  const fuelTypes = ['Benzin', 'Diesel', 'Elektro', 'Hybrid', 'Gas'];
  const statusColors = {
    verfügbar: '#27ae60',
    unterwegs: '#e74c3c', 
    wartung: '#f39c12',
    defekt: '#8e44ad'
  };

  useEffect(() => {
    fetchData();
    
    // Setze Standard-Zeiten für Buchungsformular
    if (!bookingForm.start_datetime) {
      setBookingForm(prev => ({
        ...prev,
        start_datetime: getDefaultStartTime(),
        end_datetime: getDefaultEndTime()
      }));
    }
  }, []);

  const fetchData = async () => {
    console.log('🔄 Lade Fahrzeug-Daten...');
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token vorhanden:', !!token);
      
      if (!token) {
        console.error('❌ Kein Token gefunden');
        setLoading(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [vehiclesRes, bookingsRes, employeesRes, statsRes] = await Promise.all([
        axios.get('/api/vehicles', config).catch(err => {
          console.error('❌ Vehicles laden fehlgeschlagen:', err);
          return { data: [] };
        }),
        axios.get('/api/vehicle-bookings', config).catch(err => {
          console.error('❌ Bookings laden fehlgeschlagen:', err);
          return { data: [] };
        }),
        axios.get('/api/employees', config).catch(err => {
          console.error('❌ Employees laden fehlgeschlagen:', err);
          return { data: [] };
        }),
        axios.get('/api/vehicles/stats', config).catch(err => {
          console.error('❌ Stats laden fehlgeschlagen:', err);
          return { data: { total_vehicles: 0, verfügbar: 0, unterwegs: 0, wartung: 0, aktive_buchungen: 0 } };
        })
      ]);

      console.log('✅ Daten geladen:', {
        vehicles: vehiclesRes.data.length,
        bookings: bookingsRes.data.length,
        employees: employeesRes.data.length,
        stats: statsRes.data
      });

      setVehicles(vehiclesRes.data);
      setBookings(bookingsRes.data);
      setEmployees(employeesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('💥 Globaler Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  // Wartungsmodus-Check für alle Benutzer
  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚗 Vehicle Submit gestartet');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Nicht angemeldet! Bitte neu einloggen.');
        return;
      }

      const formData = new FormData();
      
      Object.keys(vehicleForm).forEach(key => {
        if (vehicleForm[key] !== null && vehicleForm[key] !== '') {
          formData.append(key, vehicleForm[key]);
        }
      });

      const config = {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      };

      if (editingVehicle) {
        await axios.put(`/api/vehicles/${editingVehicle.id}`, formData, config);
        console.log('✅ Vehicle erfolgreich aktualisiert');
      } else {
        const response = await axios.post('/api/vehicles', formData, config);
        console.log('✅ Vehicle erfolgreich erstellt:', response.data);
      }

      resetVehicleForm();
      fetchData();
    } catch (error) {
      console.error('❌ Vehicle Submit Fehler:', error);
      
      if (error.response?.status === 403) {
        alert('Berechtigung fehlt! Bitte neu einloggen.');
      } else if (error.response?.status === 401) {
        alert('Session abgelaufen! Bitte neu einloggen.');
      } else {
        const errorMsg = error.response?.data?.error || error.message;
        alert('Fehler beim Speichern des Fahrzeugs: ' + errorMsg);
      }
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      // Validierung
      if (!bookingForm.employee_id && !bookingForm.employee_name) {
        alert('Bitte wählen Sie einen Mitarbeiter aus oder geben Sie einen Namen ein.');
        return;
      }
      
      if (!bookingForm.vehicle_id) {
        alert('Bitte wählen Sie ein Fahrzeug aus.');
        return;
      }

      // Verbesserte Zeitvalidierung
      if (!bookingForm.start_datetime || !bookingForm.end_datetime) {
        alert('Bitte geben Sie Start- und Endzeit an.');
        return;
      }

      const startTime = new Date(bookingForm.start_datetime);
      const endTime = new Date(bookingForm.end_datetime);
      
      // Prüfe auf ungültige Daten
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        alert('Ungültige Datums-/Uhrzeitangaben. Bitte überprüfen Sie Ihre Eingaben.');
        return;
      }
      
      if (startTime >= endTime) {
        alert('Das Enddatum muss nach dem Startdatum liegen.');
        return;
      }
      
      if (startTime < new Date()) {
        alert('Die Buchung kann nicht in der Vergangenheit liegen.');
        return;
      }

      const bookingData = {
        ...bookingForm,
        employee_id: bookingForm.employee_id || null,
        employee_name: bookingForm.employee_name || getEmployeeName(bookingForm.employee_id)
      };

      await axios.post('/api/vehicle-bookings', bookingData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Buchung erfolgreich erstellt!');
      resetBookingForm();
      fetchData();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.error);
      } else {
        alert('Fehler beim Erstellen der Buchung');
      }
    }
  };

  const handleVehicleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      brand: vehicle.brand,
      model: vehicle.model,
      license_plate: vehicle.license_plate,
      vehicle_type: vehicle.vehicle_type,
      color: vehicle.color || '',
      year: vehicle.year || new Date().getFullYear(),
      fuel_type: vehicle.fuel_type || 'Benzin',
      seats: vehicle.seats || 5,
      mileage: vehicle.mileage || 0,
      image: null,
      notes: vehicle.notes || ''
    });
    setPreviewImage(vehicle.image ? `/uploads/${vehicle.image}` : null);
    setShowVehicleForm(true);
  };

  const handleVehicleDelete = async (id) => {
    if (!window.confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/vehicles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      if (error.response?.status === 400) {
        alert(error.response.data.error);
      } else {
        alert('Fehler beim Löschen des Fahrzeugs');
      }
    }
  };

  const handleVehicleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      setVehicleForm(prev => ({...prev, image: file}));
      
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setVehicleForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'employee_id') {
      // Wenn ein Mitarbeiter ausgewählt wird, setze auch den Namen
      const selectedEmployee = employees.find(emp => emp.id.toString() === value);
      setBookingForm(prev => ({
        ...prev,
        employee_id: value,
        employee_name: selectedEmployee ? selectedEmployee.name : ''
      }));
    } else if (name === 'employee_name') {
      // Wenn der Name manuell eingegeben wird, setze employee_id zurück
      setBookingForm(prev => ({
        ...prev,
        employee_id: '',
        employee_name: value
      }));
    } else {
      setBookingForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      brand: '',
      model: '',
      license_plate: '',
      vehicle_type: 'PKW',
      color: '',
      year: new Date().getFullYear(),
      fuel_type: 'Benzin',
      seats: 5,
      mileage: 0,
      image: null,
      notes: ''
    });
    setPreviewImage(null);
    setShowVehicleForm(false);
    setEditingVehicle(null);
  };

  const resetBookingForm = () => {
    setBookingForm({
      vehicle_id: '',
      employee_id: '',
      employee_name: '',
      purpose: '',
      start_datetime: '',
      end_datetime: '',
      notes: ''
    });
    setShowBookingForm(false);
    setSelectedVehicle(null);
  };

  const openBookingForm = (vehicle = null) => {
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setBookingForm(prev => ({ ...prev, vehicle_id: vehicle.id }));
    }
    setShowBookingForm(true);
  };

  const getStatusText = (status) => {
    const statusMap = {
      verfügbar: '✅ Verfügbar',
      unterwegs: '🚗 Unterwegs', 
      wartung: '🔧 Wartung',
      defekt: '⚠️ Defekt'
    };
    return statusMap[status] || status;
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id.toString() === employeeId.toString());
    return employee ? employee.name : '';
  };

  const getAvailableEmployees = () => {
    return employees.filter(emp => emp.can_drive_company_vehicles && emp.employment_status === 'aktiv');
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      'Management': '👑',
      'IT': '💻',
      'Marketing': '📢',
      'HR': '👥',
      'Finanzen': '💰',
      'Vertrieb': '📈',
      'Produktion': '🏭',
      'Design': '🎨',
      'Support': '🎧'
    };
    return icons[department] || '👤';
  };

  // Standard Datum/Zeit für neue Buchungen
  const getDefaultStartTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const getDefaultEndTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  const styles = {
    header: {
      textAlign: 'center',
      marginBottom: '30px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    statCard: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
      transition: 'transform 0.3s ease',
    },
    statNumber: {
      fontSize: '36px',
      fontWeight: 'bold',
      marginBottom: '5px',
    },
    statLabel: {
      fontSize: '14px',
      color: '#7f8c8d',
    },
    tabs: {
      display: 'flex',
      backgroundColor: 'white',
      borderRadius: '10px',
      marginBottom: '30px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    tab: {
      flex: 1,
      padding: '15px 20px',
      textAlign: 'center',
      cursor: 'pointer',
      backgroundColor: '#f8f9fa',
      border: 'none',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
    },
    activeTab: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '30px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    vehicleGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
      gap: '20px',
      marginTop: '20px',
    },
    addButton: {
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '15px 25px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
      marginBottom: '20px',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      padding: '30px',
      borderRadius: '15px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    form: {
      display: 'grid',
      gap: '20px',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    formGroup: {
      display: 'grid',
      gap: '8px',
    },
    label: {
      fontWeight: '500',
      color: '#34495e',
    },
    input: {
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
      transition: 'border-color 0.3s ease',
    },
    select: {
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
      backgroundColor: 'white',
    },
    textarea: {
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '80px',
    },
    imagePreview: {
      width: '100px',
      height: '100px',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '10px',
      overflow: 'hidden',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
    },
    button: {
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'background-color 0.3s ease',
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
    },
    submitButton: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    employeeOption: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
    },
    employeeInfo: {
      fontSize: '12px',
      color: '#7f8c8d',
      marginTop: '5px',
    },
    orDivider: {
      textAlign: 'center',
      margin: '15px 0',
      color: '#7f8c8d',
      fontSize: '14px',
      position: 'relative',
    },
    orLine: {
      position: 'absolute',
      top: '50%',
      left: '0',
      right: '0',
      height: '1px',
      backgroundColor: '#ecf0f1',
      zIndex: 1,
    },
    orText: {
      backgroundColor: 'white',
      padding: '0 15px',
      position: 'relative',
      zIndex: 2,
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', fontSize: '18px', color: '#7f8c8d', padding: '50px' }}>
          Lade Fahrzeugdaten...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>🚗 Fahrzeugverwaltung</h1>
        
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#2c3e50'}}>{stats.total_vehicles}</div>
            <div style={styles.statLabel}>Gesamt</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: statusColors.verfügbar}}>{stats.verfügbar}</div>
            <div style={styles.statLabel}>Verfügbar</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: statusColors.unterwegs}}>{stats.unterwegs}</div>
            <div style={styles.statLabel}>Unterwegs</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: statusColors.wartung}}>{stats.wartung}</div>
            <div style={styles.statLabel}>Wartung</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#3498db'}}>{stats.aktive_buchungen}</div>
            <div style={styles.statLabel}>Aktive Buchungen</div>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'overview' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('overview')}
        >
          🚗 Fahrzeuge
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'bookings' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('bookings')}
        >
          📅 Buchungskalender
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'employees' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('employees')}
        >
          👥 Führerscheine
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'overview' && (
          <div>
            <button
              style={styles.addButton}
              onClick={() => setShowVehicleForm(true)}
              onMouseOver={(e) => e.target.style.backgroundColor = '#219a52'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
            >
              ➕ Neues Fahrzeug hinzufügen
            </button>

            <button
              style={{...styles.addButton, backgroundColor: '#3498db', marginLeft: '10px'}}
              onClick={() => openBookingForm()}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              📅 Neue Buchung erstellen
            </button>

            <div style={styles.vehicleGrid}>
              {vehicles.map(vehicle => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onEdit={handleVehicleEdit}
                  onDelete={handleVehicleDelete}
                  onBook={openBookingForm}
                  getStatusText={getStatusText}
                  statusColors={statusColors}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <BookingCalendar 
            vehicles={vehicles}
            bookings={bookings}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'employees' && (
          <div>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              👥 Mitarbeiter-Führerscheine verwalten
            </h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {employees
                .filter(employee => 
                  // Nur aktive Mitarbeiter anzeigen
                  employee.is_active_employee && 
                  // Keine gekündigten Mitarbeiter
                  employee.employment_status !== 'gekündigt' &&
                  // Keine ausgeschiedenen Mitarbeiter
                  employee.employment_status !== 'ausgeschieden' &&
                  // Keine "Sonstige" Gruppe
                  employee.department !== 'Sonstige' &&
                  employee.department !== 'sonstige'
                )
                .map(employee => (
                  <div key={employee.id} style={{
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    border: '2px solid #ecf0f1',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', color: '#2c3e50' }}>
                          {getDepartmentIcon(employee.department)} {employee.name}
                        </h4>
                        <p style={{ margin: '0', color: '#7f8c8d', fontSize: '14px' }}>
                          {employee.department} • {employee.phone || 'Keine Telefonnummer'}
                        </p>
                        {employee.driving_license_classes && (
                          <p style={{ margin: '5px 0 0 0', color: '#27ae60', fontSize: '14px' }}>
                            🚗 Führerschein: {employee.driving_license_classes}
                            {employee.license_expires && ` (gültig bis ${new Date(employee.license_expires).toLocaleDateString('de-DE')})`}
                          </p>
                        )}
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: employee.can_drive_company_vehicles ? '#27ae60' : '#e74c3c',
                        color: 'white'
                      }}>
                        {employee.can_drive_company_vehicles ? '✅ Fahrberechtigt' : '❌ Nicht berechtigt'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Fahrzeug-Modal */}
      {showVehicleForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {editingVehicle ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug hinzufügen'}
            </h3>
            
            <form onSubmit={handleVehicleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Marke:</label>
                  <input
                    type="text"
                    name="brand"
                    value={vehicleForm.brand}
                    onChange={handleVehicleChange}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Modell:</label>
                  <input
                    type="text"
                    name="model"
                    value={vehicleForm.model}
                    onChange={handleVehicleChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Kennzeichen:</label>
                  <input
                    type="text"
                    name="license_plate"
                    value={vehicleForm.license_plate}
                    onChange={handleVehicleChange}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fahrzeugtyp:</label>
                  <select
                    name="vehicle_type"
                    value={vehicleForm.vehicle_type}
                    onChange={handleVehicleChange}
                    style={styles.select}
                  >
                    {vehicleTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Farbe:</label>
                  <input
                    type="text"
                    name="color"
                    value={vehicleForm.color}
                    onChange={handleVehicleChange}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Baujahr:</label>
                  <input
                    type="number"
                    name="year"
                    value={vehicleForm.year}
                    onChange={handleVehicleChange}
                    style={styles.input}
                    min="1980"
                    max={new Date().getFullYear() + 1}
                  />
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Kraftstoff:</label>
                  <select
                    name="fuel_type"
                    value={vehicleForm.fuel_type}
                    onChange={handleVehicleChange}
                    style={styles.select}
                  >
                    {fuelTypes.map(fuel => (
                      <option key={fuel} value={fuel}>{fuel}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Sitzplätze:</label>
                  <input
                    type="number"
                    name="seats"
                    value={vehicleForm.seats}
                    onChange={handleVehicleChange}
                    style={styles.input}
                    min="1"
                    max="50"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Kilometerstand:</label>
                <input
                  type="number"
                  name="mileage"
                  value={vehicleForm.mileage}
                  onChange={handleVehicleChange}
                  style={styles.input}
                  min="0"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Fahrzeugbild:</label>
                <div 
                  style={{
                    ...styles.imagePreview,
                    backgroundImage: previewImage ? `url(${previewImage})` : 'none'
                  }}
                >
                  {!previewImage && <span>📷</span>}
                </div>
                <input
                  type="file"
                  name="image"
                  onChange={handleVehicleChange}
                  accept="image/*"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notizen:</label>
                <textarea
                  name="notes"
                  value={vehicleForm.notes}
                  onChange={handleVehicleChange}
                  style={styles.textarea}
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
              
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={resetVehicleForm}
                  style={{...styles.button, ...styles.cancelButton}}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  style={{...styles.button, ...styles.submitButton}}
                >
                  {editingVehicle ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verbesserte Buchungs-Modal */}
      {showBookingForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              📅 Neue Buchung erstellen
              {selectedVehicle && (
                <div style={{ fontSize: '16px', color: '#7f8c8d', fontWeight: 'normal', marginTop: '5px' }}>
                  🚗 {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.license_plate})
                </div>
              )}
            </h3>
            
            <form onSubmit={handleBookingSubmit} style={styles.form}>
              {!selectedVehicle && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fahrzeug:</label>
                  <select
                    name="vehicle_id"
                    value={bookingForm.vehicle_id}
                    onChange={handleBookingChange}
                    style={styles.select}
                    required
                  >
                    <option value="">🚗 Fahrzeug wählen</option>
                    {vehicles.filter(v => v.status === 'verfügbar').map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model} ({vehicle.license_plate})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>👤 Mitarbeiter auswählen:</label>
                <select
                  name="employee_id"
                  value={bookingForm.employee_id}
                  onChange={handleBookingChange}
                  style={styles.select}
                >
                  <option value="">👥 Mitarbeiter aus Liste wählen</option>
                  {getAvailableEmployees().map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {getDepartmentIcon(employee.department)} {employee.name} ({employee.department})
                      {employee.driving_license_classes && ` - ${employee.driving_license_classes}`}
                    </option>
                  ))}
                </select>
                {bookingForm.employee_id && (
                  <div style={styles.employeeInfo}>
                    ✅ Ausgewählt: {getEmployeeName(bookingForm.employee_id)}
                  </div>
                )}
              </div>

              <div style={styles.orDivider}>
                <div style={styles.orLine}></div>
                <span style={styles.orText}>oder manuell eingeben</span>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>✏️ Name des Fahrers (manuell):</label>
                <input
                  type="text"
                  name="employee_name"
                  value={bookingForm.employee_name}
                  onChange={handleBookingChange}
                  style={styles.input}
                  placeholder="z.B. Externer Fahrer, Kunde..."
                  disabled={!!bookingForm.employee_id}
                />
                {!bookingForm.employee_id && !bookingForm.employee_name && (
                  <div style={{...styles.employeeInfo, color: '#e74c3c'}}>
                    ⚠️ Bitte wählen Sie einen Mitarbeiter aus oder geben Sie einen Namen ein
                  </div>
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>🎯 Zweck der Fahrt:</label>
                <input
                  type="text"
                  name="purpose"
                  value={bookingForm.purpose}
                  onChange={handleBookingChange}
                  style={styles.input}
                  placeholder="z.B. Kundenbesuch, Lieferung, Geschäftsreise..."
                  required
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>🕐 Start:</label>
                  <input
                    type="datetime-local"
                    name="start_datetime"
                    value={bookingForm.start_datetime || getDefaultStartTime()}
                    onChange={handleBookingChange}
                    style={styles.input}
                    min={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>🕕 Ende:</label>
                  <input
                    type="datetime-local"
                    name="end_datetime"
                    value={bookingForm.end_datetime || getDefaultEndTime()}
                    onChange={handleBookingChange}
                    style={styles.input}
                    min={bookingForm.start_datetime || new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📝 Notizen (optional):</label>
                <textarea
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleBookingChange}
                  style={styles.textarea}
                  placeholder="Zusätzliche Informationen zur Buchung..."
                />
              </div>
              
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={resetBookingForm}
                  style={{...styles.button, ...styles.cancelButton}}
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  style={{...styles.button, ...styles.submitButton}}
                >
                  📅 Buchung erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default VehicleManagement;