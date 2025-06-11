// client/src/pages/PhoneList.js - Mit zentraler Mitarbeiterverwaltung und Filteroptionen
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';

const PhoneList = ({ kiosk = false }) => {
  const { isMaintenanceMode, MaintenanceScreen } = useMaintenanceMode();
  const [employees, setEmployees] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    
    if (kiosk) {
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [kiosk]);

  const fetchData = async () => {
    try {
      const [employeesRes, contactsRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/contacts').catch(() => ({ data: [] }))
      ]);
      
      setEmployees(employeesRes.data);
      setContacts(contactsRes.data);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEmployees = () => {
    let filtered = employees;
    
    // Filter by category
    if (filterCategory === 'bulletin_board') {
      filtered = employees.filter(emp => 
        emp.position_title?.toLowerCase().includes('lager') ||
        emp.department?.toLowerCase().includes('lager') ||
        emp.work_location === 'lager'
      );
    } else if (filterCategory === 'büro') {
      filtered = employees.filter(emp => emp.work_location === 'büro');
    } else if (filterCategory === 'management') {
      filtered = employees.filter(emp => emp.department === 'Management');
    } else if (filterCategory === 'aktiv') {
      filtered = employees.filter(emp => emp.is_active_employee);
    } else if (filterCategory === 'drivers') {
      filtered = employees.filter(emp => emp.can_drive_company_vehicles);
    } else if (filterCategory === 'extern') {
      filtered = employees.filter(emp => emp.employee_type === 'extern' || emp.employee_type === 'ehemalig');
    } else if (filterCategory === 'contacts') {
      return contacts; // Return external contacts instead
    } else if (filterCategory !== 'all') {
      filtered = employees.filter(emp => emp.department === filterCategory);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(person =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (person.department && person.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (person.phone && person.phone.includes(searchTerm)) ||
        (person.extension && person.extension.includes(searchTerm)) ||
        (person.position_title && person.position_title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
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
      'Support': '🎧',
      'Buchhaltung': '📊'
    };
    return icons[department] || '👤';
  };

  const getEmployeeStatusIcon = (employee) => {
    if (!employee.is_active_employee) return '❌';
    switch (employee.employment_status) {
      case 'krank': return '🤒';
      case 'urlaub': return '🏖️';
      case 'gekündigt': return '❌';
      default: return '✅';
    }
  };

  const getWorkLocationIcon = (location) => {
    switch (location) {
      case 'büro': return '🏢';
      case 'lager': return '📦';
      case 'homeoffice': return '🏠';
      case 'außendienst': return '🚗';
      default: return '📍';
    }
  };

  // Hilfsfunktion für TAPI- und tel: Links
  const renderPhoneLink = (phoneNumber, displayText, isDurchwahl = false) => {
    if (!phoneNumber) return displayText || 'Keine Nummer';
    
    // Für Durchwahl: Komplette Telefonnummer aufbauen
    let completePhoneNumber = phoneNumber;
    if (isDurchwahl && phoneNumber.length <= 4) {
      // Durchwahl zu kompletter Nummer machen
      completePhoneNumber = `0521-77006${phoneNumber}`;
    }
    
    // Formatiere Telefonnummer für tel: Link (entferne Leerzeichen und andere Zeichen)
    const cleanPhone = completePhoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    
    // TAPI-Link für Linkus (falls verfügbar) oder tel: Link als Fallback
    const handlePhoneClick = (e) => {
      e.preventDefault();
      
      // Versuche zuerst TAPI-Link (für Linkus)
      try {
        const tapiLink = `linkus:${cleanPhone}`;
        window.location.href = tapiLink;
        
        // Fallback nach kurzer Verzögerung falls TAPI nicht funktioniert
        setTimeout(() => {
          window.location.href = `tel:${cleanPhone}`;
        }, 1000);
      } catch (error) {
        // Falls TAPI fehlschlägt, nutze tel: Link
        window.location.href = `tel:${cleanPhone}`;
      }
    };
    
    return (
      <a 
        href={`tel:${cleanPhone}`}
        onClick={handlePhoneClick}
        style={{
          color: '#3498db',
          textDecoration: 'none',
          cursor: 'pointer'
        }}
        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
        title={`Anrufen: ${completePhoneNumber}`}
      >
        {displayText || (isDurchwahl ? `${phoneNumber} (${completePhoneNumber})` : phoneNumber)}
      </a>
    );
  };

  const filteredData = getFilteredEmployees();
  
  const groupedData = filteredData.reduce((groups, person) => {
    let groupKey;
    if (filterCategory === 'contacts') {
      groupKey = person.company || 'Ohne Firma';
    } else {
      groupKey = person.department || 'Ohne Abteilung';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(person);
    return groups;
  }, {});

  const styles = {
    container: kiosk ? { 
      padding: '40px', 
      backgroundColor: '#f8f9fa', 
      minHeight: '100vh' 
    } : {},
    header: {
      textAlign: 'center',
      marginBottom: kiosk ? '60px' : '30px',
    },
    title: {
      fontSize: kiosk ? '64px' : '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: kiosk ? '20px' : '10px',
    },
    backButton: kiosk ? {
      display: 'inline-block',
      backgroundColor: '#3498db',
      color: 'white',
      padding: '20px 40px',
      fontSize: '24px',
      fontWeight: 'bold',
      textDecoration: 'none',
      borderRadius: '10px',
      marginBottom: '40px',
      transition: 'background-color 0.3s ease',
    } : null,
    filterSection: !kiosk ? {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    } : null,
    filterButtons: !kiosk ? {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginBottom: '15px',
    } : null,
    filterButton: !kiosk ? {
      padding: '8px 16px',
      border: '2px solid #ecf0f1',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      backgroundColor: 'white',
    } : null,
    activeFilter: !kiosk ? {
      backgroundColor: '#3498db',
      color: 'white',
      borderColor: '#3498db',
    } : null,
    linkToManagement: !kiosk ? {
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '15px 25px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      textDecoration: 'none',
      display: 'inline-block',
      marginBottom: '20px',
    } : null,
    searchBox: {
      width: '100%',
      maxWidth: '500px',
      margin: '0 auto 40px',
      padding: kiosk ? '20px' : '15px',
      fontSize: kiosk ? '24px' : '18px',
      border: '3px solid #3498db',
      borderRadius: '10px',
      textAlign: 'center',
      outline: 'none',
      transition: 'border-color 0.3s ease',
    },
    departmentGroup: {
      marginBottom: kiosk ? '60px' : '40px',
      backgroundColor: 'white',
      borderRadius: kiosk ? '20px' : '10px',
      padding: kiosk ? '40px' : '25px',
      boxShadow: kiosk ? '0 8px 32px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.1)',
    },
    departmentTitle: {
      fontSize: kiosk ? '36px' : '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: kiosk ? '30px' : '20px',
      paddingBottom: kiosk ? '15px' : '10px',
      borderBottom: '3px solid #3498db',
    },
    employeeGrid: {
      display: 'grid',
      gridTemplateColumns: kiosk ? 'repeat(auto-fit, minmax(400px, 1fr))' : 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: kiosk ? '25px' : '15px',
    },
    employeeCard: {
      backgroundColor: '#f8f9fa',
      borderRadius: kiosk ? '15px' : '8px',
      padding: kiosk ? '30px' : '20px',
      border: '2px solid #ecf0f1',
      transition: 'all 0.3s ease',
    },
    employeeHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: kiosk ? '20px' : '10px',
    },
    employeeName: {
      fontSize: kiosk ? '28px' : '20px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: kiosk ? '8px' : '5px',
    },
    employeeTitle: {
      fontSize: kiosk ? '20px' : '16px',
      color: '#3498db',
      marginBottom: kiosk ? '8px' : '5px',
    },
    contactInfo: {
      display: 'flex',
      flexDirection: 'column',
      gap: kiosk ? '12px' : '8px',
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      fontSize: kiosk ? '20px' : '16px',
      color: '#34495e',
    },
    contactIcon: {
      fontSize: kiosk ? '24px' : '18px',
      marginRight: kiosk ? '15px' : '10px',
      width: kiosk ? '35px' : '25px',
    },
    contactText: {
      fontWeight: '500',
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: 'white',
      backgroundColor: '#27ae60',
    },
    emergencyBadge: {
      backgroundColor: '#e74c3c',
    }
  };

  // Wartungsmodus-Check für alle Benutzer
  if (isMaintenanceMode) {
    return <MaintenanceScreen />;
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', fontSize: '18px', color: '#7f8c8d', padding: '50px' }}>
          Lade Kontaktdaten...
        </div>
      </Layout>
    );
  }

  if (kiosk) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/kiosk" style={styles.backButton}>← Zurück zum Hauptmenü</a>
          <h1 style={styles.title}>📞 Telefonliste</h1>
        </div>
        
        <input
          type="text"
          placeholder="Name, Abteilung oder Telefonnummer suchen..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchBox}
          onFocus={(e) => e.target.style.borderColor = '#2980b9'}
          onBlur={(e) => e.target.style.borderColor = '#3498db'}
        />
        
        {Object.keys(groupedData).sort().map(department => (
          <div key={department} style={styles.departmentGroup}>
            <h2 style={styles.departmentTitle}>{department}</h2>
            <div style={styles.employeeGrid}>
              {groupedData[department].map(person => (
                <div key={person.id} style={styles.employeeCard}>
                  <div style={styles.employeeHeader}>
                    <div>
                      <div style={styles.employeeName}>
                        {filterCategory === 'contacts' 
                          ? (person.is_emergency_contact ? '🆘' : '📞')
                          : getDepartmentIcon(person.department)
                        } {person.name}
                      </div>
                      {person.position_title && (
                        <div style={styles.employeeTitle}>{person.position_title}</div>
                      )}
                    </div>
                    {filterCategory !== 'contacts' && (
                      <div style={{
                        ...styles.statusBadge,
                        backgroundColor: person.is_active_employee ? '#27ae60' : '#e74c3c'
                      }}>
                        {getEmployeeStatusIcon(person)} {person.employment_status}
                      </div>
                    )}
                    {filterCategory === 'contacts' && person.is_emergency_contact && (
                      <div style={{...styles.statusBadge, ...styles.emergencyBadge}}>
                        🆘 Notfall
                      </div>
                    )}
                  </div>
                  <div style={styles.contactInfo}>
                    {person.phone && (
                      <div style={styles.contactItem}>
                        <span style={styles.contactIcon}>📱</span>
                        <span style={styles.contactText}>{renderPhoneLink(person.phone, person.phone)}</span>
                      </div>
                    )}
                    {person.extension && (
                      <div style={styles.contactItem}>
                        <span style={styles.contactIcon}>☎️</span>
                        <span style={styles.contactText}>Durchwahl: {renderPhoneLink(person.extension, person.extension, true)}</span>
                      </div>
                    )}
                    {person.mobile && person.mobile !== person.phone && (
                      <div style={styles.contactItem}>
                        <span style={styles.contactIcon}>📲</span>
                        <span style={styles.contactText}>Mobil: {renderPhoneLink(person.mobile, person.mobile)}</span>
                      </div>
                    )}
                    {person.email && (
                      <div style={styles.contactItem}>
                        <span style={styles.contactIcon}>📧</span>
                        <span style={styles.contactText}>{person.email}</span>
                      </div>
                    )}
                    {filterCategory !== 'contacts' && person.work_location && (
                      <div style={styles.contactItem}>
                        <span style={styles.contactIcon}>{getWorkLocationIcon(person.work_location)}</span>
                        <span style={styles.contactText}>{person.work_location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {filteredData.length === 0 && (
          <div style={{
            textAlign: 'center',
            fontSize: kiosk ? '32px' : '18px',
            color: '#7f8c8d',
            padding: '100px'
          }}>
            {searchTerm ? 'Keine Treffer gefunden' : 'Keine Einträge vorhanden'}
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>📞 Telefonliste</h1>
      </div>

      <Link 
        to="/admin/employees" 
        style={styles.linkToManagement}
      >
        👥 Zur zentralen Mitarbeiterverwaltung
      </Link>

      <div style={styles.filterSection}>
        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>🔍 Filter:</h3>
        <div style={styles.filterButtons}>
          {[
            { key: 'all', label: '👥 Alle Mitarbeiter', count: employees.length },
            { key: 'aktiv', label: '✅ Nur aktive', count: employees.filter(e => e.is_active_employee).length },
            { key: 'bulletin_board', label: '📋 Lager-Mitarbeiter', count: employees.filter(e => 
              e.position_title?.toLowerCase().includes('lager') ||
              e.department?.toLowerCase().includes('lager') ||
              e.work_location === 'lager'
            ).length },
            { key: 'büro', label: '🏢 Büro', count: employees.filter(e => e.work_location === 'büro').length },
            { key: 'drivers', label: '🚗 Fahrer', count: employees.filter(e => e.can_drive_company_vehicles).length },
            { key: 'management', label: '👑 Management', count: employees.filter(e => e.department === 'Management').length },
            { key: 'extern', label: '🔗 Externe/Ehemalige', count: employees.filter(e => e.employee_type === 'extern' || e.employee_type === 'ehemalig').length },
            { key: 'contacts', label: '📞 Externe Kontakte', count: contacts.length }
          ].map(filter => (
            <button
              key={filter.key}
              style={{
                ...styles.filterButton,
                ...(filterCategory === filter.key ? styles.activeFilter : {})
              }}
              onClick={() => setFilterCategory(filter.key)}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>
        <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
          📊 Wählen Sie eine Kategorie oder nutzen Sie die Suchfunktion
        </div>
      </div>

      <input
        type="text"
        placeholder="Name, Abteilung oder Telefonnummer suchen..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          ...styles.searchBox,
          display: 'block',
          marginBottom: '30px'
        }}
        onFocus={(e) => e.target.style.borderColor = '#2980b9'}
        onBlur={(e) => e.target.style.borderColor = '#3498db'}
      />

      {Object.keys(groupedData).sort().map(department => (
        <div key={department} style={styles.departmentGroup}>
          <h2 style={styles.departmentTitle}>
            {filterCategory === 'contacts' ? '🏢' : '🏢'} {department} ({groupedData[department].length})
          </h2>
          <div style={styles.employeeGrid}>
            {groupedData[department].map(person => (
              <div key={person.id} style={styles.employeeCard}>
                <div style={styles.employeeHeader}>
                  <div>
                    <div style={styles.employeeName}>
                      {filterCategory === 'contacts' 
                        ? (person.is_emergency_contact ? '🆘' : '📞')
                        : getDepartmentIcon(person.department)
                      } {person.name}
                    </div>
                    {person.position_title && (
                      <div style={styles.employeeTitle}>{person.position_title}</div>
                    )}
                  </div>
                  {filterCategory !== 'contacts' && (
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: person.is_active_employee ? '#27ae60' : '#e74c3c'
                    }}>
                      {getEmployeeStatusIcon(person)} {person.employment_status}
                    </div>
                  )}
                  {filterCategory === 'contacts' && person.is_emergency_contact && (
                    <div style={{...styles.statusBadge, ...styles.emergencyBadge}}>
                      🆘 Notfall
                    </div>
                  )}
                  {filterCategory === 'contacts' && person.contact_type && (
                    <div style={styles.statusBadge}>
                      {person.contact_type}
                    </div>
                  )}
                </div>
                <div style={styles.contactInfo}>
                  {person.phone && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactIcon}>📱</span>
                      <span style={styles.contactText}>{renderPhoneLink(person.phone, person.phone)}</span>
                    </div>
                  )}
                  {person.extension && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactIcon}>☎️</span>
                      <span style={styles.contactText}>Durchwahl: {renderPhoneLink(person.extension, person.extension, true)}</span>
                    </div>
                  )}
                  {person.mobile && person.mobile !== person.phone && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactIcon}>📲</span>
                      <span style={styles.contactText}>Mobil: {renderPhoneLink(person.mobile, person.mobile)}</span>
                    </div>
                  )}
                  {person.email && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactIcon}>📧</span>
                      <span style={styles.contactText}>{person.email}</span>
                    </div>
                  )}
                  {filterCategory !== 'contacts' && person.work_location && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactIcon}>{getWorkLocationIcon(person.work_location)}</span>
                      <span style={styles.contactText}>{person.work_location}</span>
                    </div>
                  )}
                  {filterCategory !== 'contacts' && person.driving_license_classes && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactIcon}>🚗</span>
                      <span style={styles.contactText}>Führerschein: {person.driving_license_classes}</span>
                    </div>
                  )}
                  {!person.phone && !person.extension && !person.mobile && (
                    <div style={{...styles.contactItem, color: '#7f8c8d'}}>
                      <span style={styles.contactIcon}>❌</span>
                      <span>Keine Kontaktdaten hinterlegt</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredData.length === 0 && (
        <div style={{
          textAlign: 'center',
          fontSize: '18px',
          color: '#7f8c8d',
          padding: '40px',
          backgroundColor: 'white',
          borderRadius: '10px',
          marginTop: '20px'
        }}>
          {searchTerm 
            ? `Keine Treffer für "${searchTerm}" gefunden` 
            : `Keine Einträge in der Kategorie "${filterCategory}" vorhanden`
          }
        </div>
      )}

      {filterCategory === 'all' && !searchTerm && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '20px'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#2c3e50' }}>
            📊 Kontakt-Statistiken
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                {employees.filter(e => e.phone || e.extension).length}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Mitarbeiter mit Telefon</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                {employees.filter(e => e.is_active_employee && (e.phone || e.extension)).length}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Aktive erreichbar</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                {contacts.length}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Externe Kontakte</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                {contacts.filter(c => c.is_emergency_contact).length}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Notfall-Kontakte</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PhoneList;