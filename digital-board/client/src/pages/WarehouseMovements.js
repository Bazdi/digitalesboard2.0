import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const WarehouseMovements = ({ kiosk = false }) => {
  const [movements, setMovements] = useState([]);
  const [items, setItems] = useState([]);
  const [areas, setAreas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState({
    movement_type: 'all',
    date_from: '',
    date_to: '',
    item_id: ''
  });

  const [movementForm, setMovementForm] = useState({
    item_id: '',
    area_id: '',
    movement_type: 'in',
    quantity: 0,
    reference_number: '',
    reason: ''
  });

  const movementTypes = [
    { value: 'in', label: '📥 Wareneingang', color: '#27ae60', icon: '⬇️' },
    { value: 'out', label: '📤 Warenausgang', color: '#e74c3c', icon: '⬆️' },
    { value: 'move', label: '🔄 Umlagerung', color: '#f39c12', icon: '↔️' },
    { value: 'adjust', label: '🔧 Korrektur', color: '#9b59b6', icon: '⚙️' }
  ];

  useEffect(() => {
    fetchData();
    
    if (kiosk) {
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [kiosk, filter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Build query parameters
      const params = new URLSearchParams();
      if (filter.movement_type !== 'all') params.append('movement_type', filter.movement_type);
      if (filter.date_from) params.append('date_from', filter.date_from);
      if (filter.date_to) params.append('date_to', filter.date_to);
      if (filter.item_id) params.append('item_id', filter.item_id);

      const [movementsRes, itemsRes, areasRes] = await Promise.all([
        fetch(`/api/warehouse/movements?${params}`, { headers }),
        fetch('/api/warehouse/items', { headers }),
        fetch('/api/warehouse/areas', { headers })
      ]);

      const movements = await movementsRes.json();
      const items = await itemsRes.json();
      const areas = await areasRes.json();

      setMovements(movements);
      setItems(items);
      setAreas(areas);

      // Calculate stats
      const todaysMovements = movements.filter(m => 
        new Date(m.created_at).toDateString() === new Date().toDateString()
      );

      setStats({
        total_movements: movements.length,
        todays_movements: todaysMovements.length,
        stock_in: movements.filter(m => m.movement_type === 'in').length,
        stock_out: movements.filter(m => m.movement_type === 'out').length
      });

    } catch (error) {
      console.error('Fehler beim Laden der Bewegungsdaten:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/warehouse/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(movementForm)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Speichern');
      }
      
      resetForm();
      fetchData();
      alert('Bewegung erfolgreich erfasst!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert(error.message || 'Fehler beim Erfassen der Bewegung');
    }
  };

  const resetForm = () => {
    setMovementForm({
      item_id: '',
      area_id: '',
      movement_type: 'in',
      quantity: 0,
      reference_number: '',
      reason: ''
    });
    setShowForm(false);
  };

  const handleFilterChange = (key, value) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  };

  const getMovementTypeInfo = (type) => {
    return movementTypes.find(t => t.value === type) || movementTypes[0];
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getItemName = (itemId) => {
    const item = items.find(i => i.id === itemId);
    return item ? item.name : 'Unbekannter Artikel';
  };

  const getAreaName = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : 'Kein Bereich';
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
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    statCard: {
      backgroundColor: 'white',
      padding: kiosk ? '25px' : '20px',
      borderRadius: kiosk ? '15px' : '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
    },
    statNumber: {
      fontSize: kiosk ? '36px' : '28px',
      fontWeight: 'bold',
      marginBottom: '5px',
    },
    statLabel: {
      fontSize: kiosk ? '16px' : '14px',
      color: '#7f8c8d',
    },
    quickActions: {
      display: 'flex',
      gap: '15px',
      marginBottom: '30px',
      flexWrap: 'wrap',
      justifyContent: kiosk ? 'center' : 'flex-start',
    },
    quickButton: {
      padding: kiosk ? '20px 30px' : '15px 25px',
      fontSize: kiosk ? '20px' : '16px',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontWeight: 'bold',
      color: 'white',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    filterSection: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '15px',
      marginBottom: '30px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      display: kiosk ? 'none' : 'block',
    },
    filterGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      alignItems: 'end',
    },
    formGroup: {
      display: 'grid',
      gap: '8px',
    },
    label: {
      fontWeight: '500',
      color: '#34495e',
      fontSize: '14px',
    },
    input: {
      padding: '10px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
    },
    select: {
      padding: '10px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: 'white',
    },
    movementsGrid: {
      display: 'grid',
      gap: kiosk ? '25px' : '15px',
    },
    movementCard: {
      backgroundColor: 'white',
      borderRadius: kiosk ? '20px' : '12px',
      padding: kiosk ? '30px' : '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
    },
    movementHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: kiosk ? '20px' : '15px',
    },
    movementType: {
      padding: kiosk ? '10px 20px' : '8px 15px',
      borderRadius: '20px',
      fontSize: kiosk ? '18px' : '14px',
      fontWeight: 'bold',
      color: 'white',
    },
    movementTime: {
      fontSize: kiosk ? '16px' : '12px',
      color: '#7f8c8d',
    },
    movementDetails: {
      display: 'grid',
      gap: kiosk ? '12px' : '8px',
    },
    detailRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: kiosk ? '18px' : '14px',
    },
    detailLabel: {
      color: '#7f8c8d',
      fontWeight: '500',
    },
    detailValue: {
      color: '#2c3e50',
      fontWeight: 'bold',
    },
    quantity: {
      fontSize: kiosk ? '24px' : '18px',
      fontWeight: 'bold',
      textAlign: 'center',
      padding: kiosk ? '15px' : '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      marginTop: kiosk ? '15px' : '10px',
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
      backgroundColor: '#27ae60',
      color: 'white',
    }
  };

  if (kiosk) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/kiosk" style={styles.backButton}>← Zurück zum Hauptmenü</a>
          <h1 style={styles.title}>📦 Lagerbewegungen</h1>
        </div>
        
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#2c3e50'}}>{stats.total_movements || 0}</div>
            <div style={styles.statLabel}>Gesamte Bewegungen</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#3498db'}}>{stats.todays_movements || 0}</div>
            <div style={styles.statLabel}>Heute erfasst</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#27ae60'}}>{stats.stock_in || 0}</div>
            <div style={styles.statLabel}>Wareneingänge</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: '#e74c3c'}}>{stats.stock_out || 0}</div>
            <div style={styles.statLabel}>Warenausgänge</div>
          </div>
        </div>

        <div style={styles.movementsGrid}>
          {movements.slice(0, 20).map(movement => {
            const typeInfo = getMovementTypeInfo(movement.movement_type);
            return (
              <div key={movement.id} style={styles.movementCard}>
                <div style={styles.movementHeader}>
                  <div 
                    style={{
                      ...styles.movementType,
                      backgroundColor: typeInfo.color
                    }}
                  >
                    {typeInfo.icon} {typeInfo.label}
                  </div>
                  <div style={styles.movementTime}>
                    {formatDateTime(movement.created_at)}
                  </div>
                </div>

                <div style={styles.movementDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Artikel:</span>
                    <span style={styles.detailValue}>{getItemName(movement.item_id)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Bereich:</span>
                    <span style={styles.detailValue}>{getAreaName(movement.area_id)}</span>
                  </div>
                  {movement.reference_number && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Referenz:</span>
                      <span style={styles.detailValue}>{movement.reference_number}</span>
                    </div>
                  )}
                  {movement.reason && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Grund:</span>
                      <span style={styles.detailValue}>{movement.reason}</span>
                    </div>
                  )}
                </div>

                <div 
                  style={{
                    ...styles.quantity,
                    color: movement.movement_type === 'out' ? '#e74c3c' : '#27ae60'
                  }}
                >
                  {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Lagerbewegungen verwalten</h1>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#2c3e50'}}>{stats.total_movements || 0}</div>
          <div style={styles.statLabel}>Gesamte Bewegungen</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#3498db'}}>{stats.todays_movements || 0}</div>
          <div style={styles.statLabel}>Heute erfasst</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#27ae60'}}>{stats.stock_in || 0}</div>
          <div style={styles.statLabel}>Wareneingänge</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: '#e74c3c'}}>{stats.stock_out || 0}</div>
          <div style={styles.statLabel}>Warenausgänge</div>
        </div>
      </div>

      <div style={styles.quickActions}>
        {movementTypes.map(type => (
          <button
            key={type.value}
            style={{
              ...styles.quickButton,
              backgroundColor: type.color
            }}
            onClick={() => {
              setMovementForm(prev => ({ ...prev, movement_type: type.value }));
              setShowForm(true);
            }}
            onMouseOver={(e) => {
              const color = type.color;
              const darker = color.replace('3', '2'); // Simple darkening
              e.target.style.backgroundColor = darker;
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = type.color;
            }}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>

      <div style={styles.filterSection}>
        <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>🔍 Filter & Suche</h3>
        <div style={styles.filterGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Bewegungstyp:</label>
            <select
              value={filter.movement_type}
              onChange={(e) => handleFilterChange('movement_type', e.target.value)}
              style={styles.select}
            >
              <option value="all">Alle Bewegungen</option>
              {movementTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Artikel:</label>
            <select
              value={filter.item_id}
              onChange={(e) => handleFilterChange('item_id', e.target.value)}
              style={styles.select}
            >
              <option value="">Alle Artikel</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Von Datum:</label>
            <input
              type="date"
              value={filter.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Bis Datum:</label>
            <input
              type="date"
              value={filter.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              style={styles.input}
            />
          </div>
        </div>
      </div>

      <div style={styles.movementsGrid}>
        {movements.map(movement => {
          const typeInfo = getMovementTypeInfo(movement.movement_type);
          return (
            <div 
              key={movement.id} 
              style={styles.movementCard}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = typeInfo.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.movementHeader}>
                <div 
                  style={{
                    ...styles.movementType,
                    backgroundColor: typeInfo.color
                  }}
                >
                  {typeInfo.icon} {typeInfo.label}
                </div>
                <div style={styles.movementTime}>
                  {formatDateTime(movement.created_at)}
                  {movement.username && <div>von {movement.username}</div>}
                </div>
              </div>

              <div style={styles.movementDetails}>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Artikel:</span>
                  <span style={styles.detailValue}>{getItemName(movement.item_id)}</span>
                </div>
                <div style={styles.detailRow}>
                  <span style={styles.detailLabel}>Bereich:</span>
                  <span style={styles.detailValue}>{getAreaName(movement.area_id)}</span>
                </div>
                {movement.reference_number && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Referenz:</span>
                    <span style={styles.detailValue}>{movement.reference_number}</span>
                  </div>
                )}
                {movement.reason && (
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Grund:</span>
                    <span style={styles.detailValue}>{movement.reason}</span>
                  </div>
                )}
              </div>

              <div 
                style={{
                  ...styles.quantity,
                  color: movement.movement_type === 'out' ? '#e74c3c' : '#27ae60'
                }}
              >
                {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bewegung erfassen Modal */}
      {showForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {getMovementTypeInfo(movementForm.movement_type).icon} {getMovementTypeInfo(movementForm.movement_type).label} erfassen
            </h3>
            
            <div style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Artikel:</label>
                  <select
                    value={movementForm.item_id}
                    onChange={(e) => setMovementForm(prev => ({...prev, item_id: e.target.value}))}
                    style={styles.input}
                    required
                  >
                    <option value="">Artikel wählen</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Bestand: {item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Lagerbereich:</label>
                  <select
                    value={movementForm.area_id}
                    onChange={(e) => setMovementForm(prev => ({...prev, area_id: e.target.value}))}
                    style={styles.input}
                  >
                    <option value="">Kein Bereich</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Menge:</label>
                  <input
                    type="number"
                    value={movementForm.quantity}
                    onChange={(e) => setMovementForm(prev => ({...prev, quantity: parseInt(e.target.value) || 0}))}
                    style={styles.input}
                    min="1"
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Referenznummer:</label>
                  <input
                    type="text"
                    value={movementForm.reference_number}
                    onChange={(e) => setMovementForm(prev => ({...prev, reference_number: e.target.value}))}
                    style={styles.input}
                    placeholder="z.B. Lieferschein, Auftrag..."
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Grund/Bemerkung:</label>
                <input
                  type="text"
                  value={movementForm.reason}
                  onChange={(e) => setMovementForm(prev => ({...prev, reason: e.target.value}))}
                  style={styles.input}
                  placeholder="Grund für die Bewegung..."
                />
              </div>
              
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={resetForm}
                  style={{...styles.button, ...styles.cancelButton}}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  style={{...styles.button, ...styles.submitButton}}
                >
                  Bewegung erfassen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default WarehouseMovements; 