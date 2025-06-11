import { useState, useEffect } from 'react';
import axios from 'axios';

export const useMaintenanceMode = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await axios.get('/api/kiosk/config');
        setMaintenanceMode(response.data.maintenanceMode);
      } catch (error) {
        console.error('Fehler beim Prüfen des Wartungsmodus:', error);
        // Im Fehlerfall als nicht aktiv betrachten
        setMaintenanceMode({ enabled: false });
      } finally {
        setLoading(false);
      }
    };

    checkMaintenanceMode();

    // Alle 10 Sekunden prüfen
    const interval = setInterval(checkMaintenanceMode, 10000);
    return () => clearInterval(interval);
  }, []);

  const MaintenanceScreen = () => {
    if (!maintenanceMode?.enabled) return null;

    return (
      <div style={styles.maintenanceContainer}>
        <div style={styles.maintenanceBox}>
          <div style={styles.icon}>🔧</div>
          <h1 style={styles.title}>Wartungsmodus</h1>
          <p style={styles.message}>
            {maintenanceMode.message || 'Das System wird gerade gewartet. Bitte versuchen Sie es später erneut.'}
          </p>
          {maintenanceMode.showETA && maintenanceMode.eta && (
            <p style={styles.eta}>
              Voraussichtlich verfügbar: {new Date(maintenanceMode.eta).toLocaleString('de-DE')}
            </p>
          )}
          <div style={styles.spinner}></div>
        </div>
      </div>
    );
  };

  return {
    isMaintenanceMode: maintenanceMode?.enabled || false,
    maintenanceMode,
    loading,
    MaintenanceScreen
  };
};

const styles = {
  maintenanceContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  maintenanceBox: {
    backgroundColor: '#fff',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
    maxWidth: '500px',
    margin: '2rem',
  },
  icon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '1rem',
    fontWeight: 'bold',
  },
  message: {
    fontSize: '1.1rem',
    color: '#666',
    marginBottom: '1.5rem',
    lineHeight: 1.5,
  },
  eta: {
    fontSize: '0.9rem',
    color: '#999',
    marginBottom: '1.5rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #ff6b35',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto',
  },
  // CSS-Animation für Spinner (inline definiert)
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  }
}; 