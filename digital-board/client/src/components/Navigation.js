// client/src/components/Navigation.js - VERBESSERTE VERSION mit funktionierendem Logout
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation = ({ user, logout }) => {
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = async (e) => {
    e.preventDefault();
    
    if (loggingOut) return; // Verhindere mehrfache Clicks
    
    const confirmLogout = window.confirm(
      `Möchten Sie sich wirklich abmelden, ${user?.username || 'Admin'}?`
    );
    
    if (!confirmLogout) return;
    
    setLoggingOut(true);
    
    try {
      console.log('🚪 Logout-Prozess gestartet...');
      
      // Kurze Verzögerung für visuelles Feedback
      setTimeout(() => {
        logout();
        navigate('/login');
        setLoggingOut(false);
      }, 500);
      
    } catch (error) {
      console.error('❌ Logout-Fehler:', error);
      // Trotzdem ausloggen, auch wenn ein Fehler auftritt
      logout();
      navigate('/login');
      setLoggingOut(false);
    }
  };
  
  const styles = {
    nav: {
      backgroundColor: '#34495e',
      padding: '0',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '3px solid #3498db',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    navContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    navList: {
      listStyle: 'none',
      display: 'flex',
      margin: 0,
      padding: 0,
      flex: 1,
    },
    navItem: {
      margin: 0,
      height: '100%',
      display: 'flex',
      alignItems: 'stretch',
    },
    navLink: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '10px 16px',
      textDecoration: 'none',
      color: '#ecf0f1',
      transition: 'all 0.3s ease',
      fontSize: '14px',
      fontWeight: '500',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      flex: '1',
      minHeight: '60px',
      boxSizing: 'border-box',
    },
    activeLink: {
      backgroundColor: '#3498db',
      color: 'white',
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      padding: '15px 20px',
      gap: '15px',
      color: '#ecf0f1',
      fontSize: '14px',
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    userAvatar: {
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      backgroundColor: '#3498db',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '14px',
    },
    userDetails: {
      display: 'flex',
      flexDirection: 'column',
    },
    userName: {
      fontWeight: 'bold',
      color: '#ecf0f1',
      fontSize: '14px',
    },
    userRole: {
      fontSize: '12px',
      color: '#bdc3c7',
      textTransform: 'uppercase',
    },
    logoutButton: {
      background: '#e74c3c',
      color: 'white',
      border: 'none',
      padding: '12px 20px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      borderRadius: '0',
    },
    logoutButtonDisabled: {
      background: '#95a5a6',
      cursor: 'not-allowed',
    },
    loadingSpinner: {
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid #ffffff',
      borderRadius: '50%',
      borderTopColor: 'transparent',
      animation: 'spin 1s linear infinite',
    },
  };

  const navItems = [
    { path: '/admin', label: '🏠 Dashboard', desc: 'Übersicht' },
    { path: '/admin/panel', label: '🔧 Admin Panel', desc: 'work4all & System' },
    { path: '/admin/news', label: '📰 News', desc: 'Nachrichten' },
    { path: '/admin/posts', label: '📝 Beiträge', desc: 'Ankündigungen' },
    { path: '/admin/vehicles', label: '🚗 Fahrzeuge', desc: 'Fuhrpark' },
    { path: '/admin/warehouse', label: '📦 Lager', desc: 'Lagerübersicht' },
    { path: '/admin/tradeshows', label: '📅 Messen', desc: 'Kalender' },
    { path: '/admin/workplan', label: '📋 Arbeitsplan', desc: 'Planung' },
    { path: '/admin/employees', label: '👥 Mitarbeiter', desc: 'work4all Import (Read-Only)' },
    { path: '/admin/birthdays', label: '🎂 Geburtstage', desc: 'Termine' },
    { path: '/admin/phonelist', label: '📞 Telefon', desc: 'Kontakte' },
    { path: '/admin/organigramm', label: '🏢 Organigramm', desc: 'Struktur' },
  ];

  const getUserInitials = (username) => {
    if (!username) return 'A';
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.navContainer}>
        <ul style={styles.navList}>
          {navItems.map((item, index) => (
            <li
              key={index}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.activeLink : {})
              }}
            >
              <div
                style={{
                  ...styles.navLink,
                  ...(location.pathname === item.path ? styles.activeLink : {}),
                  cursor: 'pointer'
                }}
                onClick={() => navigate(item.path)}
                onMouseOver={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                  }
                }}
                onMouseOut={(e) => {
                  if (location.pathname !== item.path) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {item.label}
                {item.desc.includes('Read-Only') && (
                  <div style={{
                    fontSize: '9px',
                    color: '#f39c12',
                    fontWeight: 'normal',
                    marginTop: '1px',
                    lineHeight: '1'
                  }}>
                    (Read-Only)
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>
            {getUserInitials(user?.username)}
          </div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>
              {user?.username || 'Admin'}
            </span>
            <span style={styles.userRole}>
              {user?.role || 'Administrator'}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              ...styles.logoutButton,
              ...(loggingOut ? styles.logoutButtonDisabled : {}),
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!loggingOut) {
                e.target.style.backgroundColor = '#c0392b';
              }
            }}
            onMouseOut={(e) => {
              if (!loggingOut) {
                e.target.style.backgroundColor = '#e74c3c';
              }
            }}
            title={loggingOut ? 'Wird abgemeldet...' : 'Abmelden'}
          >
            {loggingOut ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Abmelden...
              </>
            ) : (
              <>
                Abmelden
              </>
            )}
          </button>
        </div>
      </div>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </nav>
  );
};

export default Navigation;