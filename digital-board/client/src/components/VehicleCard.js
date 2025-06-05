// client/src/components/VehicleCard.js
import React from 'react';

const VehicleCard = ({ vehicle, onEdit, onDelete, onBook, getStatusText, statusColors }) => {
  const getVehicleIcon = (type) => {
    switch (type) {
      case 'PKW': return '🚗';
      case 'Transporter': return '🚐';
      case 'LKW': return '🚚';
      case 'Anhänger': return '🚛';
      default: return '🚙';
    }
  };

  const getFuelIcon = (fuel) => {
    switch (fuel) {
      case 'Elektro': return '⚡';
      case 'Hybrid': return '🔋';
      case 'Diesel': return '⛽';
      case 'Gas': return '🔥';
      default: return '⛽';
    }
  };

  const styles = {
    card: {
      backgroundColor: 'white',
      borderRadius: '15px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: `3px solid ${statusColors[vehicle.status] || '#ecf0f1'}`,
      transition: 'all 0.3s ease',
      position: 'relative',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '15px',
    },
    vehicleIcon: {
      fontSize: '48px',
      marginBottom: '10px',
    },
    statusBadge: {
      position: 'absolute',
      top: '15px',
      right: '15px',
      backgroundColor: statusColors[vehicle.status] || '#95a5a6',
      color: 'white',
      padding: '5px 12px',
      borderRadius: '15px',
      fontSize: '12px',
      fontWeight: 'bold',
    },
    vehicleImage: {
      width: '100%',
      height: '150px',
      objectFit: 'cover',
      borderRadius: '10px',
      marginBottom: '15px',
    },
    imagePlaceholder: {
      width: '100%',
      height: '150px',
      backgroundColor: '#f8f9fa',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '15px',
      border: '2px dashed #ecf0f1',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '5px',
    },
    licensePlate: {
      fontSize: '18px',
      color: '#3498db',
      fontWeight: 'bold',
      marginBottom: '15px',
      padding: '5px 10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      textAlign: 'center',
      border: '2px solid #3498db',
    },
    details: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
      marginBottom: '15px',
    },
    detailItem: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      color: '#7f8c8d',
    },
    detailIcon: {
      marginRight: '8px',
      fontSize: '16px',
    },
    mileage: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#f39c12',
      textAlign: 'center',
      marginBottom: '15px',
      padding: '10px',
      backgroundColor: '#fef9e7',
      borderRadius: '8px',
    },
    notes: {
      fontSize: '14px',
      color: '#7f8c8d',
      fontStyle: 'italic',
      marginBottom: '15px',
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      borderLeft: '4px solid #3498db',
    },
    actions: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'center',
    },
    button: {
      padding: '10px 15px',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '5px',
    },
    bookButton: {
      backgroundColor: '#27ae60',
      color: 'white',
      flex: 1,
    },
    editButton: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    deleteButton: {
      backgroundColor: '#e74c3c',
      color: 'white',
    },
    disabledButton: {
      backgroundColor: '#95a5a6',
      color: 'white',
      cursor: 'not-allowed',
    }
  };

  const isAvailable = vehicle.status === 'verfügbar';

  return (
    <div 
      style={styles.card}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-5px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
    >
      <div style={styles.statusBadge}>
        {getStatusText(vehicle.status)}
      </div>

      <div style={styles.vehicleIcon}>
        {getVehicleIcon(vehicle.vehicle_type)}
      </div>

      {vehicle.image ? (
        <img 
          src={`/uploads/${vehicle.image}`} 
          alt={`${vehicle.brand} ${vehicle.model}`}
          style={styles.vehicleImage}
        />
      ) : (
        <div style={styles.imagePlaceholder}>
          <span style={{ fontSize: '48px', color: '#bdc3c7' }}>
            {getVehicleIcon(vehicle.vehicle_type)}
          </span>
        </div>
      )}

      <div style={styles.title}>
        {vehicle.brand} {vehicle.model}
      </div>

      <div style={styles.licensePlate}>
        {vehicle.license_plate}
      </div>

      <div style={styles.details}>
        <div style={styles.detailItem}>
          <span style={styles.detailIcon}>🎨</span>
          {vehicle.color || 'Keine Angabe'}
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailIcon}>📅</span>
          {vehicle.year || 'Unbekannt'}
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailIcon}>{getFuelIcon(vehicle.fuel_type)}</span>
          {vehicle.fuel_type}
        </div>
        <div style={styles.detailItem}>
          <span style={styles.detailIcon}>👥</span>
          {vehicle.seats} Plätze
        </div>
      </div>

      <div style={styles.mileage}>
        🛣️ {vehicle.mileage?.toLocaleString('de-DE') || 0} km
      </div>

      {vehicle.notes && (
        <div style={styles.notes}>
          💭 {vehicle.notes}
        </div>
      )}

      <div style={styles.actions}>
        <button
          style={{
            ...styles.button,
            ...(isAvailable ? styles.bookButton : styles.disabledButton)
          }}
          onClick={() => isAvailable && onBook(vehicle)}
          disabled={!isAvailable}
          onMouseOver={(e) => {
            if (isAvailable) {
              e.target.style.backgroundColor = '#219a52';
            }
          }}
          onMouseOut={(e) => {
            if (isAvailable) {
              e.target.style.backgroundColor = '#27ae60';
            }
          }}
        >
          📅 {isAvailable ? 'Buchen' : 'Nicht verfügbar'}
        </button>
        
        <button
          style={{...styles.button, ...styles.editButton}}
          onClick={() => onEdit(vehicle)}
          onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
        >
          ✏️
        </button>
        
        <button
          style={{...styles.button, ...styles.deleteButton}}
          onClick={() => onDelete(vehicle.id)}
          onMouseOver={(e) => e.target.style.backgroundColor = '#c0392b'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#e74c3c'}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default VehicleCard;