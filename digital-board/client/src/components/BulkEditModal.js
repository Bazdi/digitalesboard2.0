import React, { useState } from 'react';
import axios from 'axios';

const BulkEditModal = ({ isOpen, onClose, selectedEmployees, onUpdate }) => {
  const [updates, setUpdates] = useState({});
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState('bulk'); // 'bulk' oder 'individual'
  const [individualUpdates, setIndividualUpdates] = useState({});

  const handleFieldChange = (field, value) => {
    setUpdates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const removeField = (field) => {
    const newUpdates = { ...updates };
    delete newUpdates[field];
    setUpdates(newUpdates);
  };

  const handleIndividualChange = (employeeId, field, value) => {
    setIndividualUpdates(prev => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editMode === 'bulk' && Object.keys(updates).length === 0) {
      alert('Bitte wählen Sie mindestens ein Feld zum Ändern aus.');
      return;
    }
    
    if (editMode === 'individual' && Object.keys(individualUpdates).length === 0) {
      alert('Bitte nehmen Sie mindestens eine Änderung vor.');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (editMode === 'bulk') {
        // Bulk-Update für alle ausgewählten Mitarbeiter
        const employee_ids = selectedEmployees.map(emp => emp.id);
        
        const response = await axios.patch('/api/employees/bulk', {
          employee_ids,
          updates
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        alert(`✅ ${response.data.updated_count} Mitarbeiter erfolgreich aktualisiert!`);
      } else {
        // Individual-Updates
        let updateCount = 0;
        
        for (const [employeeId, empUpdates] of Object.entries(individualUpdates)) {
          if (Object.keys(empUpdates).length > 0) {
            await axios.put(`/api/employees/${employeeId}`, {
              ...selectedEmployees.find(emp => emp.id.toString() === employeeId),
              ...empUpdates
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });
            updateCount++;
          }
        }
        
        alert(`✅ ${updateCount} Mitarbeiter individuell aktualisiert!`);
      }
      
      setUpdates({});
      setIndividualUpdates({});
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      alert('❌ Fehler beim Aktualisieren: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modal: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '30px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      borderBottom: '2px solid #e9ecef',
      paddingBottom: '15px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: 0
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '24px',
      cursor: 'pointer',
      color: '#95a5a6',
      padding: '5px'
    },
    selectedInfo: {
      backgroundColor: '#e8f4fd',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      border: '1px solid #3498db'
    },
    fieldGroup: {
      marginBottom: '20px'
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontWeight: 'bold',
      color: '#34495e'
    },
    addFieldSelect: {
      width: '100%',
      padding: '10px',
      border: '2px solid #bdc3c7',
      borderRadius: '6px',
      fontSize: '16px',
      marginBottom: '15px'
    },
    fieldItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      marginBottom: '10px',
      border: '1px solid #dee2e6'
    },
    fieldLabel: {
      minWidth: '200px',
      fontWeight: 'bold',
      color: '#495057'
    },
    fieldInput: {
      flex: 1,
      padding: '8px',
      border: '1px solid #ced4da',
      borderRadius: '4px'
    },
    removeButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '5px 10px',
      cursor: 'pointer',
      fontSize: '12px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      justifyContent: 'flex-end',
      marginTop: '25px',
      paddingTop: '20px',
      borderTop: '1px solid #dee2e6'
    },
    button: {
      padding: '12px 24px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'all 0.3s ease'
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
      color: 'white'
    },
    saveButton: {
      backgroundColor: '#27ae60',
      color: 'white'
    }
  };

  const fieldOptions = [
    { value: '', label: 'Feld auswählen...' },
    { value: 'uses_bulletin_board', label: '📋 Brett nutzen', type: 'boolean' },
    { value: 'can_drive_company_vehicles', label: '🚗 Fahren dürfen', type: 'boolean' },
    { value: 'driving_license_classes', label: '🪪 Führerscheinklassen', type: 'text' },
    { value: 'license_expires', label: '📅 Führerschein gültig bis', type: 'date' },
    { value: 'has_key_access', label: '🔑 Schlüsselzugang', type: 'boolean' },
    { value: 'work_location', label: '📍 Arbeitsort', type: 'select', options: [
      { value: 'büro', label: 'Büro' },
      { value: 'lager', label: 'Lager' },
      { value: 'außendienst', label: 'Außendienst' },
      { value: 'homeoffice', label: 'Homeoffice' }
    ]},
    { value: 'department', label: '🏢 Abteilung', type: 'select', options: [
      { value: 'Management', label: 'Management' },
      { value: 'IT', label: 'IT' },
      { value: 'Marketing', label: 'Marketing' },
      { value: 'HR', label: 'HR' },
      { value: 'Finanzen', label: 'Finanzen' },
      { value: 'Vertrieb', label: 'Vertrieb' },
      { value: 'Produktion', label: 'Produktion' },
      { value: 'Design', label: 'Design' },
      { value: 'Support', label: 'Support' },
      { value: 'Buchhaltung', label: 'Buchhaltung' }
    ]}
  ];

  const addField = (fieldValue) => {
    if (!fieldValue || updates.hasOwnProperty(fieldValue)) return;
    
    const field = fieldOptions.find(f => f.value === fieldValue);
    let defaultValue = '';
    
    if (field.type === 'boolean') {
      defaultValue = true;
    } else if (field.type === 'select' && field.options) {
      defaultValue = field.options[0].value;
    }
    
    setUpdates(prev => ({
      ...prev,
      [fieldValue]: defaultValue
    }));
  };

  const renderFieldInput = (fieldKey, fieldValue) => {
    const field = fieldOptions.find(f => f.value === fieldKey);
    
    if (field.type === 'boolean') {
      return (
        <select
          style={styles.fieldInput}
          value={fieldValue}
          onChange={(e) => handleFieldChange(fieldKey, e.target.value === 'true')}
        >
          <option value="true">✅ Ja</option>
          <option value="false">❌ Nein</option>
        </select>
      );
    } else if (field.type === 'select' && field.options) {
      return (
        <select
          style={styles.fieldInput}
          value={fieldValue}
          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
        >
          {field.options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    } else if (field.type === 'date') {
      return (
        <input
          type="date"
          style={styles.fieldInput}
          value={fieldValue}
          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
        />
      );
    } else {
      return (
        <input
          type="text"
          style={styles.fieldInput}
          value={fieldValue}
          placeholder="Eingeben..."
          onChange={(e) => handleFieldChange(fieldKey, e.target.value)}
        />
      );
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>📝 Mehrfachänderung</h2>
          <button style={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div style={styles.selectedInfo}>
          <strong>📋 Ausgewählte Mitarbeiter ({selectedEmployees.length}):</strong>
          <div style={{ marginTop: '8px', fontSize: '14px' }}>
            {selectedEmployees.map(emp => emp.name).join(', ')}
          </div>
        </div>

        <div style={styles.modeSelector}>
          <label style={styles.label}>Bearbeitungsmodus:</label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              style={{
                ...styles.modeButton,
                ...(editMode === 'bulk' ? styles.activeModeButton : {})
              }}
              onClick={() => setEditMode('bulk')}
            >
              📝 Alle gleich ändern
            </button>
            <button
              type="button"
              style={{
                ...styles.modeButton,
                ...(editMode === 'individual' ? styles.activeModeButton : {})
              }}
              onClick={() => setEditMode('individual')}
            >
              👤 Jeden einzeln ändern
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Feld hinzufügen:</label>
            <select 
              style={styles.addFieldSelect}
              onChange={(e) => {
                addField(e.target.value);
                e.target.value = '';
              }}
            >
              {fieldOptions.filter(opt => !updates.hasOwnProperty(opt.value)).map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {editMode === 'bulk' ? (
            // BULK EDIT - Alle Mitarbeiter gleich ändern
            Object.keys(updates).map(fieldKey => {
              const field = fieldOptions.find(f => f.value === fieldKey);
              return (
                <div key={fieldKey} style={styles.fieldItem}>
                  <div style={styles.fieldLabel}>{field.label}</div>
                  {renderFieldInput(fieldKey, updates[fieldKey])}
                  <button
                    type="button"
                    style={styles.removeButton}
                    onClick={() => removeField(fieldKey)}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          ) : (
            // INDIVIDUAL EDIT - Jeden Mitarbeiter einzeln ändern
            <div style={styles.individualEdit}>
              {selectedEmployees.map(employee => (
                <div key={employee.id} style={styles.employeeSection}>
                  <h4 style={styles.employeeHeader}>{employee.name}</h4>
                  <div style={styles.employeeFields}>
                    <div style={styles.fieldRow}>
                      <label style={styles.fieldLabel}>📋 Brett nutzen:</label>
                      <select
                        value={individualUpdates[employee.id]?.uses_bulletin_board ?? employee.uses_bulletin_board}
                        onChange={(e) => handleIndividualChange(employee.id, 'uses_bulletin_board', e.target.value === 'true')}
                        style={styles.select}
                      >
                        <option value="true">✅ Ja</option>
                        <option value="false">❌ Nein</option>
                      </select>
                    </div>
                    <div style={styles.fieldRow}>
                      <label style={styles.fieldLabel}>🚗 Fahren:</label>
                      <select
                        value={individualUpdates[employee.id]?.can_drive_company_vehicles ?? employee.can_drive_company_vehicles}
                        onChange={(e) => handleIndividualChange(employee.id, 'can_drive_company_vehicles', e.target.value === 'true')}
                        style={styles.select}
                      >
                        <option value="true">✅ Ja</option>
                        <option value="false">❌ Nein</option>
                      </select>
                    </div>
                    <div style={styles.fieldRow}>
                      <label style={styles.fieldLabel}>🪪 Führerschein:</label>
                      <input
                        type="text"
                        placeholder="z.B. B, BE, C, CE"
                        value={individualUpdates[employee.id]?.driving_license_classes ?? employee.driving_license_classes ?? ''}
                        onChange={(e) => handleIndividualChange(employee.id, 'driving_license_classes', e.target.value)}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={styles.buttonGroup}>
            <button
              type="button"
              style={{ ...styles.button, ...styles.cancelButton }}
              onClick={onClose}
              disabled={loading}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              style={{ ...styles.button, ...styles.saveButton }}
              disabled={loading || (editMode === 'bulk' && Object.keys(updates).length === 0)}
            >
              {loading ? '⏳ Speichere...' : `💾 ${selectedEmployees.length} Mitarbeiter aktualisieren`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkEditModal; 