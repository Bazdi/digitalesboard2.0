// client/src/pages/EmployeeManagement.js - Deutsche Version mit übersetzten Begriffen
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    birthday: '',
    department: '',
    position_title: '',
    phone: '',
    mobile: '',
    extension: '',
    employee_type: 'intern',
    is_active_employee: true,
    uses_bulletin_board: true,
    work_location: 'büro',
    employment_status: 'aktiv',
    driving_license_classes: '',
    license_expires: '',
    can_drive_company_vehicles: false,
    has_key_access: false,
    security_clearance_level: 1,
    hire_date: ''
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    company: '',
    department: '',
    position_title: '',
    phone: '',
    mobile: '',
    email: '',
    contact_type: 'kunde',
    category: '',
    is_emergency_contact: false,
    notes: ''
  });

  // Styles Objekt - VERSCHIEBEN AN DEN ANFANG
  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '10px',
    },
    tabs: {
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      marginBottom: '30px',
    },
    tab: {
      padding: '15px 30px',
      backgroundColor: 'white',
      border: '2px solid #ecf0f1',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'all 0.3s ease',
    },
    activeTab: {
      backgroundColor: '#3498db',
      color: 'white',
      borderColor: '#3498db',
    },
    content: {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '30px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    filterSection: {
      marginBottom: '25px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
    },
    filterButtons: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '8px 15px',
      backgroundColor: 'white',
      border: '2px solid #ecf0f1',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.3s ease',
    },
    activeFilter: {
      backgroundColor: '#3498db',
      color: 'white',
      borderColor: '#3498db',
    },
    addButton: {
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '15px 25px',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '20px',
      transition: 'background-color 0.3s ease',
    },
    employeeCard: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '15px',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    employeeHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '15px',
    },
    employeeName: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '5px',
    },
    employeeTitle: {
      fontSize: '16px',
      color: '#7f8c8d',
      marginBottom: '3px',
    },
    employeeDepartment: {
      fontSize: '14px',
      color: '#95a5a6',
    },
    statusBadge: {
      padding: '8px 15px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 'bold',
      color: 'white',
    },
    employeeDetails: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '10px',
      marginBottom: '15px',
    },
    detailItem: {
      fontSize: '14px',
      color: '#34495e',
    },
    actions: {
      display: 'flex',
      gap: '10px',
    },
    editButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '8px 15px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
    },
    deleteButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '8px 15px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '14px',
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
      maxHeight: '90vh',
      overflow: 'auto',
    },
    modalHeader: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '25px',
      color: '#2c3e50',
    },
    formGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '20px',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.3s ease',
    },
    select: {
      width: '100%',
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: 'white',
    },
    checkbox: {
      marginRight: '8px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
      cursor: 'pointer',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '25px',
    },
    saveButton: {
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
    },
    loading: {
      textAlign: 'center',
      fontSize: '24px',
      padding: '50px',
      color: '#7f8c8d',
    },
    contactCard: {
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '15px',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
    },
    emergencyBadge: {
      backgroundColor: '#e74c3c',
    },
  };

  const departments = ['Management', 'IT', 'Marketing', 'Vertrieb', 'HR', 'Finanzen', 'Produktion', 'Design', 'Support', 'Buchhaltung'];
  const workLocations = [
    { value: 'büro', label: '🏢 Büro' },
    { value: 'lager', label: '📦 Lager' },
    { value: 'homeoffice', label: '🏠 Homeoffice' },
    { value: 'außendienst', label: '🚗 Außendienst' }
  ];
  const employmentStatuses = [
    { value: 'aktiv', label: '✅ Aktiv' },
    { value: 'krank', label: '🤒 Krank' },
    { value: 'urlaub', label: '🏖️ Urlaub' },
    { value: 'gekündigt', label: '❌ Gekündigt' }
  ];
  const contactTypes = [
    { value: 'kunde', label: '🛒 Kunde' },
    { value: 'lieferant', label: '📦 Lieferant' },
    { value: 'partner', label: '🤝 Partner' },
    { value: 'service', label: '🔧 Service' },
    { value: 'notfall', label: '🆘 Notfall' },
    { value: 'sonstiges', label: '📋 Sonstiges' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, contactsRes] = await Promise.all([
        axios.get('/api/employees'),
        axios.get('/api/contacts')
      ]);
      
      setEmployees(employeesRes.data);
      setContacts(contactsRes.data);
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      alert('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingEmployee) {
        await axios.put(`/api/employees/${editingEmployee.id}`, employeeForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Mitarbeiter erfolgreich aktualisiert!');
      } else {
        await axios.post('/api/employees', employeeForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Mitarbeiter erfolgreich erstellt!');
      }
      
      resetEmployeeForm();
      fetchData();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingContact) {
        await axios.put(`/api/contacts/${editingContact.id}`, contactForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Kontakt erfolgreich aktualisiert!');
      } else {
        await axios.post('/api/contacts', contactForm, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Kontakt erfolgreich erstellt!');
      }
      
      resetContactForm();
      fetchData();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern: ' + (error.response?.data?.error || error.message));
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm('Mitarbeiter wirklich löschen?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Mitarbeiter gelöscht!');
      fetchData();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen');
    }
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Kontakt wirklich löschen?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/contacts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Kontakt gelöscht!');
      fetchData();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen');
    }
  };

  const editEmployee = (employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({ ...employee });
    setShowEmployeeForm(true);
  };

  const editContact = (contact) => {
    setEditingContact(contact);
    setContactForm({ ...contact });
    setShowContactForm(true);
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      email: '',
      birthday: '',
      department: '',
      position_title: '',
      phone: '',
      mobile: '',
      extension: '',
      employee_type: 'intern',
      is_active_employee: true,
      uses_bulletin_board: true,
      work_location: 'büro',
      employment_status: 'aktiv',
      driving_license_classes: '',
      license_expires: '',
      can_drive_company_vehicles: false,
      has_key_access: false,
      security_clearance_level: 1,
      hire_date: ''
    });
    setShowEmployeeForm(false);
    setEditingEmployee(null);
  };

  const resetContactForm = () => {
    setContactForm({
      name: '',
      company: '',
      department: '',
      position_title: '',
      phone: '',
      mobile: '',
      email: '',
      contact_type: 'kunde',
      category: '',
      is_emergency_contact: false,
      notes: ''
    });
    setShowContactForm(false);
    setEditingContact(null);
  };

  const handleEmployeeChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmployeeForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContactChange = (e) => {
    const { name, value, type, checked } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getFilteredEmployees = () => {
    if (filterCategory === 'all') return employees;
    if (filterCategory === 'bulletin_board') {
      // Alle mit "Lager" in Position/Beschreibung/Department - konsistent mit Geburtstags-/Telefonliste
      return employees.filter(emp => 
        emp.position_title?.toLowerCase().includes('lager') ||
        emp.department?.toLowerCase().includes('lager') ||
        emp.work_location === 'lager'
      );
    }
    if (filterCategory === 'drivers') return employees.filter(emp => emp.can_drive_company_vehicles);
    if (filterCategory === 'aktiv') return employees.filter(emp => emp.is_active_employee);
    if (filterCategory === 'inaktiv') return employees.filter(emp => !emp.is_active_employee);
    return employees.filter(emp => emp.employment_status === filterCategory);
  };

  const getStatusIcon = (employee) => {
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

  const getWorkLocationLabel = (location) => {
    const locationObj = workLocations.find(loc => loc.value === location);
    return locationObj ? locationObj.label : location;
  };

  const getEmploymentStatusLabel = (status) => {
    const statusObj = employmentStatuses.find(stat => stat.value === status);
    return statusObj ? statusObj.label : status;
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

  if (loading) {
    return (
      <Layout>
        <div style={styles.loading}>🔄 Lade Mitarbeiterdaten...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>👥 Zentrale Mitarbeiterverwaltung</h1>
          <p>Verwalten Sie alle Mitarbeiter und externe Kontakte zentral</p>
        </div>

        {/* WICHTIGER HINWEIS FÜR work4all */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '25px',
          borderLeft: '4px solid #f39c12'
        }}>
          <h3 style={{ fontSize: '18px', color: '#d68910', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ work4all Integration - Wichtiger Hinweis
          </h3>
          <div style={{ fontSize: '14px', color: '#856404', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '10px' }}>
              📊 <strong>Die Mitarbeiterdaten werden automatisch aus work4all synchronisiert.</strong>
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '10px' }}>
              <li>✅ <strong>Anzeigen und Filtern:</strong> Vollständig verfügbar</li>
              <li>✅ <strong>Lokale Felder bearbeiten:</strong> Führerschein, Fahrberechtigung, Schlüsselzugang, Lager-Berechtigung (bleiben lokal gespeichert)</li>
              <li>⚠️ <strong>work4all Felder:</strong> Name, E-Mail, Telefon, Abteilung werden bei Sync überschrieben</li>
              <li>❌ <strong>Neue Mitarbeiter:</strong> Müssen in work4all angelegt werden</li>
              <li>❌ <strong>Löschen:</strong> Nur in work4all möglich</li>
            </ul>
            <p style={{ fontSize: '13px', fontStyle: 'italic' }}>
              💡 Für neue Mitarbeiter wenden Sie sich an die HR-Abteilung oder nutzen Sie das work4all-System direkt.
            </p>
          </div>
        </div>

        <div style={styles.tabs}>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === 'employees' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('employees')}
          >
            👥 Mitarbeiter ({employees.length}) - work4all Sync
          </div>
          <div
            style={{
              ...styles.tab,
              ...(activeTab === 'contacts' ? styles.activeTab : {})
            }}
            onClick={() => setActiveTab('contacts')}
          >
            📞 Externe Kontakte ({contacts.length}) - Lokal verwaltet
          </div>
        </div>

        <div style={styles.content}>
          {activeTab === 'employees' && (
            <>
              <div style={styles.filterSection}>
                <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>🔍 Filter:</h3>
                <div style={styles.filterButtons}>
                  {[
                    { key: 'all', label: '👥 Alle', count: employees.length },
                    { key: 'aktiv', label: '✅ Aktiv', count: employees.filter(e => e.is_active_employee).length },
                    { 
                      key: 'bulletin_board', 
                      label: '📋 Lager-Mitarbeiter', 
                      count: employees.filter(e => 
                        e.position_title?.toLowerCase().includes('lager') ||
                        e.department?.toLowerCase().includes('lager') ||
                        e.work_location === 'lager'
                      ).length 
                    },
                    { key: 'drivers', label: '🚗 Fahrer', count: employees.filter(e => e.can_drive_company_vehicles).length },
                    { key: 'krank', label: '🤒 Krank', count: employees.filter(e => e.employment_status === 'krank').length },
                    { key: 'urlaub', label: '🏖️ Urlaub', count: employees.filter(e => e.employment_status === 'urlaub').length },
                    { key: 'inaktiv', label: '❌ Inaktiv', count: employees.filter(e => !e.is_active_employee).length }
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
              </div>

              {/* DEAKTIVIERTER ADD-BUTTON MIT HINWEIS */}
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <button
                  style={{
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'not-allowed',
                    opacity: 0.7
                  }}
                  disabled
                  title="Neue Mitarbeiter müssen in work4all angelegt werden"
                >
                  ➕ Neuen Mitarbeiter hinzufügen (deaktiviert)
                </button>
                <div style={{ fontSize: '14px', color: '#6c757d' }}>
                  🔒 <strong>Neue Mitarbeiter werden über work4all verwaltet.</strong> 
                  Kontaktieren Sie die HR-Abteilung oder nutzen Sie das work4all-System direkt.
                </div>
              </div>

              <div style={styles.employeeList}>
                {getFilteredEmployees().map(employee => (
                  <div 
                    key={employee.id} 
                    style={styles.employeeCard}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={styles.employeeHeader}>
                      <div>
                        <div style={styles.employeeName}>
                          {getDepartmentIcon(employee.department)} {employee.name}
                        </div>
                        <div style={styles.employeeTitle}>{employee.position_title}</div>
                        <div style={styles.employeeDepartment}>{employee.department}</div>
                      </div>
                      <div style={{
                        ...styles.statusBadge,
                        backgroundColor: employee.is_active_employee ? '#27ae60' : '#e74c3c'
                      }}>
                        {getStatusIcon(employee)} {getEmploymentStatusLabel(employee.employment_status)}
                      </div>
                    </div>

                    <div style={styles.employeeDetails}>
                      <div style={styles.detailItem}>
                        📧 {employee.email || 'Keine E-Mail'}
                      </div>
                      <div style={styles.detailItem}>
                        📞 {employee.phone || 'Kein Telefon'}
                      </div>
                      <div style={styles.detailItem}>
                        📱 {employee.mobile || 'Kein Handy'}
                      </div>
                      <div style={styles.detailItem}>
                        {getWorkLocationIcon(employee.work_location)} {getWorkLocationLabel(employee.work_location)}
                      </div>
                      <div style={styles.detailItem}>
                        🎂 {employee.birthday || 'Kein Geburtstag'}
                      </div>
                      <div style={styles.detailItem}>
                        📋 Brett: {employee.uses_bulletin_board ? '✅ Ja' : '❌ Nein'}
                      </div>
                      <div style={styles.detailItem}>
                        🚗 Fahren: {employee.can_drive_company_vehicles ? '✅ Ja' : '❌ Nein'}
                      </div>
                      {employee.driving_license_classes && (
                        <div style={styles.detailItem}>
                          🪪 Führerschein: {employee.driving_license_classes}
                        </div>
                      )}
                    </div>

                    <div style={styles.actions}>
                      <button
                        style={styles.editButton}
                        onClick={() => editEmployee(employee)}
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button
                        style={styles.deleteButton}
                        onClick={() => deleteEmployee(employee.id)}
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'contacts' && (
            <>
              <button
                style={styles.addButton}
                onClick={() => setShowContactForm(true)}
              >
                ➕ Neuen Kontakt hinzufügen
              </button>

              {contacts.map(contact => (
                <div key={contact.id} style={styles.contactCard}>
                  <div style={styles.employeeHeader}>
                    <div>
                      <div style={styles.employeeName}>
                        {contact.is_emergency_contact ? '🆘' : '📞'} {contact.name}
                      </div>
                      {contact.company && (
                        <div style={styles.employeeTitle}>{contact.company}</div>
                      )}
                      {contact.position_title && (
                        <div style={styles.employeeDepartment}>{contact.position_title}</div>
                      )}
                    </div>
                    {contact.is_emergency_contact && (
                      <div style={{...styles.statusBadge, ...styles.emergencyBadge}}>
                        🆘 Notfallkontakt
                      </div>
                    )}
                    {contact.contact_type && (
                      <div style={styles.statusBadge}>
                        {contactTypes.find(type => type.value === contact.contact_type)?.label || contact.contact_type}
                      </div>
                    )}
                  </div>

                  <div style={styles.employeeDetails}>
                    <div style={styles.detailItem}>
                      📞 {contact.phone || 'Kein Telefon'}
                    </div>
                    <div style={styles.detailItem}>
                      📱 {contact.mobile || 'Kein Handy'}
                    </div>
                    <div style={styles.detailItem}>
                      📧 {contact.email || 'Keine E-Mail'}
                    </div>
                    {contact.category && (
                      <div style={styles.detailItem}>
                        🏷️ {contact.category}
                      </div>
                    )}
                  </div>

                  {contact.notes && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px',
                      backgroundColor: '#ecf0f1',
                      borderRadius: '5px',
                      fontSize: '14px',
                      color: '#7f8c8d'
                    }}>
                      📝 {contact.notes}
                    </div>
                  )}

                  <div style={styles.actions}>
                    <button
                      style={styles.editButton}
                      onClick={() => editContact(contact)}
                    >
                      ✏️ Bearbeiten
                    </button>
                    <button
                      style={styles.deleteButton}
                      onClick={() => deleteContact(contact.id)}
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Mitarbeiter Formular Modal */}
        {showEmployeeForm && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                {editingEmployee ? '✏️ Mitarbeiter bearbeiten' : '➕ Neuen Mitarbeiter hinzufügen'}
              </div>
              
              {/* HINWEIS FÜR LOKALE VS work4all FELDER */}
              {editingEmployee && (
                <div style={{
                  backgroundColor: '#e8f4fd',
                  border: '1px solid #3498db',
                  borderRadius: '6px',
                  padding: '15px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#2980b9', marginBottom: '8px' }}>
                    🔄 Sync-Verhalten bei work4all Integration:
                  </div>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#27ae60', fontWeight: 'bold', marginBottom: '5px' }}>
                        ✅ Lokale Felder (bleiben erhalten):
                      </div>
                      <ul style={{ margin: '0 0 0 15px', fontSize: '13px', color: '#555' }}>
                        <li>🚗 Fahrberechtigung</li>
                        <li>🪪 Führerscheinklassen</li>
                        <li>🔑 Schlüsselzugang</li>
                        <li>📋 Lager-Berechtigung</li>
                        <li>🔒 Sicherheitsstufe</li>
                      </ul>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#e67e22', fontWeight: 'bold', marginBottom: '5px' }}>
                        ⚠️ work4all Felder (werden überschrieben):
                      </div>
                      <ul style={{ margin: '0 0 0 15px', fontSize: '13px', color: '#555' }}>
                        <li>👤 Name, E-Mail</li>
                        <li>📞 Telefon, Handy</li>
                        <li>🏢 Abteilung, Position</li>
                        <li>🎂 Geburtstag</li>
                        <li>📍 Arbeitsort, Status</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleEmployeeSubmit}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Name *:</label>
                    <input
                      type="text"
                      name="name"
                      value={employeeForm.name}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>E-Mail:</label>
                    <input
                      type="email"
                      name="email"
                      value={employeeForm.email}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Geburtstag:</label>
                    <input
                      type="date"
                      name="birthday"
                      value={employeeForm.birthday}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Abteilung:</label>
                    <select
                      name="department"
                      value={employeeForm.department}
                      onChange={handleEmployeeChange}
                      style={styles.select}
                    >
                      <option value="">Abteilung wählen</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>
                          {getDepartmentIcon(dept)} {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Position:</label>
                    <input
                      type="text"
                      name="position_title"
                      value={employeeForm.position_title}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Telefon:</label>
                    <input
                      type="tel"
                      name="phone"
                      value={employeeForm.phone}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Handy:</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={employeeForm.mobile}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Durchwahl:</label>
                    <input
                      type="text"
                      name="extension"
                      value={employeeForm.extension}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Arbeitsort:</label>
                    <select
                      name="work_location"
                      value={employeeForm.work_location}
                      onChange={handleEmployeeChange}
                      style={styles.select}
                    >
                      {workLocations.map(location => (
                        <option key={location.value} value={location.value}>
                          {location.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Status:</label>
                    <select
                      name="employment_status"
                      value={employeeForm.employment_status}
                      onChange={handleEmployeeChange}
                      style={styles.select}
                    >
                      {employmentStatuses.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Führerscheinklassen:</label>
                    <input
                      type="text"
                      name="driving_license_classes"
                      value={employeeForm.driving_license_classes}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                      placeholder="z.B. B, BE, C"
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Führerschein gültig bis:</label>
                    <input
                      type="date"
                      name="license_expires"
                      value={employeeForm.license_expires}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Einstellungsdatum:</label>
                    <input
                      type="date"
                      name="hire_date"
                      value={employeeForm.hire_date}
                      onChange={handleEmployeeChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Sicherheitsstufe:</label>
                    <select
                      name="security_clearance_level"
                      value={employeeForm.security_clearance_level}
                      onChange={handleEmployeeChange}
                      style={styles.select}
                    >
                      <option value={1}>🔓 Stufe 1 - Standard</option>
                      <option value={2}>🔒 Stufe 2 - Erweitert</option>
                      <option value={3}>🔐 Stufe 3 - Vertraulich</option>
                      <option value={4}>🏛️ Stufe 4 - Geheim</option>
                      <option value={5}>👑 Stufe 5 - Streng geheim</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="is_active_employee"
                      checked={employeeForm.is_active_employee}
                      onChange={handleEmployeeChange}
                      style={styles.checkbox}
                    />
                    ✅ Aktiver Mitarbeiter
                  </label>
                  
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="uses_bulletin_board"
                      checked={employeeForm.uses_bulletin_board}
                      onChange={handleEmployeeChange}
                      style={styles.checkbox}
                    />
                    📋 Nutzt digitales Brett
                  </label>
                  
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="can_drive_company_vehicles"
                      checked={employeeForm.can_drive_company_vehicles}
                      onChange={handleEmployeeChange}
                      style={styles.checkbox}
                    />
                    🚗 Darf Firmenwagen fahren
                  </label>
                  
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="has_key_access"
                      checked={employeeForm.has_key_access}
                      onChange={handleEmployeeChange}
                      style={styles.checkbox}
                    />
                    🗝️ Hat Schlüsselzugang
                  </label>
                </div>

                <div style={styles.buttonGroup}>
                  <button type="submit" style={styles.saveButton}>
                    💾 Speichern
                  </button>
                  <button type="button" style={styles.cancelButton} onClick={resetEmployeeForm}>
                    ❌ Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Kontakt Formular Modal */}
        {showContactForm && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                {editingContact ? '✏️ Kontakt bearbeiten' : '➕ Neuen Kontakt hinzufügen'}
              </div>
              
              <form onSubmit={handleContactSubmit}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Name *:</label>
                    <input
                      type="text"
                      name="name"
                      value={contactForm.name}
                      onChange={handleContactChange}
                      style={styles.input}
                      required
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Firma:</label>
                    <input
                      type="text"
                      name="company"
                      value={contactForm.company}
                      onChange={handleContactChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Position:</label>
                    <input
                      type="text"
                      name="position_title"
                      value={contactForm.position_title}
                      onChange={handleContactChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Telefon:</label>
                    <input
                      type="tel"
                      name="phone"
                      value={contactForm.phone}
                      onChange={handleContactChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Handy:</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={contactForm.mobile}
                      onChange={handleContactChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>E-Mail:</label>
                    <input
                      type="email"
                      name="email"
                      value={contactForm.email}
                      onChange={handleContactChange}
                      style={styles.input}
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Kontakttyp:</label>
                    <select
                      name="contact_type"
                      value={contactForm.contact_type}
                      onChange={handleContactChange}
                      style={styles.select}
                    >
                      {contactTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Kategorie:</label>
                    <input
                      type="text"
                      name="category"
                      value={contactForm.category}
                      onChange={handleContactChange}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Notizen:</label>
                  <textarea
                    name="notes"
                    value={contactForm.notes}
                    onChange={handleContactChange}
                    style={{...styles.input, height: '80px', resize: 'vertical'}}
                  />
                </div>

                <div>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="is_emergency_contact"
                      checked={contactForm.is_emergency_contact}
                      onChange={handleContactChange}
                      style={styles.checkbox}
                    />
                    🆘 Notfallkontakt
                  </label>
                </div>

                <div style={styles.buttonGroup}>
                  <button type="submit" style={styles.saveButton}>
                    💾 Speichern
                  </button>
                  <button type="button" style={styles.cancelButton} onClick={resetContactForm}>
                    ❌ Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeManagement;