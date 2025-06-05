// client/src/components/Work4AllSync.js - work4all Synchronisations-Komponente
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Work4AllSync = () => {
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isEmployeeSyncing, setIsEmployeeSyncing] = useState(false);
  const [isVehicleSyncing, setIsVehicleSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSyncStatus();
    // Status alle 30 Sekunden aktualisieren
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/work4all/status', config);
      setSyncStatus(response.data);
    } catch (error) {
      console.error('Fehler beim Laden des Sync-Status:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('/api/work4all/test-connection', config);
      setConnectionStatus(response.data);
    } catch (error) {
      console.error('Fehler beim Verbindungstest:', error);
      setConnectionStatus({
        success: false,
        message: 'Verbindungstest fehlgeschlagen'
      });
    }
  };

  const performFullSync = async () => {
    setIsSyncing(true);
    setLastSyncResult(null);
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post('/api/work4all/sync', {}, config);
      setLastSyncResult(response.data);
      
      // Status nach Sync aktualisieren
      setTimeout(fetchSyncStatus, 2000);
    } catch (error) {
      console.error('Fehler bei der vollständigen Synchronisation:', error);
      setLastSyncResult({
        success: false,
        message: 'Vollständige Synchronisation fehlgeschlagen',
        error: error.response?.data?.details || error.message
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const performEmployeeSync = async () => {
    setIsEmployeeSyncing(true);
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post('/api/work4all/sync-employees', {}, config);
      setLastSyncResult(response.data);
      
      // Status nach Sync aktualisieren
      setTimeout(fetchSyncStatus, 2000);
    } catch (error) {
      console.error('Fehler bei der Mitarbeiter-Synchronisation:', error);
      setLastSyncResult({
        success: false,
        message: 'Mitarbeiter-Synchronisation fehlgeschlagen',
        error: error.response?.data?.details || error.message
      });
    } finally {
      setIsEmployeeSyncing(false);
    }
  };

  const performVehicleSync = async () => {
    setIsVehicleSyncing(true);
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.post('/api/work4all/sync-vehicles', {}, config);
      setLastSyncResult(response.data);
      
      // Status nach Sync aktualisieren
      setTimeout(fetchSyncStatus, 2000);
    } catch (error) {
      console.error('Fehler bei der Fahrzeug-Synchronisation:', error);
      setLastSyncResult({
        success: false,
        message: 'Fahrzeug-Synchronisation fehlgeschlagen',
        error: error.response?.data?.details || error.message
      });
    } finally {
      setIsVehicleSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nie';
    try {
      return new Date(dateString).toLocaleString('de-DE');
    } catch {
      return 'Unbekannt';
    }
  };

  const getStatusIcon = (isRunning) => {
    return isRunning ? '🟢' : '🔴';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return '#27ae60';
    if (percentage >= 70) return '#f39c12';
    return '#e74c3c';
  };

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      border: '2px solid #ecf0f1',
      marginBottom: '20px'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '25px',
      paddingBottom: '15px',
      borderBottom: '2px solid #ecf0f1'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    statusGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '20px',
      marginBottom: '25px'
    },
    statusCard: {
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      padding: '20px',
      border: '1px solid #e9ecef'
    },
    statusLabel: {
      fontSize: '14px',
      color: '#6c757d',
      marginBottom: '8px',
      fontWeight: '500'
    },
    statusValue: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#2c3e50'
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e9ecef',
      borderRadius: '4px',
      overflow: 'hidden',
      marginTop: '10px'
    },
    progressFill: {
      height: '100%',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    },
    buttonGroup: {
      display: 'flex',
      gap: '15px',
      marginBottom: '25px',
      flexWrap: 'wrap'
    },
    button: {
      padding: '12px 20px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    primaryButton: {
      backgroundColor: '#3498db',
      color: 'white'
    },
    secondaryButton: {
      backgroundColor: '#95a5a6',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#27ae60',
      color: 'white'
    },
    disabledButton: {
      backgroundColor: '#bdc3c7',
      color: '#7f8c8d',
      cursor: 'not-allowed'
    },
    resultCard: {
      borderRadius: '8px',
      padding: '20px',
      marginTop: '20px'
    },
    successCard: {
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      color: '#155724'
    },
    errorCard: {
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      color: '#721c24'
    },
    resultTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '10px'
    },
    resultDetails: {
      fontSize: '14px',
      lineHeight: '1.5'
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '20px',
      height: '20px',
      border: '2px solid #f3f3f3',
      borderTop: '2px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={styles.loadingSpinner}></div>
          <p style={{ marginTop: '15px', color: '#7f8c8d' }}>Lade Synchronisations-Status...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>
          🔄 work4all Synchronisation
        </h2>
        <div style={{ fontSize: '16px', color: '#7f8c8d' }}>
          {getStatusIcon(syncStatus?.service_running)} Service {syncStatus?.service_running ? 'Aktiv' : 'Inaktiv'}
        </div>
      </div>

      <div style={styles.statusGrid}>
        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>👥 Mitarbeiter gesamt</div>
          <div style={styles.statusValue}>
            {syncStatus?.employees?.total || 0}
          </div>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>👥 Mitarbeiter synchronisiert</div>
          <div style={styles.statusValue}>
            {syncStatus?.employees?.synced || 0}
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${syncStatus?.employees?.sync_percentage || 0}%`,
                backgroundColor: getProgressColor(syncStatus?.employees?.sync_percentage || 0)
              }}
            />
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', color: '#6c757d' }}>
            {syncStatus?.employees?.sync_percentage || 0}% synchronisiert
          </div>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>👥 Letzte Mitarbeiter-Sync</div>
          <div style={styles.statusValue}>
            ⏰ {formatDate(syncStatus?.employees?.last_sync)}
          </div>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>🚗 Fahrzeuge gesamt</div>
          <div style={styles.statusValue}>
            {syncStatus?.vehicles?.total || 0}
          </div>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>🚗 Fahrzeuge synchronisiert</div>
          <div style={styles.statusValue}>
            {syncStatus?.vehicles?.synced || 0}
          </div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${syncStatus?.vehicles?.sync_percentage || 0}%`,
                backgroundColor: getProgressColor(syncStatus?.vehicles?.sync_percentage || 0)
              }}
            />
          </div>
          <div style={{ fontSize: '12px', marginTop: '5px', color: '#6c757d' }}>
            {syncStatus?.vehicles?.sync_percentage || 0}% synchronisiert
          </div>
        </div>

        <div style={styles.statusCard}>
          <div style={styles.statusLabel}>🚗 Letzte Fahrzeug-Sync</div>
          <div style={styles.statusValue}>
            ⏰ {formatDate(syncStatus?.vehicles?.last_sync)}
          </div>
        </div>
      </div>

      <div style={styles.buttonGroup}>
        <button
          onClick={performFullSync}
          disabled={isSyncing}
          style={{
            ...styles.button,
            ...(isSyncing ? styles.disabledButton : styles.primaryButton)
          }}
        >
          {isSyncing ? (
            <>
              <div style={styles.loadingSpinner}></div>
              Vollständige Sync...
            </>
          ) : (
            <>
              🔄 Vollständige Synchronisation
            </>
          )}
        </button>

        <button
          onClick={performEmployeeSync}
          disabled={isEmployeeSyncing}
          style={{
            ...styles.button,
            ...(isEmployeeSyncing ? styles.disabledButton : styles.successButton)
          }}
        >
          {isEmployeeSyncing ? (
            <>
              <div style={styles.loadingSpinner}></div>
              Mitarbeiter Sync...
            </>
          ) : (
            <>
              👥 Nur Mitarbeiter synchronisieren
            </>
          )}
        </button>

        <button
          onClick={performVehicleSync}
          disabled={isVehicleSyncing}
          style={{
            ...styles.button,
            ...(isVehicleSyncing ? styles.disabledButton : styles.successButton)
          }}
        >
          {isVehicleSyncing ? (
            <>
              <div style={styles.loadingSpinner}></div>
              Fahrzeuge Sync...
            </>
          ) : (
            <>
              🚗 Nur Fahrzeuge synchronisieren
            </>
          )}
        </button>

        <button
          onClick={testConnection}
          style={{
            ...styles.button,
            ...styles.secondaryButton
          }}
        >
          🔍 Verbindung testen
        </button>

        <button
          onClick={fetchSyncStatus}
          style={{
            ...styles.button,
            ...styles.secondaryButton
          }}
        >
          📊 Status aktualisieren
        </button>
      </div>

      {connectionStatus && (
        <div style={{
          ...styles.resultCard,
          ...(connectionStatus.success ? styles.successCard : styles.errorCard)
        }}>
          <div style={styles.resultTitle}>
            {connectionStatus.success ? '✅ Verbindungstest erfolgreich' : '❌ Verbindungstest fehlgeschlagen'}
          </div>
          <div style={styles.resultDetails}>
            {connectionStatus.message}
          </div>
        </div>
      )}

      {lastSyncResult && (
        <div style={{
          ...styles.resultCard,
          ...(lastSyncResult.success ? styles.successCard : styles.errorCard)
        }}>
          <div style={styles.resultTitle}>
            {lastSyncResult.success ? '✅ Synchronisation erfolgreich' : '❌ Synchronisation fehlgeschlagen'}
          </div>
          <div style={styles.resultDetails}>
            {lastSyncResult.success ? (
              <>
                <strong>📊 Ergebnis:</strong><br/>
                • Gesamt: {lastSyncResult.data?.total || 0} Mitarbeiter<br/>
                • Neu erstellt: {lastSyncResult.data?.created || 0}<br/>
                • Aktualisiert: {lastSyncResult.data?.updated || 0}<br/>
                • Fehler: {lastSyncResult.data?.errors || 0}
              </>
            ) : (
              <>
                <strong>❌ Fehler:</strong><br/>
                {lastSyncResult.error}<br/>
                {lastSyncResult.details && (
                  <>
                    <br/><strong>Details:</strong><br/>
                    {lastSyncResult.details}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div style={{
        marginTop: '25px',
        padding: '15px',
        backgroundColor: '#e8f4fd',
        borderRadius: '8px',
        border: '1px solid #b8daff'
      }}>
        <h4 style={{ marginTop: 0, color: '#2c3e50' }}>ℹ️ Informationen</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#34495e' }}>
          <li>Die Synchronisation läuft automatisch alle 4 Stunden</li>
          <li>Mitarbeiter werden anhand der work4all Code-ID identifiziert</li>
          <li>Bestehende manuelle Einstellungen (Führerschein, Berechtigungen) bleiben erhalten</li>
          <li>Neue Mitarbeiter erhalten Standard-Berechtigungen</li>
          <li>Ausgeschiedene Mitarbeiter werden als inaktiv markiert</li>
        </ul>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Work4AllSync; 