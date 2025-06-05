import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const HeartbeatManager = ({ 
  clientType = 'kiosk', 
  currentPage = 'dashboard',
  enabled = true,
  onConfigUpdate = null // Callback für Konfigurationsänderungen
}) => {
  const heartbeatInterval = useRef(null);
  const clientId = useRef(null);
  const [lastConfigVersion, setLastConfigVersion] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    // Verwende persistente Client-ID für Browser-Session
    if (!clientId.current) {
      const sessionKey = `heartbeat_client_id_${clientType}`;
      const existingId = sessionStorage.getItem(sessionKey);
      
      if (existingId) {
        clientId.current = existingId;
        console.log(`🔄 Bestehende Client-ID wiederverwendet: ${clientId.current} (Type: ${clientType})`);
      } else {
        clientId.current = `${clientType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(sessionKey, clientId.current);
        console.log(`🆔 Neue Client-ID generiert und gespeichert: ${clientId.current} (Type: ${clientType})`);
      }
    }

    const sendHeartbeat = async () => {
      try {
        const heartbeatData = {
          clientId: clientId.current,
          clientType,
          currentPage,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timestamp: new Date().toISOString(),
          lastConfigVersion: lastConfigVersion
        };

        console.log(`💓 Sende Heartbeat:`, {
          clientId: clientId.current,
          clientType,
          currentPage,
          timestamp: heartbeatData.timestamp
        });

        const response = await axios.post('/api/heartbeat', heartbeatData);
        
        console.log(`✅ Heartbeat erfolgreich (${clientType}):`, {
          clientId: clientId.current,
          page: currentPage,
          activeSessions: response.data.activeSessions,
          configUpdate: response.data.configUpdate?.required || false
        });

        // Prüfe auf Konfigurationsupdate (nur für Kiosk-Clients)
        if (clientType === 'kiosk' && response.data.configUpdate?.required) {
          const updateInfo = response.data.configUpdate;
          
          if (updateInfo.immediate) {
            console.log('🚨 SOFORTIGES Kiosk-Update empfangen:', updateInfo);
            console.log(`🔄 Grund: ${updateInfo.reason}`);
            console.log(`📝 Änderung: ${updateInfo.changeType}`, updateInfo.changeDetails);
          } else {
            console.log('📱 Reguläres Kiosk-Konfigurationsupdate empfangen:', updateInfo);
          }
          
          const newVersion = updateInfo.newVersion;
          const newConfig = updateInfo.config;
          
          setLastConfigVersion(newVersion);
          
          // Benachrichtige Parent-Component über Konfigurationsänderung
          if (onConfigUpdate) {
            onConfigUpdate(newConfig, {
              immediate: updateInfo.immediate,
              changeType: updateInfo.changeType,
              changeDetails: updateInfo.changeDetails,
              reason: updateInfo.reason
            });
          }
          
          // Zeige spezielle Benachrichtigung für sofortige Updates
          if (updateInfo.immediate) {
            if (window.showImmediateConfigUpdate) {
              window.showImmediateConfigUpdate(newConfig, updateInfo);
            } else if (window.showConfigUpdateNotification) {
              window.showConfigUpdateNotification(newConfig, 'Sofortige Aktualisierung durch Admin');
            }
          } else {
            // Normale Update-Benachrichtigung
            if (window.showConfigUpdateNotification) {
              window.showConfigUpdateNotification(newConfig);
            }
          }
          
          // Bei sofortigen Updates: Zusätzliche Console-Benachrichtigung
          if (updateInfo.immediate) {
            console.log(`🎯 Sofortiges Update angewendet: ${updateInfo.changeType}`);
          }
        }

      } catch (error) {
        console.warn(`❌ Heartbeat-Fehler für ${clientType} (${clientId.current}):`, error.message);
        
        // Bei 401/403 Fehlern (Auth-Probleme) weniger häufig loggen
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.warn('⚠️ Auth-Problem - Heartbeat wird fortgesetzt (kein Login erforderlich)');
        }
      }
    };

    // Sofortiger erster Heartbeat
    console.log(`🚀 Starte Heartbeat-System für ${clientType} auf Seite ${currentPage}`);
    sendHeartbeat();

    // Heartbeat alle 30 Sekunden
    heartbeatInterval.current = setInterval(sendHeartbeat, 30000);

    // Cleanup beim Verlassen der Seite
    const handleBeforeUnload = async () => {
      try {
        await axios.post('/api/sessions/end', { clientId: clientId.current });
        // Session-Key aus sessionStorage entfernen
        const sessionKey = `heartbeat_client_id_${clientType}`;
        sessionStorage.removeItem(sessionKey);
        console.log(`👋 Session beendet und Client-ID entfernt: ${clientId.current}`);
      } catch (error) {
        console.warn('Session-End Fehler:', error.message);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log(`🛑 Heartbeat-Manager cleanup für ${clientType} (${clientId.current})`);
      clearInterval(heartbeatInterval.current);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Versuche Session beim Unmount zu beenden (aber sessionStorage NICHT löschen - nur bei echtem Seitenverlassen)
      if (clientId.current) {
        axios.post('/api/sessions/end', { clientId: clientId.current })
          .then(() => console.log(`✅ Session cleanup erfolgreich: ${clientId.current}`))
          .catch(err => {
            // 404 ist normal wenn Session bereits beendet wurde
            if (err.response?.status !== 404) {
              console.warn('Session cleanup failed:', err.message);
            }
          });
      }
    };
  }, [clientType, currentPage, enabled, lastConfigVersion, onConfigUpdate]);

  // Update current page wenn sich die Seite ändert
  useEffect(() => {
    if (enabled && clientId.current) {
      console.log(`📱 Seitenwechsel detected: ${currentPage}`);
    }
  }, [currentPage, enabled]);

  // Debug-Ausgabe im DOM (nur in Development)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        zIndex: 9999,
        borderBottomLeftRadius: '8px',
        fontFamily: 'monospace'
      }}>
        💓 {clientType} | {currentPage}
        <br />
        ID: {clientId.current ? clientId.current.split('-')[0] : 'Loading...'}
      </div>
    );
  }

  return null;
};

export default HeartbeatManager; 