// client/src/pages/BirthdayList.js - Mit zentraler Mitarbeiterverwaltung und Filteroptionen
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import { Link } from 'react-router-dom';

const BirthdayList = ({ kiosk = false }) => {
  const [employees, setEmployees] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    birthday: '',
    department: ''
  });
  const [filterCategory, setFilterCategory] = useState('all');
  const [timeRange, setTimeRange] = useState('30'); // Neuer State für Zeitraum

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingEmployee) {
        await axios.put(`/api/employees/${editingEmployee.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/employees', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Mitarbeiters');
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      birthday: employee.birthday,
      department: employee.department || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Mitarbeiters');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      birthday: '',
      department: ''
    });
    setShowForm(false);
    setEditingEmployee(null);
  };

  const getFilteredEmployees = () => {
    if (filterCategory === 'all') return employees.filter(emp => emp.is_active_employee); // Nur aktive in "alle"
    if (filterCategory === 'bulletin_board') {
      // Alle Lager-Mitarbeiter - konsistent mit anderen Listen
      return employees.filter(emp => 
        emp.position_title?.toLowerCase().includes('lager') ||
        emp.department?.toLowerCase().includes('lager') ||
        emp.work_location === 'lager'
      );
    }
    if (filterCategory === 'büro') return employees.filter(emp => emp.work_location === 'büro' && emp.is_active_employee);
    if (filterCategory === 'management') return employees.filter(emp => emp.department === 'Management' && emp.is_active_employee);
    if (filterCategory === 'aktiv') return employees.filter(emp => emp.is_active_employee);
    if (filterCategory === 'ehemalige') return employees.filter(emp => 
      !emp.is_active_employee || 
      emp.employee_type === 'ehemalig' || 
      emp.employment_status === 'gekündigt' ||
      emp.termination_date
    );
    if (filterCategory === 'extern') return employees.filter(emp => emp.employee_type === 'extern' && emp.is_active_employee);
    return employees.filter(emp => emp.department === filterCategory && emp.is_active_employee);
  };

  const getUpcomingBirthdays = () => {
    const today = new Date();
    let targetDate;
    
    if (timeRange === 'all') {
      // Alle Geburtstage des gesamten Jahres
      targetDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    } else {
      // Spezifische Anzahl Tage
      const days = parseInt(timeRange);
      targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days);
    }
    
    const filteredEmployees = getFilteredEmployees();
    
    return filteredEmployees.filter(employee => {
      if (!employee.birthday) return false;
      
      const birthday = new Date(employee.birthday);
      const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
      const nextYearBirthday = new Date(today.getFullYear() + 1, birthday.getMonth(), birthday.getDate());
      
      if (timeRange === 'all') {
        return true; // Alle Geburtstage zeigen
      }
      
      return (thisYearBirthday >= today && thisYearBirthday <= targetDate) ||
             (nextYearBirthday >= today && nextYearBirthday <= targetDate);
    }).sort((a, b) => {
      const aBirthday = new Date(a.birthday);
      const bBirthday = new Date(b.birthday);
      const aThisYear = new Date(today.getFullYear(), aBirthday.getMonth(), aBirthday.getDate());
      const bThisYear = new Date(today.getFullYear(), bBirthday.getMonth(), bBirthday.getDate());
      
      if (aThisYear < today) aThisYear.setFullYear(today.getFullYear() + 1);
      if (bThisYear < today) bThisYear.setFullYear(today.getFullYear() + 1);
      
      return aThisYear - bThisYear;
    });
  };

  const formatBirthday = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long'
    });
  };

  const getAge = (birthday) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age + 1; // Next birthday age
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

  const upcomingBirthdays = getUpcomingBirthdays();

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
    birthdayCard: {
      backgroundColor: 'white',
      borderRadius: kiosk ? '20px' : '10px',
      padding: kiosk ? '40px' : '25px',
      marginBottom: kiosk ? '30px' : '15px',
      boxShadow: kiosk ? '0 8px 32px rgba(0,0,0,0.1)' : '0 4px 8px rgba(0,0,0,0.1)',
      border: '3px solid #f39c12',
      transition: 'transform 0.3s ease',
    },
    birthdayHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: kiosk ? '20px' : '10px',
    },
    birthdayIcon: {
      fontSize: kiosk ? '48px' : '32px',
      marginRight: kiosk ? '20px' : '15px',
    },
    birthdayName: {
      fontSize: kiosk ? '36px' : '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    birthdayDate: {
      fontSize: kiosk ? '24px' : '18px',
      color: '#f39c12',
      fontWeight: '500',
      marginBottom: kiosk ? '10px' : '5px',
    },
    birthdayDepartment: {
      fontSize: kiosk ? '20px' : '16px',
      color: '#7f8c8d',
      marginBottom: kiosk ? '10px' : '5px',
    },
    birthdayAge: {
      fontSize: kiosk ? '20px' : '16px',
      color: '#27ae60',
      fontWeight: 'bold',
    },
    statusBadge: {
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 'bold',
      color: 'white',
      backgroundColor: '#27ae60',
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', fontSize: '18px', color: '#7f8c8d', padding: '50px' }}>
          Lade Mitarbeiterdaten...
        </div>
      </Layout>
    );
  }

  if (kiosk) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/kiosk" style={styles.backButton}>← Zurück zum Hauptmenü</a>
          <h1 style={styles.title}>🎂 Anstehende Geburtstage</h1>
        </div>
        
        {upcomingBirthdays.length === 0 ? (
          <div style={{
            textAlign: 'center',
            fontSize: kiosk ? '32px' : '18px',
            color: '#7f8c8d',
            padding: '100px'
          }}>
            Keine Geburtstage in den nächsten 30 Tagen
          </div>
        ) : (
          upcomingBirthdays.map(employee => (
            <div key={employee.id} style={styles.birthdayCard}>
              <div style={styles.birthdayHeader}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={styles.birthdayIcon}>🎉</span>
                  <div>
                    <span style={styles.birthdayName}>{employee.name}</span>
                    <div style={styles.birthdayDepartment}>
                      {getDepartmentIcon(employee.department)} {employee.department}
                    </div>
                  </div>
                </div>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: employee.is_active_employee ? '#27ae60' : '#e74c3c'
                }}>
                  {getEmployeeStatusIcon(employee)} {employee.employment_status}
                </div>
              </div>
              <div style={styles.birthdayDate}>
                {formatBirthday(employee.birthday)}
              </div>
              <div style={styles.birthdayAge}>
                Wird {getAge(employee.birthday)} Jahre alt
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>🎂 Geburtstagsliste</h1>
      </div>

      <Link 
        to="/admin/employees" 
        style={styles.linkToManagement}
      >
        👥 Zur zentralen Mitarbeiterverwaltung
      </Link>

      <div style={styles.filterSection}>
        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>📅 Zeitraum:</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { value: '7', label: '📅 Nächste 7 Tage' },
            { value: '14', label: '📅 Nächste 2 Wochen' },
            { value: '30', label: '📅 Nächste 30 Tage' },
            { value: '60', label: '📅 Nächste 2 Monate' },
            { value: '90', label: '📅 Nächste 3 Monate' },
            { value: 'all', label: '📅 Alle Geburtstage' }
          ].map(time => (
            <button
              key={time.value}
              style={{
                ...styles.filterButton,
                ...(timeRange === time.value ? styles.activeFilter : {})
              }}
              onClick={() => setTimeRange(time.value)}
            >
              {time.label}
            </button>
          ))}
        </div>
        
        <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>🔍 Filter:</h3>
        <div style={styles.filterButtons}>
          {[
            { key: 'all', label: '👥 Alle aktiven Mitarbeiter', count: employees.filter(e => e.is_active_employee).length },
            { key: 'aktiv', label: '✅ Nur aktive', count: employees.filter(e => e.is_active_employee).length },
            { key: 'bulletin_board', label: '📋 Lager-Mitarbeiter', count: employees.filter(e => 
              e.position_title?.toLowerCase().includes('lager') ||
              e.department?.toLowerCase().includes('lager') ||
              e.work_location === 'lager'
            ).length },
            { key: 'büro', label: '🏢 Büro', count: employees.filter(e => e.work_location === 'büro' && e.is_active_employee).length },
            { key: 'management', label: '👑 Management', count: employees.filter(e => e.department === 'Management' && e.is_active_employee).length },
            { key: 'extern', label: '🔗 Externe', count: employees.filter(e => e.employee_type === 'extern' && e.is_active_employee).length },
            { key: 'ehemalige', label: '❌ Ehemalige', count: employees.filter(e => 
              !e.is_active_employee || 
              e.employee_type === 'ehemalig' || 
              e.employment_status === 'gekündigt' ||
              e.termination_date
            ).length }
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
          📊 Gezeigt werden nur Geburtstage der {
            timeRange === 'all' ? 'gesamten Kategorie' : 
            timeRange === '7' ? 'nächsten 7 Tage' :
            timeRange === '14' ? 'nächsten 2 Wochen' :
            timeRange === '30' ? 'nächsten 30 Tage' :
            timeRange === '60' ? 'nächsten 2 Monate' :
            timeRange === '90' ? 'nächsten 3 Monate' : 'gewählten Zeitspanne'
          } aus der gewählten Kategorie
        </div>
      </div>

      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#f39c12' }}>
          🎉 Anstehende Geburtstage ({upcomingBirthdays.length})
          {timeRange !== 'all' && (
            <span style={{ fontSize: '16px', color: '#7f8c8d', fontWeight: 'normal' }}>
              {' '}- {
                timeRange === '7' ? 'Nächste 7 Tage' :
                timeRange === '14' ? 'Nächste 2 Wochen' :
                timeRange === '30' ? 'Nächste 30 Tage' :
                timeRange === '60' ? 'Nächste 2 Monate' :
                timeRange === '90' ? 'Nächste 3 Monate' : 'Gewählter Zeitraum'
              }
            </span>
          )}
        </h2>
        
        {upcomingBirthdays.length === 0 ? (
          <p style={{ fontSize: '18px', color: '#7f8c8d', textAlign: 'center', padding: '40px' }}>
            {filterCategory === 'all' 
              ? `Keine Geburtstage ${timeRange === 'all' ? 'in der gesamten Liste' : 
                  timeRange === '7' ? 'in den nächsten 7 Tagen' :
                  timeRange === '14' ? 'in den nächsten 2 Wochen' :
                  timeRange === '30' ? 'in den nächsten 30 Tagen' :
                  timeRange === '60' ? 'in den nächsten 2 Monaten' :
                  timeRange === '90' ? 'in den nächsten 3 Monaten' : 'im gewählten Zeitraum'}`
              : `Keine Geburtstage in der Kategorie "${filterCategory}" ${timeRange === 'all' ? '' : 
                  timeRange === '7' ? 'in den nächsten 7 Tagen' :
                  timeRange === '14' ? 'in den nächsten 2 Wochen' :
                  timeRange === '30' ? 'in den nächsten 30 Tagen' :
                  timeRange === '60' ? 'in den nächsten 2 Monaten' :
                  timeRange === '90' ? 'in den nächsten 3 Monaten' : 'im gewählten Zeitraum'}`
            }
          </p>
        ) : (
          upcomingBirthdays.map(employee => (
            <div key={employee.id} style={styles.birthdayCard}>
              <div style={styles.birthdayHeader}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={styles.birthdayIcon}>🎉</span>
                  <div>
                    <span style={styles.birthdayName}>{employee.name}</span>
                    <div style={styles.birthdayDepartment}>
                      {getDepartmentIcon(employee.department)} {employee.department} • {employee.position_title}
                    </div>
                  </div>
                </div>
                <div style={{
                  ...styles.statusBadge,
                  backgroundColor: employee.is_active_employee ? '#27ae60' : '#e74c3c'
                }}>
                  {getEmployeeStatusIcon(employee)} {employee.employment_status}
                </div>
              </div>
              <div style={styles.birthdayDate}>
                {formatBirthday(employee.birthday)}
              </div>
              <div style={styles.birthdayAge}>
                Wird {getAge(employee.birthday)} Jahre alt
              </div>
            </div>
          ))
        )}
      </div>

      {filterCategory === 'all' && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '10px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '20px'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#2c3e50' }}>
            📊 Statistiken
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>
                {employees.filter(e => e.birthday).length}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Mitarbeiter mit Geburtstag</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                {employees.filter(e => e.is_active_employee && e.birthday).length}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Aktive mit Geburtstag</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                {upcomingBirthdays.length}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Nächste 30 Tage</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#ecf0f1', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9b59b6' }}>
                {contacts.filter(c => c.birthday).length}
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Externe Kontakte</div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default BirthdayList; 