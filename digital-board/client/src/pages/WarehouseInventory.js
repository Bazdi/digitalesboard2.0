import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const WarehouseInventory = ({ kiosk = false }) => {
  const [items, setItems] = useState([]);
  const [areas, setAreas] = useState([]);
  const [stats, setStats] = useState({});
  const [filter, setFilter] = useState({
    category: 'all',
    area_id: 'all',
    stock_status: 'all', // all, low, empty, overstocked
    search: ''
  });
  const [sortBy, setSortBy] = useState('name'); // name, quantity, category, area
  const [sortOrder, setSortOrder] = useState('asc');

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

      const [itemsRes, areasRes, statsRes] = await Promise.all([
        fetch('/api/warehouse/items', { headers }),
        fetch('/api/warehouse/areas', { headers }),
        fetch('/api/warehouse/stats', { headers })
      ]);

      const items = await itemsRes.json();
      const areas = await areasRes.json();
      const stats = await statsRes.json();

      setItems(items);
      setAreas(areas);
      setStats(stats);
    } catch (error) {
      console.error('Fehler beim Laden der Bestandsdaten:', error);
    }
  };

  const getFilteredAndSortedItems = () => {
    let filtered = items.filter(item => {
      // Kategorie-Filter
      if (filter.category !== 'all' && item.category !== filter.category) {
        return false;
      }
      
      // Bereich-Filter
      if (filter.area_id !== 'all' && item.area_id?.toString() !== filter.area_id) {
        return false;
      }
      
      // Bestandsstatus-Filter
      if (filter.stock_status !== 'all') {
        switch (filter.stock_status) {
          case 'low':
            if (item.quantity > item.min_stock) return false;
            break;
          case 'empty':
            if (item.quantity > 0) return false;
            break;
          case 'overstocked':
            if (item.max_stock === 0 || item.quantity <= item.max_stock) return false;
            break;
        }
      }
      
      // Suchfilter
      if (filter.search && !item.name.toLowerCase().includes(filter.search.toLowerCase()) &&
          !item.sku?.toLowerCase().includes(filter.search.toLowerCase())) {
        return false;
      }
      
      return true;
    });

    // Sortierung
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'quantity':
          aVal = a.quantity || 0;
          bVal = b.quantity || 0;
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        case 'area':
          aVal = getAreaName(a.area_id);
          bVal = getAreaName(b.area_id);
          break;
        default:
          aVal = a.name || '';
          bVal = b.name || '';
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const getAreaName = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : 'Kein Bereich';
  };

  const getStockStatus = (item) => {
    if (item.quantity === 0) {
      return { status: 'empty', label: 'Leer', color: '#e74c3c', icon: '❌' };
    } else if (item.quantity <= item.min_stock) {
      return { status: 'low', label: 'Niedrig', color: '#f39c12', icon: '⚠️' };
    } else if (item.max_stock > 0 && item.quantity > item.max_stock) {
      return { status: 'overstocked', label: 'Überbestand', color: '#9b59b6', icon: '📈' };
    } else {
      return { status: 'ok', label: 'OK', color: '#27ae60', icon: '✅' };
    }
  };

  const getCategories = () => {
    return [...new Set(items.map(item => item.category).filter(Boolean))];
  };

  const getLowStockItems = () => {
    return items.filter(item => item.quantity <= item.min_stock && item.min_stock > 0);
  };

  const getEmptyItems = () => {
    return items.filter(item => item.quantity === 0);
  };

  const getTotalValue = () => {
    // Simplified - in real app you'd have prices
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const generateReport = () => {
    const lowStock = getLowStockItems();
    const empty = getEmptyItems();
    const totalValue = getTotalValue();
    
    const report = `
LAGERBESTANDSBERICHT
====================
Erstellungsdatum: ${new Date().toLocaleString('de-DE')}

ÜBERSICHT:
- Gesamtartikel: ${items.length}
- Gesamtmenge: ${totalValue} Einheiten
- Lagerbereiche: ${areas.length}
- Kategorien: ${getCategories().length}

KRITISCHE BESTÄNDE:
- Leere Artikel: ${empty.length}
- Niedrige Bestände: ${lowStock.length}

LEERE ARTIKEL:
${empty.map(item => `- ${item.name} (${item.sku || 'Keine SKU'})`).join('\n')}

NIEDRIGE BESTÄNDE:
${lowStock.map(item => 
  `- ${item.name}: ${item.quantity}/${item.min_stock} ${item.unit} (${item.sku || 'Keine SKU'})`
).join('\n')}

BESTANDSDETAILS:
${items.map(item => {
  const status = getStockStatus(item);
  return `${item.name}: ${item.quantity} ${item.unit} [${status.label}] - ${getAreaName(item.area_id)}`;
}).join('\n')}
    `;
    
    // Download report
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lagerbestandsbericht_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    alertSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    alertCard: {
      padding: kiosk ? '25px' : '20px',
      borderRadius: kiosk ? '15px' : '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      textAlign: 'center',
      color: 'white',
    },
    alertNumber: {
      fontSize: kiosk ? '36px' : '28px',
      fontWeight: 'bold',
      marginBottom: '5px',
    },
    alertLabel: {
      fontSize: kiosk ? '16px' : '14px',
    },
    controlsSection: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '15px',
      marginBottom: '30px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      display: kiosk ? 'none' : 'block',
    },
    controlsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '15px',
      marginBottom: '20px',
    },
    searchInput: {
      gridColumn: '1 / -1',
      padding: '12px',
      fontSize: '16px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      outline: 'none',
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
    select: {
      padding: '10px',
      border: '2px solid #ecf0f1',
      borderRadius: '8px',
      fontSize: '14px',
      outline: 'none',
      backgroundColor: 'white',
    },
    sortControls: {
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
    },
    sortButton: {
      padding: '8px 15px',
      border: '2px solid #3498db',
      borderRadius: '6px',
      backgroundColor: 'white',
      color: '#3498db',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.3s ease',
    },
    activeSortButton: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    reportButton: {
      backgroundColor: '#27ae60',
      color: 'white',
      border: 'none',
      padding: '12px 25px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: 'bold',
      transition: 'background-color 0.3s ease',
    },
    itemsGrid: {
      display: 'grid',
      gap: kiosk ? '20px' : '15px',
    },
    itemCard: {
      backgroundColor: 'white',
      borderRadius: kiosk ? '15px' : '10px',
      padding: kiosk ? '25px' : '20px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      border: '2px solid transparent',
      transition: 'all 0.3s ease',
    },
    itemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: kiosk ? '15px' : '10px',
    },
    itemName: {
      fontSize: kiosk ? '24px' : '18px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    itemSku: {
      fontSize: kiosk ? '16px' : '12px',
      color: '#7f8c8d',
      marginTop: '5px',
    },
    statusBadge: {
      padding: kiosk ? '8px 15px' : '6px 12px',
      borderRadius: '15px',
      fontSize: kiosk ? '14px' : '12px',
      fontWeight: 'bold',
      color: 'white',
    },
    itemDetails: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: kiosk ? '15px' : '10px',
    },
    detailItem: {
      textAlign: 'center',
      padding: kiosk ? '15px' : '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
    },
    detailValue: {
      fontSize: kiosk ? '24px' : '18px',
      fontWeight: 'bold',
      color: '#2c3e50',
    },
    detailLabel: {
      fontSize: kiosk ? '14px' : '12px',
      color: '#7f8c8d',
      marginTop: '5px',
    },
    stockBar: {
      width: '100%',
      height: kiosk ? '12px' : '8px',
      backgroundColor: '#ecf0f1',
      borderRadius: '6px',
      marginTop: '10px',
      overflow: 'hidden',
    },
    stockFill: {
      height: '100%',
      borderRadius: '6px',
      transition: 'width 0.3s ease',
    }
  };

  const filteredItems = getFilteredAndSortedItems();
  const lowStockItems = getLowStockItems();
  const emptyItems = getEmptyItems();

  if (kiosk) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <a href="/kiosk" style={styles.backButton}>← Zurück zum Hauptmenü</a>
          <h1 style={styles.title}>📊 Bestandsübersicht</h1>
        </div>
        
        <div style={styles.alertSection}>
          <div style={{...styles.alertCard, backgroundColor: '#e74c3c'}}>
            <div style={styles.alertNumber}>{emptyItems.length}</div>
            <div style={styles.alertLabel}>❌ Leere Bestände</div>
          </div>
          <div style={{...styles.alertCard, backgroundColor: '#f39c12'}}>
            <div style={styles.alertNumber}>{lowStockItems.length}</div>
            <div style={styles.alertLabel}>⚠️ Niedrige Bestände</div>
          </div>
          <div style={{...styles.alertCard, backgroundColor: '#3498db'}}>
            <div style={styles.alertNumber}>{items.length}</div>
            <div style={styles.alertLabel}>📦 Gesamte Artikel</div>
          </div>
          <div style={{...styles.alertCard, backgroundColor: '#27ae60'}}>
            <div style={styles.alertNumber}>{getTotalValue()}</div>
            <div style={styles.alertLabel}>📊 Gesamtbestand</div>
          </div>
        </div>

        <div style={styles.itemsGrid}>
          {/* Priorität: Erst leere, dann niedrige Bestände */}
          {[...emptyItems, ...lowStockItems.filter(item => item.quantity > 0)]
            .slice(0, 20)
            .map(item => {
              const status = getStockStatus(item);
              const stockPercentage = item.max_stock > 0 ? 
                (item.quantity / item.max_stock) * 100 : 
                item.min_stock > 0 ? (item.quantity / item.min_stock) * 100 : 0;
              
              return (
                <div 
                  key={item.id} 
                  style={{
                    ...styles.itemCard,
                    borderColor: status.color
                  }}
                >
                  <div style={styles.itemHeader}>
                    <div>
                      <div style={styles.itemName}>{item.name}</div>
                      {item.sku && <div style={styles.itemSku}>SKU: {item.sku}</div>}
                    </div>
                    <div 
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: status.color
                      }}
                    >
                      {status.icon} {status.label}
                    </div>
                  </div>

                  <div style={styles.itemDetails}>
                    <div style={styles.detailItem}>
                      <div style={{...styles.detailValue, color: status.color}}>
                        {item.quantity}
                      </div>
                      <div style={styles.detailLabel}>Aktuell</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailValue}>
                        {item.min_stock}
                      </div>
                      <div style={styles.detailLabel}>Minimum</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailValue}>
                        {item.unit}
                      </div>
                      <div style={styles.detailLabel}>Einheit</div>
                    </div>
                    <div style={styles.detailItem}>
                      <div style={styles.detailValue}>
                        {getAreaName(item.area_id)}
                      </div>
                      <div style={styles.detailLabel}>Bereich</div>
                    </div>
                  </div>

                  {item.max_stock > 0 && (
                    <div style={styles.stockBar}>
                      <div 
                        style={{
                          ...styles.stockFill,
                          width: `${Math.min(stockPercentage, 100)}%`,
                          backgroundColor: status.color
                        }}
                      />
                    </div>
                  )}
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
        <h1 style={styles.title}>Bestandsübersicht verwalten</h1>
      </div>

      <div style={styles.alertSection}>
        <div style={{...styles.alertCard, backgroundColor: '#e74c3c'}}>
          <div style={styles.alertNumber}>{emptyItems.length}</div>
          <div style={styles.alertLabel}>❌ Leere Bestände</div>
        </div>
        <div style={{...styles.alertCard, backgroundColor: '#f39c12'}}>
          <div style={styles.alertNumber}>{lowStockItems.length}</div>
          <div style={styles.alertLabel}>⚠️ Niedrige Bestände</div>
        </div>
        <div style={{...styles.alertCard, backgroundColor: '#3498db'}}>
          <div style={styles.alertNumber}>{items.length}</div>
          <div style={styles.alertLabel}>📦 Gesamte Artikel</div>
        </div>
        <div style={{...styles.alertCard, backgroundColor: '#27ae60'}}>
          <div style={styles.alertNumber}>{getTotalValue()}</div>
          <div style={styles.alertLabel}>📊 Gesamtbestand</div>
        </div>
      </div>

      <div style={styles.controlsSection}>
        <div style={styles.controlsGrid}>
          <input
            type="text"
            placeholder="🔍 Artikel suchen (Name oder SKU)..."
            value={filter.search}
            onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
            style={styles.searchInput}
          />

          <div style={styles.formGroup}>
            <label style={styles.label}>Kategorie:</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              style={styles.select}
            >
              <option value="all">Alle Kategorien</option>
              {getCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Lagerbereich:</label>
            <select
              value={filter.area_id}
              onChange={(e) => setFilter(prev => ({ ...prev, area_id: e.target.value }))}
              style={styles.select}
            >
              <option value="all">Alle Bereiche</option>
              {areas.map(area => (
                <option key={area.id} value={area.id.toString()}>{area.name}</option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Bestandsstatus:</label>
            <select
              value={filter.stock_status}
              onChange={(e) => setFilter(prev => ({ ...prev, stock_status: e.target.value }))}
              style={styles.select}
            >
              <option value="all">Alle Status</option>
              <option value="empty">❌ Leer</option>
              <option value="low">⚠️ Niedrig</option>
              <option value="overstocked">📈 Überbestand</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={styles.sortControls}>
            <span style={{ marginRight: '10px', fontWeight: '500' }}>Sortieren:</span>
            {[
              { key: 'name', label: 'Name' },
              { key: 'quantity', label: 'Menge' },
              { key: 'category', label: 'Kategorie' },
              { key: 'area', label: 'Bereich' }
            ].map(sort => (
              <button
                key={sort.key}
                style={{
                  ...styles.sortButton,
                  ...(sortBy === sort.key ? styles.activeSortButton : {})
                }}
                onClick={() => {
                  if (sortBy === sort.key) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(sort.key);
                    setSortOrder('asc');
                  }
                }}
              >
                {sort.label} {sortBy === sort.key && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>

          <button
            style={styles.reportButton}
            onClick={generateReport}
            onMouseOver={(e) => e.target.style.backgroundColor = '#219a52'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
          >
            📄 Bericht exportieren
          </button>
        </div>
      </div>

      <div style={styles.itemsGrid}>
        {filteredItems.map(item => {
          const status = getStockStatus(item);
          const stockPercentage = item.max_stock > 0 ? 
            (item.quantity / item.max_stock) * 100 : 
            item.min_stock > 0 ? (item.quantity / item.min_stock) * 100 : 0;
          
          return (
            <div 
              key={item.id} 
              style={styles.itemCard}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = status.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={styles.itemHeader}>
                <div>
                  <div style={styles.itemName}>{item.name}</div>
                  {item.sku && <div style={styles.itemSku}>SKU: {item.sku}</div>}
                  {item.category && <div style={styles.itemSku}>Kategorie: {item.category}</div>}
                </div>
                <div 
                  style={{
                    ...styles.statusBadge,
                    backgroundColor: status.color
                  }}
                >
                  {status.icon} {status.label}
                </div>
              </div>

              <div style={styles.itemDetails}>
                <div style={styles.detailItem}>
                  <div style={{...styles.detailValue, color: status.color}}>
                    {item.quantity}
                  </div>
                  <div style={styles.detailLabel}>Aktueller Bestand</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailValue}>
                    {item.min_stock}
                  </div>
                  <div style={styles.detailLabel}>Mindestbestand</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailValue}>
                    {item.max_stock || '-'}
                  </div>
                  <div style={styles.detailLabel}>Maximalbestand</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailValue}>
                    {item.unit}
                  </div>
                  <div style={styles.detailLabel}>Einheit</div>
                </div>
                <div style={styles.detailItem}>
                  <div style={styles.detailValue}>
                    {getAreaName(item.area_id)}
                  </div>
                  <div style={styles.detailLabel}>Lagerbereich</div>
                </div>
              </div>

              {item.max_stock > 0 && (
                <>
                  <div style={styles.stockBar}>
                    <div 
                      style={{
                        ...styles.stockFill,
                        width: `${Math.min(stockPercentage, 100)}%`,
                        backgroundColor: status.color
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '5px', fontSize: '12px', color: '#7f8c8d' }}>
                    {stockPercentage.toFixed(1)}% der Maximalkapazität
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          fontSize: '18px',
          color: '#7f8c8d'
        }}>
          Keine Artikel gefunden, die den Filterkriterien entsprechen.
        </div>
      )}
    </Layout>
  );
};

export default WarehouseInventory; 