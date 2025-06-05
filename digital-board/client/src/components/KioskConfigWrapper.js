import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KioskConfigWrapper = ({ children, moduleName }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await axios.get('/api/kiosk/config');
        setConfig(response.data);
        console.log(`📱 Kiosk-Konfiguration für ${moduleName} geladen:`, response.data);
      } catch (error) {
        console.error('❌ Fehler beim Laden der Kiosk-Konfiguration:', error);
        // Fallback: Erlaube alles wenn Konfiguration nicht geladen werden kann
        setConfig({ modules: { [moduleName]: { enabled: true } }, maintenanceMode: { enabled: false } });
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
    
    // Aktualisiere Konfiguration alle 30 Sekunden
    const interval = setInterval(loadConfig, 30000);
    
    return () => clearInterval(interval);
  }, [moduleName]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        fontSize: '18px',
        color: '#7f8c8d'
      }}>
        🔄 Lade Konfiguration...
      </div>
    );
  }

  // Wartungsmodus aktiv
  if (config.maintenanceMode?.enabled) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        backgroundColor: '#fff5f5',
        margin: '20px',
        padding: '40px',
        borderRadius: '12px',
        border: '2px solid #e53e3e'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔧</div>
        <h1 style={{ fontSize: '32px', color: '#e53e3e', marginBottom: '20px' }}>
          Wartungsmodus
        </h1>
        <p style={{ fontSize: '18px', color: '#2d3748', maxWidth: '600px', lineHeight: '1.6' }}>
          {config.maintenanceMode.message}
        </p>
        {config.maintenanceMode.showETA && config.maintenanceMode.eta && (
          <p style={{ fontSize: '16px', color: '#718096', marginTop: '20px' }}>
            Voraussichtlich verfügbar: {new Date(config.maintenanceMode.eta).toLocaleString('de-DE')}
          </p>
        )}
      </div>
    );
  }

  // Modul deaktiviert
  if (!config.modules?.[moduleName]?.enabled) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        backgroundColor: '#f7fafc',
        margin: '20px',
        padding: '40px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📵</div>
        <h2 style={{ fontSize: '24px', color: '#4a5568', marginBottom: '15px' }}>
          {config.modules[moduleName]?.label || 'Modul'} ist derzeit nicht verfügbar
        </h2>
        <p style={{ fontSize: '16px', color: '#718096' }}>
          Dieses Modul wurde vorübergehend deaktiviert.
        </p>
      </div>
    );
  }

  // Modul ist aktiviert - zeige Inhalt
  return children;
};

export default KioskConfigWrapper; 