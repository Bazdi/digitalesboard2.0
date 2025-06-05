import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';

const WarehouseOverview = ({ kiosk = false }) => {
  const [areas, setAreas] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [currentDraw, setCurrentDraw] = useState(null);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState('all');
  const svgRef = useRef();

  const [areaForm, setAreaForm] = useState({
    name: '',
    description: '',
    x_position: 0,
    y_position: 0,
    width: 100,
    height: 50,
    color: '#3498db',
    area_type: 'storage',
    capacity: 0
  });

  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    sku: '',
    area_id: '',
    quantity: 0,
    unit: 'Stück',
    category: '',
    min_stock: 0,
    max_stock: 0,
    notes: ''
  });

  const areaTypes = [
    { value: 'lager', label: 'Lager', color: '#3498db', icon: '📦' },
    { value: 'verladung', label: 'Verladung', color: '#e74c3c', icon: '🚚' },
    { value: 'büro', label: 'Büro', color: '#9b59b6', icon: '🏢' },
    { value: 'kühlung', label: 'Kühlung', color: '#f39c12', icon: '⭐' },
    { value: 'gang', label: 'Gang', color: '#95a5a6', icon: '🛤️' }
  ];

  const categories = [
    'Rohstoffe', 'Fertigware', 'Halbzeuge', 'Verpackung', 
    'Werkzeug', 'Ersatzteile', 'Chemie', 'Elektro', 'Befestigung'
  ];

  // SVG-Dimensionen (basierend auf dem Grundriss)
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 500;

  useEffect(() => {
    fetchData();
    
    if (kiosk) {
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [kiosk]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [areasRes, itemsRes, statsRes] = await Promise.all([
        fetch('/api/warehouse/areas', { headers }),
        fetch('/api/warehouse/items', { headers }),
        fetch('/api/warehouse/stats', { headers })
      ]);

      const areas = await areasRes.json();
      const items = await itemsRes.json();
      const stats = await statsRes.json();

      setAreas(areas);
      setItems(items);
      setStats(stats);
    } catch (error) {
      console.error('Fehler beim Laden der Lagerdaten:', error);
    }
  };

  const handleSVGMouseDown = (e) => {
    if (kiosk || !isDrawing) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * SVG_HEIGHT;
    
    setDrawStart({ x, y });
    setCurrentDraw({ x, y, width: 0, height: 0 });
  };

  const handleSVGMouseMove = (e) => {
    if (kiosk || !isDrawing || !drawStart) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * SVG_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * SVG_HEIGHT;
    
    setCurrentDraw({
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      width: Math.abs(x - drawStart.x),
      height: Math.abs(y - drawStart.y)
    });
  };

  const handleSVGMouseUp = (e) => {
    if (kiosk || !isDrawing || !currentDraw) return;

    if (currentDraw.width > 20 && currentDraw.height > 20) {
      setAreaForm(prev => ({
        ...prev,
        x_position: currentDraw.x,
        y_position: currentDraw.y,
        width: currentDraw.width,
        height: currentDraw.height
      }));
      setShowAreaForm(true);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setCurrentDraw(null);
  };

  const handleAreaClick = (area) => {
    if (isDrawing) return;
    setSelectedArea(selectedArea?.id === area.id ? null : area);
  };

  const handleAreaSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const method = editingArea ? 'PUT' : 'POST';
      const url = editingArea ? `/api/warehouse/areas/${editingArea.id}` : '/api/warehouse/areas';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(areaForm)
      });

      if (!response.ok) throw new Error('Fehler beim Speichern');
      
      resetAreaForm();
      fetchData();
      alert('Bereich erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Bereichs');
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const method = editingItem ? 'PUT' : 'POST';
      const url = editingItem ? `/api/warehouse/items/${editingItem.id}` : '/api/warehouse/items';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(itemForm)
      });

      if (!response.ok) throw new Error('Fehler beim Speichern');
      
      resetItemForm();
      fetchData();
      alert('Artikel erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Artikels');
    }
  };

  const handleAreaEdit = (area) => {
    setEditingArea(area);
    setAreaForm({
      name: area.name,
      description: area.description || '',
      x_position: area.x_position,
      y_position: area.y_position,
      width: area.width,
      height: area.height,
      color: area.color,
      area_type: area.area_type,
      capacity: area.capacity || 0
    });
    setShowAreaForm(true);
  };

  const handleItemEdit = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      area_id: item.area_id || '',
      quantity: item.quantity || 0,
      unit: item.unit || 'Stück',
      category: item.category || '',
      min_stock: item.min_stock || 0,
      max_stock: item.max_stock || 0,
      notes: item.notes || ''
    });
    setShowItemForm(true);
  };

  const handleAreaDelete = async (id) => {
    if (!window.confirm('Möchten Sie diesen Bereich wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/warehouse/areas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fehler beim Löschen');
      }

      fetchData();
      setSelectedArea(null);
      alert('Bereich erfolgreich gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert(error.message || 'Fehler beim Löschen des Bereichs');
    }
  };

  const handleItemDelete = async (id) => {
    if (!window.confirm('Möchten Sie diesen Artikel wirklich löschen?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/warehouse/items/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Fehler beim Löschen');

      fetchData();
      alert('Artikel erfolgreich gelöscht!');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen des Artikels');
    }
  };

  const resetAreaForm = () => {
    setAreaForm({
      name: '',
      description: '',
      x_position: 0,
      y_position: 0,
      width: 100,
      height: 50,
      color: '#3498db',
      area_type: 'lager',
      capacity: 0
    });
    setShowAreaForm(false);
    setEditingArea(null);
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      sku: '',
      area_id: '',
      quantity: 0,
      unit: 'Stück',
      category: '',
      min_stock: 0,
      max_stock: 0,
      notes: ''
    });
    setShowItemForm(false);
    setEditingItem(null);
  };

  const getFilteredAreas = () => {
    if (filter === 'all') return areas;
    return areas.filter(area => area.area_type === filter);
  };

  const getAreaItems = (areaId) => {
    return items.filter(item => item.area_id === areaId);
  };

  const getAreaTypeInfo = (type) => {
    return areaTypes.find(t => t.value === type) || areaTypes[0];
  };

  const getAreaUtilization = (area) => {
    const areaItems = getAreaItems(area.id);
    const totalItems = areaItems.reduce((sum, item) => sum + item.quantity, 0);
    return area.capacity > 0 ? (totalItems / area.capacity) * 100 : 0;
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
      color: '#2c3e50',
    },
    statLabel: {
      fontSize: kiosk ? '16px' : '14px',
      color: '#7f8c8d',
    },
    mainContainer: {
      display: 'grid',
      gridTemplateColumns: kiosk ? '1fr' : '2fr 1fr',
      gap: '30px',
    },
    warehouseView: {
      backgroundColor: 'white',
      borderRadius: kiosk ? '20px' : '15px',
      padding: kiosk ? '30px' : '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    svgContainer: {
      border: '2px solid #ecf0f1',
      borderRadius: '10px',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: '#fafafa',
    },
    svg: {
      width: '100%',
      height: 'auto',
      cursor: isDrawing ? 'crosshair' : 'default',
    },
    controls: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
      flexWrap: 'wrap',
      justifyContent: kiosk ? 'center' : 'flex-start',
    },
    button: {
      padding: kiosk ? '15px 25px' : '10px 20px',
      fontSize: kiosk ? '18px' : '14px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: '500',
      transition: 'all 0.3s ease',
    },
    drawButton: {
      backgroundColor: isDrawing ? '#e74c3c' : '#27ae60',
      color: 'white',
    },
    sidebar: {
      display: kiosk ? 'none' : 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    sidebarSection: {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#2c3e50',
    },
    filterButtons: {
      display: 'flex',
      gap: '8px',
      marginBottom: '15px',
      flexWrap: 'wrap',
    },
    filterButton: {
      padding: '8px 12px',
      border: '2px solid #ecf0f1',
      borderRadius: '20px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'all 0.3s ease',
      backgroundColor: 'white',
    },
    activeFilter: {
      backgroundColor: '#3498db',
      color: 'white',
      borderColor: '#3498db',
    },
    legend: {
      display: 'grid',
      gap: '8px',
    },
    legendItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontSize: '14px',
    },
    legendColor: {
      width: '20px',
      height: '15px',
      borderRadius: '4px',
    },
    areaInfo: {
      marginTop: '15px',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '2px solid #3498db',
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
    },
    select: {
      padding: '12px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
      backgroundColor: 'white',
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
    },
    cancelButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
    },
    submitButton: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    itemsList: {
      maxHeight: '200px',
      overflowY: 'auto',
      marginTop: '10px',
    },
    itemRow: {
      padding: '8px',
      margin: '5px 0',
      backgroundColor: 'white',
      borderRadius: '5px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '12px',
      border: '1px solid #ecf0f1',
    },
    itemActions: {
      display: 'flex',
      gap: '5px',
    },
    actionButton: {
      padding: '4px 8px',
      fontSize: '10px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
    }
  };

  if (kiosk) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/kiosk" style={styles.backButton}>← Zurück zum Hauptmenü</a>
          <h1 style={styles.title}>📦 Lagerübersicht</h1>
        </div>
        
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total_areas || 0}</div>
            <div style={styles.statLabel}>Lagerbereiche</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total_items || 0}</div>
            <div style={styles.statLabel}>Artikel</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total_quantity || 0}</div>
            <div style={styles.statLabel}>Gesamtbestand</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statNumber, color: stats.low_stock_items > 0 ? '#e74c3c' : '#27ae60'}}>
              {stats.low_stock_items || 0}
            </div>
            <div style={styles.statLabel}>Niedrige Bestände</div>
          </div>
        </div>

        <div style={styles.warehouseView}>
          <div style={styles.svgContainer}>
            <svg
              ref={svgRef}
              style={styles.svg}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            >
              {/* Hintergrund-Raster */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Lager-Bereiche */}
              {getFilteredAreas().map(area => {
                const typeInfo = getAreaTypeInfo(area.area_type);
                const utilization = getAreaUtilization(area);
                const areaItems = getAreaItems(area.id);
                
                return (
                  <g key={area.id}>
                    <rect
                      x={area.x_position}
                      y={area.y_position}
                      width={area.width}
                      height={area.height}
                      fill={area.color}
                      fillOpacity="0.7"
                      stroke={area.color}
                      strokeWidth="2"
                      rx="5"
                    />
                    <text
                      x={area.x_position + area.width / 2}
                      y={area.y_position + area.height / 2 - 10}
                      textAnchor="middle"
                      fontSize="14"
                      fontWeight="bold"
                      fill="white"
                    >
                      {typeInfo.icon} {area.name}
                    </text>
                    <text
                      x={area.x_position + area.width / 2}
                      y={area.y_position + area.height / 2 + 10}
                      textAnchor="middle"
                      fontSize="12"
                      fill="white"
                    >
                      {areaItems.length} Artikel
                    </text>
                    {area.capacity > 0 && (
                      <text
                        x={area.x_position + area.width / 2}
                        y={area.y_position + area.height / 2 + 25}
                        textAnchor="middle"
                        fontSize="11"
                        fill="white"
                      >
                        {utilization.toFixed(0)}% belegt
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h1 style={styles.title}>Lagerübersicht verwalten</h1>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.total_areas || 0}</div>
          <div style={styles.statLabel}>Lagerbereiche</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.total_items || 0}</div>
          <div style={styles.statLabel}>Artikel</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.total_quantity || 0}</div>
          <div style={styles.statLabel}>Gesamtbestand</div>
        </div>
        <div style={styles.statCard}>
          <div style={{...styles.statNumber, color: stats.low_stock_items > 0 ? '#e74c3c' : '#27ae60'}}>
            {stats.low_stock_items || 0}
          </div>
          <div style={styles.statLabel}>Niedrige Bestände</div>
        </div>
      </div>

      <div style={styles.mainContainer}>
        <div style={styles.warehouseView}>
          <div style={styles.controls}>
            <button
              style={{...styles.button, ...styles.drawButton}}
              onClick={() => setIsDrawing(!isDrawing)}
            >
              {isDrawing ? '❌ Abbrechen' : '✏️ Bereich zeichnen'}
            </button>
            <button
              style={{...styles.button, backgroundColor: '#3498db', color: 'white'}}
              onClick={() => setShowItemForm(true)}
            >
              📦 Artikel hinzufügen
            </button>
            <button
              style={{...styles.button, backgroundColor: '#9b59b6', color: 'white'}}
              onClick={() => window.open('/admin/warehouse-3d', '_blank')}
              title="3D Warehouse Visualisierung"
            >
              🏭 3D Ansicht
            </button>
            <button
              style={{...styles.button, backgroundColor: '#27ae60', color: 'white'}}
              onClick={() => window.open('/admin/warehouse-inventory', '_blank')}
            >
              📊 Bestandsübersicht
            </button>
            <button
              style={{...styles.button, backgroundColor: '#f39c12', color: 'white'}}
              onClick={() => window.open('/admin/warehouse-movements', '_blank')}
            >
              📦 Bewegungen
            </button>
          </div>

          <div style={styles.svgContainer}>
            <svg
              ref={svgRef}
              style={styles.svg}
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              onMouseDown={handleSVGMouseDown}
              onMouseMove={handleSVGMouseMove}
              onMouseUp={handleSVGMouseUp}
            >
              {/* Hintergrund-Raster */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Lager-Bereiche */}
              {getFilteredAreas().map(area => {
                const typeInfo = getAreaTypeInfo(area.area_type);
                const isSelected = selectedArea?.id === area.id;
                const utilization = getAreaUtilization(area);
                const areaItems = getAreaItems(area.id);
                
                return (
                  <g key={area.id} onClick={() => handleAreaClick(area)}>
                    <rect
                      x={area.x_position}
                      y={area.y_position}
                      width={area.width}
                      height={area.height}
                      fill={area.color}
                      fillOpacity={isSelected ? "0.9" : "0.7"}
                      stroke={isSelected ? "#2c3e50" : area.color}
                      strokeWidth={isSelected ? "3" : "2"}
                      rx="5"
                      style={{ cursor: 'pointer' }}
                    />
                    <text
                      x={area.x_position + area.width / 2}
                      y={area.y_position + area.height / 2 - 5}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="bold"
                      fill="white"
                    >
                      {typeInfo.icon} {area.name}
                    </text>
                    <text
                      x={area.x_position + area.width / 2}
                      y={area.y_position + area.height / 2 + 10}
                      textAnchor="middle"
                      fontSize="10"
                      fill="white"
                    >
                      {areaItems.length} Artikel
                    </text>
                    {area.capacity > 0 && (
                      <text
                        x={area.x_position + area.width / 2}
                        y={area.y_position + area.height / 2 + 22}
                        textAnchor="middle"
                        fontSize="9"
                        fill="white"
                      >
                        {utilization.toFixed(0)}%
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Aktueller Zeichenvorgang */}
              {currentDraw && (
                <rect
                  x={currentDraw.x}
                  y={currentDraw.y}
                  width={currentDraw.width}
                  height={currentDraw.height}
                  fill="rgba(52, 152, 219, 0.3)"
                  stroke="#3498db"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
            </svg>
          </div>
        </div>

        <div style={styles.sidebar}>
          <div style={styles.sidebarSection}>
            <div style={styles.sectionTitle}>🔍 Filter</div>
            <div style={styles.filterButtons}>
              <button
                style={{
                  ...styles.filterButton,
                  ...(filter === 'all' ? styles.activeFilter : {})
                }}
                onClick={() => setFilter('all')}
              >
                Alle ({areas.length})
              </button>
              {areaTypes.map(type => {
                const count = areas.filter(a => a.area_type === type.value).length;
                return (
                  <button
                    key={type.value}
                    style={{
                      ...styles.filterButton,
                      ...(filter === type.value ? styles.activeFilter : {})
                    }}
                    onClick={() => setFilter(type.value)}
                  >
                    {type.icon} {type.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.sidebarSection}>
            <div style={styles.sectionTitle}>🏷️ Legende</div>
            <div style={styles.legend}>
              {areaTypes.map(type => (
                <div key={type.value} style={styles.legendItem}>
                  <div 
                    style={{
                      ...styles.legendColor,
                      backgroundColor: type.color
                    }}
                  />
                  <span>{type.icon} {type.label}</span>
                </div>
              ))}
            </div>
          </div>

          {selectedArea && (
            <div style={styles.sidebarSection}>
              <div style={styles.sectionTitle}>
                📋 {selectedArea.name}
              </div>
              <div style={styles.areaInfo}>
                <p><strong>Typ:</strong> {getAreaTypeInfo(selectedArea.area_type).label}</p>
                <p><strong>Kapazität:</strong> {selectedArea.capacity || 'Keine Angabe'}</p>
                <p><strong>Artikel:</strong> {getAreaItems(selectedArea.id).length}</p>
                <p><strong>Auslastung:</strong> {getAreaUtilization(selectedArea).toFixed(1)}%</p>
                
                <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
                  <button
                    style={{...styles.button, backgroundColor: '#3498db', color: 'white'}}
                    onClick={() => handleAreaEdit(selectedArea)}
                  >
                    ✏️ Bearbeiten
                  </button>
                  <button
                    style={{...styles.button, backgroundColor: '#e74c3c', color: 'white'}}
                    onClick={() => handleAreaDelete(selectedArea.id)}
                  >
                    🗑️ Löschen
                  </button>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <strong>Gelagerte Artikel:</strong>
                  <div style={styles.itemsList}>
                    {getAreaItems(selectedArea.id).map(item => (
                      <div key={item.id} style={styles.itemRow}>
                        <span>
                          <strong>{item.name}</strong><br/>
                          {item.quantity} {item.unit}
                          {item.sku && <span style={{color: '#7f8c8d'}}> • {item.sku}</span>}
                        </span>
                        <div style={styles.itemActions}>
                          <button
                            style={{...styles.actionButton, backgroundColor: '#3498db', color: 'white'}}
                            onClick={() => handleItemEdit(item)}
                          >
                            ✏️
                          </button>
                          <button
                            style={{...styles.actionButton, backgroundColor: '#e74c3c', color: 'white'}}
                            onClick={() => handleItemDelete(item.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bereich-Modal */}
      {showAreaForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {editingArea ? 'Bereich bearbeiten' : 'Neuen Bereich hinzufügen'}
            </h3>
            
            <div style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name:</label>
                  <input
                    type="text"
                    value={areaForm.name}
                    onChange={(e) => setAreaForm(prev => ({...prev, name: e.target.value}))}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Typ:</label>
                  <select
                    value={areaForm.area_type}
                    onChange={(e) => setAreaForm(prev => ({
                      ...prev, 
                      area_type: e.target.value,
                      color: areaTypes.find(t => t.value === e.target.value)?.color || '#3498db'
                    }))}
                    style={styles.select}
                  >
                    {areaTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Beschreibung:</label>
                <input
                  type="text"
                  value={areaForm.description}
                  onChange={(e) => setAreaForm(prev => ({...prev, description: e.target.value}))}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Kapazität:</label>
                  <input
                    type="number"
                    value={areaForm.capacity}
                    onChange={(e) => setAreaForm(prev => ({...prev, capacity: parseInt(e.target.value) || 0}))}
                    style={styles.input}
                    min="0"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Farbe:</label>
                  <input
                    type="color"
                    value={areaForm.color}
                    onChange={(e) => setAreaForm(prev => ({...prev, color: e.target.value}))}
                    style={styles.input}
                  />
                </div>
              </div>
              
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={resetAreaForm}
                  style={{...styles.button, ...styles.cancelButton}}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleAreaSubmit}
                  style={{...styles.button, ...styles.submitButton}}
                >
                  {editingArea ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Artikel-Modal */}
      {showItemForm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={{ marginBottom: '20px', color: '#2c3e50' }}>
              {editingItem ? 'Artikel bearbeiten' : 'Neuen Artikel hinzufügen'}
            </h3>
            
            <div style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Name:</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm(prev => ({...prev, name: e.target.value}))}
                    style={styles.input}
                    required
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>SKU/Artikelnummer:</label>
                  <input
                    type="text"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm(prev => ({...prev, sku: e.target.value}))}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Lagerbereich:</label>
                  <select
                    value={itemForm.area_id}
                    onChange={(e) => setItemForm(prev => ({...prev, area_id: e.target.value}))}
                    style={styles.select}
                  >
                    <option value="">Kein Bereich</option>
                    {areas.filter(a => a.area_type === 'storage').map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Kategorie:</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm(prev => ({...prev, category: e.target.value}))}
                    style={styles.select}
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Menge:</label>
                  <input
                    type="number"
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm(prev => ({...prev, quantity: parseInt(e.target.value) || 0}))}
                    style={styles.input}
                    min="0"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Einheit:</label>
                  <input
                    type="text"
                    value={itemForm.unit}
                    onChange={(e) => setItemForm(prev => ({...prev, unit: e.target.value}))}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Mindestbestand:</label>
                  <input
                    type="number"
                    value={itemForm.min_stock}
                    onChange={(e) => setItemForm(prev => ({...prev, min_stock: parseInt(e.target.value) || 0}))}
                    style={styles.input}
                    min="0"
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Maximalbestand:</label>
                  <input
                    type="number"
                    value={itemForm.max_stock}
                    onChange={(e) => setItemForm(prev => ({...prev, max_stock: parseInt(e.target.value) || 0}))}
                    style={styles.input}
                    min="0"
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Beschreibung/Notizen:</label>
                <input
                  type="text"
                  value={itemForm.notes}
                  onChange={(e) => setItemForm(prev => ({...prev, notes: e.target.value}))}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.buttonGroup}>
                <button
                  type="button"
                  onClick={resetItemForm}
                  style={{...styles.button, ...styles.cancelButton}}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleItemSubmit}
                  style={{...styles.button, ...styles.submitButton}}
                >
                  {editingItem ? 'Aktualisieren' : 'Erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default WarehouseOverview; 