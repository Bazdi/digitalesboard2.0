// client/src/pages/Organigramm.js - ERWEITERT mit One-Click-Mitarbeiter-Hinzufügung
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DragDropOrgChart from '../components/DragDropOrgChart';
import axios from 'axios';

const Organigramm = ({ kiosk = false }) => {
  const [orgData, setOrgData] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  // NEUE States für erweiterte Funktionalität
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
  const [selectedParentNode, setSelectedParentNode] = useState(null);
  const [quickAddMode, setQuickAddMode] = useState(false);
  
  // Filter für Mitarbeiter-Auswahl
  const [employeeFilters, setEmployeeFilters] = useState({
    showActive: true,           // Nur aktive Mitarbeiter
    showBulletinBoard: false,   // Lagermitarbeiter (nutzen digitales Brett)
    showOffice: false,          // Büromitarbeiter
    showField: false,           // Außendienst
    showDrivers: false,         // Kann Firmenwagen fahren
    showInactive: false         // Inaktive Mitarbeiter
  });

  const [formData, setFormData] = useState({
    name: '',
    position_title: '',
    department: '',
    avatar: null
  });

  const departments = [
    'Management',
    'IT', 
    'Marketing',
    'HR',
    'Finanzen',
    'Vertrieb',
    'Produktion',
    'Design',
    'Support',
    'Lager' // Hinzugefügt für Lagermitarbeiter
  ];

  useEffect(() => {
    fetchOrgData();
    fetchAllEmployees();
    
    if (kiosk) {
      const interval = setInterval(() => {
        fetchOrgData();
        fetchAllEmployees();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [kiosk]);

  const fetchOrgData = async () => {
    try {
      const response = await axios.get('/api/orgchart');
      setOrgData(response.data);
    } catch (error) {
      console.error('Fehler beim Laden des Organigramms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setAllEmployees(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
    }
  };

  // NEUE Funktion: Mitarbeiter direkt zum Organigramm hinzufügen
  const handleQuickAddEmployee = async (employee, parentId = null) => {
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Verwende Mitarbeiterdaten aus der employees-Tabelle
      formDataToSend.append('name', employee.name);
      formDataToSend.append('position_title', employee.position_title || 'Mitarbeiter');
      formDataToSend.append('department', employee.department || getDepartmentFromWorkLocation(employee.work_location));
      formDataToSend.append('employee_id', employee.id); // Verknüpfung zur employees-Tabelle
      
      // Hierarchie-Position berechnen
      if (parentId) {
        // Als Untergebener hinzufügen
        const parentNode = orgData.find(item => item.id === parentId);
        const parentLevel = parentNode ? parentNode.level : 0;
        const childrenCount = orgData.filter(item => item.parent_id === parentId).length;
        
        formDataToSend.append('parent_id', parentId);
        formDataToSend.append('level', parentLevel + 1);
        formDataToSend.append('position', childrenCount);
      } else {
        // Als oberste Ebene hinzufügen
        const topLevelCount = orgData.filter(item => !item.parent_id || item.parent_id === null).length;
        formDataToSend.append('level', '0');
        formDataToSend.append('parent_id', '');
        formDataToSend.append('position', topLevelCount);
      }
      
      await axios.post('/api/orgchart', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      await fetchOrgData();
      setShowEmployeeSelector(false);
      setSelectedParentNode(null);
      
      // Erfolgs-Feedback
      alert(`✅ ${employee.name} wurde erfolgreich zum Organigramm hinzugefügt!`);
      
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Mitarbeiters:', error);
      alert(`❌ Fehler beim Hinzufügen von ${employee.name}: ${error.response?.data?.error || error.message}`);
    }
  };

  // Hilfsfunktion: Abteilung aus Arbeitsort ableiten
  const getDepartmentFromWorkLocation = (workLocation) => {
    const locationMapping = {
      'lager': 'Lager',
      'büro': 'Administration',
      'außendienst': 'Vertrieb',
      'produktion': 'Produktion'
    };
    return locationMapping[workLocation] || 'Allgemein';
  };

  // NEUE Funktion: Mitarbeiter als Untergebenen hinzufügen
  const handleAddSubordinate = (parentNode) => {
    setSelectedParentNode(parentNode);
    setShowEmployeeSelector(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Basis-Daten hinzufügen
      formDataToSend.append('name', formData.name);
      formDataToSend.append('position_title', formData.position_title);
      formDataToSend.append('department', formData.department);
      
      // Für neue Mitarbeiter: standardmäßig oberste Ebene
      if (!editingEmployee) {
        const topLevelCount = orgData.filter(item => !item.parent_id || item.parent_id === null).length;
        formDataToSend.append('level', '0');
        formDataToSend.append('parent_id', '');
        formDataToSend.append('position', topLevelCount);
      } else {
        // Bei Bearbeitung: bestehende Hierarchie-Daten beibehalten
        formDataToSend.append('level', editingEmployee.level || 0);
        formDataToSend.append('parent_id', editingEmployee.parent_id || '');
        formDataToSend.append('position', editingEmployee.position || 0);
      }
      
      // Avatar hinzufügen falls vorhanden
      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }
      
      if (editingEmployee) {
        await axios.put(`/api/orgchart/${editingEmployee.id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/orgchart', formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      resetForm();
      fetchOrgData();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Mitarbeiters');
    }
  };

  const handleUpdateHierarchy = async (updatedItem) => {
    try {
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', updatedItem.name);
      formDataToSend.append('position_title', updatedItem.position_title);
      formDataToSend.append('department', updatedItem.department);
      formDataToSend.append('level', updatedItem.level);
      formDataToSend.append('parent_id', updatedItem.parent_id || '');
      formDataToSend.append('position', updatedItem.position);
      
      await axios.put(`/api/orgchart/${updatedItem.id}`, formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Daten neu laden
      await fetchOrgData();
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Hierarchie:', error);
      throw error;
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      position_title: employee.position_title,
      department: employee.department || '',
      avatar: null
    });
    setPreviewImage(employee.avatar ? `/uploads/${employee.avatar}` : null);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    // Prüfe ob Mitarbeiter Untergebene hat
    const hasChildren = orgData.some(item => item.parent_id === id);
    
    if (hasChildren) {
      if (!window.confirm('Dieser Mitarbeiter hat Untergebene. Sollen alle untergeordneten Mitarbeiter ebenfalls gelöscht werden?')) {
        return;
      }
    } else {
      if (!window.confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) {
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/orgchart/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrgData();
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Mitarbeiters');
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'avatar' && files && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, avatar: file }));
      
      // Preview erstellen
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position_title: '',
      department: '',
      avatar: null
    });
    setEditingEmployee(null);
    setShowForm(false);
    setPreviewImage(null);
  };

  const getDepartmentIcon = (department) => {
    const icons = {
      'Management': '👑',
      'IT': '��',
      'Marketing': '📢',
      'HR': '👥',
      'Finanzen': '💰',
      'Vertrieb': '📈',
      'Produktion': '🏭',
      'Design': '🎨',
      'Support': '🎧',
      'Lager': '📦'
    };
    return icons[department] || '🏢';
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // KORRIGIERTE Filterfunktion für Mitarbeiter
  const getFilteredEmployees = () => {
    return allEmployees.filter(employee => {
      // Prüfe ob Mitarbeiter bereits im Organigramm ist
      const isAlreadyInOrg = orgData.some(orgItem => 
        orgItem.employee_id === employee.id || 
        orgItem.name === employee.name
      );
      
      if (isAlreadyInOrg) return false;

      // Standard: Zeige nur aktive Mitarbeiter die das digitale Brett nutzen
      // WICHTIG: Alle Lagermitarbeiter = digitale Brett Mitarbeiter (kein Unterschied!)
      if (!Object.values(employeeFilters).some(filter => filter)) {
        return employee.is_active_employee && 
               (employee.uses_bulletin_board || employee.work_location === 'lager');
      }

      // Prüfe jeden Filter
      const matchesFilters = [];

      if (employeeFilters.showActive) {
        matchesFilters.push(employee.is_active_employee);
      }

      if (employeeFilters.showBulletinBoard) {
        // Lager = digitales Brett (beide sind identisch!)
        // Alle Lagermitarbeiter nutzen automatisch das digitale Brett
        matchesFilters.push(
          employee.uses_bulletin_board || 
          employee.work_location === 'lager'
        );
      }

      if (employeeFilters.showOffice) {
        matchesFilters.push(employee.work_location === 'büro');
      }

      if (employeeFilters.showField) {
        matchesFilters.push(employee.work_location === 'außendienst');
      }

      if (employeeFilters.showDrivers) {
        matchesFilters.push(employee.can_drive_company_vehicles);
      }

      if (employeeFilters.showInactive) {
        matchesFilters.push(!employee.is_active_employee);
      }

      // Mitarbeiter wird angezeigt, wenn er mindestens einen Filter erfüllt
      return matchesFilters.some(match => match);
    });
  };

  // Handler für Filter-Checkboxen
  const handleFilterChange = (filterName) => {
    setEmployeeFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // NEUE Komponente: Mitarbeiter-Auswahl Modal
  const EmployeeSelectorModal = () => {
    if (!showEmployeeSelector) return null;

    const filteredEmployees = getFilteredEmployees();

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '15px',
          padding: '30px',
          maxWidth: '800px',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px',
            paddingBottom: '15px',
            borderBottom: '2px solid #ecf0f1'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#2c3e50',
              margin: 0
            }}>
              👥 Mitarbeiter zum Organigramm hinzufügen
              {selectedParentNode && (
                <div style={{ fontSize: '16px', color: '#7f8c8d', marginTop: '5px' }}>
                  Als Untergebener von: <strong>{selectedParentNode.name}</strong>
                </div>
              )}
            </h2>
            
            <button
              onClick={() => {
                setShowEmployeeSelector(false);
                setSelectedParentNode(null);
              }}
              style={{
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>

          {/* Filter-Checkboxen */}
          <div style={{
            marginBottom: '25px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '10px',
            border: '1px solid #ecf0f1'
          }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#2c3e50' }}>
              🔍 Mitarbeiter-Filter
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {[
                { key: 'showActive', label: '✅ Nur aktive Mitarbeiter', icon: '✅' },
                { key: 'showBulletinBoard', label: '�� Lagermitarbeiter (nutzen Digitales Brett)', icon: '📦' },
                { key: 'showOffice', label: '🏢 Büromitarbeiter', icon: '🏢' },
                { key: 'showField', label: '🚗 Außendienst', icon: '🚗' },
                { key: 'showDrivers', label: '🚙 Fahrzeugberechtigung', icon: '🚙' },
                { key: 'showInactive', label: '❌ Inaktive Mitarbeiter', icon: '❌' }
              ].map(filter => (
                <label key={filter.key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: employeeFilters[filter.key] ? '#e8f4fd' : 'white',
                  border: `1px solid ${employeeFilters[filter.key] ? '#3498db' : '#ecf0f1'}`,
                  transition: 'all 0.3s ease'
                }}>
                  <input
                    type="checkbox"
                    checked={employeeFilters[filter.key]}
                    onChange={() => handleFilterChange(filter.key)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {filter.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Mitarbeiter-Liste */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#2c3e50' }}>
              📋 Verfügbare Mitarbeiter ({filteredEmployees.length})
            </h3>
            
            {filteredEmployees.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#7f8c8d',
                backgroundColor: '#f8f9fa',
                borderRadius: '10px',
                border: '2px dashed #bdc3c7'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📭</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                  Keine Mitarbeiter verfügbar
                </div>
                <div style={{ fontSize: '14px' }}>
                  Alle Mitarbeiter sind bereits im Organigramm oder entsprechen nicht den Filterkriterien.
                </div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '15px',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '10px'
              }}>
                {filteredEmployees.map(employee => (
                  <div
                    key={employee.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '20px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '10px',
                      border: '2px solid #ecf0f1',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e8f4fd';
                      e.currentTarget.style.borderColor = '#3498db';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#ecf0f1';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        backgroundColor: '#3498db',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}>
                        {getInitials(employee.name)}
                      </div>
                      
                      <div>
                        <div style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#2c3e50',
                          marginBottom: '5px'
                        }}>
                          {employee.name}
                        </div>
                        
                        <div style={{
                          fontSize: '14px',
                          color: '#7f8c8d',
                          display: 'flex',
                          gap: '15px'
                        }}>
                          <span>📋 {employee.position_title || 'Mitarbeiter'}</span>
                          <span>🏢 {employee.department || 'Nicht zugewiesen'}</span>
                          <span>📍 {employee.work_location || 'Nicht angegeben'}</span>
                        </div>
                        
                        <div style={{
                          fontSize: '12px',
                          color: '#95a5a6',
                          marginTop: '5px',
                          display: 'flex',
                          gap: '10px'
                        }}>
                          {employee.uses_bulletin_board && <span>📱 Digitales Brett</span>}
                          {employee.can_drive_company_vehicles && <span>🚗 Fahrer</span>}
                          {employee.has_key_access && <span>🔑 Schlüsselzugang</span>}
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleQuickAddEmployee(employee, selectedParentNode?.id)}
                      style={{
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#219a52';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#27ae60';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span>➕</span>
                      Hinzufügen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
    quickAddSection: {
      backgroundColor: 'white',
      padding: '25px',
      borderRadius: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      marginBottom: '30px',
      border: '2px solid #ecf0f1',
    },
    quickAddTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#2c3e50',
      textAlign: 'center',
    },
    form: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '30px',
      alignItems: 'start',
    },
    leftColumn: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '20px',
    },
    rightColumn: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '16px',
      fontWeight: '600',
      color: '#34495e',
    },
    input: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      outline: 'none',
    },
    select: {
      width: '100%',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      outline: 'none',
      backgroundColor: 'white',
    },
    avatarSection: {
      textAlign: 'center',
    },
    avatarPreview: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      backgroundColor: '#ecf0f1',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '15px',
      border: '3px solid #3498db',
      overflow: 'hidden',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    avatarPlaceholder: {
      fontSize: '36px',
      color: '#7f8c8d',
    },
    fileInputWrapper: {
      position: 'relative',
      display: 'inline-block',
      cursor: 'pointer',
    },
    fileInput: {
      position: 'absolute',
      opacity: 0,
      width: '100%',
      height: '100%',
      cursor: 'pointer',
    },
    fileInputButton: {
      backgroundColor: '#3498db',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.3s ease',
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'center',
      gap: '15px',
      marginTop: '20px',
      gridColumn: '1 / -1',
    },
    button: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      fontSize: '16px',
      fontWeight: 'bold',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
    },
    helpBox: {
      backgroundColor: '#e8f4fd',
      border: '2px solid #3498db',
      borderRadius: '15px',
      padding: '20px',
      marginBottom: '30px',
      textAlign: 'center',
    },
    helpTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '10px',
    },
    helpText: {
      fontSize: '14px',
      color: '#34495e',
      lineHeight: '1.5',
    },
    employeeGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '15px',
      marginTop: '30px',
    },
    employeeCard: {
      backgroundColor: 'white',
      borderRadius: '10px',
      padding: '15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '2px solid #ecf0f1',
      transition: 'all 0.3s ease',
      textAlign: 'center',
    },
    employeeAvatar: {
      width: '60px',
      height: '60px',
      borderRadius: '50%',
      backgroundColor: '#3498db',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontWeight: 'bold',
      margin: '0 auto 10px',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
    employeeName: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '5px',
    },
    employeeTitle: {
      fontSize: '14px',
      color: '#3498db',
      marginBottom: '5px',
    },
    employeeDepartment: {
      fontSize: '12px',
      color: '#7f8c8d',
      marginBottom: '10px',
    },
    employeeActions: {
      display: 'flex',
      gap: '5px',
      justifyContent: 'center',
    },
    editButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '12px',
    },
    deleteButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '12px',
    }
  };

  if (kiosk) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/kiosk" style={styles.backButton}>← Zurück zum Hauptmenü</a>
          <h1 style={styles.title}>🏢 Organigramm</h1>
        </div>
        
        <DragDropOrgChart 
          data={orgData} 
          onUpdateHierarchy={handleUpdateHierarchy}
          onAddSubordinate={handleAddSubordinate}
          kiosk={true} 
        />
      </div>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Organigramm verwalten</h1>
      </div>

      <div style={styles.helpBox}>
        <div style={styles.helpTitle}>🎯 So einfach geht's!</div>
        <div style={styles.helpText}>
          <strong>1.</strong> Neuen Mitarbeiter unten hinzufügen<br/>
          <strong>2.</strong> Per Drag & Drop im Organigramm an die richtige Stelle ziehen<br/>
          <strong>3.</strong> Fertig! Die Hierarchie wird automatisch berechnet
        </div>
      </div>

      <div style={styles.quickAddSection}>
        <div style={styles.quickAddTitle}>
          {editingEmployee ? '✏️ Mitarbeiter bearbeiten' : '➕ Neuen Mitarbeiter hinzufügen'}
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.leftColumn}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Name:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                placeholder="z.B. Max Mustermann"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Position/Titel:</label>
              <input
                type="text"
                name="position_title"
                value={formData.position_title}
                onChange={handleChange}
                style={styles.input}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                placeholder="z.B. Marketing Manager"
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Abteilung:</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                style={styles.select}
                onFocus={(e) => e.target.style.borderColor = '#3498db'}
                onBlur={(e) => e.target.style.borderColor = '#ecf0f1'}
                required
              >
                <option value="">Abteilung wählen</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>
                    {getDepartmentIcon(dept)} {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={styles.rightColumn}>
            <div style={styles.avatarSection}>
              <label style={styles.label}>Profilbild:</label>
              <div 
                style={{
                  ...styles.avatarPreview,
                  backgroundImage: previewImage ? `url(${previewImage})` : 'none'
                }}
              >
                {!previewImage && (
                  <div style={styles.avatarPlaceholder}>
                    {formData.name ? getInitials(formData.name) : '👤'}
                  </div>
                )}
              </div>
              
              <div style={styles.fileInputWrapper}>
                <input
                  type="file"
                  name="avatar"
                  onChange={handleChange}
                  style={styles.fileInput}
                  accept="image/*"
                />
                <button 
                  type="button"
                  style={styles.fileInputButton}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
                >
                  📷 Bild wählen
                </button>
              </div>
            </div>
          </div>
          
          <div style={styles.buttonGroup}>
            {editingEmployee && (
              <button
                type="button"
                onClick={resetForm}
                style={{...styles.button, ...styles.cancelButton}}
                onMouseOver={(e) => e.target.style.backgroundColor = '#7f8c8d'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#95a5a6'}
              >
                Abbrechen
              </button>
            )}
            <button
              type="submit"
              style={styles.button}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
            >
              {editingEmployee ? '💾 Speichern' : '➕ Hinzufügen'}
            </button>
          </div>
        </form>
      </div>

      <DragDropOrgChart 
        data={orgData} 
        onUpdateHierarchy={handleUpdateHierarchy}
        onAddSubordinate={handleAddSubordinate}
        kiosk={false} 
      />

      <div>
        <h2 style={{ fontSize: '24px', marginBottom: '20px', color: '#2c3e50', textAlign: 'center' }}>
          👥 Alle Mitarbeiter ({getFilteredEmployees().length} von {allEmployees.length}) - Zentrale Mitarbeiterverwaltung
        </h2>
        <div style={{ 
          fontSize: '14px', 
          color: '#7f8c8d', 
          textAlign: 'center', 
          marginBottom: '20px',
          backgroundColor: '#e8f4fd',
          padding: '10px',
          borderRadius: '8px'
        }}>
          💡 Diese Liste zeigt ALLE Mitarbeiter aus der zentralen Verwaltung. 
          Für das Organigramm oben verwenden Sie das Formular zum Hinzufügen.
        </div>

        {/* NEUE Filter-Checkboxen */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '2px solid #ecf0f1'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#2c3e50', 
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            🔍 Mitarbeiter filtern
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: employeeFilters.showActive ? '#e8f5e8' : 'transparent',
              border: employeeFilters.showActive ? '1px solid #27ae60' : '1px solid transparent'
            }}>
              <input
                type="checkbox"
                checked={employeeFilters.showActive}
                onChange={() => handleFilterChange('showActive')}
                style={{ cursor: 'pointer' }}
              />
              <span>✅ Nur aktive Mitarbeiter ({allEmployees.filter(e => e.is_active_employee).length})</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: employeeFilters.showBulletinBoard ? '#e8f4fd' : 'transparent',
              border: employeeFilters.showBulletinBoard ? '1px solid #3498db' : '1px solid transparent'
            }}>
              <input
                type="checkbox"
                checked={employeeFilters.showBulletinBoard}
                onChange={() => handleFilterChange('showBulletinBoard')}
                style={{ cursor: 'pointer' }}
              />
              <span>�� Lagermitarbeiter (nutzen Digitales Brett) ({allEmployees.filter(e => e.uses_bulletin_board || e.work_location === 'lager').length})</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: employeeFilters.showOffice ? '#f4f6f7' : 'transparent',
              border: employeeFilters.showOffice ? '1px solid #7f8c8d' : '1px solid transparent'
            }}>
              <input
                type="checkbox"
                checked={employeeFilters.showOffice}
                onChange={() => handleFilterChange('showOffice')}
                style={{ cursor: 'pointer' }}
              />
              <span>🏢 Büromitarbeiter ({allEmployees.filter(e => e.work_location === 'büro').length})</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: employeeFilters.showField ? '#eaf2f8' : 'transparent',
              border: employeeFilters.showField ? '1px solid #3498db' : '1px solid transparent'
            }}>
              <input
                type="checkbox"
                checked={employeeFilters.showField}
                onChange={() => handleFilterChange('showField')}
                style={{ cursor: 'pointer' }}
              />
              <span>🚗 Außendienst ({allEmployees.filter(e => e.work_location === 'außendienst').length})</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: employeeFilters.showDrivers ? '#e8f8f5' : 'transparent',
              border: employeeFilters.showDrivers ? '1px solid #1abc9c' : '1px solid transparent'
            }}>
              <input
                type="checkbox"
                checked={employeeFilters.showDrivers}
                onChange={() => handleFilterChange('showDrivers')}
                style={{ cursor: 'pointer' }}
              />
              <span>🚙 Kann Firmenwagen fahren ({allEmployees.filter(e => e.can_drive_company_vehicles).length})</span>
            </label>

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: employeeFilters.showInactive ? '#fdf2f2' : 'transparent',
              border: employeeFilters.showInactive ? '1px solid #e74c3c' : '1px solid transparent'
            }}>
              <input
                type="checkbox"
                checked={employeeFilters.showInactive}
                onChange={() => handleFilterChange('showInactive')}
                style={{ cursor: 'pointer' }}
              />
              <span>❌ Inaktive Mitarbeiter ({allEmployees.filter(e => !e.is_active_employee).length})</span>
            </label>
          </div>

          <div style={{ 
            fontSize: '12px', 
            color: '#7f8c8d', 
            textAlign: 'center', 
            marginTop: '15px',
            fontStyle: 'italic'
          }}>
            💡 Mehrere Filter können kombiniert werden. Ohne aktive Filter werden nur aktive Mitarbeiter angezeigt.
          </div>
        </div>

        <div style={styles.employeeGrid}>
          {getFilteredEmployees().map(employee => (
            <div 
              key={employee.id} 
              style={styles.employeeCard}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e8f4fd';
                e.currentTarget.style.borderColor = '#3498db';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#ecf0f1';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
            >
              <div style={styles.employeeAvatar}>
                {getInitials(employee.name)}
              </div>
              
              <div style={styles.employeeName}>{employee.name}</div>
              <div style={styles.employeeTitle}>{employee.position_title || 'Mitarbeiter'}</div>
              <div style={styles.employeeDepartment}>
                🏢 {employee.department || 'Nicht zugewiesen'} | 📍 {employee.work_location || 'Nicht angegeben'}
              </div>
              
              {/* Status-Badges */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                justifyContent: 'center',
                marginBottom: '10px'
              }}>
                {employee.uses_bulletin_board && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#e8f4fd',
                    color: '#3498db',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    border: '1px solid #3498db'
                  }}>📱 Digitales Brett</span>
                )}
                {employee.can_drive_company_vehicles && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#e8f8f5',
                    color: '#1abc9c',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    border: '1px solid #1abc9c'
                  }}>🚗 Fahrer</span>
                )}
                {employee.has_key_access && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#fdf2e9',
                    color: '#f39c12',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    border: '1px solid #f39c12'
                  }}>🔑 Schlüssel</span>
                )}
                {!employee.is_active_employee && (
                  <span style={{
                    fontSize: '10px',
                    backgroundColor: '#fdf2f2',
                    color: '#e74c3c',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    border: '1px solid #e74c3c'
                  }}>❌ Inaktiv</span>
                )}
              </div>
              
              <div style={styles.employeeActions}>
                {/* NEUE Quick-Add-Buttons */}
                <button
                  onClick={() => handleQuickAddEmployee(employee)}
                  style={{
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#219a52';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#27ae60';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Mitarbeiter zum Organigramm hinzufügen"
                >
                  <span>➕</span>
                  Zum Organigramm
                </button>
                
                {/* Bearbeiten-Button wenn bereits im Organigramm */}
                {orgData.some(orgItem => 
                  orgItem.employee_id === employee.id || 
                  orgItem.name === employee.name
                ) && (
                  <button
                    onClick={() => {
                      const orgEmployee = orgData.find(orgItem => 
                        orgItem.employee_id === employee.id || 
                        orgItem.name === employee.name
                      );
                      if (orgEmployee) handleEdit(orgEmployee);
                    }}
                    style={{
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#d68910';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f39c12';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title="Im Organigramm bearbeiten"
                  >
                    <span>✏️</span>
                    Im Organigramm
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* NEUE Quick-Add-Buttons oberhalb der Liste */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginTop: '30px',
          border: '2px solid #27ae60'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#2c3e50',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            🚀 Schnell-Aktionen
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <button
              onClick={() => setShowEmployeeSelector(true)}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                padding: '15px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#219a52';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#27ae60';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>👥</span>
              Mitarbeiter hinzufügen (oberste Ebene)
            </button>
            
            <button
              onClick={() => {
                const hasActiveFilter = Object.values(employeeFilters).some(filter => filter);
                if (!hasActiveFilter) {
                  // Setze Standard-Filter für Lager/Digitales Brett
                  setEmployeeFilters(prev => ({ ...prev, showBulletinBoard: true }));
                }
              }}
              style={{
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                padding: '15px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#2980b9';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3498db';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>📦</span>
              Lager-Mitarbeiter anzeigen
            </button>
            
            <button
              onClick={() => {
                // Alle Filter zurücksetzen - zeigt standardmäßig aktive Mitarbeiter
                setEmployeeFilters({
                  showActive: false,
                  showBulletinBoard: false,
                  showOffice: false,
                  showField: false,
                  showDrivers: false,
                  showInactive: false
                });
              }}
              style={{
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                padding: '15px 20px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#7f8c8d';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#95a5a6';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>🔄</span>
              Filter zurücksetzen
            </button>
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#7f8c8d',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            💡 <strong>Wichtiger Hinweis:</strong> Alle Lagermitarbeiter nutzen automatisch das digitale Brett. 
            Das digitale Brett ist speziell für das Lager konzipiert - daher gibt es keinen Unterschied zwischen beiden.
          </div>
        </div>
      </div>

      <EmployeeSelectorModal />
    </Layout>
  );
};

export default Organigramm;