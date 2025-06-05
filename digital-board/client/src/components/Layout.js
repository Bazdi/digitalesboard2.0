// client/src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import HeartbeatManager from './HeartbeatManager';

const Layout = ({ children, user, logout, kiosk = false }) => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [kioskConfig, setKioskConfig] = useState(null);

  // Extrahiere Seitennamen aus der URL
  useEffect(() => {
    const path = location.pathname;
    let pageName = 'dashboard';
    
    if (path.includes('/admin')) pageName = 'admin';
    else if (path.includes('/news')) pageName = 'news';
    else if (path.includes('/posts')) pageName = 'posts';
    else if (path.includes('/tradeshows')) pageName = 'tradeshows';
    else if (path.includes('/workplan')) pageName = 'workplan';
    else if (path.includes('/vehicles')) pageName = 'vehicles';
    else if (path.includes('/employees')) pageName = 'employees';
    else if (path.includes('/birthdays')) pageName = 'birthdays';
    else if (path.includes('/directory')) pageName = 'directory';
    else if (path.includes('/orgchart')) pageName = 'orgchart';
    else if (path.includes('/warehouse')) pageName = 'warehouse';
    
    setCurrentPage(pageName);
  }, [location.pathname]);

  // Bestimme Client-Type basierend auf Kontext und URL
  const getClientType = () => {
    console.log(`🔍 getClientType Debug:`, {
      kioskProp: kiosk,
      pathname: location.pathname,
      userExists: !!user,
      userRole: user?.role
    });
    
    // ERSTE PRIORITÄT: kiosk prop (explizit übergeben)
    if (kiosk) {
      console.log('✅ ClientType: kiosk (via prop)');
      return 'kiosk';
    }
    
    // ZWEITE PRIORITÄT: URL für Kiosk-Modus
    if (location.pathname.includes('/kiosk')) {
      console.log('✅ ClientType: kiosk (via URL)');
      return 'kiosk';
    }
    
    // DRITTE PRIORITÄT: Admin-Benutzer
    if (user && user.role === 'admin') {
      console.log('✅ ClientType: admin (via user role)');
      return 'admin';
    }
    
    // STANDARD: user
    console.log('✅ ClientType: user (default)');
    return 'user';
  };

  // Handle Kiosk-Konfigurationsupdate
  const handleConfigUpdate = (newConfig) => {
    console.log('🔄 Layout: Neue Kiosk-Konfiguration empfangen:', newConfig);
    setKioskConfig(newConfig);
    
    // Zeige Update-Benachrichtigung (nur im Kiosk-Modus)
    if (kiosk) {
      showKioskUpdateNotification(newConfig);
    }
  };

  // Zeige Konfigurationsupdate-Benachrichtigung
  const showKioskUpdateNotification = (config) => {
    // Erstelle eine kleine Benachrichtigung
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">🔄</span>
        <div>
          <div style="margin-bottom: 5px;">Konfiguration aktualisiert</div>
          <div style="font-size: 12px; opacity: 0.9;">
            ${config.maintenanceMode?.enabled ? 'Wartungsmodus aktiviert' : 'Module aktualisiert'}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Entferne Benachrichtigung nach 4 Sekunden
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 4000);
  };

  // CSS-Animationen für Benachrichtigungen
  useEffect(() => {
    if (!document.getElementById('kiosk-animations')) {
      const style = document.createElement('style');
      style.id = 'kiosk-animations';
      style.textContent = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Globale Funktion für externe Benachrichtigungen
    window.showConfigUpdateNotification = showKioskUpdateNotification;
    
    return () => {
      if (window.showConfigUpdateNotification) {
        delete window.showConfigUpdateNotification;
      }
    };
  }, []);

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
    },
    header: {
      backgroundColor: kiosk ? '#2c3e50' : '#34495e',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      fontSize: kiosk ? '36px' : '24px',
      fontWeight: 'bold',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    content: {
      padding: kiosk ? '40px 20px' : '20px',
      maxWidth: kiosk ? 'none' : '1200px',
      margin: '0 auto',
    }
  };

  // Clone children with kioskConfig prop for kiosk mode
  const childrenWithProps = kiosk && kioskConfig ? 
    React.cloneElement(children, { kioskConfig }) : 
    children;

  return (
    <div style={styles.container}>
      {/* Heartbeat-Manager für Session-Tracking */}
      <HeartbeatManager 
        clientType={getClientType()}
        currentPage={currentPage}
        enabled={true}
        onConfigUpdate={handleConfigUpdate}
      />
      
      <header style={styles.header}>
        Digitales Schwarzes Brett
      </header>
      
      {!kiosk && <Navigation user={user} logout={logout} />}
      
      <main style={styles.content}>
        {childrenWithProps}
      </main>
    </div>
  );
};

export default Layout; 